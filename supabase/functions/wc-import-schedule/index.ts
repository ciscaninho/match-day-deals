// Admin-only: build a pending import batch of WC2026 matches.
//
// Source: either `fifa_seed` (canonical 104-fixture schedule) or `csv`
// (admin upload, same shape). The function resolves every row against the
// host stadiums (is_world_cup_host=true), dedupes against existing matches
// by slug, and writes a `wc_match_import_batches` row with status=pending.
// No rows are inserted into `matches` here — admin reviews then calls
// wc-import-apply.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type TeamStatus = "tbd" | "projected" | "confirmed";
type FixtureConfidence = "projected" | "confirmed";

interface SeedRow {
  slug: string;
  kickoffUtc: string;
  kickoffLocal?: string;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  homeTeamStatus?: TeamStatus;
  awayTeamStatus?: TeamStatus;
  fixtureConfidence?: FixtureConfidence;
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

// ---------------------------------------------------------------------------
// Canonical 104-fixture seed (mirrors src/data/wc2026Schedule.ts).
// ---------------------------------------------------------------------------
interface Venue { key: string; name: string; aliases?: string[]; city: string; country: string; localOffsetHours: number; }
const V: Record<string, Venue> = {
  azteca:    { key: "azteca",    name: "Estadio Azteca",         aliases: ["Estadio Banorte","Azteca Stadium"], city: "Mexico City",     country: "Mexico",        localOffsetHours: -6 },
  akron:     { key: "akron",     name: "Estadio Akron",          aliases: ["Estadio Chivas","Guadalajara Stadium"], city: "Guadalajara",  country: "Mexico",        localOffsetHours: -6 },
  bbva:      { key: "bbva",      name: "Estadio BBVA",           aliases: ["Estadio BBVA Bancomer","Monterrey Stadium"], city: "Monterrey", country: "Mexico",        localOffsetHours: -6 },
  bmo:       { key: "bmo",       name: "BMO Field",              aliases: ["Toronto Stadium"], city: "Toronto",       country: "Canada",        localOffsetHours: -4 },
  bcplace:   { key: "bcplace",   name: "BC Place",               aliases: ["Vancouver Stadium"], city: "Vancouver",   country: "Canada",        localOffsetHours: -7 },
  sofi:      { key: "sofi",      name: "SoFi Stadium",           aliases: ["Los Angeles Stadium"], city: "Inglewood", country: "United States", localOffsetHours: -7 },
  levis:     { key: "levis",     name: "Levi's Stadium",         aliases: ["Bay Area Stadium","San Francisco Bay Area Stadium"], city: "Santa Clara", country: "United States", localOffsetHours: -7 },
  lumen:     { key: "lumen",     name: "Lumen Field",            aliases: ["Seattle Stadium"], city: "Seattle",       country: "United States", localOffsetHours: -7 },
  arrowhead: { key: "arrowhead", name: "Arrowhead Stadium",      aliases: ["GEHA Field at Arrowhead Stadium","Kansas City Stadium"], city: "Kansas City", country: "United States", localOffsetHours: -5 },
  nrg:       { key: "nrg",       name: "NRG Stadium",            aliases: ["Houston Stadium"], city: "Houston",       country: "United States", localOffsetHours: -5 },
  att:       { key: "att",       name: "AT&T Stadium",           aliases: ["Dallas Stadium"], city: "Arlington",      country: "United States", localOffsetHours: -5 },
  mercedes:  { key: "mercedes",  name: "Mercedes-Benz Stadium",  aliases: ["Atlanta Stadium"], city: "Atlanta",       country: "United States", localOffsetHours: -4 },
  hardrock:  { key: "hardrock",  name: "Hard Rock Stadium",      aliases: ["Miami Stadium"], city: "Miami Gardens",   country: "United States", localOffsetHours: -4 },
  lincoln:   { key: "lincoln",   name: "Lincoln Financial Field",aliases: ["Philadelphia Stadium"], city: "Philadelphia", country: "United States", localOffsetHours: -4 },
  gillette:  { key: "gillette",  name: "Gillette Stadium",       aliases: ["Boston Stadium","Foxborough Stadium"], city: "Foxborough", country: "United States", localOffsetHours: -4 },
  metlife:   { key: "metlife",   name: "MetLife Stadium",        aliases: ["New York / New Jersey Stadium"], city: "East Rutherford", country: "United States", localOffsetHours: -4 },
};
type VK = keyof typeof V;
const pad = (n: number) => String(n).padStart(2, "0");
const kickoff = (dateLocal: string, timeLocal: string, venue: Venue) => {
  const [y, m, d] = dateLocal.split("-").map(Number);
  const [hh, mm] = timeLocal.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, hh - venue.localOffsetHours, mm));
  return { kickoffUtc: utc.toISOString(), kickoffLocal: timeLocal };
};
const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;
type G = typeof groups[number];
const hostSlot: Partial<Record<G, { code: string; name: string }>> = {
  A: { code: "MEX", name: "Mexico" },
  B: { code: "CAN", name: "Canada" },
  D: { code: "USA", name: "USA" },
};
const groupVenueRotation: Record<G, [VK,VK,VK,VK,VK,VK]> = {
  A: ["azteca","akron","bbva","azteca","akron","bbva"],
  B: ["bmo","bcplace","bmo","bcplace","bmo","bcplace"],
  C: ["nrg","arrowhead","nrg","arrowhead","nrg","arrowhead"],
  D: ["sofi","levis","lumen","sofi","levis","lumen"],
  E: ["mercedes","lincoln","mercedes","lincoln","mercedes","lincoln"],
  F: ["hardrock","gillette","hardrock","gillette","hardrock","gillette"],
  G: ["att","metlife","att","metlife","att","metlife"],
  H: ["nrg","arrowhead","nrg","arrowhead","nrg","arrowhead"],
  I: ["sofi","levis","lumen","sofi","levis","lumen"],
  J: ["mercedes","lincoln","mercedes","lincoln","mercedes","lincoln"],
  K: ["hardrock","gillette","hardrock","gillette","hardrock","gillette"],
  L: ["att","metlife","att","metlife","att","metlife"],
};
const mdDates: Record<1|2|3, string[]> = {
  1: ["2026-06-11","2026-06-12","2026-06-13","2026-06-14","2026-06-15","2026-06-16","2026-06-17"],
  2: ["2026-06-18","2026-06-19","2026-06-20","2026-06-21","2026-06-22","2026-06-23"],
  3: ["2026-06-24","2026-06-25","2026-06-26","2026-06-27"],
};
const mdTimes = ["12:00","15:00","18:00","21:00"];

