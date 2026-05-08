import type { Match } from "@/data/matches";

// ---------------- Aliases ----------------
// Map any alias / abbreviation / accent variant -> canonical token(s) we match against.
// Lowercased, accent-stripped on both sides.
export const TEAM_ALIASES: Record<string, string[]> = {
  psg: ["paris", "paris saint-germain", "paris sg"],
  "paris sg": ["paris saint-germain", "psg"],
  om: ["marseille", "olympique de marseille", "olympique marseille"],
  mars: ["marseille"],
  ol: ["lyon", "olympique lyonnais"],
  asse: ["saint-etienne", "saint etienne"],
  ogcn: ["nice", "ogc nice"],
  "man u": ["manchester united", "man utd", "manchester utd"],
  "man utd": ["manchester united"],
  mufc: ["manchester united"],
  "man city": ["manchester city"],
  mcfc: ["manchester city"],
  spurs: ["tottenham", "tottenham hotspur"],
  thfc: ["tottenham"],
  afc: ["arsenal"],
  cfc: ["chelsea"],
  lfc: ["liverpool"],
  barca: ["barcelona", "fc barcelona"],
  "barça": ["barcelona"],
  rma: ["real madrid"],
  real: ["real madrid"],
  atleti: ["atletico madrid", "atlético madrid", "atletico de madrid"],
  atletico: ["atletico madrid", "atlético madrid"],
  inter: ["inter milan", "internazionale", "fc internazionale"],
  milan: ["ac milan", "inter milan"],
  juve: ["juventus"],
  lazio: ["ss lazio", "lazio roma"],
  roma: ["as roma"],
  bvb: ["borussia dortmund", "dortmund"],
  fcb: ["bayern munich", "bayern münchen", "fc bayern"],
  bayern: ["bayern munich", "bayern münchen"],
  ajax: ["afc ajax"],
  psv: ["psv eindhoven"],
  benfica: ["sl benfica"],
  porto: ["fc porto"],
  galata: ["galatasaray"],
  fener: ["fenerbahce", "fenerbahçe"],
  bjk: ["besiktas", "beşiktaş"],
};

export const CITY_ALIASES: Record<string, string[]> = {
  paris: ["paris"],
  lond: ["london"],
  london: ["london"],
  madrid: ["madrid"],
  barcelona: ["barcelona"],
  barca: ["barcelona"],
  milan: ["milan", "milano"],
  milano: ["milan"],
  rome: ["rome", "roma"],
  roma: ["rome"],
  munich: ["munich", "münchen", "munchen"],
  munchen: ["munich"],
  münchen: ["munich"],
  dortmund: ["dortmund"],
  lisbon: ["lisbon", "lisboa"],
  porto: ["porto"],
  amsterdam: ["amsterdam"],
  istanbul: ["istanbul"],
  manchester: ["manchester"],
  liverpool: ["liverpool"],
  marseille: ["marseille"],
  mars: ["marseille"],
  lyon: ["lyon"],
  naples: ["naples", "napoli"],
  napoli: ["naples"],
  turin: ["turin", "torino"],
};

export const COUNTRY_ALIASES: Record<string, string[]> = {
  usa: ["united states", "usa", "us"],
  us: ["united states"],
  "etats-unis": ["united states"],
  "états-unis": ["united states"],
  uk: ["england", "united kingdom", "great britain"],
  england: ["england"],
  france: ["france"],
  espana: ["spain"],
  españa: ["spain"],
  spain: ["spain"],
  italia: ["italy"],
  italy: ["italy"],
  deutschland: ["germany"],
  allemagne: ["germany"],
  germany: ["germany"],
  portugal: ["portugal"],
  niederlande: ["netherlands"],
  paysbas: ["netherlands"],
  "pays-bas": ["netherlands"],
};

