import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Mode = "scan" | "commit";

type Bucket = "new" | "ambiguous" | "existing" | "auto_safe";

interface CandidateClub {
  bucket: Bucket;
  raw_name: string;
  normalized: string;
  slug: string;
  short_name: string;
  countries: string[];
  leagues: string[];
  logos: string[];
  stadiums: { name: string; slug: string | null }[];
  cities: string[];
  match_count: number;
  matched_existing_slug?: string;
  reason?: string;
}

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeName = (s: string) =>
  stripAccents(s)
    .toLowerCase()
    .replace(/\b(fc|cf|ac|sc|afc|cfc|club|футбольный)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (s: string) =>
  stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const shortCode = (name: string) => {
  const clean = stripAccents(name).replace(/[^A-Za-z ]/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => !/^(fc|cf|ac|sc|afc|cfc)$/i.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[1][1] || words[0][1] || "")).toUpperCase();
  return clean.replace(/\s+/g, "").slice(0, 3).toUpperCase() || "TBD";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Verify admin role
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode: Mode = body.mode === "commit" ? "commit" : "scan";
    const slugsToImport: string[] | undefined = Array.isArray(body.slugs) ? body.slugs : undefined;
    const includeAutoSafe: boolean = body.includeAutoSafe !== false;

    // Fetch matches in chunks to avoid 1k row limit
    const allMatches: any[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await admin
        .from("matches")
        .select("home_team,away_team,home_short,away_short,home_logo,away_logo,competition,country,city,stadium")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allMatches.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // Existing clubs
    const { data: existingClubs } = await admin
      .from("club_ticketing_profiles")
      .select("slug,club_name,short_name,country,league");
    const existingByNorm = new Map<string, { slug: string; club_name: string }>();
    const existingBySlug = new Set<string>();
    (existingClubs ?? []).forEach((c) => {
      existingBySlug.add(c.slug);
      existingByNorm.set(normalizeName(c.club_name), { slug: c.slug, club_name: c.club_name });
      if (c.short_name) existingByNorm.set(normalizeName(c.short_name), { slug: c.slug, club_name: c.club_name });
    });

    // Stadiums for slug resolution
    const { data: stadiumsData } = await admin
      .from("stadiums")
      .select("slug,stadium_name");
    const stadiumByNorm = new Map<string, string>();
    (stadiumsData ?? []).forEach((s) => stadiumByNorm.set(normalizeName(s.stadium_name), s.slug));

    // Aggregate teams from matches
    type Agg = {
      raw_name: string;
      short: string;
      countries: Set<string>;
      leagues: Set<string>;
      logos: Set<string>;
      stadiums: Map<string, string | null>;
      cities: Set<string>;
      count: number;
    };
    const agg = new Map<string, Agg>();
    const bump = (
      name: string | null,
      short: string | null,
      logo: string | null,
      league: string | null,
      country: string | null,
      city: string | null,
      stadium: string | null,
      isHome: boolean,
    ) => {
      if (!name || name.trim() === "" || name === "TBD") return;
      const norm = normalizeName(name);
      if (!norm) return;
      let entry = agg.get(norm);
      if (!entry) {
        entry = {
          raw_name: name.trim(),
          short: short?.trim() || shortCode(name),
          countries: new Set(),
          leagues: new Set(),
          logos: new Set(),
          stadiums: new Map(),
          cities: new Set(),
          count: 0,
        };
        agg.set(norm, entry);
      }
      entry.count++;
      if (country) entry.countries.add(country);
      if (league) entry.leagues.add(league);
      if (logo) entry.logos.add(logo);
      if (isHome && stadium) {
        const sslug = stadiumByNorm.get(normalizeName(stadium)) ?? null;
        if (!entry.stadiums.has(stadium)) entry.stadiums.set(stadium, sslug);
        if (city) entry.cities.add(city);
      }
    };
    for (const m of allMatches) {
      bump(m.home_team, m.home_short, m.home_logo, m.competition, m.country, m.city, m.stadium, true);
      bump(m.away_team, m.away_short, m.away_logo, m.competition, m.country, m.city, m.stadium, false);
    }

    // Classify
    const candidates: CandidateClub[] = [];
    for (const [norm, a] of agg.entries()) {
      const baseSlug = slugify(a.raw_name);
      const existing = existingByNorm.get(norm) ?? (existingBySlug.has(baseSlug) ? { slug: baseSlug, club_name: a.raw_name } : undefined);
      const countries = [...a.countries].filter(Boolean);
      const leagues = [...a.leagues].filter(Boolean);

      const base: CandidateClub = {
        bucket: "new",
        raw_name: a.raw_name,
        normalized: norm,
        slug: baseSlug,
        short_name: a.short,
        countries,
        leagues,
        logos: [...a.logos].filter(Boolean),
        stadiums: [...a.stadiums.entries()].map(([name, slug]) => ({ name, slug })),
        cities: [...a.cities].filter(Boolean),
        match_count: a.count,
      };

      if (existing) {
        candidates.push({ ...base, bucket: "existing", matched_existing_slug: existing.slug });
        continue;
      }

      const ambiguous = countries.length > 1 || leagues.length > 1;
      if (ambiguous) {
        candidates.push({
          ...base,
          bucket: "ambiguous",
          reason: `Multiple ${countries.length > 1 ? "countries" : ""}${countries.length > 1 && leagues.length > 1 ? " & " : ""}${leagues.length > 1 ? "leagues" : ""} detected`,
        });
      } else if (countries.length === 1 && leagues.length === 1 && base.logos.length > 0) {
        candidates.push({ ...base, bucket: "auto_safe" });
      } else {
        candidates.push({ ...base, bucket: "new", reason: "Missing country, league, or logo" });
      }
    }

    candidates.sort((a, b) => b.match_count - a.match_count);

    // SCAN mode: return classification only
    if (mode === "scan") {
      const summary = {
        total_teams: candidates.length,
        existing: candidates.filter((c) => c.bucket === "existing").length,
        auto_safe: candidates.filter((c) => c.bucket === "auto_safe").length,
        ambiguous: candidates.filter((c) => c.bucket === "ambiguous").length,
        new_incomplete: candidates.filter((c) => c.bucket === "new").length,
      };
      return new Response(JSON.stringify({ mode, summary, candidates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // COMMIT mode: insert selected
    const toInsert = candidates.filter((c) => {
      if (c.bucket === "existing") return false;
      if (slugsToImport && slugsToImport.length > 0) return slugsToImport.includes(c.slug);
      // Default: only auto_safe
      return includeAutoSafe && c.bucket === "auto_safe";
    });

    // Resolve slug collisions
    const usedSlugs = new Set<string>(existingBySlug);
    const ensureUniqueSlug = (s: string) => {
      let candidate = s || "club";
      let i = 2;
      while (usedSlugs.has(candidate)) candidate = `${s}-${i++}`;
      usedSlugs.add(candidate);
      return candidate;
    };

    const today = new Date().toISOString().slice(0, 10);
    const rows = toInsert.map((c) => {
      const finalSlug = ensureUniqueSlug(c.slug);
      const stadium = c.stadiums[0] ?? null;
      return {
        slug: finalSlug,
        club_name: c.raw_name,
        short_name: c.short_name,
        country: c.countries[0] ?? null,
        city: c.cities[0] ?? null,
        league: c.leagues[0] ?? null,
        stadium_name: stadium?.name ?? null,
        stadium_slug: stadium?.slug ?? null,
        logo_url: c.logos[0] ?? null,
        average_difficulty: "medium",
        public_sale_possible: true,
        notes: `Auto-imported from matches dataset on ${today} (${c.match_count} matches referenced)`,
      };
    });

    let inserted = 0;
    const errors: string[] = [];
    if (rows.length > 0) {
      // Insert in chunks of 100
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const { error, count } = await admin
          .from("club_ticketing_profiles")
          .insert(chunk, { count: "exact" });
        if (error) {
          errors.push(error.message);
        } else {
          inserted += count ?? chunk.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        mode,
        inserted,
        attempted: rows.length,
        errors,
        imported_slugs: rows.map((r) => r.slug),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
