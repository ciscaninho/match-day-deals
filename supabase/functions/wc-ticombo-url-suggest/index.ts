// Suggests matches.ticombo_url for FIFA World Cup 2026 fixtures.
// Crawls the public Ticombo WC2026 index page, extracts all single-fixture
// event URLs, infers home/away/date from the slug, and matches against DB
// fixtures. Returns proposals only — never writes.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TICOMBO_INDEX =
  "https://www.ticombo.com/en/sports-tickets/football-tickets/world-cup-2026?group=group-date&key=bab812da-41b7-42b7-aabe-cb3908cbc347";

const SINGLE_FIXTURE_RE = /\/en\/sports-tickets\/football-tickets\/match-[a-z0-9-]+/gi;
const BLACKLIST_FRAGMENTS = [
  "all-matches", "stadium-", "-stadium-tickets", "package", "follow-",
  "group-matches", "hospitality", "venue-series", "vip-experience", "bundle",
  "series-pass", "8-matches", "all-3", "all-group",
];

const COUNTRY_ALIASES: Record<string, string[]> = {
  "usa": ["usa", "united states", "united-states", "us", "u-s-a"],
  "united states": ["usa", "united states", "united-states", "us"],
  "south korea": ["south-korea", "korea-republic", "korea"],
  "north korea": ["north-korea", "korea-dpr"],
  "ivory coast": ["ivory-coast", "cote-d-ivoire", "cote-divoire"],
  "england": ["england"],
  "iran": ["iran", "ir-iran"],
  "saudi arabia": ["saudi-arabia"],
  "south africa": ["south-africa"],
  "new zealand": ["new-zealand"],
  "cape verde": ["cape-verde"],
};

const normalize = (s: string): string =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const teamCandidates = (raw: string): string[] => {
  const n = normalize(raw);
  const direct = [n, n.replace(/-/g, "")];
  const alias = COUNTRY_ALIASES[raw.toLowerCase().trim()] ?? [];
  return [...new Set([...direct, ...alias.map(normalize)])];
};

// Slug pattern: match-<home>-vs-<away>-fifa-world-cup-2026-YYYY-MM-DD-<stadium>
function parseSlug(url: string): { home: string; away: string; date: string | null; provider_event_id: string } | null {
  const m = url.match(/\/match-([a-z0-9-]+)/i);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  const dateMatch = slug.match(/(20\d{2})-(\d{2})-(\d{2})/);
  const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
  const vsIdx = slug.indexOf("-vs-");
  if (vsIdx < 0) return null;
  const home = slug.slice(0, vsIdx);
  let rest = slug.slice(vsIdx + 4);
  // strip "-fifa-world-cup..."
  rest = rest.replace(/-fifa-world-cup-2026.*$/, "");
  const away = rest;
  if (!home || !away) return null;
  return { home, away, date, provider_event_id: slug };
}

