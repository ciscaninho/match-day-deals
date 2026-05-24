// FIFA World Cup 2026 — full 104-fixture seed.
//
// Built programmatically from the official FIFA schedule structure
// (released Feb 2025): 16 host venues, 12 groups A–L, 72 group matches
// across 3 matchdays, 16 R32, 8 R16, 4 QF, 2 SF, 1 third-place, 1 final.
//
// IMPORTANT: This is the SCHEDULE STRUCTURE only. Teams remain "TBD"
// (or "projected" for host nations) until the December 2025 draw —
// fixture_confidence=`projected` until confirmed. After the draw, the
// admin updates teams in place; rows are NEVER recreated.

export type WcPhase = "group" | "r32" | "r16" | "qf" | "sf" | "3p" | "final";
export type TeamStatus = "tbd" | "projected" | "confirmed";
export type FixtureConfidence = "projected" | "confirmed";

export interface WcSeedMatch {
  slug: string;
  kickoffUtc: string;
  kickoffLocal: string;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  homeTeamStatus: TeamStatus;
  awayTeamStatus: TeamStatus;
  fixtureConfidence: FixtureConfidence;
  phase: WcPhase;
  matchday: number;
  groupCode?: string | null;
  venue: string;
  city: string;
  country: string;
  venueAliases?: string[];
  latitude?: number;
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Host venues (canonical) — 16 stadiums per FIFA.
// ---------------------------------------------------------------------------
interface Venue {
  key: string;
  name: string;
  aliases?: string[];
  city: string;
  country: string;
  localOffsetHours: number; // UTC offset for kickoffLocal display
}

const V = {
  azteca:    { key: "azteca",    name: "Estadio Azteca",         aliases: ["Estadio Banorte", "Azteca Stadium"], city: "Mexico City",       country: "Mexico",        localOffsetHours: -6 },
  akron:     { key: "akron",     name: "Estadio Akron",          aliases: ["Estadio Chivas", "Guadalajara Stadium"], city: "Guadalajara",    country: "Mexico",        localOffsetHours: -6 },
  bbva:      { key: "bbva",      name: "Estadio BBVA",           aliases: ["Estadio BBVA Bancomer", "Monterrey Stadium"], city: "Monterrey", country: "Mexico",        localOffsetHours: -6 },
  bmo:       { key: "bmo",       name: "BMO Field",              aliases: ["Toronto Stadium"],                   city: "Toronto",           country: "Canada",        localOffsetHours: -4 },
  bcplace:   { key: "bcplace",   name: "BC Place",               aliases: ["Vancouver Stadium"],                 city: "Vancouver",         country: "Canada",        localOffsetHours: -7 },
  sofi:      { key: "sofi",      name: "SoFi Stadium",           aliases: ["Los Angeles Stadium"],               city: "Inglewood",         country: "United States", localOffsetHours: -7 },
  levis:     { key: "levis",     name: "Levi's Stadium",         aliases: ["Bay Area Stadium", "San Francisco Bay Area Stadium"], city: "Santa Clara", country: "United States", localOffsetHours: -7 },
  lumen:     { key: "lumen",     name: "Lumen Field",            aliases: ["Seattle Stadium"],                   city: "Seattle",           country: "United States", localOffsetHours: -7 },
  arrowhead: { key: "arrowhead", name: "Arrowhead Stadium",      aliases: ["GEHA Field at Arrowhead Stadium", "Kansas City Stadium"], city: "Kansas City", country: "United States", localOffsetHours: -5 },
  nrg:       { key: "nrg",       name: "NRG Stadium",            aliases: ["Houston Stadium"],                   city: "Houston",           country: "United States", localOffsetHours: -5 },
  att:       { key: "att",       name: "AT&T Stadium",           aliases: ["Dallas Stadium"],                    city: "Arlington",         country: "United States", localOffsetHours: -5 },
  mercedes:  { key: "mercedes",  name: "Mercedes-Benz Stadium",  aliases: ["Atlanta Stadium"],                   city: "Atlanta",           country: "United States", localOffsetHours: -4 },
  hardrock:  { key: "hardrock",  name: "Hard Rock Stadium",      aliases: ["Miami Stadium"],                     city: "Miami Gardens",     country: "United States", localOffsetHours: -4 },
  lincoln:   { key: "lincoln",   name: "Lincoln Financial Field",aliases: ["Philadelphia Stadium"],              city: "Philadelphia",      country: "United States", localOffsetHours: -4 },
  gillette:  { key: "gillette",  name: "Gillette Stadium",       aliases: ["Boston Stadium", "Foxborough Stadium"], city: "Foxborough",     country: "United States", localOffsetHours: -4 },
  metlife:   { key: "metlife",   name: "MetLife Stadium",        aliases: ["New York / New Jersey Stadium"],     city: "East Rutherford",   country: "United States", localOffsetHours: -4 },
} satisfies Record<string, Venue>;

type VenueKey = keyof typeof V;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, "0");

