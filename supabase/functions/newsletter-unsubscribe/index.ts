import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, getOrCreateListId, removeFromList, blacklistContact } from "../_shared/brevo.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let token: string | null = null;
  let reason: string | null = null;
  if (req.method === "POST") {
    try {
      const b = await req.json();
      token = typeof b?.token === "string" ? b.token : null;
      reason = typeof b?.reason === "string" ? b.reason.slice(0, 500) : null;
    } catch { /* */ }
  } else if (req.method === "GET") {
    token = new URL(req.url).searchParams.get("token");
  } else {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response(JSON.stringify({ error: "invalid_token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const sb = admin();
  const { data: row } = await sb.from("newsletter_signups")
    .select("id, email, status").eq("unsubscribe_token", token).maybeSingle();

  if (!row) {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (row.status !== "unsubscribed") {
    await sb.from("newsletter_signups").update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason,
    }).eq("id", row.id);
  }

  try {
    const listId = await getOrCreateListId();
    await removeFromList(listId, [row.email]).catch(() => {});
    await blacklistContact(row.email);
    await sb.from("newsletter_signups").update({ last_synced_at: new Date().toISOString() }).eq("id", row.id);
  } catch (e) {
    console.error("[newsletter-unsubscribe] brevo sync failed", e);
  }

  return new Response(JSON.stringify({ ok: true, email: row.email }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
