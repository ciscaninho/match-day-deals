import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPPORT_EMAIL = "support@footticketfinder.com";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  /** honeypot — must be empty */
  website?: unknown;
}

const isStr = (v: unknown, min: number, max: number): v is string =>
  typeof v === "string" && v.trim().length >= min && v.trim().length <= max;

const isEmail = (v: unknown): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.length <= 254;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: ContactPayload;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Honeypot — silently accept to avoid signaling bots.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isStr(body.name, 1, 120) || !isEmail(body.email) ||
      !isStr(body.subject, 2, 200) || !isStr(body.message, 5, 5000)) {
    return new Response(JSON.stringify({ error: "invalid_input" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const name = (body.name as string).trim();
  const email = (body.email as string).trim();
  const subject = (body.subject as string).trim();
  const message = (body.message as string).trim();

  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

  // Best-effort: try Resend via Lovable connector gateway if configured.
  if (RESEND_KEY && LOVABLE_KEY) {
    try {
      const html = `
        <h2>New contact message — Foot Ticket Finder</h2>
        <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr/>
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
      `;
      const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_KEY}`,
          "X-Connection-Api-Key": RESEND_KEY,
        },
        body: JSON.stringify({
          from: "Foot Ticket Finder <onboarding@resend.dev>",
          to: [SUPPORT_EMAIL],
          reply_to: email,
          subject: `[Contact] ${subject}`,
          html,
        }),
      });
      if (r.ok) {
        return new Response(JSON.stringify({ ok: true, channel: "email" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("resend_failed", e);
    }
  }

  // Fallback: log so the message is at least visible in function logs.
  console.log("[contact-form-fallback]", { name, email, subject, message });
  return new Response(JSON.stringify({ ok: true, channel: "logged" }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}
