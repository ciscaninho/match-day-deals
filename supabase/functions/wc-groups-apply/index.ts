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

    const SHORT_OVERRIDES: Record<string, string> = {
      "Mexico":"MEX","Canada":"CAN","United States":"USA","USA":"USA",
      "South Africa":"RSA","South Korea":"KOR","Korea Republic":"KOR",
      "Czech Republic":"CZE","Czechia":"CZE","Switzerland":"SUI","Qatar":"QAT",
      "Bosnia and Herzgovina":"BIH","Bosnia and Herzegovina":"BIH",
    };
    const shortFor = (name: string, fallback?: string | null) =>
      SHORT_OVERRIDES[name] ?? (fallback && fallback.length >= 2 && fallback.length <= 4 ? fallback.toUpperCase() : name.replace(/[^A-Za-z]/g, "").slice(0,3).toUpperCase());

    const body = (await req.json()) as ApplyBody;
    const groupCode = (body.group_code ?? "").toUpperCase();
    const slot = Number(body.slot_position);
    if (!/^[A-L]$/.test(groupCode) || ![1, 2, 3, 4].includes(slot)) {
      return new Response(JSON.stringify({ error: "invalid_slot" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const placeholder = `${groupCode}${slot}`;
    const isRevert = !((body.team_name ?? "").trim());
    const teamName = isRevert ? placeholder : (body.team_name as string).trim();
    const teamShort = isRevert ? placeholder : shortFor(teamName, body.team_short ?? null);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find affected fixtures in this group — placeholder OR previous team name (for re-edits)
    const { data: prevSlot } = await admin.from("wc_group_slots" as never)
      .select("team_name").eq("group_code", groupCode).eq("slot_position", slot).maybeSingle();
    const prevName = ((prevSlot as any)?.team_name ?? "").trim();

    const { data: matches, error: mErr } = await admin
      .from("matches").select("id, home_team, away_team, group_code")
      .eq("competition", "FIFA World Cup 2026").eq("group_code", groupCode);
    if (mErr) throw mErr;

    const homeTouched = (matches ?? []).filter((m) => {
      const ht = (m.home_team ?? "").trim();
      return ht === placeholder || (prevName && ht === prevName);
    });
    const awayTouched = (matches ?? []).filter((m) => {
      const at = (m.away_team ?? "").trim();
      return at === placeholder || (prevName && at === prevName);
    });

    const matchIds = [...new Set([...homeTouched, ...awayTouched].map((m) => m.id))];
    let coverageAffected = 0;
    if (matchIds.length > 0) {
      const { count } = await admin.from("wc_ticket_coverage" as never)
        .select("id", { count: "exact", head: true }).in("match_id", matchIds);
      coverageAffected = count ?? 0;
    }

    if (body.preview) {
      return new Response(JSON.stringify({
        ok: true, preview: true, placeholder, new_team: teamName,
        fixtures_to_update: matchIds.length,
        home_slots: homeTouched.length, away_slots: awayTouched.length,
        coverage_rows_affected: coverageAffected, public_cards_affected: coverageAffected,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let homeUpdated = 0, awayUpdated = 0;
    for (const m of homeTouched) {
      const { error } = await admin.from("matches").update({
        home_team: teamName, home_short: teamShort,
        home_team_status: isRevert ? "projected" : "confirmed",
      }).eq("id", m.id);
      if (!error) homeUpdated++;
    }
    for (const m of awayTouched) {
      const { error } = await admin.from("matches").update({
        away_team: teamName, away_short: teamShort,
        away_team_status: isRevert ? "projected" : "confirmed",
      }).eq("id", m.id);
      if (!error) awayUpdated++;
    }

    await admin.from("wc_group_slots" as never).update({
      team_name: isRevert ? null : teamName,
      team_short: isRevert ? null : teamShort,
      source: "manual",
      status: isRevert ? "draft" : "confirmed",
    }).eq("group_code", groupCode).eq("slot_position", slot);

    // Validation post-state: count fixtures in this group + scan for unresolved placeholders
    const { data: postMatches } = await admin.from("matches")
      .select("home_team, away_team")
      .eq("competition", "FIFA World Cup 2026").eq("group_code", groupCode);
    const groupCount = postMatches?.length ?? 0;
    const PH = /^[A-L][1-4]$/;
    const stillUnresolved = (postMatches ?? []).flatMap((m: any) => {
      const out: string[] = [];
      if (PH.test((m.home_team ?? "").trim())) out.push(m.home_team);
      if (PH.test((m.away_team ?? "").trim())) out.push(m.away_team);
      return out;
    });

    return new Response(JSON.stringify({
      ok: true,
      placeholder, new_team: teamName,
      fixtures_updated: homeUpdated + awayUpdated,
      home_slots_updated: homeUpdated, away_slots_updated: awayUpdated,
      coverage_rows_affected: coverageAffected,
      public_cards_affected: coverageAffected,
      validation: {
        group_fixture_count: groupCount,
        expected: 6,
        valid_count: groupCount === 6,
        unresolved_placeholders: stillUnresolved,
        valid: groupCount === 6 && stillUnresolved.length === 0,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
