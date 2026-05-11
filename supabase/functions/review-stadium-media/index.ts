// Admin moderation action for stadium media review rows.
// Lets an admin approve / reject / mark-ambiguous / skip / rematch a row in
// stadium_media_history, optionally reassigning the matched stadium.
//
// POST body:
//   { history_id: uuid,
//     action: 'approve' | 'reject' | 'ambiguous' | 'skip' | 'rematch',
//     stadium_id?: uuid   // required for action='rematch'
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VALID_ACTIONS = new Set([
  "approve",
  "reject",
  "ambiguous",
  "skip",
  "rematch",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const { data: roleRow } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const historyId: string | undefined = body.history_id;
    const action: string | undefined = body.action;
    const stadiumId: string | undefined = body.stadium_id;

    if (!historyId || !action || !VALID_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "rematch" && !stadiumId) {
      return new Response(
        JSON.stringify({ error: "rematch_requires_stadium_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const update: Record<string, unknown> = {
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };

    if (action === "approve") {
      update.review_status = "approved";
      update.action = "import";
    } else if (action === "reject") {
      update.review_status = "rejected";
      update.action = "skip";
    } else if (action === "ambiguous") {
      update.review_status = "ambiguous";
      update.action = "needs_review";
    } else if (action === "skip") {
      update.review_status = "skipped";
      update.action = "skip";
    } else if (action === "rematch" && stadiumId) {
      // Look up the new stadium and patch matched_* fields
      const { data: stadium, error: sErr } = await sb
        .from("stadiums")
        .select(
          "id, slug, stadium_name, hero_image_url, background_image_url, image_url",
        )
        .eq("id", stadiumId)
        .single();
      if (sErr || !stadium) {
        return new Response(JSON.stringify({ error: "stadium_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      update.review_status = "rematched";
      update.action = "import";
      update.manual_stadium_id = stadium.id;
      update.matched_stadium_id = stadium.id;
      update.matched_stadium_slug = stadium.slug;
      update.matched_stadium_name = stadium.stadium_name;
      update.match_confidence = "manual";
      update.match_type = "manual";
      update.previous_image_url =
        stadium.hero_image_url ??
        stadium.background_image_url ??
        stadium.image_url ??
        null;
      update.would_overwrite = !!(
        stadium.hero_image_url ||
        stadium.background_image_url ||
        stadium.image_url
      );
    }

    const { error: updErr } = await sb
      .from("stadium_media_history")
      .update(update)
      .eq("id", historyId);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
