// Admin-only: for a given host stadium, surface any scheduled WC2026 fixture
// from the canonical seed that has no matching `matches` row yet, as a
// pending one-row import batch the admin can apply via wc-import-apply.

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
}

const fold = (s: string | null | undefined): string =>
  !s ? "" : s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// Subset duplicated from wc-import-schedule SEED.
const SEED: SeedRow[] = [
  { slug: "wc2026-1-mex-tbd1", kickoffUtc: "2026-06-11T18:00:00Z", kickoffLocal: "12:00", homeTeam: "Mexico", awayTeam: "TBD", homeShort: "MEX", awayShort: "TBD", phase: "group", matchday: 1, groupCode: "A", venue: "Estadio Azteca", venueAliases: ["Estadio Banorte"], city: "Mexico City", country: "Mexico" },
  { slug: "wc2026-1-can-tbd2", kickoffUtc: "2026-06-12T23:00:00Z", kickoffLocal: "16:00", homeTeam: "Canada", awayTeam: "TBD", homeShort: "CAN", awayShort: "TBD", phase: "group", matchday: 1, groupCode: "B", venue: "BMO Field", city: "Toronto", country: "Canada" },
  { slug: "wc2026-1-usa-tbd3", kickoffUtc: "2026-06-12T20:00:00Z", kickoffLocal: "16:00", homeTeam: "USA", awayTeam: "TBD", homeShort: "USA", awayShort: "TBD", phase: "group", matchday: 1, groupCode: "D", venue: "SoFi Stadium", city: "Inglewood", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-metlife", kickoffUtc: "2026-06-13T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "MetLife Stadium", city: "East Rutherford", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-att", kickoffUtc: "2026-06-14T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "AT&T Stadium", city: "Arlington", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-mercedes", kickoffUtc: "2026-06-15T19:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-lincoln", kickoffUtc: "2026-06-15T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Lincoln Financial Field", city: "Philadelphia", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-hardrock", kickoffUtc: "2026-06-16T23:00:00Z", kickoffLocal: "19:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Hard Rock Stadium", city: "Miami Gardens", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-lumen", kickoffUtc: "2026-06-15T22:00:00Z", kickoffLocal: "15:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Lumen Field", city: "Seattle", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-levis", kickoffUtc: "2026-06-17T19:00:00Z", kickoffLocal: "12:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Levi's Stadium", city: "Santa Clara", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-arrowhead", kickoffUtc: "2026-06-16T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Arrowhead Stadium", city: "Kansas City", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-nrg", kickoffUtc: "2026-06-14T19:00:00Z", kickoffLocal: "14:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "NRG Stadium", city: "Houston", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-gillette", kickoffUtc: "2026-06-15T20:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Gillette Stadium", city: "Foxborough", country: "United States" },
  { slug: "wc2026-2-tbd-tbd-bcplace", kickoffUtc: "2026-06-13T23:00:00Z", kickoffLocal: "16:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "BC Place", city: "Vancouver", country: "Canada" },
  { slug: "wc2026-2-tbd-tbd-akron", kickoffUtc: "2026-06-14T22:00:00Z", kickoffLocal: "17:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Estadio Akron", city: "Guadalajara", country: "Mexico" },
  { slug: "wc2026-2-tbd-tbd-bbva", kickoffUtc: "2026-06-14T22:00:00Z", kickoffLocal: "17:00", homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD", phase: "group", matchday: 2, venue: "Estadio BBVA", city: "Monterrey", country: "Mexico" },
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { stadium_id } = await req.json();
    if (!stadium_id) return new Response(JSON.stringify({ error: "missing_stadium_id" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: stadium } = await admin
      .from("stadiums")
      .select("id, slug, stadium_name, aliases, city, country")
      .eq("id", stadium_id).single();
    if (!stadium) return new Response(JSON.stringify({ error: "stadium_not_found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const venueKey = fold(stadium.stadium_name);
    const aliasKeys = (stadium.aliases || []).map(fold);
    const candidates = SEED.filter((s) => {
      const vk = fold(s.venue);
      const ak = (s.venueAliases || []).map(fold);
      if (vk === venueKey) return true;
      if (aliasKeys.includes(vk)) return true;
      if (ak.includes(venueKey)) return true;
      return fold(s.city) === fold(stadium.city) && fold(s.country) === fold(stadium.country);
    });

    const { data: existing } = await admin
      .from("matches").select("slug").in("slug", candidates.map((c) => c.slug));
    const have = new Set((existing || []).map((m: any) => m.slug));
    const missing = candidates.filter((c) => !have.has(c.slug));

    if (missing.length === 0) {
      return new Response(JSON.stringify({ batch_id: null, proposed: [], summary: { total: 0, ready: 0, duplicate: 0, needs_stadium: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const proposed = missing.map((r) => ({
      row: r,
      stadium_id: stadium.id,
      stadium_slug: stadium.slug,
      stadium_name: stadium.stadium_name,
      strategy: "name",
      status: "ready",
    }));
    const summary = { total: proposed.length, ready: proposed.length, duplicate: 0, needs_stadium: 0 };

    const { data: batch, error } = await admin
      .from("wc_match_import_batches")
      .insert({ source: "copilot", status: "pending", summary, proposed, created_by: user.id })
      .select("id").single();
    if (error) throw error;

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
