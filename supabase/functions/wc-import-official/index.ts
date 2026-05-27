// Admin-only. Imports/refreshes the 104 official FIFA World Cup 2026 fixtures
// in one call by chaining wc-import-schedule (preview, source=fifa_seed) and
// wc-import-apply (accept-all). Idempotent: rows already present by slug are
// skipped. Every imported row is flagged fixture_origin='official_import' and
// has its date/stadium/city locked by the wc_lock_official_fixture_fields trigger.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: role } = await userClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // 1) Preview via wc-import-schedule
    const previewRes = await fetch(`${SUPABASE_URL}/functions/v1/wc-import-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader, apikey: ANON },
      body: JSON.stringify({ source: "fifa_seed" }),
    });
    const preview = await previewRes.json();
    if (!previewRes.ok) return new Response(JSON.stringify({ error: "preview_failed", detail: preview }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const proposed = (preview?.proposed ?? []) as any[];
    const readySlugs = proposed.filter(p => p.status === "ready").map(p => p.row.slug);

    // 2) Apply
    const applyRes = await fetch(`${SUPABASE_URL}/functions/v1/wc-import-apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader, apikey: ANON },
      body: JSON.stringify({ batch_id: preview.batch_id, accepted_slugs: readySlugs }),
    });
    const applied = await applyRes.json();

    // 3) Report current state
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { count: officialCount } = await admin.from("matches").select("id", { count: "exact", head: true })
      .eq("competition", "FIFA World Cup 2026").eq("fixture_origin", "official_import");
    const { count: generatedCount } = await admin.from("matches").select("id", { count: "exact", head: true })
      .eq("competition", "FIFA World Cup 2026").eq("fixture_origin", "generated");

    return new Response(JSON.stringify({
      ok: true,
      preview_summary: preview?.summary ?? null,
      apply_summary: applied,
      official_in_db: officialCount ?? 0,
      generated_in_db: generatedCount ?? 0,
      target: 104,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
