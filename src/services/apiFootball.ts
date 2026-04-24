import { supabase } from "@/integrations/supabase/client";

export interface ApiFootballSyncResult {
  success: boolean;
  synced?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "network" | "table" | "unknown";
  status?: number;
}

const API_BASE_URL = "https://api.football-data.org/v4/matches";
const COMPETITIONS = ["FL1", "PL", "CL"] as const; // Ligue 1, Premier League, Champions League
const DAYS_AHEAD = 30;

interface FdTeam {
  id: number;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface FdCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
}

interface FdArea {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  area: FdArea;
  competition: FdCompetition;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  venue?: string | null;
}

interface FdResponse {
  matches?: FdMatch[];
  errorCode?: number;
  message?: string;
}

const shortCode = (team: FdTeam) => {
  if (team.tla) return team.tla.toUpperCase();
  const src = team.shortName || team.name || "";
  return src.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "TBD";
};

const buildId = (matchId: number) => `fd_${matchId}`;

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Browser-only Football-Data.org v4 → Supabase sync.
 * Reads VITE_FOOTBALL_DATA_KEY from the frontend env and calls api.football-data.org directly.
 * Fetches the next 30 days of fixtures for Ligue 1, Premier League and Champions League,
 * then upserts results into the `matches` table via the Supabase JS client.
 */
export const syncApiFootballFixtures = async (): Promise<ApiFootballSyncResult> => {
  const apiKey = (import.meta.env.VITE_FOOTBALL_DATA_KEY as string | undefined)?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "[KEY] VITE_FOOTBALL_DATA_KEY manquant. Ajoute-le dans Vercel puis redéploie.",
      errorType: "key",
    };
  }

  const headers = {
    "X-Auth-Token": apiKey,
    Accept: "application/json",
  };

  const dateFrom = formatDate(new Date());
  const dateTo = formatDate(new Date(Date.now() + DAYS_AHEAD * 24 * 60 * 60 * 1000));

  const buildUrl = (code: string) =>
    `${API_BASE_URL}?competitions=${code}&dateFrom=${dateFrom}&dateTo=${dateTo}`;

  let responses: Response[];
  try {
    // Football-Data free plan rate-limits to ~10 req/min. Sequential calls keep us safe.
    responses = [];
    for (const code of COMPETITIONS) {
      const resp = await fetch(buildUrl(code), { headers });
      responses.push(resp);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] Impossible d'appeler Football-Data.org: ${message}`,
      errorType: "network",
    };
  }

  const failedResponse = responses.find((resp) => !resp.ok);
  if (failedResponse) {
    const txt = await failedResponse.text();
    const errorType: ApiFootballSyncResult["errorType"] =
      failedResponse.status === 401 || failedResponse.status === 403 ? "key" : "network";
    return {
      success: false,
      error: `[FOOTBALL-DATA ${failedResponse.status}] ${txt.slice(0, 300)}`,
      errorType,
      status: failedResponse.status,
    };
  }

  let payloads: FdResponse[];
  try {
    payloads = (await Promise.all(responses.map((resp) => resp.json()))) as FdResponse[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] Réponse Football-Data invalide: ${message}`,
      errorType: "network",
    };
  }

  const payloadWithError = payloads.find((p) => p.errorCode);
  if (payloadWithError) {
    return {
      success: false,
      error: `[KEY] Football-Data a retourné une erreur: ${payloadWithError.message ?? "unknown"}`,
      errorType: "key",
    };
  }

  const matchMap = new Map<number, FdMatch>();
  payloads.forEach((payload) => {
    (payload.matches ?? []).forEach((m) => matchMap.set(m.id, m));
  });

  const matches = Array.from(matchMap.values());
  const rows = matches.map((m) => ({
    id: buildId(m.id),
    sportmonks_id: m.id,
    home_team: m.homeTeam.name ?? m.homeTeam.shortName ?? "TBD",
    away_team: m.awayTeam.name ?? m.awayTeam.shortName ?? "TBD",
    home_short: shortCode(m.homeTeam),
    away_short: shortCode(m.awayTeam),
    home_logo: m.homeTeam.crest,
    away_logo: m.awayTeam.crest,
    competition: m.competition.name,
    country: m.area?.name ?? "",
    date: m.utcDate,
    stadium: m.venue ?? "",
    city: "",
    ticket_status: "not_released",
    ticket_release_date: null,
    ticket_sources: [],
    featured: false,
    priority: false,
    starting_price: null,
  }));

  if (rows.length === 0) {
    return {
      success: true,
      synced: 0,
      message: `Aucun match retourné pour ${COMPETITIONS.join(" + ")} sur ${DAYS_AHEAD} jours`,
    };
  }

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "sportmonks_id" });

  if (error) {
    const lower = error.message.toLowerCase();
    let errorType: ApiFootballSyncResult["errorType"] = "table";
    if (lower.includes("row-level security") || lower.includes("permission") || lower.includes("policy")) {
      errorType = "key";
    }
    return {
      success: false,
      error: `[${errorType.toUpperCase()}] ${error.message}`,
      errorType,
    };
  }

  return {
    success: true,
    synced: rows.length,
    message: `Synchronisation Football-Data (Ligue 1 + Premier League + Champions League, ${DAYS_AHEAD} prochains jours)`,
  };
};
