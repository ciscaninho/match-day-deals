import { supabase } from "@/integrations/supabase/client";

export interface SportmonksSyncResult {
  success: boolean;
  synced?: number;
  pages?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "function" | "table" | "network" | "preview" | "unknown";
  status?: number;
}

const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";
const MAX_PAGES = 5;

interface SportmonksParticipant {
  id: number;
  name: string;
  short_code: string | null;
  image_path: string | null;
  meta?: { location?: "home" | "away" };
}

interface SportmonksLeague {
  id: number;
  name: string;
  country?: { name: string } | null;
}

interface SportmonksVenue {
  id: number;
  name: string | null;
  city_name: string | null;
}

interface SportmonksFixture {
  id: number;
  name: string;
  starting_at: string;
  league?: SportmonksLeague | null;
  venue?: SportmonksVenue | null;
  participants?: SportmonksParticipant[];
}

const shortCode = (p: SportmonksParticipant | undefined, fallback: string) => {
  if (!p) return fallback.slice(0, 3).toUpperCase();
  if (p.short_code && p.short_code.trim()) return p.short_code.toUpperCase();
  return p.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
};

const buildId = (sportmonksId: number) => `sm_${sportmonksId}`;
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Browser-only Sportmonks → Supabase sync.
 * - Reads VITE_SPORTMONKS_API_TOKEN from the frontend env (Vercel).
 * - Calls Sportmonks directly from the browser.
 * - Upserts results into the `matches` table via the Supabase JS client.
 *
 * Requires the user to be authenticated as an admin (RLS allows admin insert/update).
 */
export const syncSportmonksFixtures = async (): Promise<SportmonksSyncResult> => {
  const token = (import.meta.env.VITE_SPORTMONKS_API_TOKEN as string | undefined)?.trim();
  if (!token) {
    return {
      success: false,
      error: "[KEY] VITE_SPORTMONKS_API_TOKEN manquant. Ajoute-le dans Vercel puis redéploie.",
      errorType: "key",
    };
  }

  // Auth check — admin RLS requires a logged-in admin user
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return {
      success: false,
      error: "[KEY] Tu dois être connecté en tant qu'admin pour écrire dans la base.",
      errorType: "key",
    };
  }

  // Date window: today → +60 days
  const today = new Date();
  const end = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  const baseUrl = new URL(`${SPORTMONKS_BASE}/fixtures/between/${fmt(today)}/${fmt(end)}`);
  baseUrl.searchParams.set("include", "participants;league.country;venue");
  baseUrl.searchParams.set("per_page", "100");
  baseUrl.searchParams.set("api_token", token);

  const allFixtures: SportmonksFixture[] = [];
  let nextUrl: string | null = baseUrl.toString();
  let page = 0;

  try {
    while (nextUrl && page < MAX_PAGES) {
      const resp = await fetch(nextUrl, { headers: { Accept: "application/json" } });
      if (!resp.ok) {
        const txt = await resp.text();
        const errorType: SportmonksSyncResult["errorType"] =
          resp.status === 401 || resp.status === 403 ? "key" : "network";
        return {
          success: false,
          error: `[SPORTMONKS ${resp.status}] ${txt.slice(0, 300)}`,
          errorType,
          status: resp.status,
        };
      }
      const json: {
        data?: SportmonksFixture[];
        pagination?: { has_more?: boolean; next_page?: string };
      } = await resp.json();
      allFixtures.push(...(json.data ?? []));
      // Sportmonks next_page already includes api_token, leave as-is
      nextUrl = json.pagination?.has_more ? json.pagination.next_page ?? null : null;
      page += 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] Impossible d'appeler Sportmonks: ${message}`,
      errorType: "network",
    };
  }

  const rows = allFixtures
    .map((f) => {
      const home = f.participants?.find((p) => p.meta?.location === "home") ?? f.participants?.[0];
      const away = f.participants?.find((p) => p.meta?.location === "away") ?? f.participants?.[1];
      if (!home || !away) return null;
      return {
        id: buildId(f.id),
        sportmonks_id: f.id,
        home_team: home.name,
        away_team: away.name,
        home_short: shortCode(home, home.name),
        away_short: shortCode(away, away.name),
        home_logo: home.image_path,
        away_logo: away.image_path,
        competition: f.league?.name ?? "Unknown",
        country: f.league?.country?.name ?? "",
        date: f.starting_at,
        stadium: f.venue?.name ?? "",
        city: f.venue?.city_name ?? "",
        ticket_status: "not_released",
        ticket_release_date: null,
        ticket_sources: [],
        featured: false,
        priority: false,
        starting_price: null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return { success: true, synced: 0, pages: page, message: "No fixtures returned" };
  }

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "sportmonks_id" });

  if (error) {
    const lower = error.message.toLowerCase();
    let errorType: SportmonksSyncResult["errorType"] = "table";
    if (lower.includes("row-level security") || lower.includes("permission") || lower.includes("policy")) {
      errorType = "key";
    }
    return {
      success: false,
      error: `[${errorType.toUpperCase()}] ${error.message}`,
      errorType,
    };
  }

  return { success: true, synced: rows.length, pages: page };
};
