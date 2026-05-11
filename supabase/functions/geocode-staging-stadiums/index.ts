// Progressive geocoder for stadiums_master_staging using Nominatim (OpenStreetMap).
// Admin-only. Processes a small batch per call to respect Nominatim's 1 req/sec policy.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StagingRow {
  id: string;
  canonical_name: string;
  city: string | null;
  country: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocodeOne(row: StagingRow): Promise<{ lat: number; lon: number } | null> {
  const parts = [row.canonical_name, row.city, row.country].filter(Boolean).join(", ");
  if (!parts) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(parts)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FootTicketFinder-StadiumGeocoder/1.0 (admin)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 25);

    const { data: rows, error } = await supabase
      .from("stadiums_master_staging")
      .select("id, canonical_name, city, country")
      .is("latitude", null)
      .not("canonical_name", "is", null)
      .limit(limit);
    if (error) throw error;

    let geocoded = 0;
    let failed = 0;
    for (const row of (rows ?? []) as StagingRow[]) {
      const coords = await geocodeOne(row);
      if (coords) {
        await supabase
          .from("stadiums_master_staging")
          .update({ latitude: coords.lat, longitude: coords.lon })
          .eq("id", row.id);
        geocoded++;
      } else {
        failed++;
      }
      await sleep(1100); // Nominatim usage policy
    }

    return new Response(
      JSON.stringify({ processed: rows?.length ?? 0, geocoded, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