function scoreMatch(
  fx: { home: string; away: string; date: string },
  ev: { home: string; away: string; date: string | null }
): { score: number; confidence: "high" | "medium" | "low"; reasons: string[] } {
  const reasons: string[] = [];
  const fxHome = teamCandidates(fx.home);
  const fxAway = teamCandidates(fx.away);
  const evHome = ev.home;
  const evAway = ev.away;
  const homeOk = fxHome.some((c) => c && evHome.includes(c));
  const awayOk = fxAway.some((c) => c && evAway.includes(c));
  const swapHome = fxHome.some((c) => c && evAway.includes(c));
  const swapAway = fxAway.some((c) => c && evHome.includes(c));
  const teamsExact = homeOk && awayOk;
  const teamsSwapped = swapHome && swapAway;
  const teamsAny = teamsExact || teamsSwapped;
  const dateOk = ev.date && fx.date.startsWith(ev.date);
  let score = 0;
  if (teamsExact) { score += 60; reasons.push("teams_exact_order"); }
  else if (teamsSwapped) { score += 50; reasons.push("teams_swapped"); }
  else if (homeOk || awayOk || swapHome || swapAway) { score += 20; reasons.push("teams_partial"); }
  if (dateOk) { score += 40; reasons.push("date_match"); }
  let confidence: "high" | "medium" | "low" = "low";
  if (teamsAny && dateOk) confidence = "high";
  else if (teamsAny || dateOk) confidence = "medium";
  return { score, confidence, reasons };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    // Crawl the index page (recursive scrape limited to single-fixture matches)
    const crawlResp = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url: TICOMBO_INDEX,
        formats: ["links", "markdown"],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });
    if (!crawlResp.ok) {
      const txt = await crawlResp.text();
      return new Response(JSON.stringify({ error: "firecrawl_failed", detail: txt }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const crawlJson = await crawlResp.json();
    const links: string[] = (crawlJson?.data?.links ?? []) as string[];
    const markdown: string = (crawlJson?.data?.markdown ?? "") as string;
    const linkSet = new Set<string>();
    for (const l of links) if (typeof l === "string") linkSet.add(l);
    // also harvest from markdown
    const mdLinks = markdown.match(SINGLE_FIXTURE_RE) ?? [];
    for (const l of mdLinks) linkSet.add(l.startsWith("http") ? l : `https://www.ticombo.com${l}`);

    const eventCandidates: { url: string; home: string; away: string; date: string | null; provider_event_id: string }[] = [];
    const seen = new Set<string>();
    for (const raw of linkSet) {
      const url = raw.split("?")[0].split("#")[0];
      const path = url.toLowerCase();
      if (!path.includes("/football-tickets/match-")) continue;
      if (BLACKLIST_FRAGMENTS.some((b) => path.includes(b))) continue;
      const parsed = parseSlug(url);
      if (!parsed) continue;
      if (seen.has(parsed.provider_event_id)) continue;
      seen.add(parsed.provider_event_id);
      eventCandidates.push({ url, ...parsed });
    }

    // Fetch WC2026 fixtures
    const { data: fixtures, error: fxErr } = await supabase
      .from("matches")
      .select("id,home_team,away_team,date,stadium,city,ticombo_url")
      .eq("competition", "FIFA World Cup 2026")
      .is("archived_at", null)
      .order("date");
    if (fxErr) throw fxErr;
    const fxRows = (fixtures ?? []) as Array<{ id: string; home_team: string; away_team: string; date: string; stadium: string | null; city: string | null; ticombo_url: string | null }>;

    // For each event find the best fixture
    type Proposal = {
      match_id: string;
      home_team: string;
      away_team: string;
      kickoff: string;
      stadium: string | null;
      city: string | null;
      current_url: string | null;
      suggested_url: string;
      provider_event_id: string;
      confidence: "high" | "medium" | "low";
      score: number;
      reasons: string[];
      event_date: string | null;
    };
    const proposalsByMatch = new Map<string, Proposal>();

    for (const ev of eventCandidates) {
      let best: { fx: typeof fxRows[number]; score: number; confidence: "high" | "medium" | "low"; reasons: string[] } | null = null;
      for (const fx of fxRows) {
        const fxDateYMD = fx.date.slice(0, 10);
        const res = scoreMatch(
          { home: fx.home_team, away: fx.away_team, date: fxDateYMD },
          { home: ev.home, away: ev.away, date: ev.date },
        );
        if (!best || res.score > best.score) best = { fx, ...res };
      }
      if (!best || best.score < 50) continue;
      const proposal: Proposal = {
        match_id: best.fx.id,
        home_team: best.fx.home_team,
        away_team: best.fx.away_team,
        kickoff: best.fx.date,
        stadium: best.fx.stadium,
        city: best.fx.city,
        current_url: best.fx.ticombo_url,
        suggested_url: ev.url,
        provider_event_id: ev.provider_event_id,
        confidence: best.confidence,
        score: best.score,
        reasons: best.reasons,
        event_date: ev.date,
      };
      const existing = proposalsByMatch.get(proposal.match_id);
      if (!existing || existing.score < proposal.score) {
        proposalsByMatch.set(proposal.match_id, proposal);
      }
    }

    const proposals = [...proposalsByMatch.values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff));

    const stats = {
      fixtures_total: fxRows.length,
      events_discovered: eventCandidates.length,
      proposals: proposals.length,
      already_set: fxRows.filter((f) => f.ticombo_url).length,
      high: proposals.filter((p) => p.confidence === "high").length,
      medium: proposals.filter((p) => p.confidence === "medium").length,
      low: proposals.filter((p) => p.confidence === "low").length,
      new_urls: proposals.filter((p) => p.suggested_url !== p.current_url).length,
    };

    return new Response(JSON.stringify({ stats, proposals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unhandled", detail: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
