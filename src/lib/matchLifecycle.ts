// Match lifecycle helpers (mirrors the SQL trigger in matches.lifecycle_status)
export type MatchLifecycleStatus = "upcoming" | "live" | "completed" | "archived";

const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000;     // 2h30 after kickoff = live
const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14d after kickoff = completed, then archived

export const deriveLifecycle = (
  dateIso: string,
  archivedAt?: string | null,
  now: number = Date.now(),
): MatchLifecycleStatus => {
  if (archivedAt) return "archived";
  const t = new Date(dateIso).getTime();
  if (now < t) return "upcoming";
  if (now < t + LIVE_WINDOW_MS) return "live";
  if (now < t + RECENT_WINDOW_MS) return "completed";
  return "archived";
};

export const isPublicDiscoverable = (status: MatchLifecycleStatus) =>
  status === "upcoming" || status === "live";

export const isRecentForClubPage = (status: MatchLifecycleStatus) =>
  status === "upcoming" || status === "live" || status === "completed";