export const COMPETITION_ALIASES: Record<string, string[]> = {
  ucl: ["champions league", "uefa champions league"],
  cl: ["champions league"],
  uel: ["europa league", "uefa europa league"],
  uecl: ["conference league", "uefa conference league"],
  epl: ["premier league", "english premier league"],
  pl: ["premier league"],
  laliga: ["la liga", "la liga ea sports"],
  "la liga": ["la liga"],
  "primera": ["la liga"],
  "primera division": ["la liga"],
  // Finals & knockout rounds (multilingual)
  final: ["final", "finale", "finals", "champions league final", "europa league final", "cup final"],
  finale: ["final", "finale", "champions league final", "europa league final"],
  finals: ["final", "finale"],
  finalissima: ["finalissima", "final"],
  "ucl final": ["champions league final", "uefa champions league final"],
  "uel final": ["europa league final", "uefa europa league final"],
  "cup final": ["cup final", "final"],
  semifinal: ["semi-final", "semifinal", "semi final", "semifinale", "demi-finale"],
  semifinale: ["semi-final", "semifinal", "semifinale"],
  "demi finale": ["semi-final", "semifinal"],
  quarterfinal: ["quarter-final", "quarterfinal", "quart de finale"],
  "quart de finale": ["quarter-final", "quarterfinal"],
  derby: ["derby", "derbi", "clasico", "clásico", "el clasico"],
  clasico: ["el clasico", "clásico", "real madrid barcelona"],
  "el clasico": ["el clasico", "real madrid", "barcelona"],
  seriea: ["serie a"],
  "serie a": ["serie a"],
  bundesliga: ["bundesliga"],
  ligue1: ["ligue 1"],
  "ligue 1": ["ligue 1"],
  eredivisie: ["eredivisie"],
  liga: ["la liga", "liga portugal"],
};

// ---------------- Normalization ----------------
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ALL_ALIASES = (): Record<string, string[]> => ({
  ...TEAM_ALIASES,
  ...CITY_ALIASES,
  ...COUNTRY_ALIASES,
  ...COMPETITION_ALIASES,
});

const expandToken = (token: string): string[] => {
  const t = normalize(token);
  if (!t) return [];
  const out = new Set<string>([t]);
  for (const [k, vs] of Object.entries(ALL_ALIASES())) {
    const nk = normalize(k);
    if (nk === t || nk.startsWith(t) || t.startsWith(nk)) {
      vs.forEach((v) => out.add(normalize(v)));
    }
  }
  return [...out];
};

// Returns the raw normalized query plus a list of token-level alias buckets.
// Multi-word queries are matched with AND-semantics across fields.
const expandQuery = (raw: string): string[] => {
  const q = normalize(raw);
  if (!q) return [];
  return expandToken(q);
};

const queryTokens = (raw: string): string[][] => {
  const q = normalize(raw);
  if (!q) return [];
  const tokens = q.split(" ").filter((t) => t.length >= 2);
  if (tokens.length <= 1) return [expandToken(q)];
  // Also include the full-string expansion as one bucket
  return [expandToken(q), ...tokens.map(expandToken)];
};

// Damerau-Levenshtein-lite (for typo tolerance) — small, capped
const editDistance = (a: string, b: string): number => {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp: number[] = Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
};

const tokenScore = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!h) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(` ${n}`)) return 70;
  if (h.includes(n)) return 55;
  // Token-level prefix match
  const tokens = h.split(" ");
  for (const t of tokens) {
    if (t.startsWith(n)) return 60;
    if (n.length >= 4 && editDistance(t.slice(0, n.length + 1), n) <= 1) return 40;
  }
  if (n.length >= 5 && editDistance(h.slice(0, n.length), n) <= 1) return 30;
  return 0;
};

const matchScore = (m: Match, queries: string[]): number => {
  const fields = [m.homeTeam, m.awayTeam, m.competition, m.city, m.stadium, m.country];
  // Combined haystack lets us also catch queries spanning multiple fields ("psg final")
  const combined = fields.filter(Boolean).join(" ");
  let best = 0;
  for (const q of queries) {
    let s = tokenScore(combined, q);
    for (const f of fields) s = Math.max(s, tokenScore(f ?? "", q));
    best = Math.max(best, s);
  }
  return best;
};

// Multi-token AND scoring: every token bucket must match somewhere.
const multiTokenScore = (m: Match, raw: string): number => {
  const buckets = queryTokens(raw);
  if (buckets.length === 0) return 0;
  if (buckets.length === 1) return matchScore(m, buckets[0]);
  let total = 0;
  for (const bucket of buckets) {
    const s = matchScore(m, bucket);
    if (s < 25) return 0; // require every word to match
    total += s;
  }
  return Math.round(total / buckets.length);
};

