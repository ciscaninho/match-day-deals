// Sync curated stadium images from Google Drive into our media pipeline.
//
// Modes:
//  - dry_run: true (default)  → only list Drive files, compute matches, write
//                               a full report into stadium_media_imports +
//                               stadium_media_history. NO uploads, NO writes
//                               to public.stadiums.
//  - dry_run: false           → actually download each matched file, upload
//                               to the `stadium-media` storage bucket, and
//                               update the matched row in public.stadiums.
//
// Auth: admin-only. Requires a valid Supabase JWT belonging to a user with
// role = 'admin' in public.user_roles.
//
// Drive: authenticated via the Lovable connector gateway
//   GET https://connector-gateway.lovable.dev/google_drive/drive/v3/files
//        ?q='<folderId>' in parents and trashed=false
//        &fields=files(id,name,mimeType,size,modifiedTime)
//        &pageSize=1000

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  imageMediaMetadata?: { width?: number; height?: number };
};

type StadiumRow = {
  id: string;
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  hero_image_url: string | null;
  background_image_url: string | null;
  image_url: string | null;
};

type Candidate = {
  stadium_id: string;
  slug: string;
  stadium_name: string;
  score: number;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[a-z0-9]+$/i, "") // strip extension
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (s: string) => new Set(normalize(s).split(" ").filter(Boolean));

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
};

function scoreMatch(fileNorm: string, stadium: StadiumRow): number {
  const fTokens = tokens(fileNorm);
  const nameNorm = normalize(stadium.stadium_name);
  const slugNorm = normalize(stadium.slug);
  const nameTokens = tokens(nameNorm);
  const slugTokens = tokens(slugNorm);

  if (fileNorm === nameNorm || fileNorm === slugNorm) return 1;
  // strong substring containment
  if (nameNorm && (fileNorm.includes(nameNorm) || nameNorm.includes(fileNorm))) {
    return Math.max(0.9, jaccard(fTokens, nameTokens));
  }
  if (slugNorm && (fileNorm.includes(slugNorm) || slugNorm.includes(fileNorm))) {
    return Math.max(0.88, jaccard(fTokens, slugTokens));
  }
  return Math.max(jaccard(fTokens, nameTokens), jaccard(fTokens, slugTokens));
}

function classify(score: number): { confidence: string; match_type: string } {
  if (score >= 0.95) return { confidence: "high", match_type: "exact" };
  if (score >= 0.75) return { confidence: "high", match_type: "strong" };
  if (score >= 0.55) return { confidence: "medium", match_type: "partial" };
  if (score >= 0.35) return { confidence: "low", match_type: "weak" };
  return { confidence: "none", match_type: "none" };
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

async function listFolderChildren(folderId: string): Promise<DriveFile[]> {
  const all: DriveFile[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < 20; i++) {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const fields = encodeURIComponent(
      "nextPageToken, files(id,name,mimeType,size,modifiedTime,parents)",
    );
    const url =
      `${GATEWAY}/files?q=${q}&fields=${fields}&pageSize=1000` +
      `&supportsAllDrives=true&includeItemsFromAllDrives=true` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY!,
      },
    });
    if (!r.ok) {
      const body = await r.text();
      throw new Error(`Drive list failed [${r.status}]: ${body.slice(0, 400)}`);
    }
    const data = await r.json();
    for (const f of data.files ?? []) all.push(f);
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return all;
}