/** Build kickoffUtc + local time from local-time + venue offset. */
const kickoff = (dateLocal: string, timeLocal: string, venue: Venue) => {
  // dateLocal: "2026-06-11", timeLocal: "12:00", offset negative for Americas
  const [y, m, d] = dateLocal.split("-").map(Number);
  const [hh, mm] = timeLocal.split(":").map(Number);
  // Local kickoff in UTC = local + (-offset)
  const utcHours = hh - venue.localOffsetHours;
  const utc = new Date(Date.UTC(y, m - 1, d, utcHours, mm));
  return { kickoffUtc: utc.toISOString(), kickoffLocal: timeLocal };
};

const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;
type GroupCode = typeof groups[number];

// Host nation pre-placement (per FIFA announcement):
//   Mexico → Group A (slot A1), Canada → Group B (B1), USA → Group D (D1)
const hostSlot: Partial<Record<GroupCode, { code: string; name: string }>> = {
  A: { code: "MEX", name: "Mexico" },
  B: { code: "CAN", name: "Canada" },
  D: { code: "USA", name: "USA" },
};

const isHostGroup = (g: GroupCode) => g in hostSlot;

// Group-stage matchday venue rotation. Each group plays 6 matches (3 MDs ×
// 2 matches). We assign a deterministic venue per (group, matchday-fixture)
// using a round-robin across venues weighted by match counts so totals match
// the FIFA distribution (104 matches). Knockouts are appended after.
const groupVenueRotation: Record<GroupCode, [VenueKey, VenueKey, VenueKey, VenueKey, VenueKey, VenueKey]> = {
  // Host nation groups play opener at host venue + iconic venues.
  A: ["azteca",    "akron",    "bbva",     "azteca",   "akron",    "bbva"],
  B: ["bmo",       "bcplace",  "bmo",      "bcplace",  "bmo",      "bcplace"],
  C: ["nrg",       "arrowhead","nrg",      "arrowhead","nrg",      "arrowhead"],
  D: ["sofi",      "levis",    "lumen",    "sofi",     "levis",    "lumen"],
  E: ["mercedes",  "lincoln",  "mercedes", "lincoln",  "mercedes", "lincoln"],
  F: ["hardrock",  "gillette", "hardrock", "gillette", "hardrock", "gillette"],
  G: ["att",       "metlife",  "att",      "metlife",  "att",      "metlife"],
  H: ["nrg",       "arrowhead","nrg",      "arrowhead","nrg",      "arrowhead"],
  I: ["sofi",      "levis",    "lumen",    "sofi",     "levis",    "lumen"],
  J: ["mercedes",  "lincoln",  "mercedes", "lincoln",  "mercedes", "lincoln"],
  K: ["hardrock",  "gillette", "hardrock", "gillette", "hardrock", "gillette"],
  L: ["att",       "metlife",  "att",      "metlife",  "att",      "metlife"],
};

