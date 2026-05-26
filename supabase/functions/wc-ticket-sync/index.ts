// wc-ticket-sync — enrich World Cup ticket coverage. Handles both single event URLs
// and generic landing pages (auto-expanded into per-event rows).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (compatible; FootTicketBot/1.0; +https://footticketfinder.com)";

const STATUS_FROM_TEXT = (t: string): string | null => {
  const s = t.toLowerCase();
  if (s.includes("opening")) return "opening_match";
  if (s.includes("final") && !s.includes("semi") && !s.includes("quarter") && !s.includes("third")) return "final";
  if (s.includes("third")) return "third_place";
  if (s.includes("semi")) return "semi_final";
  if (s.includes("quarter")) return "quarter_final";
  if (s.includes("round of 16") || s.includes("r16")) return "round_of_16";
  if (s.includes("round of 32") || s.includes("r32")) return "round_of_32";
  if (s.includes("group")) return "group_stage";
  return null;
};

function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  return html.match(re)?.[1] ?? null;
}

function extractJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { out.push(JSON.parse(m[1].trim())); } catch { /* ignore */ }
  }
  return out;
}

function parseMatchup(title: string | null): { home: string | null; away: string | null } {
  if (!title) return { home: null, away: null };
  const cleaned = title.replace(/\s*[-–|·].*$/, "").trim();
  const m = cleaned.match(/^(.+?)\s+(?:vs?\.?|v|–|-)\s+(.+)$/i);
  if (!m) return { home: null, away: null };
  return { home: m[1].trim(), away: m[2].trim() };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function isGenericLanding(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    // Search pages, very short paths, or world-cup hubs are landing pages.
    if (/\/search\b/i.test(path)) return true;
    if (/\/(world[- ]cup|fifa)[- ]?2026?\b/i.test(path)) return true;
    const segs = path.split("/").filter(Boolean);
    if (segs.length <= 2) return true;
    // No event signature (event/match id) → treat as landing.
    if (!/event|match|fixture|ticket|game|\d{5,}/i.test(path)) return true;
    return false;
  } catch { return true; }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

type ScrapeResult = {
  event_name: string | null;
  home_label: string | null;
  away_label: string | null;
  event_date: string | null;
  image_url: string | null;
  starting_price: number | null;
  event_status: string | null;
};

type CoverageRow = {
  id: string;
  active?: boolean | null;
  stadium_slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  kind: string;
  provider: string;
  url: string | null;
  ticket_url: string | null;
  currency: string | null;
  status: string;
  priority: number | null;
  event_slug: string | null;
  event_name: string | null;
  event_date: string | null;
  home_label: string | null;
  away_label: string | null;
  image_url: string | null;
  event_status: string | null;
  match_id: string | null;
  last_sync_status: string | null;
};

function parseScrape(html: string): ScrapeResult {
  const title = extractMeta(html, "og:title") ?? html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null;
  const image = extractMeta(html, "og:image");
  const desc = extractMeta(html, "og:description");
  let event_date: string | null = null;
  let event_name: string | null = title?.trim() ?? null;
  let starting_price: number | null = null;
  let event_status: string | null = null;

  for (const block of extractJsonLd(html)) {
    const arr = Array.isArray(block) ? block : [block];
    for (const n of arr) {
      const t = String(n["@type"] ?? "").toLowerCase();
      if (t.includes("event")) {
        event_name = event_name ?? (typeof n.name === "string" ? n.name : null);
        if (typeof n.startDate === "string") {
          const d = new Date(n.startDate);
          if (!Number.isNaN(d.getTime())) event_date = d.toISOString().slice(0, 10);
        }
        const offers = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
        for (const o of offers) {
          const p = Number(o.lowPrice ?? o.price);
          if (Number.isFinite(p) && p > 0 && (starting_price == null || p < starting_price)) starting_price = p;
        }
      }
    }
  }
  if (!event_status && (event_name || desc)) event_status = STATUS_FROM_TEXT(`${event_name ?? ""} ${desc ?? ""}`);
  const { home, away } = parseMatchup(event_name);
  return { event_name, home_label: home, away_label: away, event_date, image_url: image, starting_price, event_status };
}

function extractEventLinks(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  const base = new URL(baseUrl);
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:")) continue;
    try {
      const u = new URL(raw, base);
      if (u.host !== base.host) continue;
      if (isGenericLanding(u.toString())) continue;
      out.add(u.toString().split("#")[0]);
    } catch { /* ignore */ }
    if (out.size >= 40) break;
  }
  return [...out];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const provider = body.provider as string | undefined;
    const limit = Math.min(Number(body.limit ?? 25), 100);
    const onlyFailed = body.onlyFailed === true;

    let sourceQ = supabase.from("wc_ticket_coverage").select("*");
    if (provider) sourceQ = sourceQ.ilike("provider", provider);
    const { data: sourceRows, error } = await sourceQ.limit(limit * 4);
    if (error) throw error;

    const allRows = ((sourceRows ?? []) as CoverageRow[]);
    const rowsSkippedInactive = allRows.filter((row) => row.active === false).length;
    const rowsSkippedMissingUrl = allRows.filter((row) => !(row.ticket_url ?? row.url)).length;
    const rows = allRows
      .filter((row) => row.active !== false)
      .filter((row) => !!(row.ticket_url ?? row.url))
      .filter((row) => !onlyFailed || !row.event_slug || row.last_sync_status !== "ok")
      .slice(0, limit);

    const { data: wcMatches } = await supabase
      .from("matches")
      .select("id,date,stadium,home_team,away_team")
      .ilike("competition", "%world cup%");

    const stadiumDateIndex = new Map<string, Array<{ id: string; date: string; home: string; away: string }>>();
    for (const m of (wcMatches ?? []) as any[]) {
      const day = m.date ? String(m.date).slice(0, 10) : null;
      if (!day || !m.stadium) continue;
      const key = `${String(m.stadium).toLowerCase()}|${day}`;
      const arr = stadiumDateIndex.get(key) ?? [];
      arr.push({ id: m.id, date: day, home: m.home_team, away: m.away_team });
      stadiumDateIndex.set(key, arr);
    }

    const debug: any[] = [];
    let scanned = 0, enriched = 0, linked = 0, failed = 0, expanded = 0, created = 0, skipped = 0;
    const rowsLoaded = rows.length;
    let rowsProcessed = 0;

    const seenUrls = new Set<string>();

    for (const r of rows) {
      scanned++;
      rowsProcessed++;
      const sourceUrl = r.ticket_url ?? r.url;
      const isLanding = isGenericLanding(sourceUrl);
      const dbg: any = { id: r.id, parsed_url: sourceUrl, landing: isLanding, detected: 0, created: 0, skipped: 0, reason: null };

      // ---- Landing page expansion ----
      if (isLanding) {
        const html = await fetchHtml(sourceUrl);
        if (!html) {
          failed++;
          await supabase.from("wc_ticket_coverage").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "scrape_failed",
          }).eq("id", r.id);
          dbg.reason = "fetch_failed";
          debug.push(dbg);
          continue;
        }
        const links = extractEventLinks(html, sourceUrl);
        dbg.detected = links.length;
        if (links.length === 0) {
          await supabase.from("wc_ticket_coverage").update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "no_events_found",
          }).eq("id", r.id);
          dbg.reason = "no_event_links";
          debug.push(dbg);
          continue;
        }

        for (const link of links.slice(0, 25)) {
          if (seenUrls.has(link)) { dbg.skipped++; continue; }
          seenUrls.add(link);
          const childHtml = await fetchHtml(link);
          if (!childHtml) { dbg.skipped++; continue; }
          const s = parseScrape(childHtml);
          if (!s.event_name && !s.event_date) { dbg.skipped++; continue; }

          // Slug: prefer derived, fallback to wc-{stadium}-{date}-{provider}
          let slug: string | null = null;
          if (s.event_date && (s.home_label || s.event_name)) {
            slug = slugify(`${s.event_date}-${s.home_label ?? s.event_name ?? "wc"}-${s.away_label ?? r.stadium_slug ?? ""}`);
          } else if (s.event_date && r.stadium_slug && r.provider) {
            slug = slugify(`wc-${r.stadium_slug}-${s.event_date}-${r.provider}`);
          }
          if (!slug) { dbg.skipped++; continue; }

          // Match linking
          let match_id: string | null = null;
          if (s.event_date && r.stadium_name) {
            const cands = stadiumDateIndex.get(`${String(r.stadium_name).toLowerCase()}|${s.event_date}`) ?? [];
            const pick = (s.home_label && s.away_label)
              ? cands.find((c) => `${c.home} ${c.away}`.toLowerCase().includes((s.home_label ?? "").toLowerCase().slice(0, 4)))
              : cands[0];
            if (pick) { match_id = pick.id; linked++; }
          }

          const row = {
            active: true,
            stadium_slug: r.stadium_slug,
            stadium_name: r.stadium_name,
            city: r.city,
            country: r.country,
            kind: r.kind,
            provider: r.provider,
            url: link,
            ticket_url: link,
            currency: r.currency ?? "EUR",
            status: "active",
            priority: r.priority ?? 100,
            event_slug: slug,
            event_name: s.event_name,
            event_date: s.event_date,
            home_label: s.home_label,
            away_label: s.away_label,
            event_status: s.event_status,
            image_url: s.image_url,
            starting_price: s.starting_price,
            ticket_source_type: r.kind,
            match_id,
            is_available: true,
            last_price_check: new Date().toISOString(),
            last_sync_at: new Date().toISOString(),
            last_sync_status: "ok",
          };
          const { error: insErr } = await supabase.from("wc_ticket_coverage")
            .upsert(row as never, { onConflict: "event_slug,provider", ignoreDuplicates: false });
          if (insErr) { dbg.skipped++; continue; }
          created++; dbg.created++;
        }

        // Mark parent landing as inactive (expanded)
        await supabase.from("wc_ticket_coverage").update({
          active: false,
          status: "archived",
          last_sync_at: new Date().toISOString(),
          last_sync_status: "expanded",
        }).eq("id", r.id);
        expanded++;
        debug.push(dbg);
        continue;
      }

      // ---- Single event scrape ----
      const html = await fetchHtml(sourceUrl);
      if (!html) {
        failed++;
        await supabase.from("wc_ticket_coverage").update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "scrape_failed",
        }).eq("id", r.id);
        dbg.reason = "fetch_failed";
        debug.push(dbg);
        continue;
      }
      const s = parseScrape(html);

      const patch: Record<string, unknown> = {
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_price_check: new Date().toISOString(),
      };
      if (!r.event_name && s.event_name) patch.event_name = s.event_name;
      if (!r.home_label && s.home_label) patch.home_label = s.home_label;
      if (!r.away_label && s.away_label) patch.away_label = s.away_label;
      if (!r.event_date && s.event_date) patch.event_date = s.event_date;
      if (!r.image_url && s.image_url) patch.image_url = s.image_url;
      if (!r.event_status && s.event_status) patch.event_status = s.event_status;
      if (s.starting_price != null) patch.starting_price = s.starting_price;

      const day = (patch.event_date ?? r.event_date) as string | null;
      if (!r.match_id && day && r.stadium_name) {
        const cands = stadiumDateIndex.get(`${String(r.stadium_name).toLowerCase()}|${day}`) ?? [];
        const home = (patch.home_label ?? r.home_label) as string | null;
        const away = (patch.away_label ?? r.away_label) as string | null;
        let pick = cands[0];
        if (home && away) {
          const found = cands.find((c) =>
            (c.home?.toLowerCase().includes(home.toLowerCase()) || home.toLowerCase().includes((c.home ?? "").toLowerCase())) &&
            (c.away?.toLowerCase().includes(away.toLowerCase()) || away.toLowerCase().includes((c.away ?? "").toLowerCase()))
          );
          if (found) pick = found;
        }
        if (pick) { patch.match_id = pick.id; linked++; }
      }

      // Slug fallback
      if (!r.event_slug) {
        const eDate = (patch.event_date ?? r.event_date) as string | null;
        const home = (patch.home_label ?? r.home_label) as string | null;
        const name = (patch.event_name ?? r.event_name) as string | null;
        if (eDate && (home || name)) {
          patch.event_slug = slugify(`${eDate}-${home ?? name}-${(patch.away_label ?? r.away_label) ?? r.stadium_slug}`);
        } else if (eDate && r.stadium_slug && r.provider) {
          patch.event_slug = slugify(`wc-${r.stadium_slug}-${eDate}-${r.provider}`);
        }
      }

      const { error: upErr } = await supabase.from("wc_ticket_coverage").update(patch).eq("id", r.id);
      if (upErr) { failed++; dbg.reason = upErr.message; debug.push(dbg); continue; }
      enriched++; dbg.created = 0;
      debug.push(dbg);
    }

    return new Response(JSON.stringify({ rows_loaded: rowsLoaded, rows_skipped_inactive: rowsSkippedInactive, rows_skipped_missing_url: rowsSkippedMissingUrl, rows_processed: rowsProcessed, scanned, enriched, expanded, created, linked, failed, skipped, debug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
