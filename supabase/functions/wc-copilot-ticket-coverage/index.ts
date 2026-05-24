import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Hosts
    const { data: hosts, error: hostsErr } = await supabase
      .from("stadiums")
      .select("slug,stadium_name,city,country")
      .is("archived_at", null)
      .eq("is_world_cup_host", true);
    if (hostsErr) throw hostsErr;

    const { data: existing } = await supabase
      .from("wc_ticket_coverage")
      .select("stadium_slug");
    const haveSet = new Set((existing ?? []).map((r: any) => r.stadium_slug));

    const missing = (hosts ?? []).filter((h: any) => !haveSet.has(h.slug));

    const rows = missing.map((h: any) => ({
      stadium_slug: h.slug,
      stadium_name: h.stadium_name,
      city: h.city,
      country: h.country,
      kind: "affiliate" as const,
      provider: "Ticombo",
      url: `https://www.ticombo.com/en/search?query=${encodeURIComponent(`${h.stadium_name} World Cup 2026`)}`,
      currency: "EUR",
      status: "active",
      label: `World Cup 2026 tickets at ${h.stadium_name}`,
      notes: "Auto-suggested by Copilot. Verify and confirm.",
    }));

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("wc_ticket_coverage").insert(rows);
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ created: rows.length, missing_before: missing.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
