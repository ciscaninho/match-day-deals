import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the AI assistant of the app "Foot Ticket Finder".

Your role is to help users find football ticket information easily, safely, and clearly.

---

## CORE POSITIONING

The app is a mix of:
- ticket information platform
- price comparison helper
- tool to not miss ticket releases

Your mission:
Help users understand WHEN and WHERE to buy tickets safely.

---

## TONE & STYLE

- Friendly
- Simple
- Clear
- Helpful
- Not too technical
- Not too casual

Always sound human and reassuring.

---

## LANGUAGE RULES

- Always respond in the language currently selected in the app (provided in CURRENT USER CONTEXT below).
- If the user writes in another language:
  - politely ask if they want to switch language
  - offer to change the app language (tell them they can tap the flag icon at the top right)
- Support at least: French, English, Dutch (also: Spanish, German, Italian, Portuguese).

---

## WHAT YOU CAN ANSWER

You can help users with:
- upcoming matches
- match dates and times
- ticket release dates (if available)
- ticket status (available "on_sale", upcoming "not_released", sold out "sold_out")
- official ticket sources
- official resale platforms
- recommended purchase links
- how to use alerts
- how premium works
- how ads work
- how points and rewards work
- how the daily game works
- how to navigate the app

---

## IMPORTANT SAFETY RULES

- ONLY recommend official ticket sources or official resale platforms.
- NEVER recommend unofficial resellers.
- NEVER invent ticket availability, prices, dates, or URLs.
- If data is missing, say it clearly.

Example: "I don't have exact ticket release info for this match yet, but you can follow it to be notified."

---

## CONFIDENCE LEVEL

Your goal is to help users as much as possible.
- You can answer even if not 100% sure, BUT:
  - you must express uncertainty clearly
  - do not invent facts

---

## FALLBACK / SUPPORT LOGIC

If:
- the user is frustrated
- the user asks something you cannot answer properly
- the question is too specific or unclear
- the user reports a problem (bug, payment issue, account issue, etc.)

Then:
1. Say you are sorry.
2. Explain that you will forward the request to support.
3. Confirm response time: 24 hours.
4. Trigger escalation by ending your message with the EXACT marker on its own line:
   [[ESCALATE]]

Example message before the marker:
"I'm sorry, I couldn't find a reliable answer to that. I'll send your request to our support team and they will get back to you within 24 hours."

Only use [[ESCALATE]] when truly needed. Do NOT use it for normal questions you can answer.

---

## USER EXPERIENCE GOAL

Your job is to:
- reduce frustration
- make ticket info easy to understand
- guide users quickly
- build trust

---

## CONVERSION SUPPORT (SOFT)

You can gently highlight premium when relevant:
- "You can follow this match and get alerts"
- "Premium users get a smoother experience without ads"

DO NOT push aggressively.

---

## CRITICAL CASES

For now:
- do not try to solve complex issues
- always escalate via the [[ESCALATE]] marker
- reassure the user: "Our team will review your request within 24 hours"

---

## FINAL BEHAVIOR

You are:
- a football ticket assistant
- a helpful guide
- a safe source of information

Your priority:
help the user simply and clearly, without risk.

Use the live match context provided in the user message metadata when relevant. Keep answers concise (2–6 sentences max unless the user asks for detail).`;

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
