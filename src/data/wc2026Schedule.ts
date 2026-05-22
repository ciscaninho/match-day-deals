// FIFA World Cup 2026 — canonical schedule seed.
//
// Source of truth for the match import workflow. Admin imports from this
// seed (or a CSV with the same shape) and the importer resolves the
// `venue` to an existing host stadium via `wcStadiumResolver`.
//
// Times are stored as UTC ISO strings (kickoffUtc) and a local kickoff
// time for display. Extend or override via CSV upload — never by editing
// matches manually.

export type WcPhase =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "3p"
  | "final";

export interface WcSeedMatch {
  /** Canonical slug, used for deduplication (wc2026-{mdY}-{home}-{away}). */
  slug: string;
  /** ISO UTC kickoff. */
  kickoffUtc: string;
  /** Local kickoff time HH:mm (display only). */
  kickoffLocal: string;
  /** Home / away team labels (or TBD for knockout placeholders). */
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  /** Tournament metadata. */
  phase: WcPhase;
  matchday: number;
  groupCode?: string | null;
  /** Venue resolution hints. */
  venue: string;
  city: string;
  country: string;
  venueAliases?: string[];
  latitude?: number;
  longitude?: number;
}

const T = (h: string) => h;

// Representative seed — opening match + one fixture per host venue + key
// knockout rounds + final. Extend via CSV upload in the admin importer.
export const WC2026_SCHEDULE: WcSeedMatch[] = [
  {
    slug: "wc2026-1-mex-tbd1",
    kickoffUtc: "2026-06-11T18:00:00Z",
    kickoffLocal: T("12:00"),
    homeTeam: "Mexico",
    awayTeam: "TBD",
    homeShort: "MEX",
    awayShort: "TBD",
    phase: "group",
    matchday: 1,
    groupCode: "A",
    venue: "Estadio Azteca",
    venueAliases: ["Estadio Banorte", "Azteca Stadium"],
    city: "Mexico City",
    country: "Mexico",
  },
  {
    slug: "wc2026-1-can-tbd2",
    kickoffUtc: "2026-06-12T23:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "Canada",
    awayTeam: "TBD",
    homeShort: "CAN",
    awayShort: "TBD",
    phase: "group",
    matchday: 1,
    groupCode: "B",
    venue: "BMO Field",
    city: "Toronto",
    country: "Canada",
  },
  {
    slug: "wc2026-1-usa-tbd3",
    kickoffUtc: "2026-06-12T20:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "USA",
    awayTeam: "TBD",
    homeShort: "USA",
    awayShort: "TBD",
    phase: "group",
    matchday: 1,
    groupCode: "D",
    venue: "SoFi Stadium",
    city: "Inglewood",
    country: "United States",
    venueAliases: ["Los Angeles Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-metlife",
    kickoffUtc: "2026-06-13T20:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "MetLife Stadium",
    city: "East Rutherford",
    country: "United States",
    venueAliases: ["New York / New Jersey Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-att",
    kickoffUtc: "2026-06-14T19:00:00Z",
    kickoffLocal: T("14:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "AT&T Stadium",
    city: "Arlington",
    country: "United States",
    venueAliases: ["Dallas Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-mercedes",
    kickoffUtc: "2026-06-15T19:00:00Z",
    kickoffLocal: T("15:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "United States",
  },
  {
    slug: "wc2026-2-tbd-tbd-lincoln",
    kickoffUtc: "2026-06-15T20:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Lincoln Financial Field",
    city: "Philadelphia",
    country: "United States",
    venueAliases: ["Philadelphia Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-hardrock",
    kickoffUtc: "2026-06-16T23:00:00Z",
    kickoffLocal: T("19:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Hard Rock Stadium",
    city: "Miami Gardens",
    country: "United States",
    venueAliases: ["Miami Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-lumen",
    kickoffUtc: "2026-06-15T22:00:00Z",
    kickoffLocal: T("15:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Lumen Field",
    city: "Seattle",
    country: "United States",
    venueAliases: ["Seattle Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-levis",
    kickoffUtc: "2026-06-17T19:00:00Z",
    kickoffLocal: T("12:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Levi's Stadium",
    city: "Santa Clara",
    country: "United States",
    venueAliases: ["Bay Area Stadium", "San Francisco Bay Area Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-arrowhead",
    kickoffUtc: "2026-06-16T19:00:00Z",
    kickoffLocal: T("14:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Arrowhead Stadium",
    city: "Kansas City",
    country: "United States",
    venueAliases: ["GEHA Field at Arrowhead Stadium", "Kansas City Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-nrg",
    kickoffUtc: "2026-06-14T19:00:00Z",
    kickoffLocal: T("14:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "NRG Stadium",
    city: "Houston",
    country: "United States",
  },
  {
    slug: "wc2026-2-tbd-tbd-gillette",
    kickoffUtc: "2026-06-15T20:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Gillette Stadium",
    city: "Foxborough",
    country: "United States",
    venueAliases: ["Boston Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-bcplace",
    kickoffUtc: "2026-06-13T23:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "BC Place",
    city: "Vancouver",
    country: "Canada",
    venueAliases: ["Vancouver Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-akron",
    kickoffUtc: "2026-06-14T22:00:00Z",
    kickoffLocal: T("17:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Estadio Akron",
    city: "Guadalajara",
    country: "Mexico",
    venueAliases: ["Estadio Chivas", "Guadalajara Stadium"],
  },
  {
    slug: "wc2026-2-tbd-tbd-bbva",
    kickoffUtc: "2026-06-14T22:00:00Z",
    kickoffLocal: T("17:00"),
    homeTeam: "TBD",
    awayTeam: "TBD",
    homeShort: "TBD",
    awayShort: "TBD",
    phase: "group",
    matchday: 2,
    venue: "Estadio BBVA",
    city: "Monterrey",
    country: "Mexico",
    venueAliases: ["Estadio BBVA Bancomer", "Monterrey Stadium"],
  },
  // Knockouts
  {
    slug: "wc2026-r32-1-att",
    kickoffUtc: "2026-06-27T19:00:00Z",
    kickoffLocal: T("14:00"),
    homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
    phase: "r32", matchday: 4,
    venue: "AT&T Stadium", city: "Arlington", country: "United States",
  },
  {
    slug: "wc2026-r16-1-bcplace",
    kickoffUtc: "2026-07-04T22:00:00Z",
    kickoffLocal: T("15:00"),
    homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
    phase: "r16", matchday: 5,
    venue: "BC Place", city: "Vancouver", country: "Canada",
  },
  {
    slug: "wc2026-qf-1-mercedes",
    kickoffUtc: "2026-07-09T20:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
    phase: "qf", matchday: 6,
    venue: "Mercedes-Benz Stadium", city: "Atlanta", country: "United States",
  },
  {
    slug: "wc2026-sf-1-att",
    kickoffUtc: "2026-07-14T20:00:00Z",
    kickoffLocal: T("15:00"),
    homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
    phase: "sf", matchday: 7,
    venue: "AT&T Stadium", city: "Arlington", country: "United States",
  },
  {
    slug: "wc2026-3p-hardrock",
    kickoffUtc: "2026-07-18T20:00:00Z",
    kickoffLocal: T("16:00"),
    homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
    phase: "3p", matchday: 8,
    venue: "Hard Rock Stadium", city: "Miami Gardens", country: "United States",
  },
  {
    slug: "wc2026-final-metlife",
    kickoffUtc: "2026-07-19T19:00:00Z",
    kickoffLocal: T("15:00"),
    homeTeam: "TBD", awayTeam: "TBD", homeShort: "TBD", awayShort: "TBD",
    phase: "final", matchday: 8,
    venue: "MetLife Stadium", city: "East Rutherford", country: "United States",
  },
];
