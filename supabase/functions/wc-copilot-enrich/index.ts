// Copilot enrichment for World Cup host stadiums.
// Generates editorial proposals (host city context, fan zones, transport,
// hospitality, ticket guidance, etc.) for review/approval in admin.
// POST { stadium_id, fields?: string[] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const FIELDS = [
  "host_city_context",
  "architecture_notes",
  "seat_recommendations",
  "fan_zones",
  "transport_notes",
  "hospitality_notes",
  "ticket_guidance",
  "matchday_advice",
  "travel_notes",
  "historical_facts",
] as const;

type Field = typeof FIELDS[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "missing_auth" }, 401);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: userData } = await sb.auth.getUser(token);
    if (!userData?.user) return json({ error: "invalid_auth" }, 401);
    const userId = userData.user.id;

    const { data: roleRow } = await sb
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const stadiumId: string | undefined = body.stadium_id;
    const requested: string[] | undefined = Array.isArray(body.fields) ? body.fields : undefined;
    if (!stadiumId) return json({ error: "missing_stadium_id" }, 400);

    const { data: stadium, error: sErr } = await sb
      .from("stadiums")
      .select("id, stadium_name, city, country, league, capacity, opened_year, " + FIELDS.join(", "))
      .eq("id", stadiumId).maybeSingle();
    if (sErr || !stadium) return json({ error: "stadium_not_found" }, 404);

    const targetFields: Field[] = (requested?.length
      ? requested.filter((f): f is Field => (FIELDS as readonly string[]).includes(f))
      : FIELDS.filter((f) => !((stadium as any)[f]?.toString().trim()))) as Field[];

    if (targetFields.length === 0) return json({ proposals: [], message: "nothing_to_propose" }, 200);

    const prompt = `You are an editorial assistant enriching a World Cup host stadium profile.
Stadium: ${stadium.stadium_name}
City: ${stadium.city ?? "?"}, Country: ${stadium.country ?? "?"}
League: ${stadium.league ?? "?"} · Capacity: ${stadium.capacity ?? "?"} · Opened: ${stadium.opened_year ?? "?"}

For each requested field, write 2-4 concise, factual, traveler-oriented sentences in English.
Avoid hype. Do not invent statistics. If unsure, write what is generally known and flag uncertainty.

Requested fields: ${targetFields.join(", ")}

Return strictly JSON: { "proposals": [ { "field": "<field_name>", "value": "<text>", "rationale": "<one line>" } ] }`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You produce concise editorial copy for travel/sport guides. Output strict JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return json({ error: "ai_failed", status: aiRes.status, detail: txt.slice(0, 500) }, 502);
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { proposals?: Array<{ field: string; value: string; rationale?: string }> } = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const proposals = (parsed.proposals ?? []).filter(
      (p) => p?.field && p?.value && (FIELDS as readonly string[]).includes(p.field),
    );

    if (proposals.length === 0) return json({ proposals: [], message: "no_proposals_returned" }, 200);

    const rows = proposals.map((p) => ({
      stadium_id: stadiumId,
      field: p.field,
      proposed_value: String(p.value).trim().slice(0, 4000),
      rationale: p.rationale ? String(p.rationale).slice(0, 500) : null,
      source: "copilot:gemini-2.5-flash",
      status: "pending",
      created_by: userId,
    }));

    const { data: inserted, error: insErr } = await sb
      .from("stadium_enrichment_proposals").insert(rows).select("*");
    if (insErr) throw insErr;

    return json({ proposals: inserted }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
