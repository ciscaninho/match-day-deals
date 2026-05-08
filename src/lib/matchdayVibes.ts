// Matchday Vibes: emotional/cultural context inferred from match + stadium data.
// Each vibe is a compact chip with an emoji, an i18n key, and a tone.
// Usage: vibesForMatch({ ... }) -> Vibe[]; vibesForStadium(stadium) -> Vibe[].

export type VibeId =
  | "intense"
  | "family"
  | "ultras"
  | "historic"
  | "festive"
  | "premium"
  | "tourist"
  | "derby"
  | "european_night";

export type Vibe = {
  id: VibeId;
  emoji: string;
  i18nKey: string; // resolved via t()
  tone: "hot" | "ultras" | "family" | "historic" | "festive" | "premium" | "tourist" | "derby" | "european";
};

const VIBE_META: Record<VibeId, Omit<Vibe, "id">> = {
  intense:        { emoji: "🔥", i18nKey: "vibe.intense",        tone: "hot" },
  family:         { emoji: "👨‍👩‍👧", i18nKey: "vibe.family",      tone: "family" },
  ultras:         { emoji: "🎺", i18nKey: "vibe.ultras",         tone: "ultras" },
  historic:       { emoji: "🏟", i18nKey: "vibe.historic",       tone: "historic" },
  festive:        { emoji: "🎉", i18nKey: "vibe.festive",        tone: "festive" },
  premium:        { emoji: "💎", i18nKey: "vibe.premium",        tone: "premium" },
  tourist:        { emoji: "🌍", i18nKey: "vibe.tourist",        tone: "tourist" },
  derby:          { emoji: "🧨", i18nKey: "vibe.derby",          tone: "derby" },
  european_night: { emoji: "🌙", i18nKey: "vibe.european_night", tone: "european" },
};

const make = (id: VibeId): Vibe => ({ id, ...VIBE_META[id] });

const norm = (s?: string | null) => (s ?? "").toLowerCase();

const EUROPEAN_COMPS = [
  "champions league", "europa league", "conference league", "uefa", "super cup",
];

const DERBY_PAIRS: [string, string][] = [
  ["real madrid", "atletico"], ["real madrid", "barcelona"], ["barcelona", "espanyol"],
  ["inter", "milan"], ["inter", "ac milan"], ["roma", "lazio"], ["arsenal", "tottenham"],
  ["liverpool", "everton"], ["manchester united", "manchester city"], ["chelsea", "tottenham"],
  ["bayern", "dortmund"], ["psg", "marseille"], ["psg", "olympique"], ["boca", "river"],
  ["celtic", "rangers"], ["galatasaray", "fenerbahce"], ["galatasaray", "fenerbahçe"],
  ["ajax", "feyenoord"], ["porto", "benfica"], ["sporting", "benfica"],
  ["napoli", "roma"], ["fenerbahce", "besiktas"],
];

export const isDerbyMatch = (home?: string | null, away?: string | null) => {
  const h = norm(home);
  const a = norm(away);
  if (!h || !a) return false;
  return DERBY_PAIRS.some(([x, y]) =>
    (h.includes(x) && a.includes(y)) || (h.includes(y) && a.includes(x)),
  );
};

export const isEuropeanNight = (competition?: string | null) => {
  const c = norm(competition);
  return EUROPEAN_COMPS.some((k) => c.includes(k));
};

const HISTORIC_STADIUMS = [
  "santiago bernabéu", "santiago bernabeu", "camp nou", "spotify camp nou",
  "old trafford", "anfield", "san siro", "stadio giuseppe meazza",
  "signal iduna park", "westfalenstadion", "la bombonera", "monumental",
  "maracana", "maracanã", "wembley", "estadio azteca", "azteca",
  "stade vélodrome", "velodrome", "celtic park", "ibrox",
];

export const isHistoricStadium = (stadiumName?: string | null) => {
  const s = norm(stadiumName);
  if (!s) return false;
  return HISTORIC_STADIUMS.some((h) => s.includes(h));
};

type StadiumLike = {
  atmosphere_score?: number | null;
  family_friendly_score?: number | null;
  popularity_score?: number | null;
  ultras_section?: string | null;
  family_section?: string | null;
  vip_available?: boolean | null;
  opened_year?: number | null;
  capacity?: number | null;
  stadium_name?: string | null;
};

export const vibesForStadium = (stadium?: StadiumLike | null): Vibe[] => {
  if (!stadium) return [];
  const out: VibeId[] = [];
  const atm = stadium.atmosphere_score ?? null;
  if (atm != null && atm >= 8.5) out.push("intense");
  if (stadium.ultras_section) out.push("ultras");
  if ((stadium.family_friendly_score ?? 0) >= 7.5 || stadium.family_section) out.push("family");
  if (isHistoricStadium(stadium.stadium_name) || (stadium.opened_year && stadium.opened_year < 1960)) {
    out.push("historic");
  }
  if (stadium.vip_available) out.push("premium");
  if ((stadium.popularity_score ?? 0) >= 8.5 || (stadium.capacity ?? 0) >= 70000) out.push("tourist");
  return dedupe(out).slice(0, 4).map(make);
};

type MatchLike = {
  homeTeam?: string | null;
  awayTeam?: string | null;
  competition?: string | null;
  stadium?: string | null;
  featured?: boolean | null;
  priority?: boolean | null;
};

export const vibesForMatch = (
  match: MatchLike,
  stadium?: StadiumLike | null,
): Vibe[] => {
  const out: VibeId[] = [];
  if (isDerbyMatch(match.homeTeam, match.awayTeam)) out.push("derby");
  if (isEuropeanNight(match.competition)) out.push("european_night");
  const c = norm(match.competition);
  if (c.includes("final")) out.push("festive");

  // merge in stadium-driven vibes
  vibesForStadium(stadium).forEach((v) => out.push(v.id));

  // big match → intense
  if ((match.featured || match.priority) && !out.includes("intense")) out.push("intense");

  return dedupe(out).slice(0, 5).map(make);
};

const dedupe = <T>(arr: T[]): T[] => Array.from(new Set(arr));

// Tone -> tailwind classes (works on both dark + light contexts via opacity).
export const vibeToneClasses = (tone: Vibe["tone"], dark = true): string => {
  if (dark) {
    const m: Record<Vibe["tone"], string> = {
      hot:      "bg-red-500/15 text-red-300 border-red-400/30",
      ultras:   "bg-orange-500/15 text-orange-300 border-orange-400/30",
      family:   "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
      historic: "bg-amber-500/15 text-amber-300 border-amber-400/30",
      festive:  "bg-pink-500/15 text-pink-300 border-pink-400/30",
      premium:  "bg-violet-500/15 text-violet-300 border-violet-400/30",
      tourist:  "bg-sky-500/15 text-sky-300 border-sky-400/30",
      derby:    "bg-amber-500/20 text-amber-300 border-amber-400/40",
      european: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
    };
    return m[tone];
  }
  const m: Record<Vibe["tone"], string> = {
    hot:      "bg-red-50 text-red-700 border-red-200",
    ultras:   "bg-orange-50 text-orange-700 border-orange-200",
    family:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    historic: "bg-amber-50 text-amber-700 border-amber-200",
    festive:  "bg-pink-50 text-pink-700 border-pink-200",
    premium:  "bg-violet-50 text-violet-700 border-violet-200",
    tourist:  "bg-sky-50 text-sky-700 border-sky-200",
    derby:    "bg-amber-50 text-amber-800 border-amber-300",
    european: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return m[tone];
};
