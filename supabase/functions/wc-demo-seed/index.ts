// wc-demo-seed — admin-only seed for Turn 1 demo data.
// Idempotent. POST {action:"seed"|"reset"} → creates or removes:
//   - 1 draft fixture (group A, home=A2 placeholder)
//   - 1 unmatched provider row (wc_ticket_coverage with match_id NULL)
//   - 1 linked provider row (wc_ticket_coverage with match_id set, provider_event_id set)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_FIXTURE_ID = "wc2026-demo-A-md1";
const DEMO_UNMATCHED_SLUG = "demo-unmatched-event";
const DEMO_LINKED_SLUG = "demo-linked-event";
const DEMO_PROVIDER = "Demo Provider";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "not_admin" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action } = await req.json().catch(() => ({ action: "seed" }));
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (action === "reset") {
      await admin.from("wc_ticket_coverage" as never).delete().in("event_slug", [DEMO_UNMATCHED_SLUG, DEMO_LINKED_SLUG]);
      await admin.from("matches").delete().eq("id", DEMO_FIXTURE_ID);
      return new Response(JSON.stringify({ ok: true, action: "reset" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // SEED
    const summary: Record<string, unknown> = {};

    // Draft fixture — NOT in any real group (group_code null) to avoid duplicating round-robin
    const fixture = {
      id: DEMO_FIXTURE_ID,
      slug: DEMO_FIXTURE_ID,
      competition: "FIFA World Cup 2026",
      home_team: "Demo Home",
      away_team: "Demo Away",
      home_short: "DEM",
      away_short: "DMO",
      home_team_status: "projected",
      away_team_status: "projected",
      fixture_confidence: "projected",
      country: "Mexico",
      city: "Mexico City",
      stadium: "Estadio Azteca",
      date: "2026-06-15T19:00:00Z",
      ticket_status: "not_released",
      ticket_sources: [],
      publication_status: "draft",
      group_code: null,
      phase: "demo",
      matchday: null,
    };
    const { error: fxErr } = await admin.from("matches").upsert(fixture as never, { onConflict: "id" });
    summary.draft_fixture = fxErr ? `error:${fxErr.message}` : "ok";

    // 2) Unmatched coverage row (no match_id, no provider_event_id)
    const unmatched = {
      active: true,
      stadium_slug: "azteca",
      stadium_name: "Estadio Azteca",
      city: "Mexico City",
      country: "Mexico",
      kind: "resale",
      provider: DEMO_PROVIDER,
      url: "https://example.com/demo/unmatched",
      ticket_url: "https://example.com/demo/unmatched",
      currency: "EUR",
      status: "active",
      priority: 100,
      url_type: "event",
      event_slug: DEMO_UNMATCHED_SLUG,
      event_name: "Demo Unmatched Event",
      event_date: "2026-06-20",
      event_time: "20:00",
      event_status: "group_stage",
      home_label: "Team X",
      away_label: "Team Y",
      starting_price: 189,
      price_source: "demo",
      price_confidence: "high",
      match_id: null,
      provider_event_id: null,
      is_available: true,
      last_sync_at: new Date().toISOString(),
      last_sync_status: "demo_seed",
    };
    const { error: uErr } = await admin.from("wc_ticket_coverage" as never)
      .upsert(unmatched as never, { onConflict: "event_slug,provider" });
    summary.unmatched_row = uErr ? `error:${uErr.message}` : "ok";

    // 3) Linked coverage row (match_id + provider_event_id set → immutable)
    const linked = {
      ...unmatched,
      event_slug: DEMO_LINKED_SLUG,
      event_name: "Demo Linked Event",
      home_label: "A2",
      provider_event_id: "demo-pe-00000000-0000-0000-0000-000000000001",
      match_id: DEMO_FIXTURE_ID,
      url: "https://example.com/demo/linked",
      ticket_url: "https://example.com/demo/linked",
      starting_price: 249,
      image_url: null,
    };
    const { error: lErr } = await admin.from("wc_ticket_coverage" as never)
      .upsert(linked as never, { onConflict: "event_slug,provider" });
    summary.linked_row = lErr ? `error:${lErr.message}` : "ok";

    return new Response(JSON.stringify({ ok: true, action: "seed", summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
