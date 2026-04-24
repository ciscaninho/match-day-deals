import { supabase } from "@/integrations/supabase/client";

export interface ApiFootballSyncResult {
  success: boolean;
  synced?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "network" | "table" | "unknown";
  status?: number;
}

const API_BASE_URL = "https://v3.football.api-sports.io/fixtures";
const API_SEASON = 2025;
const API_LEAGUES = [
  { id: 61, label: "Ligue 1" },
  { id: 39, label: "Premier League" },
] as const;

interface ApiFootballTeam {
  id: number;
  name: string;
  logo: string | null;
}

interface ApiFootballFixtureResponse {
  fixture: {
    id: number;
    date: string;
    venue: { id: number | null; name: string | null; city: string | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string | null;
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
}

interface ApiFootballResponse {
  errors?: unknown;
  results?: number;
  response?: ApiFootballFixtureResponse[];
}

const shortCode = (name: string) =>
  name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "TBD";

const buildId = (fixtureId: number) => `af_${fixtureId}`;

const hasApiErrors = (errors: unknown) =>
  Boolean(
    errors &&
      ((Array.isArray(errors) && errors.length > 0) ||
        (typeof errors === "object" && Object.keys(errors as object).length > 0))
  );

const getLeagueUrl = (leagueId: number) =>
  `${API_BASE_URL}?league=${leagueId}&season=${API_SEASON}`;

/**
 * Browser-only API-FOOTBALL → Supabase sync.
 * Reads VITE_API_FOOTBALL_KEY from the frontend env and calls api-sports.io directly.
 * Upserts results into the `matches` table via the Supabase JS client.
 */
export const syncApiFootballFixtures = async (): Promise<ApiFootballSyncResult> => {
  const apiKey = (import.meta.env.VITE_API_FOOTBALL_KEY as string | undefined)?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "[KEY] VITE_API_FOOTBALL_KEY manquant. Ajoute-le dans Vercel puis redéploie.",
      errorType: "key",
    };
  }

  const headers = {
    "x-apisports-key": apiKey,
    Accept: "application/json",
  };

  let responses: Response[];
  try {
    responses = await Promise.all(
      API_LEAGUES.map(({ id }) =>
        fetch(getLeagueUrl(id), {
          headers,
        })
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] Impossible d'appeler API-FOOTBALL: ${message}`,
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
      error: `[API-FOOTBALL ${failedResponse.status}] ${txt.slice(0, 300)}`,
      errorType,
      status: failedResponse.status,
    };
  }

  let payloads: ApiFootballResponse[];
  try {
    payloads = (await Promise.all(responses.map((resp) => resp.json()))) as ApiFootballResponse[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] Réponse API-FOOTBALL invalide: ${message}`,
      errorType: "network",
    };
  }

  const payloadWithErrors = payloads.find((payload) => hasApiErrors(payload.errors));
  if (payloadWithErrors) {
    return {
      success: false,
      error: `[KEY] API-FOOTBALL a retourné une erreur: ${JSON.stringify(payloadWithErrors.errors).slice(0, 300)}`,
      errorType: "key",
    };
  }

  const fixtureMap = new Map<number, ApiFootballFixtureResponse>();
  payloads.forEach((payload) => {
    (payload.response ?? []).forEach((fixture) => {
      fixtureMap.set(fixture.fixture.id, fixture);
    });
  });

  const fixtures = Array.from(fixtureMap.values());
  const rows = fixtures.map((f) => ({
    id: buildId(f.fixture.id),
    sportmonks_id: f.fixture.id,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_short: shortCode(f.teams.home.name),
    away_short: shortCode(f.teams.away.name),
    home_logo: f.teams.home.logo,
    away_logo: f.teams.away.logo,
    competition: f.league.name,
    country: f.league.country ?? "",
    date: f.fixture.date,
    stadium: f.fixture.venue?.name ?? "",
    city: f.fixture.venue?.city ?? "",
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
      message: `Aucun match retourné pour ${API_LEAGUES.map(({ label }) => label).join(" + ")}`,
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
    message: `Synchronisation ${API_LEAGUES.map(({ label }) => label).join(" + ")} (${API_SEASON})`,
  };
};
