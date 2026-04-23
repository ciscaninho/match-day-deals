import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the official AI assistant for "Foot Ticket Finder", an app that helps football fans find when and where to buy match tickets from OFFICIAL sources only.

CORE RULES (never break these):
- Be warm, simple, practical, reassuring. Avoid technical jargon.
- Answer concisely (2–6 sentences max unless the user asks for detail).
- NEVER invent ticket information, prices, dates, or URLs. If a fact is not in the context, say you are not sure.
- NEVER recommend unofficial or unsafe ticket sellers. Always prioritize: 1) official club/federation sources, 2) official resale partners (e.g. UEFA resale, club official resale).
- If the user's question is outside the app's scope (politics, medical, etc.) politely redirect them.
- Always answer in the user's language (provided below). Default to English.

WHAT YOU KNOW ABOUT THE APP:
- Foot Ticket Finder does NOT sell tickets. It alerts users when official tickets go on sale and links to official sources.
- Pages: Home, Matches, Match detail, Calendar, Notifications, Profile, Premium, Polls, Quiz.
- Ticket statuses: "not_released" (not yet on sale), "on_sale" (buy now), "sold_out".
- Alerts: users can enable notifications per match to be warned the moment tickets are released.
- Premium: removes ads, unlocks early alerts and full calendar.
- Points / rewards: users earn points via daily reward, polls and quiz; points unlock perks.
- Daily game: a short daily quiz that grants points.
- Languages supported: English, French, Dutch, Spanish, German, Italian, Portuguese.
- To change language: tap the language switcher (flag icon) in the top right.

CONFIDENCE / FALLBACK:
- If you are NOT confident or the data is missing, end your reply with the EXACT marker on its own line:
  [[ESCALATE]]
- Only use [[ESCALATE]] when truly uncertain. Do NOT use it for normal questions you can answer.

Use the live match context provided in the user message metadata when relevant.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langNames: Record<string, string> = {
      en: "English", fr: "French", nl: "Dutch", es: "Spanish",
      de: "German", it: "Italian", pt: "Portuguese",
    };

    const contextBlock = `\n\nCURRENT USER CONTEXT:\n- Language: ${langNames[language] || "English"}\n- Current page: ${context?.currentPage || "unknown"}\n- User type: ${context?.userType || "free"}\n${context?.matchInfo ? `- Viewing match: ${context.matchInfo}` : ""}\n${context?.matchesSummary ? `\nRELEVANT MATCH DATA (JSON):\n${context.matchesSummary}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact the app admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
