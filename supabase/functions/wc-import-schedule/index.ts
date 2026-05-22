// Admin-only: build a pending import batch of WC2026 matches.
//
// Source: either `fifa_seed` (canonical shipped list) or `csv` (admin upload,
// same shape). The function resolves every row against the host stadiums
// (is_world_cup_host=true), dedupes against existing matches by slug, and
// writes a `wc_match_import_batches` row with status=pending. No rows are
// inserted into `matches` here — admin reviews then calls wc-import-apply.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface SeedRow {
  slug: string;
  kickoffUtc: string;
  kickoffLocal?: string;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  phase: string;
  matchday: number;
  groupCode?: string | null;
  venue: string;
  city: string;
  country: string;
  venueAliases?: string[];
  latitude?: number;
  longitude?: number;
}

interface HostStadium {
  id: string;
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  aliases: string[] | null;
  latitude: number | null;
  longitude: number | null;
}

// --- minimal accent fold + resolver (mirrors src/lib/wcStadiumResolver.ts) ---
const fold = (s: string | null | undefined): string => {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._'`/]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const resolveHost = (row: SeedRow, hosts: HostStadium[]) => {
  const venueF = fold(row.venue);
  const aliasF = [row.venue, ...(row.venueAliases || [])].map(fold);
  let hit = hosts.find((h) => fold(h.stadium_name) === venueF);
  if (hit) return { stadium: hit, strategy: "name" };
  hit = hosts.find((h) => fold(h.slug) === venueF);
  if (hit) return { stadium: hit, strategy: "slug" };
  hit = hosts.find((h) => {
    const a = (h.aliases || []).map(fold);
    return aliasF.some((x) => a.includes(x)) || a.includes(venueF) ||
      aliasF.includes(fold(h.stadium_name));
  });
  if (hit) return { stadium: hit, strategy: "alias" };
  const cityMatches = hosts.filter(
    (h) => fold(h.city) === fold(row.city) && fold(h.country) === fold(row.country),
  );
  if (cityMatches.length === 1) {
    return { stadium: cityMatches[0], strategy: "city-country" };
  }
  if (typeof row.latitude === "number" && typeof row.longitude === "number") {
    const withCoords = hosts.filter((h) => h.latitude != null && h.longitude != null);
    const near = withCoords
      .map((h) => ({ h, d: haversineKm(row.latitude!, row.longitude!, h.latitude!, h.longitude!) }))
      .filter((x) => x.d <= 5)
      .sort((a, b) => a.d - b.d);
    if (near.length) return { stadium: near[0].h, strategy: "coords" };
  }
  return { stadium: null, strategy: "none" };
};

