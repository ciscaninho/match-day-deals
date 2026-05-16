// Centralized text normalization for football-aware search.
//
// Use `foldText` everywhere we want "Brøndby" to match "brondby", "København"
// to match "kobenhavn" or "copenhagen", and "FC St. Pauli 1910" to match "pauli".
//
// Pipeline:
//  1. Lowercase
//  2. Transliterate non-ASCII glyphs the unicode NFD trick can't handle (ø, æ, ß, ł, đ, ð, þ…)
//  3. NFD + strip combining marks (handles é, ñ, ü, etc.)
//  4. Punctuation -> space (., -, ', ’, /)
//  5. Collapse whitespace

const TRANSLITERATIONS: Record<string, string> = {
  ø: "o", Ø: "o",
  æ: "ae", Æ: "ae",
  œ: "oe", Œ: "oe",
  å: "a", Å: "a",
  ß: "ss",
  ł: "l", Ł: "l",
  đ: "d", Đ: "d", ð: "d", Ð: "d",
  þ: "th", Þ: "th",
  ı: "i", İ: "i",
  ş: "s", Ş: "s",
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
};

// Word-level aliases. Each token may expand to extra synonyms. Used as token
// equivalences both ways (saint ↔ st, copenhagen ↔ kobenhavn, etc.).
const TOKEN_ALIASES: Record<string, string[]> = {
  st: ["saint"],
  saint: ["st"],
  ste: ["sainte"],
  sainte: ["ste"],
  ft: ["fort"],
  mt: ["mount"],
  fc: [],
  cf: [],
  ac: [],
  sc: [],
  af: [],
  // City/place aliases
  kobenhavn: ["copenhagen"],
  copenhagen: ["kobenhavn"],
  munchen: ["munich"],
  munich: ["munchen"],
  milano: ["milan"],
  milan: ["milano"],
  roma: ["rome"],
  rome: ["roma"],
  napoli: ["naples"],
  naples: ["napoli"],
  torino: ["turin"],
  turin: ["torino"],
  lisboa: ["lisbon"],
  lisbon: ["lisboa"],
  sevilla: ["seville"],
  seville: ["sevilla"],
  praha: ["prague"],
  prague: ["praha"],
  wien: ["vienna"],
  vienna: ["wien"],
  warszawa: ["warsaw"],
  warsaw: ["warszawa"],
  moskva: ["moscow"],
  moscow: ["moskva"],
  athina: ["athens"],
  athens: ["athina"],
};

/** Strip diacritics + transliterate special glyphs to ASCII. */
export const foldText = (input: string | null | undefined): string => {
  if (!input) return "";
  let s = "";
  for (const ch of input) s += TRANSLITERATIONS[ch] ?? ch;
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._'’`/]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/** Split into normalized tokens of length >= 1. */
export const foldTokens = (input: string | null | undefined): string[] =>
  foldText(input).split(" ").filter(Boolean);

/** Expand a query into the set of tokens it could match (incl. aliases). */
const expandToken = (tok: string): string[] => {
  const aliases = TOKEN_ALIASES[tok];
  return aliases && aliases.length ? [tok, ...aliases] : [tok];
};

/**
 * Forgiving "does query match this haystack" check.
 * - Folds both sides (accent + transliteration + punctuation).
 * - Multi-word query: every token must match (AND), expanded via aliases.
 * - Each token matches as a substring (so partials like "o" find "brondby").
 * - Empty query returns true.
 */
export const matchesQuery = (
  haystack: string | (string | null | undefined)[] | null | undefined,
  rawQuery: string,
): boolean => {
  const q = foldText(rawQuery);
  if (!q) return true;
  const hayParts = Array.isArray(haystack) ? haystack : [haystack];
  const folded = hayParts.map((h) => foldText(h)).filter(Boolean).join(" ");
  if (!folded) return false;
  const tokens = q.split(" ").filter(Boolean);
  return tokens.every((tok) => expandToken(tok).some((variant) => folded.includes(variant)));
};

/** Lightweight relevance score: 0 = no match, higher = better. */
export const queryScore = (
  haystack: string | (string | null | undefined)[] | null | undefined,
  rawQuery: string,
): number => {
  const q = foldText(rawQuery);
  if (!q) return 0;
  const hayParts = Array.isArray(haystack) ? haystack : [haystack];
  const folded = hayParts.map((h) => foldText(h)).filter(Boolean).join(" | ");
  if (!folded) return 0;
  const tokens = q.split(" ").filter(Boolean);
  let total = 0;
  for (const tok of tokens) {
    const variants = expandToken(tok);
    let best = 0;
    for (const v of variants) {
      if (!folded.includes(v)) continue;
      if (folded === v) best = Math.max(best, 100);
      else if (folded.startsWith(v) || folded.includes(` ${v}`)) best = Math.max(best, 70);
      else if (folded.includes(v)) best = Math.max(best, 40);
    }
    if (best === 0) return 0; // AND semantics
    total += best;
  }
  return Math.round(total / tokens.length);
};
