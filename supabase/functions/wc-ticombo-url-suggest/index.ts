// Suggests matches.ticombo_url for FIFA World Cup 2026 fixtures.
// Crawls multiple Ticombo WC2026 index pages (date/team/city/venue groupings,
// plus group-stage and knockout indexes), parses the NEW slug schema
//   match-<N>-group-<X>-football-world-cup-2026-<YYMMDDHHMM>/<uuid>
//   match-104-final-w101-vs-w102-football-world-cup-2026-<YYMMDDHHMM>/<uuid>
// and matches each event to a canonical fixture by:
//   1. fifa_match_number (when DB column populated)  — strongest signal
//   2. kickoff date + group_code                     — group stage primary
//   3. kickoff date + phase                          — knockout primary
//   4. kickoff date alone                            — weak fallback
//   5. team-name overlap                             — tiebreaker only
// Returns proposals + a diagnostic report. Never writes.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TICOMBO_ROOTS = [
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-date&key=bab812da-41b7-42b7-aabe-cb3908cbc347",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=team",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=city",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=venue",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/group-stage-matches-world-cup-2026",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/knockout-stage-matches-world-cup-2026",
  "https://www.ticombo.com/en/sports-tickets/football-tickets/final-world-cup-2026",
];

// Pattern: /match-<...>/<uuid>  — strict trailing UUID
const MATCH_PATH_RE = /\/en\/sports-tickets\/football-tickets\/match-[a-z0-9-]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Hard rejects
const BLACKLIST_FRAGMENTS = [
  "all-matches", "stadium-", "-stadium-tickets", "package", "follow-",
  "hospitality", "venue-series", "vip-experience", "bundle", "series-pass",
];

type ParsedSlug = {
  url: string;
  uuid: string;
  match_number: number | null;
  group_code: string | null;
  phase: string | null;
  date: string | null; // YYYY-MM-DD
  raw_slug: string;
};

// Slug examples:
//   match-7-group-c-football-world-cup-2026-2606132359/<uuid>
//   match-104-final-w101-vs-w102-football-world-cup-2026-2607192359/<uuid>
//   match-89-round-of-16-...-football-world-cup-2026-<...>/<uuid>
function parseSlug(url: string): ParsedSlug | null {
  const m = url.match(/\/match-([a-z0-9-]+)\/([0-9a-f-]{36})/i);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  const uuid = m[2].toLowerCase();

  const numMatch = slug.match(/^(\d{1,3})-/);
  const match_number = numMatch ? Number(numMatch[1]) : null;

  const groupMatch = slug.match(/-group-([a-l])(?:-|$)/i);
  const group_code = groupMatch ? groupMatch[1].toUpperCase() : null;

  let phase: string | null = null;
  if (group_code) phase = "group";
  else if (/-final(?:-|$)/.test(slug) && !/semi-final|quarter-final|third-place/.test(slug)) phase = "final";
  else if (/semi-final|-sf-/.test(slug)) phase = "sf";
  else if (/quarter-final|-qf-/.test(slug)) phase = "qf";
  else if (/round-of-16|-r16-/.test(slug)) phase = "r16";
  else if (/round-of-32|-r32-/.test(slug)) phase = "r32";
  else if (/third-place|3rd-place/.test(slug)) phase = "3p";
  // Fall back from match_number when slug is ambiguous
  if (!phase && match_number != null) {
    if (match_number <= 72) phase = "group";
    else if (match_number <= 88) phase = "r32";
    else if (match_number <= 96) phase = "r16";
    else if (match_number <= 100) phase = "qf";
    else if (match_number <= 102) phase = "sf";
    else if (match_number === 103) phase = "3p";
    else if (match_number === 104) phase = "final";
  }

  // Packed datetime YYMMDDHHMM (we use the YMD only — HHMM is a sort placeholder)
  const dateMatch = slug.match(/-(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\/|$)/);
  let date: string | null = null;
  if (dateMatch) {
    const [, yy, mo, dd] = dateMatch;
    date = `20${yy}-${mo}-${dd}`;
  }

  return { url, uuid, match_number, group_code, phase, date, raw_slug: slug };
}

type Fixture = {
  id: string;
  home_team: string;
  away_team: string;
  date: string;
  group_code: string | null;
  phase: string | null;
  matchday: number | null;
  fifa_match_number: number | null;
  ticombo_url: string | null;
};

type Proposal = {
  match_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  group_code: string | null;
  phase: string | null;
  fifa_match_number: number | null;
  current_url: string | null;
  suggested_url: string;
  provider_event_id: string; // uuid
  ticombo_match_number: number | null;
  ticombo_date: string | null;
  ticombo_phase: string | null;
  ticombo_group: string | null;
  confidence: "high" | "medium" | "low";
  score: number;
  reasons: string[];
};

