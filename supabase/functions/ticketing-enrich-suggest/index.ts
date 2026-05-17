// AI-assisted ticketing enrichment.
// Given a club, asks Lovable AI to propose: official ticketing URL, hospitality URL,
// membership info, resale provider, source confidence, and a short rationale.
// Returns suggestions only — the admin approves/edits/rejects in the UI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a football ticketing operations analyst. For a given club, propose the most likely OFFICIAL ticketing infrastructure based on widely-known public knowledge of major football clubs.

Return STRICT JSON matching the schema. Rules:
- Only suggest URLs you have high prior confidence are the club's real official domains (e.g. arsenal.com/tickets, fcbayern.com/tickets, billetterie.psg.fr, juventus.com/en/tickets).
- Never invent obscure domains. If unsure, set the field to null and lower confidence.
- "official_ticketing_url": the club's own official ticket sales page.
- "hospitality_url": club official VIP/hospitality page (often hospitality.<domain> or <domain>/hospitality).
- "membership_required": true if buying league tickets typically requires a paid membership (Barcelona socio, Bayern Mitglied, PSG carte, etc.).
- "membership_name": name of the membership scheme if applicable.
- "resale_exchange_name" + "resale_exchange_url": official resale platform run/endorsed by the club (e.g. Twickets, Seatlab, club own exchange).
- "confidence": integer 0-100. Use 90+ only for top global clubs you are extremely confident about. Use 50-70 for mid-tier. <40 means "guess".
- "source_confidence": "high" | "medium" | "low".
- "rationale": one short sentence explaining your reasoning.
- "geo_restrictions": array of country codes if tickets are geo-blocked (e.g. ["DE"] for some Bundesliga clubs). Empty array if none known.

Respond ONLY with a valid JSON object. No prose, no markdown fences.`;

type Suggestion = {
  official_ticketing_url: string | null;
  hospitality_url: string | null;
  membership_required: boolean;
  membership_name: string | null;
  membership_required_for_big_games: boolean;
  resale_exchange_available: boolean;
  resale_exchange_name: string | null;
  resale_exchange_url: string | null;
  geo_restrictions: string[];
  confidence: number;
  source_confidence: "high" | "medium" | "low";
  rationale: string;
};

async function suggestForClub(club: any, apiKey: string): Promise<Suggestion | { error: string }> {
  const userPrompt = `Club: ${club.club_name}
Country: ${club.country ?? "?"}
City: ${club.city ?? "?"}
League: ${club.league ?? "?"}
Known aliases: ${(club.aliases ?? []).join(", ") || "—"}
Current official URL on file: ${club.official_ticketing_url ?? "(none)"}
Official website: ${club.official_website ?? "(none)"}

Propose the ticketing enrichment JSON now.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("AI gateway error", resp.status, txt);
    if (resp.status === 429) return { error: "rate_limited" };
    if (resp.status === 402) return { error: "payment_required" };
    return { error: "ai_error" };
  }
  const json = await resp.json();
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      official_ticketing_url: parsed.official_ticketing_url ?? null,
      hospitality_url: parsed.hospitality_url ?? null,
      membership_required: !!parsed.membership_required,
      membership_name: parsed.membership_name ?? null,
      membership_required_for_big_games: !!parsed.membership_required_for_big_games,
      resale_exchange_available: !!(parsed.resale_exchange_url || parsed.resale_exchange_name),
      resale_exchange_name: parsed.resale_exchange_name ?? null,
      resale_exchange_url: parsed.resale_exchange_url ?? null,
      geo_restrictions: Array.isArray(parsed.geo_restrictions) ? parsed.geo_restrictions : [],
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(100, parsed.confidence)) : 50,
      source_confidence: ["high", "medium", "low"].includes(parsed.source_confidence) ? parsed.source_confidence : "medium",
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
    };
  } catch (e) {
    console.error("parse error", e, raw);
    return { error: "parse_error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const slugs: string[] = Array.isArray(body.club_slugs)
      ? body.club_slugs.slice(0, 8)
      : body.club_slug ? [body.club_slug] : [];
    if (slugs.length === 0) {
      return new Response(JSON.stringify({ error: "no_slug" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: clubs, error: cErr } = await supabase
      .from("club_ticketing_profiles")
      .select("slug,club_name,country,city,league,aliases,official_ticketing_url,official_website")
      .in("slug", slugs);
    if (cErr) throw cErr;
    if (!clubs || clubs.length === 0) {
      return new Response(JSON.stringify({ error: "club_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const results: Array<{ slug: string; club_name: string; suggestion: Suggestion | { error: string } }> = [];
    // Sequential to stay polite on rate limits
    for (const club of clubs) {
      const s = await suggestForClub(club, apiKey);
      results.push({ slug: club.slug, club_name: club.club_name, suggestion: s });
      // Abort early on hard errors
      if ("error" in s && (s.error === "rate_limited" || s.error === "payment_required")) {
        return new Response(JSON.stringify({ error: s.error, partial: results }), {
          status: s.error === "rate_limited" ? 429 : 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ticketing-enrich-suggest error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