const buildSeed = (): SeedRow[] => {
  const out: SeedRow[] = [];
  const pairings: Array<[number,number]> = [[1,2],[3,4],[1,3],[4,2],[4,1],[2,3]];
  groups.forEach((g, gi) => {
    pairings.forEach(([h, a], pi) => {
      const md = (Math.floor(pi/2)+1) as 1|2|3;
      const venue = V[groupVenueRotation[g][pi]];
      const date = mdDates[md][(gi+pi) % mdDates[md].length];
      const time = mdTimes[(gi+pi) % mdTimes.length];
      const { kickoffUtc, kickoffLocal } = kickoff(date, time, venue);
      const host = hostSlot[g];
      const homeIsHost = md===1 && pi===0 && !!host;
      out.push({
        slug: `wc2026-g${g.toLowerCase()}-md${md}-${h}v${a}`,
        kickoffUtc, kickoffLocal,
        homeTeam: homeIsHost ? host!.name : `${g}${h}`,
        awayTeam: `${g}${a}`,
        homeShort: homeIsHost ? host!.code : `${g}${h}`,
        awayShort: `${g}${a}`,
        homeTeamStatus: homeIsHost ? "projected" : "tbd",
        awayTeamStatus: "tbd",
        fixtureConfidence: "projected",
        phase: "group", matchday: md, groupCode: g,
        venue: venue.name, city: venue.city, country: venue.country,
        venueAliases: venue.aliases,
      });
    });
  });
  const r32V: VK[] = ["att","mercedes","sofi","nrg","arrowhead","levis","lumen","gillette","metlife","hardrock","lincoln","azteca","akron","bbva","bcplace","bmo"];
  const r32D = ["2026-06-28","2026-06-29","2026-06-30","2026-07-01","2026-07-02","2026-07-03"];
  r32V.forEach((vk, i) => {
    const venue = V[vk];
    const { kickoffUtc, kickoffLocal } = kickoff(r32D[i%r32D.length], mdTimes[i%mdTimes.length], venue);
    out.push({ slug: `wc2026-r32-${pad(i+1)}-${vk}`, kickoffUtc, kickoffLocal,
      homeTeam:"TBD",awayTeam:"TBD",homeShort:"TBD",awayShort:"TBD",
      homeTeamStatus:"tbd",awayTeamStatus:"tbd",fixtureConfidence:"projected",
      phase:"r32",matchday:4,venue:venue.name,city:venue.city,country:venue.country,venueAliases:venue.aliases });
  });
  const r16V: VK[] = ["bcplace","mercedes","sofi","metlife","arrowhead","gillette","levis","hardrock"];
  const r16D = ["2026-07-04","2026-07-05","2026-07-06","2026-07-07"];
  r16V.forEach((vk, i) => {
    const venue = V[vk];
    const { kickoffUtc, kickoffLocal } = kickoff(r16D[i%r16D.length], mdTimes[i%mdTimes.length], venue);
    out.push({ slug: `wc2026-r16-${pad(i+1)}-${vk}`, kickoffUtc, kickoffLocal,
      homeTeam:"TBD",awayTeam:"TBD",homeShort:"TBD",awayShort:"TBD",
      homeTeamStatus:"tbd",awayTeamStatus:"tbd",fixtureConfidence:"projected",
      phase:"r16",matchday:5,venue:venue.name,city:venue.city,country:venue.country,venueAliases:venue.aliases });
  });
  const qfV: VK[] = ["mercedes","sofi","metlife","gillette"];
  const qfD = ["2026-07-09","2026-07-10","2026-07-11","2026-07-11"];
  qfV.forEach((vk, i) => {
    const venue = V[vk];
    const { kickoffUtc, kickoffLocal } = kickoff(qfD[i], i%2?"18:00":"15:00", venue);
    out.push({ slug: `wc2026-qf-${pad(i+1)}-${vk}`, kickoffUtc, kickoffLocal,
      homeTeam:"TBD",awayTeam:"TBD",homeShort:"TBD",awayShort:"TBD",
      homeTeamStatus:"tbd",awayTeamStatus:"tbd",fixtureConfidence:"projected",
      phase:"qf",matchday:6,venue:venue.name,city:venue.city,country:venue.country,venueAliases:venue.aliases });
  });
  const sfV: VK[] = ["att","mercedes"];
  const sfD = ["2026-07-14","2026-07-15"];
  sfV.forEach((vk, i) => {
    const venue = V[vk];
    const { kickoffUtc, kickoffLocal } = kickoff(sfD[i], "15:00", venue);
    out.push({ slug: `wc2026-sf-${pad(i+1)}-${vk}`, kickoffUtc, kickoffLocal,
      homeTeam:"TBD",awayTeam:"TBD",homeShort:"TBD",awayShort:"TBD",
      homeTeamStatus:"tbd",awayTeamStatus:"tbd",fixtureConfidence:"projected",
      phase:"sf",matchday:7,venue:venue.name,city:venue.city,country:venue.country,venueAliases:venue.aliases });
  });
  {
    const venue = V.hardrock;
    const { kickoffUtc, kickoffLocal } = kickoff("2026-07-18", "16:00", venue);
    out.push({ slug: "wc2026-3p-hardrock", kickoffUtc, kickoffLocal,
      homeTeam:"TBD",awayTeam:"TBD",homeShort:"TBD",awayShort:"TBD",
      homeTeamStatus:"tbd",awayTeamStatus:"tbd",fixtureConfidence:"projected",
      phase:"3p",matchday:8,venue:venue.name,city:venue.city,country:venue.country,venueAliases:venue.aliases });
  }
  {
    const venue = V.metlife;
    const { kickoffUtc, kickoffLocal } = kickoff("2026-07-19", "15:00", venue);
    out.push({ slug: "wc2026-final-metlife", kickoffUtc, kickoffLocal,
      homeTeam:"TBD",awayTeam:"TBD",homeShort:"TBD",awayShort:"TBD",
      homeTeamStatus:"tbd",awayTeamStatus:"tbd",fixtureConfidence:"projected",
      phase:"final",matchday:8,venue:venue.name,city:venue.city,country:venue.country,venueAliases:venue.aliases });
  }
  return out;
};

const SEED: SeedRow[] = buildSeed();

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
      by_phase: proposed.reduce((acc: Record<string, number>, p) => {
        const ph = (p.row as any).phase || "unknown";
        acc[ph] = (acc[ph] || 0) + 1;
        return acc;
      }, {}),
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
