// Admin-only proxy that streams a Google Drive image (alt=media) through the
// Lovable connector gateway. Used by the moderation UI to preview Drive files
// during dry-run review (before any upload to the stadium-media bucket).
//
// Auth: admin only. Caller must pass an Authorization Bearer JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get("file_id");
    const token =
      url.searchParams.get("token") ??
      (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

    if (!fileId) {
      return new Response(JSON.stringify({ error: "missing_file_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
      return new Response(JSON.stringify({ error: "drive_not_connected" }), {
        status: 500,
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
    const { data: roleRow } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const driveUrl = `${GATEWAY}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
    const r = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
      },
    });
    if (!r.ok) {
      const body = await r.text();
      return new Response(
        JSON.stringify({ error: `drive_fetch_failed_${r.status}`, body: body.slice(0, 300) }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const contentType = r.headers.get("Content-Type") ?? "application/octet-stream";
    return new Response(r.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