async function listAllDriveFiles(folderId: string): Promise<DriveFile[]> {
  const all: DriveFile[] = [];
  const queue: string[] = [folderId];
  const visited = new Set<string>();
  let safety = 0;
  while (queue.length && safety++ < 200) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const children = await listFolderChildren(current);
    for (const f of children) {
      if (f.mimeType === FOLDER_MIME) {
        queue.push(f.id);
      } else {
        all.push(f);
      }
    }
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: require admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const { data: roleRow } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "drive_not_connected" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const folderId: string = body.folder_id ??
      "1sqgnhnyUYp9MsPqUAnMmI7lbytQsUv_q";
    const dryRun: boolean = body.dry_run !== false; // default true
    const limit: number | undefined = body.limit;

    // Open import run
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    const { data: importRow, error: importErr } = await admin
      .from("stadium_media_imports")
      .insert({
        triggered_by: userId,
        dry_run: dryRun,
        folder_id: folderId,
        status: "running",
      })
      .select("id")
      .single();
    if (importErr) throw importErr;
    const importId = importRow.id;

    try {
      const files = await listAllDriveFiles(folderId);
      const imageFiles = files.filter((f) =>
        f.mimeType?.startsWith("image/")
      );

      const { data: stadiums, error: sErr } = await admin
        .from("stadiums")
        .select(
          "id, slug, stadium_name, city, country, hero_image_url, background_image_url, image_url",
        );
      if (sErr) throw sErr;
      const stadiumList = (stadiums ?? []) as StadiumRow[];

      // Build history rows
      const historyRows: any[] = [];
      const seenSlugs = new Map<string, number>(); // slug -> count of files matching
      let matched = 0,
        ambiguous = 0,
        unmatched = 0,
        wouldOverwrite = 0,
        duplicates = 0;

      const toProcess = limit ? imageFiles.slice(0, limit) : imageFiles;

      for (const f of toProcess) {
        const fileNorm = normalize(f.name);
        const scored: Candidate[] = stadiumList
          .map((s) => ({
            stadium_id: s.id,
            slug: s.slug,
            stadium_name: s.stadium_name,
            score: scoreMatch(fileNorm, s),
          }))
          .filter((c) => c.score >= 0.35)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        const best = scored[0];
        const second = scored[1];
        const cls = best
          ? classify(best.score)
          : { confidence: "none", match_type: "none" };

        let action = "skip";
        let notes: string | null = null;
        let isAmbiguous = false;

        if (!best) {
          unmatched++;
          notes = "no candidate above threshold";
        } else if (second && best.score - second.score < 0.08 && best.score < 0.95) {
          // ambiguous: top 2 are too close
          isAmbiguous = true;
          ambiguous++;
          action = "needs_review";
          notes = `ambiguous: ${best.slug} (${best.score.toFixed(2)}) vs ${second.slug} (${second.score.toFixed(2)})`;
        } else {
          matched++;
          action = dryRun ? "would_import" : "import";
        }

        // duplicate detection: multiple files mapped to same slug
        if (best && !isAmbiguous) {
          const c = (seenSlugs.get(best.slug) ?? 0) + 1;
          seenSlugs.set(best.slug, c);
          if (c > 1) {
            duplicates++;
            notes = (notes ? notes + " · " : "") +
              `duplicate: slug "${best.slug}" already matched by another file in this run`;
          }
        }

        // overwrite check
        const matchedStadium = best
          ? stadiumList.find((s) => s.id === best.stadium_id) ?? null
          : null;
        const previousUrl = matchedStadium?.hero_image_url ??
          matchedStadium?.background_image_url ??
          matchedStadium?.image_url ?? null;
        const overwrites = !!(best && !isAmbiguous && previousUrl);
        if (overwrites) wouldOverwrite++;

        historyRows.push({
          import_id: importId,
          drive_file_id: f.id,
          drive_file_name: f.name,
          drive_mime_type: f.mimeType,
          drive_size_bytes: f.size ? Number(f.size) : null,
          normalized_name: fileNorm,
          matched_stadium_id: best && !isAmbiguous ? best.stadium_id : null,
          matched_stadium_slug: best && !isAmbiguous ? best.slug : null,
          matched_stadium_name: best && !isAmbiguous ? best.stadium_name : null,
          match_confidence: cls.confidence,
          match_type: cls.match_type,
          candidates: scored,
          action,
          would_overwrite: overwrites,
          previous_image_url: previousUrl,
          destination_path: best && !isAmbiguous
            ? `stadiums/${best.slug}.${(f.mimeType.split("/")[1] ?? "jpg").replace(
                "jpeg",
                "jpg",
              )}`
            : null,
          destination_public_url: null,
          notes,
        });
      }

      // Insert history in chunks
      for (let i = 0; i < historyRows.length; i += 200) {
        const chunk = historyRows.slice(i, i + 200);
        const { error: hErr } = await admin
          .from("stadium_media_history")
          .insert(chunk);
        if (hErr) throw hErr;
      }

      const report = {
        folder_id: folderId,
        scanned_files: files.length,
        image_files: imageFiles.length,
        processed: toProcess.length,
        stadiums_in_db: stadiumList.length,
        dry_run: dryRun,
      };

      await admin
        .from("stadium_media_imports")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          total_files: toProcess.length,
          matched_count: matched,
          ambiguous_count: ambiguous,
          unmatched_count: unmatched,
          would_overwrite_count: wouldOverwrite,
          duplicate_count: duplicates,
          imported_count: 0,
          report,
        })
        .eq("id", importId);

      return new Response(
        JSON.stringify({
          ok: true,
          import_id: importId,
          dry_run: dryRun,
          totals: {
            scanned: files.length,
            images: imageFiles.length,
            processed: toProcess.length,
            matched,
            ambiguous,
            unmatched,
            would_overwrite: wouldOverwrite,
            duplicates,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await admin
        .from("stadium_media_imports")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: msg,
        })
        .eq("id", importId);
      throw e;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("sync-drive-stadium-media error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
