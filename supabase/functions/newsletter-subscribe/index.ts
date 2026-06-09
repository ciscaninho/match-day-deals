import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, getOrCreateListId, upsertContact, sendEmail, confirmationEmail, SITE_URL } from "../_shared/brevo.ts";

const isEmail = (v: unknown): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.length <= 254;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Honeypot
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!isEmail(body.email)) {
    return new Response(JSON.stringify({ error: "invalid_email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (body.consent !== true) {
    return new Response(JSON.stringify({ error: "consent_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const email = (body.email as string).trim().toLowerCase();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const ua = req.headers.get("user-agent") || null;

  const payload = {
    email,
    favourite_team: typeof body.favourite_team === "string" ? body.favourite_team.trim().slice(0, 120) || null : null,
    source: typeof body.source === "string" ? body.source.slice(0, 60) : "unknown",
    utm_source: typeof body.utm_source === "string" ? body.utm_source.slice(0, 120) : null,
    utm_medium: typeof body.utm_medium === "string" ? body.utm_medium.slice(0, 120) : null,
    utm_campaign: typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 120) : null,
    utm_content: typeof body.utm_content === "string" ? body.utm_content.slice(0, 120) : null,
    page_path: typeof body.page_path === "string" ? body.page_path.slice(0, 240) : null,
    language: typeof body.language === "string" ? body.language.slice(0, 8) : null,
    user_agent: ua,
    consent_given: true,
    consent_at: new Date().toISOString(),
    consent_ip: ip,
  };

  const sb = admin();

  // Check if exists
  const { data: existing } = await sb
    .from("newsletter_signups")
    .select("id, status, confirmation_token, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  let confirmationToken: string;
  let unsubscribeToken: string;
  let alreadyConfirmed = false;

  if (existing) {
    confirmationToken = existing.confirmation_token!;
    unsubscribeToken = existing.unsubscribe_token!;
    alreadyConfirmed = existing.status === "confirmed";
    await sb.from("newsletter_signups")
      .update({
        ...payload,
        // If they unsubscribed and re-subscribe → reset to pending
        status: existing.status === "unsubscribed" ? "pending" : existing.status,
      })
      .eq("id", existing.id);
  } else {
    const ins = await sb.from("newsletter_signups").insert({ ...payload, status: "pending" })
      .select("confirmation_token, unsubscribe_token").single();
    if (ins.error) {
      console.error("[newsletter-subscribe] insert failed", ins.error);
      return new Response(JSON.stringify({ error: "db_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    confirmationToken = ins.data.confirmation_token!;
    unsubscribeToken = ins.data.unsubscribe_token!;
  }

  // Brevo sync (non-blocking on failure)
  try {
    const listId = await getOrCreateListId();
    await upsertContact({
      email,
      attributes: {
        FAVOURITE_TEAM: payload.favourite_team,
        SOURCE: payload.source,
        UTM_SOURCE: payload.utm_source,
        UTM_MEDIUM: payload.utm_medium,
        UTM_CAMPAIGN: payload.utm_campaign,
        UTM_CONTENT: payload.utm_content,
        LANGUAGE: payload.language,
        DOUBLE_OPT_IN: alreadyConfirmed,
      },
      listIds: alreadyConfirmed ? [listId] : [],
    });
    await sb.from("newsletter_signups").update({ last_synced_at: new Date().toISOString() }).eq("email", email);
  } catch (e) {
    console.error("[newsletter-subscribe] brevo sync failed", e);
  }

  // Send confirmation email if not already confirmed
  if (!alreadyConfirmed) {
    const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${confirmationToken}`;
    const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?token=${unsubscribeToken}`;
    const { html, text } = confirmationEmail({ confirmUrl, unsubscribeUrl });
    try {
      await sendEmail({
        to: [{ email }],
        subject: "Confirm your Foot Ticket Finder subscription",
        htmlContent: html,
        textContent: text,
        tags: ["newsletter", "double-opt-in"],
      });
    } catch (e) {
      console.error("[newsletter-subscribe] email send failed", e);
      return new Response(JSON.stringify({ ok: true, status: "pending", emailed: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ ok: true, status: alreadyConfirmed ? "confirmed" : "pending" }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
