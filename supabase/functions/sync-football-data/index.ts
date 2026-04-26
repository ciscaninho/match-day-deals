import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE_URL = "https://api.football-data.org/v4/matches";
// Top 5 européens + Champions League
// FL1=Ligue 1, PL=Premier League, PD=La Liga, SA=Serie A, BL1=Bundesliga, CL=Champions League
const COMPETITIONS = ["FL1", "PL", "PD", "SA", "BL1", "CL"] as const;
// Plan gratuit Football-Data: max 10 jours par requête → on découpe en fenêtres
const WINDOW_DAYS = 10;
const WINDOWS_COUNT = 4; // 4 × 10 = 40 jours couverts
const DAYS_AHEAD = WINDOW_DAYS * WINDOWS_COUNT;

interface FdTeam {
  id: number;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}
interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  area: { id: number; name: string; code: string; flag: string | null };
  competition: { id: number; name: string; code: string; emblem: string | null };
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

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FOOTBALL_DATA_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FOOTBALL_DATA_KEY manquant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const headers = { "X-Auth-Token": apiKey, Accept: "application/json" };
    const dateFrom = formatDate(new Date());
    const dateTo = formatDate(new Date(Date.now() + DAYS_AHEAD * 86400000));

    const matchMap = new Map<number, FdMatch>();
    const errors: string[] = [];

    // Free plan: ~10 req/min → on espace les requêtes
    for (const code of COMPETITIONS) {
      const url = `${API_BASE_URL}?competitions=${code}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
      try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
          const txt = await resp.text();
          errors.push(`[${code} ${resp.status}] ${txt.slice(0, 150)}`);
          continue;
        }
        const payload = (await resp.json()) as FdResponse;
        if (payload.errorCode) {
          errors.push(`[${code}] ${payload.message ?? "error"}`);
          continue;
        }
        (payload.matches ?? []).forEach((m) => matchMap.set(m.id, m));
      } catch (err) {
        errors.push(`[${code}] ${err instanceof Error ? err.message : String(err)}`);
      }
      // Petit délai entre les requêtes pour respecter le rate limit
      await new Promise((r) => setTimeout(r, 6500));
    }

    const matches = Array.from(matchMap.values());
    const rows = matches.map((m) => ({
      id: `fd_${m.id}`,
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
      return new Response(
        JSON.stringify({
          success: true,
          synced: 0,
          message: "Aucun match retourné",
          errors,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "sportmonks_id" });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message, errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: rows.length,
        competitions: COMPETITIONS,
        days_ahead: DAYS_AHEAD,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
