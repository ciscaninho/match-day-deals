// Admin Actions Execute — validates admin, executes a proposed action, captures undo payload
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function executeKind(kind: string, payload: any, supabase: any): Promise<{ undo: any }> {
  switch (kind) {
    case "stadium_update": {
      const { slug, fields } = payload;
      if (!slug || typeof fields !== "object") throw new Error("invalid_payload");
      const { data: before, error: beforeErr } = await supabase
        .from("stadiums").select("*").eq("slug", slug).maybeSingle();
      if (beforeErr) throw beforeErr;
      if (!before) throw new Error("stadium_not_found");
      const { error } = await supabase.from("stadiums").update(fields).eq("slug", slug).select();
      if (error) throw error;
      const undoFields: any = {};
      for (const k of Object.keys(fields)) undoFields[k] = before[k] ?? null;
      return { undo: { kind: "stadium_update", payload: { slug, fields: undoFields } } };
    }
    case "attach_club_to_stadium": {
      const { club_slug, stadium_slug } = payload;
      const { data: before } = await supabase
        .from("club_ticketing_profiles").select("stadium_slug").eq("slug", club_slug).maybeSingle();
      const { error } = await supabase
        .from("club_ticketing_profiles").update({ stadium_slug }).eq("slug", club_slug).select();
      if (error) throw error;
      return { undo: { kind: "attach_club_to_stadium", payload: { club_slug, stadium_slug: before?.stadium_slug ?? null } } };
    }
    case "detach_club_from_stadium": {
      const { club_slug } = payload;
      const { data: before } = await supabase
        .from("club_ticketing_profiles").select("stadium_slug").eq("slug", club_slug).maybeSingle();
      const { error } = await supabase
        .from("club_ticketing_profiles").update({ stadium_slug: null }).eq("slug", club_slug).select();
      if (error) throw error;
      return { undo: { kind: "attach_club_to_stadium", payload: { club_slug, stadium_slug: before?.stadium_slug ?? null } } };
    }
  }
  throw new Error("unknown_action_kind:" + kind);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action_id, mode } = await req.json();
    if (!action_id) throw new Error("missing_action_id");

    const { data: action, error: aErr } = await supabase.from("admin_actions").select("*").eq("id", action_id).maybeSingle();
    if (aErr || !action) throw new Error("action_not_found");

    if (mode === "reject") {
      await supabase.from("admin_actions").update({ status: "rejected" }).eq("id", action_id);
      return new Response(JSON.stringify({ ok: true, status: "rejected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (mode === "rollback") {
      if (action.status !== "executed" || !action.undo_payload) throw new Error("not_rollbackable");
      const undo = action.undo_payload;
      await executeKind(undo.kind, undo.payload, supabase);
      await supabase.from("admin_actions").update({ status: "rolled_back" }).eq("id", action_id);
      return new Response(JSON.stringify({ ok: true, status: "rolled_back" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // default: execute
    if (action.status !== "proposed") throw new Error("not_proposed");
    try {
      const { undo } = await executeKind(action.kind, action.payload, supabase);
      await supabase.from("admin_actions").update({
        status: "executed",
        undo_payload: undo,
        executed_at: new Date().toISOString(),
        executed_by: userData.user.id,
      }).eq("id", action_id);
      return new Response(JSON.stringify({ ok: true, status: "executed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.from("admin_actions").update({ status: "failed", error: msg }).eq("id", action_id);
      throw err;
    }
  } catch (e) {
    console.error("admin-actions-execute error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
