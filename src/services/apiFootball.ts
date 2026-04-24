import { supabase } from "@/integrations/supabase/client";

export interface ApiFootballSyncResult {
  success: boolean;
  synced?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "network" | "table" | "unknown";
  status?: number;
}

const API_URL = "https://v3.football.api-sports.io/fixtures?next=50";

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

  let json: ApiFootballResponse;
  try {
    const resp = await fetch(API_URL, {
      headers: {
        "x-apisports-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      const errorType: ApiFootballSyncResult["errorType"] =
        resp.status === 401 || resp.status === 403 ? "key" : "network";
      return {
        success: false,
        error: `[API-FOOTBALL ${resp.status}] ${txt.slice(0, 300)}`,
        errorType,
        status: resp.status,
      };
    }

    json = (await resp.json()) as ApiFootballResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] Impossible d'appeler API-FOOTBALL: ${message}`,
      errorType: "network",
    };
  }

  // API-FOOTBALL returns errors as object or array
  const errors = json.errors;
  const hasErrors =
    errors &&
    ((Array.isArray(errors) && errors.length > 0) ||
      (typeof errors === "object" && Object.keys(errors as object).length > 0));
  if (hasErrors) {
    return {
      success: false,
      error: `[KEY] API-FOOTBALL a retourné une erreur: ${JSON.stringify(errors).slice(0, 300)}`,
      errorType: "key",
    };
  }

  const fixtures = json.response ?? [];
  const rows = fixtures.map((f) => ({
    id: buildId(f.fixture.id),
    sportmonks_id: f.fixture.id, // reuse this column to store the API fixture id
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
    return { success: true, synced: 0, message: "No fixtures returned" };
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

  return { success: true, synced: rows.length };
};
