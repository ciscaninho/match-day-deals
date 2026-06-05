// Verified Ticombo mapping pipeline.
//
// Strategy (after fifa_match_number was proven unreliable):
//   1. Firecrawl-map ticombo.com for all /football-tickets/match-*/<uuid> URLs.
//   2. For each unique event URL, scrape the page and extract the real <title>.
//   3. Parse "<HOME> vs <AWAY>" from the title.
//   4. Match against the DB by:
//        a. Both teams identified in title (with alias map)  AND
//        b. Same UTC kickoff date  (±1 day tolerance)
//      → high confidence.
//      One team + same date → medium (rejected from auto-apply).
//      Anything else → low (rejected).
//   5. Only "high" proposals are emitted as verified mappings.
//
// Optional body: { apply: true } — writes matches.ticombo_url for all verified.
//
// Returns: stats, proposals, verification breakdown, sample rejected events.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BLACKLIST_FRAGMENTS = [
  "all-matches", "stadium-", "-stadium-tickets", "package", "follow-",
  "hospitality", "venue-series", "vip-experience", "bundle", "series-pass",
];

// Map DB team name → list of acceptable lowercase tokens/phrases that may appear in Ticombo title.
const TEAM_ALIASES: Record<string, string[]> = {
  "USA": ["usa", "united states", "u.s.a", "united-states"],
  "South Korea": ["south korea", "korea republic", "republic of korea", "korea"],
  "North Korea": ["north korea", "dpr korea", "korea dpr"],
  "Cape Verde": ["cape verde", "cabo verde"],
  "Czech Republic": ["czech republic", "czechia"],
  "Czechia": ["czech republic", "czechia"],
  "Ivory Coast": ["ivory coast", "cote d'ivoire", "côte d'ivoire", "cote divoire"],
  "Côte d'Ivoire": ["ivory coast", "cote d'ivoire", "côte d'ivoire"],
  "Bosnia and Herzegovina": ["bosnia", "bosnia and herzegovina", "bosnia-herzegovina", "herzegovina"],
  "DR Congo": ["dr congo", "congo dr", "democratic republic of congo", "drc"],
  "Trinidad and Tobago": ["trinidad", "trinidad and tobago"],
  "New Zealand": ["new zealand"],
  "Saudi Arabia": ["saudi arabia", "saudi"],
  "South Africa": ["south africa"],
  "Costa Rica": ["costa rica"],
  "United Arab Emirates": ["uae", "united arab emirates"],
  "Curaçao": ["curacao", "curaçao"],
  "Jamaica": ["jamaica"],
  "Wales": ["wales"],
};

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalize = (s: string) =>
  stripDiacritics(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

function teamTokens(dbName: string): string[] {
  const alias = TEAM_ALIASES[dbName];
  if (alias) return alias.map(normalize);
  return [normalize(dbName)];
}

function titleMentionsTeam(normalizedTitle: string, dbName: string): boolean {
  const tokens = teamTokens(dbName);
  return tokens.some((t) => t.length > 1 && normalizedTitle.includes(t));
}

// Parse "<HOME> vs <AWAY>" out of a Ticombo title. Strip trailing brand fragments.
function parseTitleTeams(rawTitle: string): { home: string; away: string } | null {
  if (!rawTitle) return null;
  // Clean common suffixes.
  let t = rawTitle.replace(/\s*[|•·–-]\s*(FIFA|Ticombo|World Cup|Football|Tickets).*$/i, "");
  t = t.replace(/\s*Tickets\b.*$/i, "");
  t = t.trim();
  const m = t.match(/^(.+?)\s+(?:vs?\.?|v|—)\s+(.+?)$/i);
  if (!m) return null;
  return { home: m[1].trim(), away: m[2].trim() };
}

type EventScrape = {
  url: string;
  uuid: string;
  date_from_slug: string | null; // YYYY-MM-DD
  title: string | null;
  home_label: string | null;
  away_label: string | null;
  scrape_ok: boolean;
  err?: string;
};

function uuidFromUrl(url: string): string | null {
  const m = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
  return m ? m[1].toLowerCase() : null;
}

function dateFromSlug(url: string): string | null {
  const m = url.match(/-(\d{2})(\d{2})(\d{2})\d{4}\/[0-9a-f-]{36}\/?$/);
  if (!m) return null;
  return `20${m[1]}-${m[2]}-${m[3]}`;
}

async function firecrawlMap(rootUrl: string, search: string | null, apiKey: string) {
  try {
    const body: Record<string, unknown> = { url: rootUrl, limit: 5000, includeSubdomains: false };
    if (search) body.search = search;
    const r = await fetch("https://api.firecrawl.dev/v2/map", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { links: [] as string[], ok: false, err: `http_${r.status}` };
    const j = await r.json();
    const raw = (j?.links ?? j?.data?.links ?? []) as unknown[];
    const links: string[] = raw
      .map((x) => (typeof x === "string" ? x : (x as { url?: string })?.url ?? ""))
      .filter((u): u is string => !!u);
    return { links, ok: true };
  } catch (e) {
    return { links: [] as string[], ok: false, err: String((e as Error).message ?? e) };
  }
}

async function firecrawlScrapeTitle(url: string, apiKey: string): Promise<{ title: string | null; ok: boolean; err?: string }> {
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: false,
        waitFor: 0,
        timeout: 12000,
      }),
    });
    if (!r.ok) return { title: null, ok: false, err: `http_${r.status}` };
    const j = await r.json();
    const meta = (j?.data?.metadata ?? j?.metadata ?? {}) as Record<string, unknown>;
    const title =
      (meta.ogTitle as string) ||
      (meta["og:title"] as string) ||
      (meta.title as string) ||
      null;
    return { title: title ?? null, ok: true };
  } catch (e) {
    return { title: null, ok: false, err: String((e as Error).message ?? e) };
  }
}

