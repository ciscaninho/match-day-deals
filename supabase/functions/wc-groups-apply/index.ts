// wc-groups-apply — apply a group-slot change to the matches table.
// Admin-only. Propagates `${groupCode}${slotPosition}` placeholders into real team names.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplyBody {
  group_code: string;
  slot_position: number;
  team_name: string | null;
  team_short?: string | null;
  preview?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Verify admin via anon client + caller JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "not_admin" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as ApplyBody;
    const groupCode = (body.group_code ?? "").toUpperCase();
    const slot = Number(body.slot_position);
    if (!/^[A-L]$/.test(groupCode) || ![1, 2, 3, 4].includes(slot)) {
      return new Response(JSON.stringify({ error: "invalid_slot" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const placeholder = `${groupCode}${slot}`;
    const teamName = (body.team_name ?? "").trim() || placeholder; // empty = revert to placeholder
    const teamShort = (body.team_short ?? teamName.slice(0, 3).toUpperCase()).trim();

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find matches in that group where home/away matches the placeholder
    // (we look at home_team, home_team_projected, away_team, away_team_projected)
    const { data: matches, error: mErr } = await admin
      .from("matches")
      .select("id, home_team, away_team, home_team_projected, away_team_projected, group_code, home_short, away_short")
      .eq("group_code", groupCode);
    if (mErr) throw mErr;

    const homeTouched: any[] = [];
    const awayTouched: any[] = [];
    for (const m of matches ?? []) {
      const ht = (m.home_team ?? "").toUpperCase();
      const htp = (m.home_team_projected ?? "").toUpperCase();
      const at = (m.away_team ?? "").toUpperCase();
      const atp = (m.away_team_projected ?? "").toUpperCase();
      if (ht === placeholder || htp === placeholder || ht === "" || ht === "TBD") homeTouched.push(m);
      if (at === placeholder || atp === placeholder || at === "" || at === "TBD") awayTouched.push(m);
    }

    // For demo purposes: only touch matches where home_team/away_team EXACTLY equals the placeholder.
    const strictHome = homeTouched.filter((m) => (m.home_team ?? "").toUpperCase() === placeholder);
    const strictAway = awayTouched.filter((m) => (m.away_team ?? "").toUpperCase() === placeholder);

    if (body.preview) {
      // Also count coverage rows linked to those matches
      const matchIds = [...new Set([...strictHome, ...strictAway].map((m) => m.id))];
      let coverageAffected = 0;
      if (matchIds.length > 0) {
        const { count } = await admin
          .from("wc_ticket_coverage" as never)
          .select("id", { count: "exact", head: true })
          .in("match_id", matchIds);
        coverageAffected = count ?? 0;
      }
      return new Response(JSON.stringify({
        ok: true,
        preview: true,
        placeholder,
        new_team: teamName,
        fixtures_to_update: matchIds.length,
        home_slots: strictHome.length,
        away_slots: strictAway.length,
        coverage_rows_affected: coverageAffected,
        public_cards_affected: coverageAffected,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let homeUpdated = 0;
    let awayUpdated = 0;
    for (const m of strictHome) {
      const { error } = await admin.from("matches").update({
        home_team: teamName, home_short: teamShort, home_team_status: "confirmed",
      }).eq("id", m.id);
      if (!error) homeUpdated++;
    }
    for (const m of strictAway) {
      const { error } = await admin.from("matches").update({
        away_team: teamName, away_short: teamShort, away_team_status: "confirmed",
      }).eq("id", m.id);
      if (!error) awayUpdated++;
    }

    // Update slot row itself
    await admin.from("wc_group_slots" as never).update({
      team_name: body.team_name?.trim() || null,
      team_short: body.team_name ? teamShort : null,
      source: "manual",
      status: body.team_name ? "confirmed" : "draft",
    }).eq("group_code", groupCode).eq("slot_position", slot);

    const matchIds = [...new Set([...strictHome, ...strictAway].map((m) => m.id))];
    let coverageAffected = 0;
    if (matchIds.length > 0) {
      const { count } = await admin
        .from("wc_ticket_coverage" as never)
        .select("id", { count: "exact", head: true })
        .in("match_id", matchIds);
      coverageAffected = count ?? 0;
    }

    return new Response(JSON.stringify({
      ok: true,
      placeholder,
      new_team: teamName,
      fixtures_updated: homeUpdated + awayUpdated,
      home_slots_updated: homeUpdated,
      away_slots_updated: awayUpdated,
      coverage_rows_affected: coverageAffected,
      public_cards_affected: coverageAffected,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
