// Admin-only. Deletes World Cup 2026 rows that are NOT canonical official
// imports. Use after wc-import-official has populated the 104-row source of
// truth to remove synthetic / generated fixtures (e.g. wc2026-demo-*).
// Coverage rows that reference deleted matches are nulled-out, not deleted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "missing_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: role } = await userClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body?.dry_run !== false;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: targets, error: selErr } = await admin.from("matches")
      .select("id, slug, home_team, away_team, stadium, date, fixture_origin")
      .eq("competition", "FIFA World Cup 2026")
      .neq("fixture_origin", "official_import");
    if (selErr) throw selErr;

    const ids = (targets ?? []).map((t: any) => t.id);

    if (dryRun) {
      return new Response(JSON.stringify({ ok: true, dry_run: true, would_delete: ids.length, sample: (targets ?? []).slice(0, 10) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let coverageNulled = 0;
    if (ids.length > 0) {
      // Detach coverage rows so the FK reference is clean.
      const { count } = await admin.from("wc_ticket_coverage" as never)
        .update({ match_id: null }).in("match_id", ids).select("id", { count: "exact", head: true } as never);
      coverageNulled = count ?? 0;
      const { error: delErr } = await admin.from("matches").delete().in("id", ids);
      if (delErr) throw delErr;
    }

    return new Response(JSON.stringify({ ok: true, dry_run: false, deleted: ids.length, coverage_detached: coverageNulled }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
