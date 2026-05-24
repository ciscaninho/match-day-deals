// Utilities to render World Cup / tournament slot codes as human-friendly
// labels for public-facing UI. Admin surfaces should keep the raw code.
//
// Recognized raw codes (from wc2026Schedule seed):
//   A1..L4      → "Group A Position 1"
//   W49, W#49   → "Winner of Match 49"
//   L49         → "Loser of Match 49" (only if no group letter conflict)
//   RU-A        → "Runner-up Group A"
//   1A / 2B     → "Group A Position 1" / "Group B Position 2"
//   TBD         → "TBD"

export const isInternationalCompetition = (competition?: string | null) => {
  if (!competition) return false;
  return /world cup|coupe du monde|f[ií]fa\s*wc|copa\s*mundial|mundial\b|euro\b|copa am[eé]rica|nations league/i.test(
    competition,
  );
};

const groupLetters = "ABCDEFGHIJKL";

export function formatTournamentSlot(raw?: string | null): string {
  if (!raw) return "TBD";
  const s = raw.trim();
  if (!s || /^tbd$/i.test(s)) return "TBD";

  // Winner of match: W49, W#49, WM49
  let m = s.match(/^W#?M?(\d{1,3})$/i);
  if (m) return `Winner of Match ${m[1]}`;
  // Loser of match: LM49 (avoid conflict with "L2" which is group L pos 2)
  m = s.match(/^LM(\d{1,3})$/i);
  if (m) return `Loser of Match ${m[1]}`;
  // Runner-up: RU-A or 2A or RUA
  m = s.match(/^RU-?([A-L])$/i);
  if (m) return `Runner-up Group ${m[1].toUpperCase()}`;
  // Group winner: W-A
  m = s.match(/^W-([A-L])$/i);
  if (m) return `Winner Group ${m[1].toUpperCase()}`;

  // X1 form: letter then position (A1..L4 etc.)
  m = s.match(/^([A-L])(\d)$/i);
  if (m && groupLetters.includes(m[1].toUpperCase())) {
    return `Group ${m[1].toUpperCase()} Position ${m[2]}`;
  }
  // 1X form: position then letter (1A, 2B)
  m = s.match(/^(\d)([A-L])$/i);
  if (m && groupLetters.includes(m[2].toUpperCase())) {
    return `Group ${m[2].toUpperCase()} Position ${m[1]}`;
  }
  // G3 / Group G Position 3 fallbacks
  m = s.match(/^G(\d+)$/i);
  if (m) return `Group Position ${m[1]}`;

  return s; // Real team name or already friendly — leave as-is
}

// Returns the public label for a single side. When a projected country code
// or name is available, prefer that with a "(Projected)" suffix.
export function formatTeamLabel(opts: {
  raw?: string | null;
  projected?: string | null;
  status?: string | null;
}): string {
  const { raw, projected, status } = opts;
  if (status === "confirmed" && raw) return raw;
  if (projected && projected.trim()) {
    return `${projected.trim()} (Projected)`;
  }
  return formatTournamentSlot(raw);
}
