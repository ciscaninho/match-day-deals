// Admin AI Copilot — moderation assistant with tool calling
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Football Operations Copilot for Foot Ticket Finder, an admin assistant helping moderators of a premium football travel & ticketing platform.

You help with:
- Detecting duplicate stadiums (similar names, same city)
- Finding entities (clubs, stadiums, matches, leagues)
- Explaining data conflicts (missing coordinates, missing images, capacity mismatches)
- Suggesting concrete moderation fixes
- Surfacing relationships between clubs ↔ stadiums ↔ matches ↔ leagues ↔ ticketing

Style:
- Be concise, structured, use markdown (bullets, bold).
- When you mention an entity, include its slug in backticks so admins can navigate.
- Always call tools before making factual claims about the database.
- Reply in the language the admin uses (English or French).`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_stadiums",
      description: "Search stadiums by name/city/country (case-insensitive).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number", default: 10 } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_clubs",
      description: "Search clubs by name or slug.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number", default: 10 } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_duplicate_stadiums",
      description: "Find stadiums that look like duplicates (same city + similar normalized name).",
      parameters: { type: "object", properties: { limit: { type: "number", default: 20 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "find_data_gaps",
      description: "Find stadiums missing key data: coordinates, image, capacity, or description.",
      parameters: {
        type: "object",
        properties: {
          missing: { type: "string", enum: ["coords", "image", "capacity", "description", "any"], default: "any" },
          limit: { type: "number", default: 20 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_stadium",
      description: "Get full details for a stadium by slug, including related clubs and upcoming matches.",
      parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    },
  },
  {
    type: "function",
    function: {
      name: "upcoming_matches",
      description: "List upcoming matches, optionally filtered by competition or city.",
      parameters: {
        type: "object",
        properties: {
          competition: { type: "string" },
          city: { type: "string" },
          limit: { type: "number", default: 15 },
        },
      },
    },
  },
];

async function runTool(name: string, args: any, supabase: any) {
  switch (name) {
    case "search_stadiums": {
      const q = String(args.query || "").trim();
      const limit = Math.min(args.limit ?? 10, 25);
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,league,capacity,latitude,longitude,hero_image_url")
        .or(`stadium_name.ilike.%${q}%,city.ilike.%${q}%,country.ilike.%${q}%`)
        .limit(limit);
      return data || [];
    }
    case "search_clubs": {
      const q = String(args.query || "").trim();
      const limit = Math.min(args.limit ?? 10, 25);
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,league,country,city,stadium_slug,logo_url")
        .or(`club_name.ilike.%${q}%,slug.ilike.%${q}%,short_name.ilike.%${q}%`)
        .limit(limit);
      return data || [];
    }
    case "find_duplicate_stadiums": {
      const limit = Math.min(args.limit ?? 20, 50);
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country")
        .limit(2000);
      if (!data) return [];
      const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const groups = new Map<string, any[]>();
      for (const s of data) {
        const k = `${norm(s.city || "")}-${norm(s.stadium_name || "").slice(0, 10)}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(s);
      }
      return Array.from(groups.values()).filter((g) => g.length > 1).slice(0, limit);
    }
    case "find_data_gaps": {
      const missing = args.missing || "any";
      const limit = Math.min(args.limit ?? 20, 50);
      let q = supabase.from("stadiums").select("slug,stadium_name,city,country,latitude,longitude,hero_image_url,capacity,description").limit(limit * 3);
      const { data } = await q;
      if (!data) return [];
      const gaps = data.filter((s: any) => {
        if (missing === "coords") return !s.latitude || !s.longitude;
        if (missing === "image") return !s.hero_image_url;
        if (missing === "capacity") return !s.capacity;
        if (missing === "description") return !s.description;
        return !s.latitude || !s.longitude || !s.hero_image_url || !s.capacity;
      });
      return gaps.slice(0, limit);
    }
    case "inspect_stadium": {
      const slug = String(args.slug || "");
      const { data: stadium } = await supabase.from("stadiums").select("*").eq("slug", slug).maybeSingle();
      if (!stadium) return { error: "not_found", slug };
      const { data: clubs } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,logo_url,league")
        .eq("stadium_slug", slug);
      const { data: matches } = await supabase
        .from("matches")
        .select("id,home_team,away_team,competition,date,ticket_status")
        .ilike("stadium", `%${stadium.stadium_name}%`)
        .gte("date", new Date().toISOString())
        .order("date")
        .limit(10);
      return { stadium, clubs: clubs || [], upcoming_matches: matches || [] };
    }
    case "upcoming_matches": {
      const limit = Math.min(args.limit ?? 15, 30);
      let q = supabase
        .from("matches")
        .select("id,home_team,away_team,competition,date,stadium,city,ticket_status")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(limit);
      if (args.competition) q = q.ilike("competition", `%${args.competition}%`);
      if (args.city) q = q.ilike("city", `%${args.city}%`);
      const { data } = await q;
      return data || [];
    }
  }
  return { error: "unknown_tool", name };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages = [] } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const chatMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    // Tool calling loop (max 4 iterations)
    for (let i = 0; i < 4; i++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: chatMessages,
          tools: TOOLS,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        if (resp.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        console.error("AI gateway error", resp.status, txt);
        return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const json = await resp.json();
      const msg = json.choices?.[0]?.message;
      if (!msg) break;

      if (msg.tool_calls?.length) {
        chatMessages.push(msg);
        for (const call of msg.tool_calls) {
          let args = {};
          try { args = JSON.parse(call.function?.arguments || "{}"); } catch { /* noop */ }
          const result = await runTool(call.function.name, args, supabase);
          chatMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result).slice(0, 12000),
          });
        }
        continue;
      }

      return new Response(JSON.stringify({ reply: msg.content || "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ reply: "I couldn't complete that reasoning loop. Try a more specific question." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
