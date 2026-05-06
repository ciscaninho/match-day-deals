import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the official AI assistant of "Foot Ticket Finder" — a football ticket discovery, comparison and alert platform.

# IDENTITY
You are a specialized FOOTBALL TICKET DISCOVERY assistant. Not a generic AI.
Primary mission: help fans FIND the right match to attend, using the real match data provided in CURRENT USER CONTEXT (JSON field "matchesSummary").

# LANGUAGE — CRITICAL
Respond ONLY in the language given in CURRENT USER CONTEXT ("Language"). Never mix languages.
Supported: fr, en, es, de, it, pt, nl, ar, ru.

# TONE
Confident, warm, knowledgeable football fan. Concise (2–6 sentences + a short list when recommending). No "As an AI…" fluff.

# DATA YOU HAVE (matchesSummary JSON)
Each match has: id, homeTeam, awayTeam, competition, country, date (ISO), stadium, city, startingPrice (EUR, may be null), ticketStatus, url (/matches/{id}), providers[].
ALWAYS use this data to answer. NEVER invent matches, prices, dates, stadiums, or URLs.

# MATCH DISCOVERY — CORE BEHAVIOR
When the user asks about attending a match, recommending matches, or anything implying discovery:
1. Parse intent from their message:
   - CITY / COUNTRY / STADIUM (e.g. "London", "Madrid", "Wembley", "Spain")
   - DATE intent: "this weekend" = next Sat/Sun from nowIso; "tonight", "tomorrow", "next week", "in March", specific dates
   - COMPETITION: "Champions League" → UEFA Champions League; "Premier League"; "La Liga"; "Serie A"; "Bundesliga"; "Ligue 1"; "Europa League"
   - TEAM names and their cities:
     * London: Arsenal, Chelsea, Tottenham, West Ham, Crystal Palace, Fulham, Brentford
     * Manchester: Man United, Man City
     * Madrid: Real Madrid, Atlético Madrid
     * Barcelona: FC Barcelona, Espanyol
     * Milan: AC Milan, Inter Milan
     * Paris: PSG
     * Munich: Bayern Munich
   - DERBY / RIVALRY: El Clásico (Real-Barça), North London Derby (Arsenal-Spurs), Manchester Derby, Derby della Madonnina (Milan), Le Classique (PSG-Marseille), Der Klassiker (Bayern-Dortmund)
   - BUDGET intent:
     * "cheap" / "good price" / "budget" → prefer startingPrice ≤ 80 EUR (or lowest available)
     * "premium" / "VIP" / "best seats" → mention higher categories, suggest official providers
     * unspecified → sort by relevance + soonest date
2. Filter matchesSummary against parsed intent. Be flexible: if "London this weekend" yields nothing, broaden to "London upcoming" and SAY SO.
3. Recommend 2–5 matches as a markdown list. For each item include: **Home vs Away** — Competition · Stadium, City · formatted date · "from €X" if startingPrice present (else "price TBC") · a [View match](/matches/{id}) link.
4. After the list, add a one-line tip (e.g. "Tap any match to compare Ticketmaster, StubHub, Viagogo and Ticombo prices.").
5. If the data has ZERO matching results, say so honestly and offer: set up an alert ([/app/alerts]), browse all matches ([/matches]), or pick a related competition.

# DATE PARSING
Use nowIso from context as "now". "This weekend" = upcoming Saturday + Sunday. "Next weekend" = the one after. "Tonight" = today. "Next week" = next Mon–Sun.

# NAVIGATION LINKS (use markdown)
- All matches → /matches
- Specific match → /matches/{id}
- Leagues → /leagues
- How it works → /how-it-works
- Pricing & premium → /pricing
- FAQ → /faq
- Get the app → /app
- Alerts → /app/alerts
- Premium upsell → /app/upsell

# SAFETY (NON-NEGOTIABLE)
- NEVER invent matches, prices, URLs, stadiums, dates.
- Only recommend matches that exist in matchesSummary.
- Prices are "from" (startingPrice). Always phrase as "from €X" — never as a fixed price.
- For payment/account/bug issues → apologize, promise 24h reply, end with a single line: [[ESCALATE]]

# FALLBACK
If a request is unclear, ask ONE short clarifying question OR proactively show 3 featured/soonest matches from the data with their links. Never say "I don't know" — always offer real next actions.

# OUTPUT FORMAT
Markdown. Short intro sentence → bulleted recommendations → short closer. Use bullets only when listing matches or 3+ items. Reply ONLY in the user's language.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langNames: Record<string, string> = {
      en: "English", fr: "French", nl: "Dutch", es: "Spanish",
      de: "German", it: "Italian", pt: "Portuguese", ar: "Arabic", ru: "Russian",
    };
    const langName = langNames[language] || "English";

    const contextBlock = `\n\nCURRENT USER CONTEXT:\n- Language: ${langName} (code: ${language || "en"}) — YOU MUST REPLY IN ${langName.toUpperCase()} ONLY.\n- Current page: ${context?.currentPage || "unknown"}\n- User type: ${context?.userType || "free"}\n- Timestamp: ${new Date().toISOString()}\n${context?.matchInfo ? `- Viewing match: ${context.matchInfo}` : ""}\n${context?.matchesSummary ? `\nRELEVANT MATCH DATA (JSON):\n${context.matchesSummary}` : ""}`;

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