const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function scoreFixture(fx: Fixture, ev: ParsedSlug): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 1. fifa_match_number — strongest signal when available on both sides
  if (fx.fifa_match_number != null && ev.match_number != null && fx.fifa_match_number === ev.match_number) {
    score += 1000;
    reasons.push("fifa_match_number_exact");
  }

  const fxDateYMD = fx.date.slice(0, 10);
  const dateOk = ev.date && ev.date === fxDateYMD;

  // 2. date + group_code  — primary for group stage
  if (dateOk && ev.group_code && fx.group_code && ev.group_code === fx.group_code) {
    score += 500;
    reasons.push("date_plus_group");
  }
  // 3. date + phase  — primary for knockout
  else if (dateOk && ev.phase && fx.phase && ev.phase === fx.phase) {
    score += 400;
    reasons.push("date_plus_phase");
  }
  // 4. date alone
  else if (dateOk) {
    score += 100;
    reasons.push("date_only");
  }

  // Light penalty for date mismatch when match_number didn't fire
  if (!dateOk && ev.date && score < 1000) {
    score -= 50;
    reasons.push("date_mismatch");
  }

  // 5. Team-name tiebreaker (only meaningful for slugs that include teams)
  if (fx.home_team && fx.away_team) {
    const fxH = normalize(fx.home_team);
    const fxA = normalize(fx.away_team);
    const slug = ev.raw_slug;
    if (fxH && slug.includes(fxH)) { score += 10; reasons.push("home_in_slug"); }
    if (fxA && slug.includes(fxA)) { score += 10; reasons.push("away_in_slug"); }
  }

  return { score, reasons };
}

function classifyConfidence(score: number, reasons: string[]): "high" | "medium" | "low" {
  if (reasons.includes("fifa_match_number_exact")) return "high";
  if (reasons.includes("date_plus_group")) return "high";
  if (reasons.includes("date_plus_phase") && (reasons.includes("home_in_slug") || reasons.includes("away_in_slug"))) return "high";
  if (reasons.includes("date_plus_phase")) return "medium";
  if (reasons.includes("date_only")) return "low";
  return "low";
}

async function firecrawlScrape(url: string, apiKey: string): Promise<{ links: string[]; markdown: string; ok: boolean; err?: string }> {
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url, formats: ["links", "markdown"], onlyMainContent: false, waitFor: 3000 }),
    });
    if (!r.ok) return { links: [], markdown: "", ok: false, err: `http_${r.status}` };
    const j = await r.json();
    const links: string[] = (j?.data?.links ?? j?.links ?? []) as string[];
    const markdown: string = (j?.data?.markdown ?? j?.markdown ?? "") as string;
    return { links, markdown, ok: true };
  } catch (e) {
    return { links: [], markdown: "", ok: false, err: String((e as Error).message ?? e) };
  }
}