// Canonical seed embedded here (kept in sync with src/data/wc2026Schedule.ts).
// For brevity the edge function lets the caller pass payload.rows for CSV imports.
const SEED: SeedRow[] = [
  { slug: "wc2026-1-mex-tbd1", kickoffUtc: "2026-06-11T18:00:00Z", kickoffLocal: "12:00", homeTeam: "Mexico", awayTeam: "TBD", homeShort: "MEX", awayShort: "TBD", phase: "group", matchday: 1, groupCode: "A", venue: "Estadio Azteca", venueAliases: ["Estadio Banorte"], city: "Mexico City", country: "Mexico" },
  { slug: "wc2026-1-can-tbd2", kickoffUtc: "2026-06-12T23:00:00Z", kickoffLocal: "16:00", homeTeam: "Canada", awayTeam: "TBD", homeShort: "CAN", awayShort: "TBD", phase: "group", matchday: 1, groupCode: "B", venue: "BMO Field", city: "Toronto", country: "Canada" },
  { slug: "wc2026-1-usa-tbd3", kickoffUtc: "2026-06-12T20:00:00Z", kickoffLocal: "16:00", homeTeam: "USA", awayTeam: "TBD", homeShort: "USA", awayShort: "TBD", phase: "group", matchday: 1, groupCode: "D", venue: "SoFi Stadium", city: "Inglewood", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-metlife", kickoffUtc: "2026-06-13T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "MetLife Stadium", venueAliases: ["New York / New Jersey Stadium"], city: "East Rutherford", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-att", kickoffUtc: "2026-06-14T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "AT&T Stadium", venueAliases: ["Dallas Stadium"], city: "Arlington", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-mercedes", kickoffUtc: "2026-06-15T19:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-lincoln", kickoffUtc: "2026-06-15T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Lincoln Financial Field", venueAliases: ["Philadelphia Stadium"], city: "Philadelphia", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-hardrock", kickoffUtc: "2026-06-16T23:00:00Z", kickoffLocal: "19:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Hard Rock Stadium", venueAliases: ["Miami Stadium"], city: "Miami Gardens", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-lumen", kickoffUtc: "2026-06-15T22:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Lumen Field", venueAliases: ["Seattle Stadium"], city: "Seattle", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-levis", kickoffUtc: "2026-06-17T19:00:00Z", kickoffLocal: "12:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Levi's Stadium", venueAliases: ["Bay Area Stadium", "San Francisco Bay Area Stadium"], city: "Santa Clara", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-arrowhead", kickoffUtc: "2026-06-16T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Arrowhead Stadium", venueAliases: ["GEHA Field at Arrowhead Stadium", "Kansas City Stadium"], city: "Kansas City", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-nrg", kickoffUtc: "2026-06-14T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "NRG Stadium", city: "Houston", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-gillette", kickoffUtc: "2026-06-15T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Gillette Stadium", venueAliases: ["Boston Stadium"], city: "Foxborough", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-bcplace", kickoffUtc: "2026-06-13T23:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "BC Place", venueAliases: ["Vancouver Stadium"], city: "Vancouver", country: "Canada" },
  { slug: "wc2026-2-tbd-tbd-akron", kickoffUtc: "2026-06-14T22:00:00Z", kickoffLocal: "17:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Estadio Akron", venueAliases: ["Estadio Chivas", "Guadalajara Stadium"], city: "Guadalajara", country: "Mexico" },
  { slug: "wc2026-2-tbd-tbd-bbva", kickoffUtc: "2026-06-14T22:00:00Z", kickoffLocal: "17:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Estadio BBVA", venueAliases: ["Estadio BBVA Bancomer", "Monterrey Stadium"], city: "Monterrey", country: "Mexico" },
  { slug: "wc2026-r32-1-att", kickoffUtc: "2026-06-27T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "r32", matchday: 4, venue: "AT&T Stadium", city: "Arlington", country: "United States" },
  { slug: "wc2026-r16-1-bcplace", kickoffUtc: "2026-07-04T22:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "r16", matchday: 5, venue: "BC Place", city: "Vancouver", country: "Canada" },
  { slug: "wc2026-qf-1-mercedes", kickoffUtc: "2026-07-09T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "qf", matchday: 6, venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "United States" },
  { slug: "wc2026-sf-1-att", kickoffUtc: "2026-07-14T20:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "sf", matchday: 7, venue: "AT&T Stadium", city: "Arlington", country: "United States" },
  { slug: "wc2026-3p-hardrock", kickoffUtc: "2026-07-18T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "3p", matchday: 8, venue: "Hard Rock Stadium", city: "Miami Gardens", country: "United States" },
  { slug: "wc2026-final-metlife", kickoffUtc: "2026-07-19T19:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "final", matchday: 8, venue: "MetLife Stadium", city: "East Rutherford", country: "United States" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const source: "fifa_seed" | "csv" = body.source === "csv" ? "csv" : "fifa_seed";
    const rows: SeedRow[] = source === "csv" ? (body.rows || []) : SEED;

    const admin = createClient(supabaseUrl, serviceKey);

    // load host stadiums + existing matches
    const [{ data: hosts }, { data: existing }] = await Promise.all([
      admin.from("stadiums")
        .select("id,slug,stadium_name,city,country,aliases,latitude,longitude")
        .eq("is_world_cup_host", true)
        .is("archived_at", null),
      admin.from("matches").select("slug").not("slug", "is", null),
    ]);

    const existingSlugs = new Set((existing || []).map((m: any) => m.slug));

    const proposed = rows.map((r) => {
      const { stadium, strategy } = resolveHost(r, (hosts || []) as HostStadium[]);
      let status: "ready" | "duplicate" | "needs_stadium" = "ready";
      if (existingSlugs.has(r.slug)) status = "duplicate";
      else if (!stadium) status = "needs_stadium";
      return {
        row: r,
        stadium_id: stadium?.id ?? null,
        stadium_slug: stadium?.slug ?? null,
        stadium_name: stadium?.stadium_name ?? null,
        strategy,
        status,
      };
    });

    const summary = {
      total: proposed.length,
      ready: proposed.filter((p) => p.status === "ready").length,
      duplicate: proposed.filter((p) => p.status === "duplicate").length,
      needs_stadium: proposed.filter((p) => p.status === "needs_stadium").length,
    };

    const { data: batch, error: insErr } = await admin
      .from("wc_match_import_batches")
      .insert({ source, status: "pending", summary, proposed, created_by: user.id })
      .select("id")
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ batch_id: batch.id, summary, proposed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
