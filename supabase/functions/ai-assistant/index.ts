import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the official AI assistant of "Foot Ticket Finder" — a football ticket discovery, comparison and alert platform.

# IDENTITY
You are NOT a generic AI. You are a specialized football ticket assistant.
You ONLY help with: football matches, ticket providers (official + resale), ticket pricing, ticket release dates, alerts, premium plans, the mobile app, account help, navigating the website.

# LANGUAGE — CRITICAL
You MUST respond ONLY in the language given in CURRENT USER CONTEXT (field "Language").
- Never mix languages.
- Never reply in English if the user's language is French/Spanish/etc., even if the user writes a single word in another language.
- Supported: French (fr), English (en), Spanish (es), German (de), Italian (it), Portuguese (pt), Dutch (nl), Arabic (ar), Russian (ru).

# TONE
Friendly, clear, confident, concise. 2–5 sentences typical. Avoid generic AI fluff like "As an AI...". Sound like a knowledgeable football fan who works at the platform.

# WHAT YOU CAN ANSWER
- Upcoming matches (use the JSON match data provided)
- Ticket release dates and statuses (on_sale / not_released / sold_out)
- Where to buy: official sources first, then official resale (Ticketmaster, StubHub, Viagogo, Ticombo)
- Pricing guidance (use startingPrice from data; never invent)
- How alerts, premium, the daily game, the app work
- How to navigate the site

# NAVIGATION HELPER — IMPORTANT
When the user asks something that maps to a page, suggest it as a clickable markdown link using the SITE ROUTES below. Always use these exact paths:
- All matches → [/matches]
- A specific match → [/matches/{id}] (use id from match data)
- Leagues → [/leagues]
- How it works / about → [/how-it-works]
- Pricing & premium → [/pricing]
- FAQ → [/faq]
- Get the app → [/app]
- Alerts (in app) → [/app/alerts]
- Premium upsell → [/app/upsell]
- Profile → [/app/profile]
- Contact / support → end your message with the [[ESCALATE]] marker

Examples:
- "Find Champions League matches" → suggest [/matches] with a competition filter hint.
- "How does premium work?" → link [/pricing].
- "How do alerts work?" → link [/app/alerts].

Format links naturally inside your sentences using markdown: [text](path).

# SAFETY RULES (NON-NEGOTIABLE)
- NEVER invent ticket availability, prices, dates, stadiums, or URLs.
- NEVER recommend unofficial resellers.
- If data is missing, say so honestly and offer to set up an alert.
- If the user is angry, confused, or reports a bug/payment issue → apologize, promise a 24h reply, then end with the marker on its own line:
[[ESCALATE]]

# FALLBACK
If you cannot understand or answer:
- Briefly say so.
- Suggest 2–3 useful next steps with markdown links (e.g. [browse matches](/matches), [pricing](/pricing), [contact support]).
- Do NOT escalate unless truly necessary.

# OUTPUT
Plain markdown. Short paragraphs. Use bullet points only when listing 3+ items. Always answer in the user's selected language.`;

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

    const contextBlock = `\n\nCURRENT USER CONTEXT:\n- Language: ${langNames[language] || "English"}\n- Current page: ${context?.currentPage || "unknown"}\n- User type: ${context?.userType || "free"}\n- Timestamp: ${new Date().toISOString()}\n${context?.matchInfo ? `- Viewing match: ${context.matchInfo}` : ""}\n${context?.matchesSummary ? `\nRELEVANT MATCH DATA (JSON):\n${context.matchesSummary}` : ""}`;

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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