// ---------------- Suggestion items ----------------
export type SuggestionKind = "match" | "team" | "city" | "competition" | "stadium";

export interface Suggestion {
  kind: SuggestionKind;
  label: string;
  sublabel?: string;
  score: number;
  match?: Match;
  href: string;
}

export const buildSuggestions = (matches: Match[], rawQuery: string, limit = 10): Suggestion[] => {
  const queries = expandQuery(rawQuery);
  if (queries.length === 0) return [];

  // Match-first
  const now = Date.now();
  const scored: Suggestion[] = [];
  const seenTeams = new Set<string>();
  const seenCities = new Set<string>();
  const seenComps = new Set<string>();
  const seenStadiums = new Set<string>();

  for (const m of matches) {
    const upcoming = new Date(m.date).getTime() >= now - 24 * 3600 * 1000;
    const sc = Math.max(matchScore(m, queries), multiTokenScore(m, rawQuery));
    if (sc >= 30 && upcoming) {
      // Boost: ticket on sale, has price, sooner
      const daysAway = Math.max(1, (new Date(m.date).getTime() - now) / 86400000);
      const recencyBoost = Math.max(0, 20 - Math.min(20, daysAway));
      const availBoost = m.ticketStatus === "on_sale" ? 15 : 0;
      const priceBoost = m.startingPrice != null ? 5 : 0;
      scored.push({
        kind: "match",
        label: `${m.homeTeam} vs ${m.awayTeam}`,
        sublabel: `${m.competition} · ${m.city || m.stadium || ""}`,
        score: sc + recencyBoost + availBoost + priceBoost,
        match: m,
        href: `/matches/${m.id}`,
      });
    }

    // Aggregate entity suggestions
    for (const [team, isHome] of [[m.homeTeam, true], [m.awayTeam, false]] as const) {
      const key = normalize(team);
      if (seenTeams.has(key)) continue;
      const ts = Math.max(...queries.map((q) => tokenScore(team, q)));
      if (ts >= 40) {
        seenTeams.add(key);
        scored.push({
          kind: "team",
          label: team,
          sublabel: "Team",
          score: ts - 5,
          href: `/matches?q=${encodeURIComponent(team)}`,
        });
      }
      void isHome;
    }
    if (m.city) {
      const key = normalize(m.city);
      if (!seenCities.has(key)) {
        const cs = Math.max(...queries.map((q) => tokenScore(m.city, q)));
        if (cs >= 40) {
          seenCities.add(key);
          scored.push({
            kind: "city",
            label: m.city,
            sublabel: "City",
            score: cs - 8,
            href: `/matches?q=${encodeURIComponent(m.city)}`,
          });
        }
      }
    }
    if (m.competition) {
      const key = normalize(m.competition);
      if (!seenComps.has(key)) {
        const cs = Math.max(...queries.map((q) => tokenScore(m.competition, q)));
        if (cs >= 40) {
          seenComps.add(key);
          scored.push({
            kind: "competition",
            label: m.competition,
            sublabel: "Competition",
            score: cs - 10,
            href: `/matches?league=${encodeURIComponent(m.competition)}`,
          });
        }
      }
    }
    if (m.stadium) {
      const key = normalize(m.stadium);
      if (!seenStadiums.has(key)) {
        const ss = Math.max(...queries.map((q) => tokenScore(m.stadium, q)));
        if (ss >= 50) {
          seenStadiums.add(key);
          scored.push({
            kind: "stadium",
            label: m.stadium,
            sublabel: m.city ? `Stadium · ${m.city}` : "Stadium",
            score: ss - 15,
            href: `/matches?q=${encodeURIComponent(m.stadium)}`,
          });
        }
      }
    }
  }

  return scored
    .sort((a, b) => {
      // Matches first within same score band
      if (Math.abs(a.score - b.score) < 5) {
        const ka = a.kind === "match" ? 0 : 1;
        const kb = b.kind === "match" ? 0 : 1;
        if (ka !== kb) return ka - kb;
      }
      return b.score - a.score;
    })
    .slice(0, limit);
};

export const filterMatchesByQuery = (matches: Match[], rawQuery: string): Match[] => {
  const queries = expandQuery(rawQuery);
  if (queries.length === 0) return matches;
  return matches
    .map((m) => ({ m, s: matchScore(m, queries) }))
    .filter((x) => x.s >= 30)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
};