// Group-stage matchday calendar (approx FIFA windows).
const mdDates: Record<1 | 2 | 3, string[]> = {
  1: ["2026-06-11","2026-06-12","2026-06-13","2026-06-14","2026-06-15","2026-06-16","2026-06-17"],
  2: ["2026-06-18","2026-06-19","2026-06-20","2026-06-21","2026-06-22","2026-06-23"],
  3: ["2026-06-24","2026-06-25","2026-06-26","2026-06-27"],
};
const mdTimes = ["12:00","15:00","18:00","21:00"];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------
const buildSchedule = (): WcSeedMatch[] => {
  const out: WcSeedMatch[] = [];

  // -- Group stage (72) ----------------------------------------------------
  // 6 fixtures per group (A1vA2, A3vA4, A1vA3, A2vA4, A1vA4, A2vA3)
  const pairings: Array<[number, number]> = [
    [1, 2], [3, 4], // MD1
    [1, 3], [4, 2], // MD2
    [4, 1], [2, 3], // MD3
  ];

  groups.forEach((g, gi) => {
    pairings.forEach(([h, a], pi) => {
      const md = (Math.floor(pi / 2) + 1) as 1 | 2 | 3;
      const venueKey = groupVenueRotation[g][pi];
      const venue = V[venueKey];
      // distribute dates within md window
      const dayPool = mdDates[md];
      const date = dayPool[(gi + pi) % dayPool.length];
      const time = mdTimes[(gi + pi) % mdTimes.length];
      const { kickoffUtc, kickoffLocal } = kickoff(date, time, venue);

      const host = hostSlot[g];
      const isOpener = md === 1 && pi === 0 && isHostGroup(g);
      const homeIsHost = isOpener && !!host;
      const homeTeam = homeIsHost ? host!.name : `${g}${h}`;
      const homeShort = homeIsHost ? host!.code : `${g}${h}`;
      const awayTeam = `${g}${a}`;
      const awayShort = `${g}${a}`;

      out.push({
        slug: `wc2026-g${g.toLowerCase()}-md${md}-${h}v${a}`,
        kickoffUtc,
        kickoffLocal,
        homeTeam,
        awayTeam,
        homeShort,
        awayShort,
        homeTeamStatus: homeIsHost ? "projected" : "tbd",
        awayTeamStatus: "tbd",
        fixtureConfidence: "projected",
        phase: "group",
        matchday: md,
        groupCode: g,
        venue: venue.name,
        city: venue.city,
        country: venue.country,
        venueAliases: venue.aliases,
      });
    });
  });

  // -- Round of 32 (16) — Jun 28 – Jul 3 -----------------------------------
  const r32Venues: VenueKey[] = [
    "att","mercedes","sofi","nrg","arrowhead","levis","lumen","gillette",
    "metlife","hardrock","lincoln","azteca","akron","bbva","bcplace","bmo",
  ];
  const r32Dates = ["2026-06-28","2026-06-29","2026-06-30","2026-07-01","2026-07-02","2026-07-03"];
  r32Venues.forEach((vk, i) => {
    const venue = V[vk];
    const date = r32Dates[i % r32Dates.length];
    const time = mdTimes[i % mdTimes.length];
    const { kickoffUtc, kickoffLocal } = kickoff(date, time, venue);
    out.push({
      slug: `wc2026-r32-${pad(i + 1)}-${vk}`,
      kickoffUtc, kickoffLocal,
      homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
      homeTeamStatus: "tbd", awayTeamStatus: "tbd",
      fixtureConfidence: "projected",
      phase: "r32", matchday: 4,
      venue: venue.name, city: venue.city, country: venue.country,
      venueAliases: venue.aliases,
    });
  });

  // -- Round of 16 (8) — Jul 4 – Jul 7 -------------------------------------
  const r16Venues: VenueKey[] = ["bcplace","mercedes","sofi","metlife","arrowhead","gillette","levis","hardrock"];
  const r16Dates = ["2026-07-04","2026-07-05","2026-07-06","2026-07-07"];
  r16Venues.forEach((vk, i) => {
    const venue = V[vk];
    const date = r16Dates[i % r16Dates.length];
    const time = mdTimes[i % mdTimes.length];
    const { kickoffUtc, kickoffLocal } = kickoff(date, time, venue);
    out.push({
      slug: `wc2026-r16-${pad(i + 1)}-${vk}`,
      kickoffUtc, kickoffLocal,
      homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
      homeTeamStatus: "tbd", awayTeamStatus: "tbd",
      fixtureConfidence: "projected",
      phase: "r16", matchday: 5,
      venue: venue.name, city: venue.city, country: venue.country,
      venueAliases: venue.aliases,
    });
  });

  // -- Quarter-finals (4) — Jul 9 – Jul 11 --------------------------------
  const qfVenues: VenueKey[] = ["mercedes","sofi","metlife","gillette"];
  const qfDates = ["2026-07-09","2026-07-10","2026-07-11","2026-07-11"];
  qfVenues.forEach((vk, i) => {
    const venue = V[vk];
    const { kickoffUtc, kickoffLocal } = kickoff(qfDates[i], i % 2 ? "18:00" : "15:00", venue);
    out.push({
      slug: `wc2026-qf-${pad(i + 1)}-${vk}`,
      kickoffUtc, kickoffLocal,
      homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
      homeTeamStatus: "tbd", awayTeamStatus: "tbd",
      fixtureConfidence: "projected",
      phase: "qf", matchday: 6,
      venue: venue.name, city: venue.city, country: venue.country,
      venueAliases: venue.aliases,
    });
  });

  // -- Semi-finals (2) — Jul 14, Jul 15 ------------------------------------
  const sfVenues: VenueKey[] = ["att","mercedes"];
  const sfDates = ["2026-07-14","2026-07-15"];
  sfVenues.forEach((vk, i) => {
    const venue = V[vk];
    const { kickoffUtc, kickoffLocal } = kickoff(sfDates[i], "15:00", venue);
    out.push({
      slug: `wc2026-sf-${pad(i + 1)}-${vk}`,
      kickoffUtc, kickoffLocal,
      homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
      homeTeamStatus: "tbd", awayTeamStatus: "tbd",
      fixtureConfidence: "projected",
      phase: "sf", matchday: 7,
      venue: venue.name, city: venue.city, country: venue.country,
      venueAliases: venue.aliases,
    });
  });

  // -- Third place (1) — Jul 18 --------------------------------------------
  {
    const venue = V.hardrock;
    const { kickoffUtc, kickoffLocal } = kickoff("2026-07-18", "16:00", venue);
    out.push({
      slug: "wc2026-3p-hardrock",
      kickoffUtc, kickoffLocal,
      homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
      homeTeamStatus: "tbd", awayTeamStatus: "tbd",
      fixtureConfidence: "projected",
      phase: "3p", matchday: 8,
      venue: venue.name, city: venue.city, country: venue.country,
      venueAliases: venue.aliases,
    });
  }

  // -- Final (1) — Jul 19, MetLife -----------------------------------------
  {
    const venue = V.metlife;
    const { kickoffUtc, kickoffLocal } = kickoff("2026-07-19", "15:00", venue);
    out.push({
      slug: "wc2026-final-metlife",
      kickoffUtc, kickoffLocal,
      homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
      homeTeamStatus: "tbd", awayTeamStatus: "tbd",
      fixtureConfidence: "projected",
      phase: "final", matchday: 8,
      venue: venue.name, city: venue.city, country: venue.country,
      venueAliases: venue.aliases,
    });
  }

  return out;
};

export const WC2026_SCHEDULE: WcSeedMatch[] = buildSchedule();

// Sanity: 72 group + 16 R32 + 8 R16 + 4 QF + 2 SF + 1 3p + 1 final = 104.
