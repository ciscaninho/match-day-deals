// Disambiguates league names that exist in multiple countries.
// Examples: "Superliga" → "Danish Superliga" / "Romanian SuperLiga".
//
// Rules:
// - Known shared names get a country qualifier prepended.
// - Unknown leagues are returned as-is (avoids breaking unique names).
// - Special-cased capitalization for SuperLiga (Romania) where appropriate.

const COUNTRY_ADJ: Record<string, string> = {
  Denmark: "Danish",
  Romania: "Romanian",
  Greece: "Greek",
  Switzerland: "Swiss",
  Germany: "German",
  Austria: "Austrian",
  England: "English",
  Wales: "Welsh",
  Scotland: "Scottish",
  Ireland: "Irish",
  "Northern Ireland": "Northern Irish",
  "United States": "US",
  USA: "US",
  Canada: "Canadian",
  Mexico: "Mexican",
  Italy: "Italian",
  Spain: "Spanish",
  France: "French",
  Portugal: "Portuguese",
  Netherlands: "Dutch",
  Belgium: "Belgian",
  Turkey: "Turkish",
  Russia: "Russian",
  Brazil: "Brazilian",
  Argentina: "Argentine",
  Japan: "Japanese",
  "South Korea": "South Korean",
  China: "Chinese",
  "Saudi Arabia": "Saudi",
  Australia: "Australian",
};

// Names that are reused across countries — always disambiguate.
const SHARED_LEAGUE_NAMES = new Set(
  [
    "superliga",
    "super league",
    "bundesliga",
    "championship",
    "premier league",
    "first division",
    "second division",
    "league of ireland",
    "mls",
    "primera division",
    "primera división",
    "serie a",
    "serie b",
    "ligue 1",
    "ligue 2",
    "cup",
    "league cup",
  ].map((s) => s.toLowerCase()),
);

const norm = (v: string | null | undefined) => (v || "").trim();

export const isSharedLeagueName = (league: string | null | undefined) =>
  SHARED_LEAGUE_NAMES.has(norm(league).toLowerCase());

/**
 * Returns a label like "Danish Superliga" when a league name is shared across
 * multiple countries. Falls back to the bare league name otherwise.
 */
export const formatLeagueLabel = (
  league: string | null | undefined,
  country: string | null | undefined,
): string => {
  const l = norm(league);
  if (!l) return "";
  if (!isSharedLeagueName(l)) return l;
  const adj = COUNTRY_ADJ[norm(country)];
  if (!adj) return country ? `${l} (${country})` : l;
  // Avoid double prefix (e.g. league already starts with adjective)
  if (l.toLowerCase().startsWith(adj.toLowerCase())) return l;
  return `${adj} ${l}`;
};

/**
 * Builds a stable key for a (country, league) pair to use in dropdowns
 * and URL params when disambiguation is required.
 */
export const leagueKey = (
  league: string | null | undefined,
  country: string | null | undefined,
): string => {
  const l = norm(league);
  const c = norm(country);
  if (!l) return "";
  return isSharedLeagueName(l) && c ? `${c}::${l}` : l;
};