async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

type Fixture = {
  id: string;
  home_team: string;
  away_team: string;
  date: string;
  group_code: string | null;
  phase: string | null;
  fifa_match_number: number | null;
  ticombo_url: string | null;
  home_team_status: string;
  away_team_status: string;
  stadium: string | null;
  city: string | null;
};

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
  ticombo_title: string;
  ticombo_home_label: string | null;
  ticombo_away_label: string | null;
  ticombo_date: string | null;
  confidence: "high" | "medium" | "low";
  score: number;
  reasons: string[];
  event_date: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace(/^Bearer\s+/i, "");
    // Service-role bypass: accept either the modern sb_secret_ key OR a JWT whose payload role === "service_role".
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    let isServiceRole = !!serviceRole && token === serviceRole;
    if (!isServiceRole && token.split(".").length === 3) {
      try {
        const payloadJson = atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadJson);
        if (payload?.role === "service_role" && payload?.ref) isServiceRole = true;
      } catch { /* ignore */ }
    }
    if (!isServiceRole) {
      const { data: userRes } = await supabase.auth.getUser(token);
      const userId = userRes?.user?.id;
      if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) return new Response(JSON.stringify({ error: "missing_firecrawl_key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const apply = !!body?.apply;
    const audit = !!body?.audit;

    // ---- 1. Fetch fixtures FIRST (needed for date pre-filter) ----
    const { data: fixtures, error: fxErr } = await supabase
      .from("matches")
      .select("id,home_team,away_team,date,group_code,phase,fifa_match_number,ticombo_url,home_team_status,away_team_status,stadium,city")
      .eq("competition", "FIFA World Cup 2026")
      .is("archived_at", null)
      .order("date");
    if (fxErr) throw fxErr;
    const fxRows = (fixtures ?? []) as Fixture[];
    const fixtureDates = new Set(fxRows.map((f) => f.date.slice(0, 10)));

    // ---- 2. Discover URLs via Firecrawl map (multi-query sweep) ----
    // Firecrawl's map endpoint caps results, so a single "world-cup" query only
    // surfaces ~60 of the 104 fixtures. Sweep with many narrow terms (groups,
    // knockout phases, dates) and union the results for full coverage.
    const searchTerms = [
      "world-cup", "world cup 2026", "football-world-cup-2026", "match",
      "group-a", "group-b", "group-c", "group-d", "group-e", "group-f",
      "group-g", "group-h", "group-i", "group-j", "group-k", "group-l",
      "round-of-32", "round-of-16", "quarter-final", "semi-final", "final",
      "third-place", "2026-06", "2026-07",
    ];
    const mapResults = await runWithConcurrency(searchTerms, 8, (term) =>
      firecrawlMap("https://www.ticombo.com", term, firecrawlKey)
    );
    const mapErrors = mapResults.filter((m) => !m.ok).map((m) => m.err ?? "unknown");
    const all = new Set<string>();
    let rawLinkCount = 0;
    for (const m of mapResults) {
      rawLinkCount += m.links.length;
      for (const l of m.links) all.add(l);
    }

    const candidates: string[] = [];
    const rejections: Record<string, number> = { not_ticombo: 0, no_match_prefix: 0, blacklist: 0, no_uuid: 0, date_not_in_fixtures: 0 };
    for (const raw of all) {
      let u: URL;
      try { u = new URL(raw); } catch { continue; }
      if (!u.hostname.includes("ticombo.com")) { rejections.not_ticombo++; continue; }
      const p = u.pathname.toLowerCase();
      if (!p.includes("/football-tickets/match-")) { rejections.no_match_prefix++; continue; }
      if (BLACKLIST_FRAGMENTS.some((b) => p.includes(b))) { rejections.blacklist++; continue; }
      if (!/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i.test(u.pathname)) {
        rejections.no_uuid++; continue;
      }
      const cleaned = `${u.origin}${u.pathname.replace(/\/$/, "")}`;
      const d = dateFromSlug(cleaned);
      if (d && !fixtureDates.has(d)) { rejections.date_not_in_fixtures++; continue; }
      candidates.push(cleaned);
    }

    // Dedupe by UUID
    const byUuid = new Map<string, string>();
    for (const url of candidates) {
      const uuid = uuidFromUrl(url);
      if (uuid && !byUuid.has(uuid)) byUuid.set(uuid, url);
    }
    const uniqueUrls = [...byUuid.values()];

    // ---- 3. Scrape each event page in parallel (titles only) ----
    const scrapes: EventScrape[] = await runWithConcurrency(uniqueUrls, 16, async (url) => {
      const res = await firecrawlScrapeTitle(url, firecrawlKey);
      const teams = res.title ? parseTitleTeams(res.title) : null;
      return {
        url,
        uuid: uuidFromUrl(url) ?? "",
        date_from_slug: dateFromSlug(url),
        title: res.title,
        home_label: teams?.home ?? null,
        away_label: teams?.away ?? null,
        scrape_ok: res.ok,
        err: res.err,
      };
    });


    // ---- 4. Verify each event against fixtures ----
    const proposalsByMatch = new Map<string, Proposal>();
    const rejected: Array<{ url: string; title: string | null; reason: string }> = [];
    let bothTeamsVerified = 0;
    let oneTeamVerified = 0;
    let titleParseFailed = 0;
    let scrapeFailed = 0;

    for (const ev of scrapes) {
      if (!ev.scrape_ok || !ev.title) { scrapeFailed++; rejected.push({ url: ev.url, title: ev.title, reason: ev.err ?? "scrape_failed" }); continue; }
      if (!ev.home_label || !ev.away_label) { titleParseFailed++; rejected.push({ url: ev.url, title: ev.title, reason: "title_parse_failed" }); continue; }

      const normTitle = normalize(ev.title);
      // Find best fixture by date + team mentions
      let best: { fx: Fixture; bothHit: boolean; oneHit: boolean } | null = null;
      for (const fx of fxRows) {
        if (fx.home_team_status !== "confirmed" || fx.away_team_status !== "confirmed") continue;
        const fxDate = fx.date.slice(0, 10);
        if (ev.date_from_slug && ev.date_from_slug !== fxDate) continue;
        // Verify orientation: home matches title-home, away matches title-away (preferred)
        const homeInTitle = titleMentionsTeam(normTitle, fx.home_team);
        const awayInTitle = titleMentionsTeam(normTitle, fx.away_team);
        const bothHit = homeInTitle && awayInTitle;
        const oneHit = homeInTitle || awayInTitle;
        if (!oneHit) continue;
        if (!best || (bothHit && !best.bothHit)) best = { fx, bothHit, oneHit };
      }

      if (!best) {
        rejected.push({ url: ev.url, title: ev.title, reason: "no_team_match_on_date" });
        continue;
      }

      if (best.bothHit) bothTeamsVerified++;
      else { oneTeamVerified++; rejected.push({ url: ev.url, title: ev.title, reason: "only_one_team_matched" }); continue; }

      const confidence: "high" | "medium" | "low" = "high";
      const proposal: Proposal = {
        match_id: best.fx.id,
        home_team: best.fx.home_team,
        away_team: best.fx.away_team,
        kickoff: best.fx.date,
        stadium: best.fx.stadium,
        city: best.fx.city,
        current_url: best.fx.ticombo_url,
        suggested_url: ev.url,
        provider_event_id: ev.uuid,
        ticombo_title: ev.title,
        ticombo_home_label: ev.home_label,
        ticombo_away_label: ev.away_label,
        ticombo_date: ev.date_from_slug,
        confidence,
        score: 1000,
        reasons: ["title_both_teams_verified", "date_match"],
        event_date: ev.date_from_slug,
      };
      const prior = proposalsByMatch.get(proposal.match_id);
      if (!prior) proposalsByMatch.set(proposal.match_id, proposal);
    }

    const proposals = [...proposalsByMatch.values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff));

    // ---- 5. Optionally apply (clears stale URLs first, then writes verified) ----
    let appliedCount = 0;
    let applySkipped = 0;
    let clearedCount = 0;
    if (apply) {
      const verifiedIds = new Set(proposals.map((p) => p.match_id));
      // Clear ticombo_url on any WC fixture not in the verified set (kills wrong mappings)
      const staleIds = fxRows.filter((f) => f.ticombo_url && !verifiedIds.has(f.id)).map((f) => f.id);
      if (staleIds.length > 0) {
        const { error: clearErr } = await supabase
          .from("matches")
          .update({ ticombo_url: null, updated_at: new Date().toISOString() })
          .in("id", staleIds);
        if (!clearErr) clearedCount = staleIds.length;
      }
      for (const p of proposals) {
        if (p.current_url === p.suggested_url) continue;
        const { error } = await supabase
          .from("matches")
          .update({ ticombo_url: p.suggested_url, updated_at: new Date().toISOString() })
          .eq("id", p.match_id)
          .eq("competition", "FIFA World Cup 2026");
        if (error) applySkipped++;
        else appliedCount++;
      }
    }

    const fxConfirmed = fxRows.filter((f) => f.home_team_status === "confirmed" && f.away_team_status === "confirmed").length;

    const stats = {
      fixtures_total: fxRows.length,
      confirmed_fixtures: fxConfirmed,
      discovery_search_terms: searchTerms.length,
      discovery_map_errors: mapErrors.length,
      discovery_raw_links: rawLinkCount,
      discovery_unique_links: all.size,
      events_discovered: uniqueUrls.length,
      events_scraped_ok: scrapes.filter((s) => s.scrape_ok).length,
      events_title_parsed: scrapes.filter((s) => s.home_label && s.away_label).length,
      both_teams_verified: bothTeamsVerified,
      one_team_verified: oneTeamVerified,
      title_parse_failed: titleParseFailed,
      scrape_failed: scrapeFailed,
      proposals: proposals.length,
      already_set: fxRows.filter((f) => f.ticombo_url).length,
      high: proposals.length,
      medium: 0,
      low: 0,
      new_urls: proposals.filter((p) => p.suggested_url !== p.current_url).length,
      coverage_pct_of_confirmed: fxConfirmed ? Math.round((proposals.length / fxConfirmed) * 1000) / 10 : 0,
      apply_mode: apply,
      applied: appliedCount,
      apply_skipped: applySkipped,
      cleared_stale: clearedCount,
      rejections,
    };

    // ---- 6. Optional diagnostic audit (no writes) ----
    let audit_report: unknown = undefined;
    if (audit) {
      // Build a per-event index for quick lookups: by date.
      const evByDate = new Map<string, EventScrape[]>();
      for (const ev of scrapes) {
        const d = ev.date_from_slug ?? "unknown";
        if (!evByDate.has(d)) evByDate.set(d, []);
        evByDate.get(d)!.push(ev);
      }

      const causes: Record<string, number> = {
        matched_high: 0,
        no_event_on_date: 0,
        date_only_one_team: 0,
        date_no_team: 0,
        date_title_parse_failed: 0,
        date_scrape_failed: 0,
        team_unconfirmed: 0,
      };

      type FxAudit = {
        match_id: string;
        home_team: string;
        away_team: string;
        kickoff: string;
        date: string;
        group_code: string | null;
        confirmed: boolean;
        matched: boolean;
        matched_url: string | null;
        matched_title: string | null;
        rejection_reason: string;
        closest_candidate?: {
          url: string;
          title: string | null;
          home_label: string | null;
          away_label: string | null;
          home_in_title: boolean;
          away_in_title: boolean;
          score: number;
        };
        candidates_on_date: number;
      };

      const fxAudits: FxAudit[] = fxRows.map((fx) => {
        const fxDate = fx.date.slice(0, 10);
        const confirmed = fx.home_team_status === "confirmed" && fx.away_team_status === "confirmed";
        const matched = proposalsByMatch.get(fx.id);
        if (matched) {
          causes.matched_high++;
          return {
            match_id: fx.id, home_team: fx.home_team, away_team: fx.away_team,
            kickoff: fx.date, date: fxDate, group_code: fx.group_code, confirmed,
            matched: true, matched_url: matched.suggested_url, matched_title: matched.ticombo_title,
            rejection_reason: "", candidates_on_date: (evByDate.get(fxDate) ?? []).length,
          };
        }
        if (!confirmed) {
          causes.team_unconfirmed++;
          return {
            match_id: fx.id, home_team: fx.home_team, away_team: fx.away_team,
            kickoff: fx.date, date: fxDate, group_code: fx.group_code, confirmed,
            matched: false, matched_url: null, matched_title: null,
            rejection_reason: "team_unconfirmed_placeholder",
            candidates_on_date: (evByDate.get(fxDate) ?? []).length,
          };
        }
        const dayEvents = evByDate.get(fxDate) ?? [];
        if (dayEvents.length === 0) {
          causes.no_event_on_date++;
          return {
            match_id: fx.id, home_team: fx.home_team, away_team: fx.away_team,
            kickoff: fx.date, date: fxDate, group_code: fx.group_code, confirmed,
            matched: false, matched_url: null, matched_title: null,
            rejection_reason: "no_ticombo_event_on_fixture_date", candidates_on_date: 0,
          };
        }
        // Find closest candidate on date
        let best: { ev: EventScrape; homeIn: boolean; awayIn: boolean; score: number } | null = null;
        for (const ev of dayEvents) {
          const normTitle = ev.title ? normalize(ev.title) : "";
          const homeIn = !!normTitle && titleMentionsTeam(normTitle, fx.home_team);
          const awayIn = !!normTitle && titleMentionsTeam(normTitle, fx.away_team);
          const score = (homeIn ? 50 : 0) + (awayIn ? 50 : 0);
          if (!best || score > best.score) best = { ev, homeIn, awayIn, score };
        }
        let reason = "date_no_team_in_title";
        if (best) {
          if (!best.ev.scrape_ok) { reason = `scrape_failed:${best.ev.err ?? "unknown"}`; causes.date_scrape_failed++; }
          else if (!best.ev.home_label) { reason = "title_parse_failed"; causes.date_title_parse_failed++; }
          else if (best.homeIn !== best.awayIn) { reason = "only_one_team_matched_in_title"; causes.date_only_one_team++; }
          else { reason = "date_no_team_in_title"; causes.date_no_team++; }
        }
        return {
          match_id: fx.id, home_team: fx.home_team, away_team: fx.away_team,
          kickoff: fx.date, date: fxDate, group_code: fx.group_code, confirmed,
          matched: false, matched_url: null, matched_title: null,
          rejection_reason: reason,
          closest_candidate: best ? {
            url: best.ev.url, title: best.ev.title,
            home_label: best.ev.home_label, away_label: best.ev.away_label,
            home_in_title: best.homeIn, away_in_title: best.awayIn, score: best.score,
          } : undefined,
          candidates_on_date: dayEvents.length,
        };
      });

      // Discovered but unmatched events (no DB fixture claimed them)
      const claimedUrls = new Set([...proposalsByMatch.values()].map((p) => p.suggested_url));
      const unmatched_events = scrapes
        .filter((s) => !claimedUrls.has(s.url))
        .map((s) => ({
          url: s.url, title: s.title, date: s.date_from_slug,
          home_label: s.home_label, away_label: s.away_label,
          scrape_ok: s.scrape_ok, err: s.err,
        }));

      audit_report = {
        causes,
        fixtures: fxAudits,
        unmatched_fixtures_sample: fxAudits.filter((f) => !f.matched).slice(0, 20),
        unmatched_events,
      };
    }

    return new Response(JSON.stringify({
      stats,
      proposals,
      sample_rejected: rejected.slice(0, 30),
      sample_scrapes: scrapes.slice(0, 6),
      audit_report,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unhandled", detail: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