// ---------------- Recommendations ----------------
const DERBIES: Array<[string, string]> = [
  ["real madrid", "barcelona"],
  ["barcelona", "real madrid"],
  ["real madrid", "atletico madrid"],
  ["atletico madrid", "real madrid"],
  ["inter milan", "ac milan"],
  ["ac milan", "inter milan"],
  ["roma", "lazio"],
  ["lazio", "roma"],
  ["liverpool", "manchester united"],
  ["manchester united", "liverpool"],
  ["arsenal", "tottenham"],
  ["tottenham", "arsenal"],
  ["psg", "marseille"],
  ["marseille", "psg"],
  ["paris saint-germain", "marseille"],
  ["marseille", "paris saint-germain"],
  ["bayern munich", "borussia dortmund"],
  ["borussia dortmund", "bayern munich"],
  ["fenerbahce", "galatasaray"],
  ["galatasaray", "fenerbahce"],
];

const isDerby = (m: Match): boolean => {
  const h = normalize(m.homeTeam);
  const a = normalize(m.awayTeam);
  return DERBIES.some(([x, y]) => h.includes(x) && a.includes(y));
};

const isWeekend = (iso: string): boolean => {
  const d = new Date(iso).getDay();
  return d === 0 || d === 5 || d === 6; // Fri/Sat/Sun
};

const inNextDays = (iso: string, days: number): boolean => {
  const t = new Date(iso).getTime();
  const now = Date.now();
  return t >= now && t <= now + days * 86400000;
};

export interface RecommendationSection {
  id: string;
  title: string;
  subtitle?: string;
  matches: Match[];
}

export const buildRecommendations = (
  allMatches: Match[],
  opts: { country?: string | null } = {},
): RecommendationSection[] => {
  const upcoming = allMatches.filter((m) => new Date(m.date).getTime() >= Date.now());
  const sections: RecommendationSection[] = [];

  // Weekend
  const weekend = upcoming.filter((m) => isWeekend(m.date) && inNextDays(m.date, 10)).slice(0, 6);
  if (weekend.length) sections.push({ id: "weekend", title: "recommendations.weekend", subtitle: "recommendations.weekend_subtitle", matches: weekend });

  // Big derbies
  const derbies = upcoming.filter(isDerby).slice(0, 6);
  if (derbies.length) sections.push({ id: "derbies", title: "recommendations.derbies", subtitle: "recommendations.derbies_subtitle", matches: derbies });

  // Champions League
  const ucl = upcoming.filter((m) => /champions league/i.test(m.competition)).slice(0, 6);
  if (ucl.length) sections.push({ id: "ucl", title: "recommendations.ucl", subtitle: "recommendations.ucl_subtitle", matches: ucl });

  // Cheapest
  const cheapest = [...upcoming]
    .filter((m) => m.startingPrice != null && m.ticketStatus !== "sold_out")
    .sort((a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0))
    .slice(0, 6);
  if (cheapest.length) sections.push({ id: "cheapest", title: "recommendations.cheapest", subtitle: "recommendations.cheapest_subtitle", matches: cheapest });

  // Best value (mid range at iconic stadiums)
  const value = [...upcoming]
    .filter((m) => m.startingPrice != null && m.startingPrice >= 50 && m.startingPrice <= 120)
    .slice(0, 6);
  if (value.length) sections.push({ id: "value", title: "recommendations.value", subtitle: "recommendations.value_subtitle", matches: value });

  // Trending (heuristic: upcoming + on_sale + featured/priority)
  const trending = [...upcoming]
    .filter((m) => m.featured || m.priority || m.ticketStatus === "on_sale")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);
  if (trending.length) sections.push({ id: "trending", title: "recommendations.trending", subtitle: "recommendations.trending_subtitle", matches: trending });

  // Popular in your country
  if (opts.country) {
    const local = upcoming
      .filter((m) => normalize(m.country ?? "") === normalize(opts.country!))
      .slice(0, 6);
    if (local.length) sections.push({ id: "local", title: "recommendations.local", subtitle: "recommendations.local_subtitle", matches: local });
  }

  return sections;
};