async function firecrawlMap(url: string, apiKey: string): Promise<{ links: string[]; ok: boolean; err?: string }> {
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/map", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ url, limit: 5000, includeSubdomains: false, search: "match-" }),
    });
    if (!r.ok) return { links: [], ok: false, err: `http_${r.status}` };
    const j = await r.json();
    const links: string[] = (j?.links ?? j?.data?.links ?? []) as string[];
    return { links, ok: true };
  } catch (e) {
    return { links: [], ok: false, err: String((e as Error).message ?? e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Admin gate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userRes } = await supabase.auth.getUser(token);
    const userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "missing_firecrawl_key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Discovery: fan out across multiple Ticombo index pages + firecrawl map ----
    const allLinks = new Set<string>();
    const roots: Array<{ url: string; scrape_ok: boolean; map_ok: boolean; raw_count: number; match_count: number; err?: string }> = [];

    // 1. Map of the root domain (filtered by "match-")
    const mapRes = await firecrawlMap("https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026", firecrawlKey);
    if (mapRes.ok) for (const l of mapRes.links) allLinks.add(l);

    // 2. Scrape each indexed root in parallel
    const scrapeResults = await Promise.all(TICOMBO_ROOTS.map((r) => firecrawlScrape(r, firecrawlKey)));
    TICOMBO_ROOTS.forEach((url, i) => {
      const res = scrapeResults[i];
      let matchCount = 0;
      if (res.ok) {
        for (const l of res.links) allLinks.add(l);
        // Also harvest matches from markdown (catches hrefs the link extractor missed)
        const mdHits = res.markdown.match(MATCH_PATH_RE) ?? [];
        for (const m of mdHits) {
          const full = m.startsWith("http") ? m : `https://www.ticombo.com${m}`;
          allLinks.add(full);
          matchCount++;
        }
      }
      roots.push({
        url,
        scrape_ok: res.ok,
        map_ok: false,
        raw_count: res.links?.length ?? 0,
        match_count: (res.links ?? []).filter((l) => /\/match-/i.test(l)).length + matchCount,
        err: res.err,
      });
    });
    roots.unshift({ url: "FIRECRAWL_MAP(world-cup-2026)", scrape_ok: false, map_ok: mapRes.ok, raw_count: mapRes.links.length, match_count: mapRes.links.filter((l) => /\/match-/i.test(l)).length, err: mapRes.err });

    // ---- Filter to single-fixture URLs (with UUID) ----
    const rejections: Record<string, number> = { not_ticombo: 0, no_match_prefix: 0, blacklist: 0, no_uuid: 0, unparseable_slug: 0 };
    const acceptedRaw: string[] = [];
    for (const raw of allLinks) {
      let url: URL;
      try { url = new URL(raw); } catch { continue; }
      if (!url.hostname.includes("ticombo.com")) { rejections.not_ticombo++; continue; }
      const cleanPath = url.pathname.toLowerCase();
      if (!cleanPath.includes("/football-tickets/match-")) { rejections.no_match_prefix++; continue; }
      if (BLACKLIST_FRAGMENTS.some((b) => cleanPath.includes(b))) { rejections.blacklist++; continue; }
      // Must end with a UUID segment
      if (!/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i.test(url.pathname)) {
        rejections.no_uuid++; continue;
      }
      const clean = `${url.origin}${url.pathname.replace(/\/$/, "")}`;
      acceptedRaw.push(clean);
    }

    // Dedupe by UUID + parse
    const parsedByUuid = new Map<string, ParsedSlug>();
    for (const u of acceptedRaw) {
      const parsed = parseSlug(u);
      if (!parsed) { rejections.unparseable_slug++; continue; }
      const existing = parsedByUuid.get(parsed.uuid);
      if (!existing) parsedByUuid.set(parsed.uuid, parsed);
    }
    const events = [...parsedByUuid.values()];

    // ---- Fetch WC2026 fixtures ----
    const { data: fixtures, error: fxErr } = await supabase
      .from("matches")
      .select("id,home_team,away_team,date,group_code,phase,matchday,fifa_match_number,ticombo_url")
      .eq("competition", "FIFA World Cup 2026")
      .is("archived_at", null)
      .order("date");
    if (fxErr) throw fxErr;
    const fxRows = (fixtures ?? []) as Fixture[];

    // ---- Score each event against every fixture; keep best per fixture ----
    const proposalsByMatch = new Map<string, Proposal>();
    for (const ev of events) {
      let best: { fx: Fixture; score: number; reasons: string[] } | null = null;
      for (const fx of fxRows) {
        const { score, reasons } = scoreFixture(fx, ev);
        if (!best || score > best.score) best = { fx, score, reasons };
      }
      if (!best || best.score < 100) continue; // require at least date_only
      const confidence = classifyConfidence(best.score, best.reasons);
      const proposal: Proposal = {
        match_id: best.fx.id,
        home_team: best.fx.home_team,
        away_team: best.fx.away_team,
        kickoff: best.fx.date,
        group_code: best.fx.group_code,
        phase: best.fx.phase,
        fifa_match_number: best.fx.fifa_match_number,
        current_url: best.fx.ticombo_url,
        suggested_url: ev.url,
        provider_event_id: ev.uuid,
        ticombo_match_number: ev.match_number,
        ticombo_date: ev.date,
        ticombo_phase: ev.phase,
        ticombo_group: ev.group_code,
        confidence,
        score: best.score,
        reasons: best.reasons,
      };
      const existing = proposalsByMatch.get(proposal.match_id);
      if (!existing || existing.score < proposal.score) proposalsByMatch.set(proposal.match_id, proposal);
    }

    const proposals = [...proposalsByMatch.values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff));

    const stats = {
      fixtures_total: fxRows.length,
      raw_links_discovered: allLinks.size,
      links_accepted_to_uuid_dedupe: acceptedRaw.length,
      unique_events: events.length,
      rejections,
      proposals: proposals.length,
      already_set: fxRows.filter((f) => f.ticombo_url).length,
      high: proposals.filter((p) => p.confidence === "high").length,
      medium: proposals.filter((p) => p.confidence === "medium").length,
      low: proposals.filter((p) => p.confidence === "low").length,
      would_change: proposals.filter((p) => p.suggested_url !== p.current_url).length,
    };

    return new Response(JSON.stringify({ stats, roots, proposals, sample_events: events.slice(0, 8) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unhandled", detail: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
