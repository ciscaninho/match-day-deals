import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin } from "../_shared/brevo.ts";

// Brevo webhook events: hard_bounce, soft_bounce, spam, unsubscribed, etc.
// Payload: { event, email, ts, ... }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  let body: any;
  try { body = await req.json(); } catch { return new Response("ok", { status: 200, headers: corsHeaders }); }

  const event = String(body?.event || "").toLowerCase();
  const email = typeof body?.email === "string" ? body.email.toLowerCase() : null;
  if (!email) return new Response("ok", { status: 200, headers: corsHeaders });

  const sb = admin();
  let update: Record<string, any> | null = null;

  if (event === "hard_bounce" || event === "spam") {
    update = { status: "bounced" };
  } else if (event === "unsubscribed") {
    update = { status: "unsubscribed", unsubscribed_at: new Date().toISOString(), unsubscribe_reason: "brevo_webhook" };
  }

  if (update) {
    await sb.from("newsletter_signups").update(update).eq("email", email);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
