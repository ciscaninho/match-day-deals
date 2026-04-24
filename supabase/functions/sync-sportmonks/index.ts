// Sportmonks v3 → Supabase matches sync
// Fetches upcoming fixtures and upserts them into the `matches` table.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";

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
  starting_at: string; // ISO
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

Deno.serve(async (req) => {
  console.log(`sync-sportmonks: ${req.method} ${req.url}`);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SPORTMONKS_API_TOKEN = Deno.env.get("SPORTMONKS_API_TOKEN")?.trim();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("sync-sportmonks: token length =", SPORTMONKS_API_TOKEN?.length ?? 0);

    if (!SPORTMONKS_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "SPORTMONKS_API_TOKEN is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(
        JSON.stringify({ error: "Supabase env not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Compute date window: today → +60 days
    const today = new Date();
    const end = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const url = new URL(
      `${SPORTMONKS_BASE}/fixtures/between/${fmt(today)}/${fmt(end)}`,
    );
    url.searchParams.set("include", "participants;league.country;venue");
    url.searchParams.set("per_page", "100");

    const allFixtures: SportmonksFixture[] = [];
    let nextUrl: string | null = url.toString();
    let page = 0;
    const MAX_PAGES = 5; // safety limit

    while (nextUrl && page < MAX_PAGES) {
      const resp: Response = await fetch(nextUrl, {
        headers: {
          Authorization: SPORTMONKS_API_TOKEN,
          Accept: "application/json",
        },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return new Response(
          JSON.stringify({ error: `Sportmonks API ${resp.status}: ${txt}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const json: { data?: SportmonksFixture[]; pagination?: { has_more?: boolean; next_page?: string } } =
        await resp.json();
      const data: SportmonksFixture[] = json.data ?? [];
      allFixtures.push(...data);
      nextUrl = json.pagination?.has_more ? json.pagination.next_page ?? null : null;
      page += 1;
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const rows = allFixtures
      .map((f) => {
        const home = f.participants?.find((p) => p.meta?.location === "home")
          ?? f.participants?.[0];
        const away = f.participants?.find((p) => p.meta?.location === "away")
          ?? f.participants?.[1];
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
          ticket_status: "not_released" as const,
          ticket_release_date: null,
          ticket_sources: [],
          featured: false,
          priority: false,
          starting_price: null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No fixtures returned" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upsert by sportmonks_id (unique index)
    const { error } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "sportmonks_id" });

    if (error) {
      return new Response(
        JSON.stringify({ error: `Upsert failed: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: rows.length,
        pages: page,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("sync-sportmonks error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
