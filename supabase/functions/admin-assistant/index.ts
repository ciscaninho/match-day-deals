// Admin AI Copilot — moderation assistant with tool calling, thread memory, and proposed actions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Football Operations Copilot for Foot Ticket Finder, an admin assistant for moderators of a premium football travel & ticketing platform.

You help with:
- Detecting duplicates, conflicts and missing data
- Finding clubs / stadiums / matches / leagues
- Surfacing relationships
- Proposing concrete moderation fixes via the propose_* tools

Strict rules:
- ALWAYS call tools before making factual claims about the database.
- When the admin asks you to change data, do NOT pretend to do it. Call the matching propose_* tool, which creates a proposed action the admin will Approve or Reject in the UI.
- Reference proposed actions by their id in backticks so the UI can render them.
- Reply in the language used by the admin (English or French).
- Be concise, structured markdown.`;

const READ_TOOLS = [
  { type: "function", function: { name: "search_stadiums", description: "Search stadiums by name/city/country.", parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["query"] } } },
  { type: "function", function: { name: "search_clubs", description: "Search clubs by name or slug.", parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["query"] } } },
  { type: "function", function: { name: "find_duplicate_stadiums", description: "Find stadiums that look like duplicates.", parameters: { type: "object", properties: { limit: { type: "number", default: 20 } } } } },
  { type: "function", function: { name: "find_data_gaps", description: "Find stadiums missing key data.", parameters: { type: "object", properties: { missing: { type: "string", enum: ["coords", "image", "capacity", "description", "any"], default: "any" }, limit: { type: "number", default: 20 } } } } },
  { type: "function", function: { name: "inspect_stadium", description: "Get full stadium details + clubs + upcoming matches.", parameters: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] } } },
  { type: "function", function: { name: "upcoming_matches", description: "List upcoming matches.", parameters: { type: "object", properties: { competition: { type: "string" }, city: { type: "string" }, limit: { type: "number", default: 15 } } } } },
];

const WRITE_TOOLS = [
  { type: "function", function: { name: "propose_stadium_update", description: "Propose updating fields on a stadium. Allowed fields: city, country, league, capacity, latitude, longitude, hero_image_url, description.", parameters: { type: "object", properties: { slug: { type: "string" }, fields: { type: "object" }, reason: { type: "string" } }, required: ["slug", "fields"] } } },
  { type: "function", function: { name: "propose_attach_club", description: "Propose attaching a club to a stadium (sets stadium_slug on the club ticketing profile).", parameters: { type: "object", properties: { club_slug: { type: "string" }, stadium_slug: { type: "string" }, reason: { type: "string" } }, required: ["club_slug", "stadium_slug"] } } },
  { type: "function", function: { name: "propose_detach_club", description: "Propose detaching a club from its stadium.", parameters: { type: "object", properties: { club_slug: { type: "string" }, reason: { type: "string" } }, required: ["club_slug"] } } },
  { type: "function", function: { name: "propose_merge_stadiums", description: "Propose merging a duplicate stadium into a canonical stadium. This archives the duplicate, moves linked relations, and preserves aliases.", parameters: { type: "object", properties: { canonical_slug: { type: "string" }, duplicate_slug: { type: "string" }, reason: { type: "string" } }, required: ["canonical_slug", "duplicate_slug"] } } },
  { type: "function", function: { name: "propose_create_stadium", description: "Propose creating a new stadium entity. Always created with publication_status='draft'. ALWAYS call search_stadiums first with the proposed name to avoid duplicates. Slug must be kebab-case unique. Aliases improve future matching.", parameters: { type: "object", properties: { stadium_name: { type: "string" }, slug: { type: "string" }, country: { type: "string" }, city: { type: "string" }, league: { type: "string" }, capacity: { type: "number" }, latitude: { type: "number" }, longitude: { type: "number" }, hero_image_url: { type: "string" }, aliases: { type: "array", items: { type: "string" } }, reason: { type: "string" } }, required: ["stadium_name", "slug", "country", "city"] } } },
];

const ALLOWED_STADIUM_FIELDS = new Set(["city", "country", "league", "capacity", "latitude", "longitude", "hero_image_url", "description"]);

async function runReadTool(name: string, args: any, supabase: any) {
  switch (name) {
    case "search_stadiums": {
      const q = String(args.query || "").trim();
      const { data } = await supabase.from("stadiums")
        .select("slug,stadium_name,city,country,league,capacity,latitude,longitude,hero_image_url")
        .or(`stadium_name.ilike.%${q}%,city.ilike.%${q}%,country.ilike.%${q}%`)
        .limit(Math.min(args.limit ?? 10, 25));
      return data || [];
    }
    case "search_clubs": {
      const q = String(args.query || "").trim();
      const { data } = await supabase.from("club_ticketing_profiles")
        .select("slug,club_name,short_name,league,country,city,stadium_slug,logo_url")
        .or(`club_name.ilike.%${q}%,slug.ilike.%${q}%,short_name.ilike.%${q}%`)
        .limit(Math.min(args.limit ?? 10, 25));
      return data || [];
    }
    case "find_duplicate_stadiums": {
      const { data } = await supabase.from("stadiums").select("slug,stadium_name,city,country,aliases").is("archived_at", null).limit(2000);
      if (!data) return [];
      const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const groups = new Map<string, any[]>();
      for (const s of data) {
        const k = `${norm(s.city || "")}-${norm(s.stadium_name || "").slice(0, 10)}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(s);
      }
      return Array.from(groups.values()).filter((g) => g.length > 1).slice(0, Math.min(args.limit ?? 20, 50));
    }
    case "find_data_gaps": {
      const missing = args.missing || "any";
      const limit = Math.min(args.limit ?? 20, 50);
      const { data } = await supabase.from("stadiums")
        .select("slug,stadium_name,city,country,latitude,longitude,hero_image_url,capacity,description").limit(limit * 3);
      if (!data) return [];
      return data.filter((s: any) => {
        if (missing === "coords") return !s.latitude || !s.longitude;
        if (missing === "image") return !s.hero_image_url;
        if (missing === "capacity") return !s.capacity;
        if (missing === "description") return !s.description;
        return !s.latitude || !s.longitude || !s.hero_image_url || !s.capacity;
      }).slice(0, limit);
    }
    case "inspect_stadium": {
      const slug = String(args.slug || "");
      const { data: stadium } = await supabase.from("stadiums").select("*").eq("slug", slug).maybeSingle();
      if (!stadium) return { error: "not_found", slug };
      const { data: clubs } = await supabase.from("club_ticketing_profiles")
        .select("slug,club_name,short_name,logo_url,league").eq("stadium_slug", slug);
      const { data: matches } = await supabase.from("matches")
        .select("id,home_team,away_team,competition,date,ticket_status")
        .ilike("stadium", `%${stadium.stadium_name}%`)
        .gte("date", new Date().toISOString()).order("date").limit(10);
      return { stadium, clubs: clubs || [], upcoming_matches: matches || [] };
    }
    case "upcoming_matches": {
      const limit = Math.min(args.limit ?? 15, 30);
      let q = supabase.from("matches")
        .select("id,home_team,away_team,competition,date,stadium,city,ticket_status")
        .gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(limit);
      if (args.competition) q = q.ilike("competition", `%${args.competition}%`);
      if (args.city) q = q.ilike("city", `%${args.city}%`);
      const { data } = await q;
      return data || [];
    }
  }
  return { error: "unknown_tool", name };
}

async function proposeAction(kind: string, payload: any, preview: any, supabase: any, userId: string, threadId: string | null) {
  const { data, error } = await supabase.from("admin_actions").insert({
    kind, payload, preview, status: "proposed", created_by: userId, thread_id: threadId,
  }).select("id,kind,payload,preview,status").single();
  if (error) return { error: error.message };
  return { proposed_action: data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = userData.user.id;
    const body = await req.json();
    let { thread_id, message, messages } = body as { thread_id?: string | null; message?: string; messages?: any[] };

    // Ensure thread exists (create on first user message)
    if (!thread_id && message) {
      const title = message.slice(0, 60);
      const { data: t } = await supabase.from("admin_assistant_threads").insert({ user_id: userId, title }).select("id").single();
      thread_id = t?.id ?? null;
    }

    // Load history if thread provided and no messages array supplied
    let chatHistory: any[] = [];
    if (thread_id && (!messages || messages.length === 0)) {
      const { data: rows } = await supabase.from("admin_assistant_messages")
        .select("role,content").eq("thread_id", thread_id).order("created_at").limit(60);
      chatHistory = (rows || []).filter((r: any) => r.role === "user" || r.role === "assistant");
    } else if (messages) {
      chatHistory = messages;
    }

    if (message) {
      chatHistory.push({ role: "user", content: message });
      if (thread_id) await supabase.from("admin_assistant_messages").insert({ thread_id, role: "user", content: message });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const chatMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory];
    const proposedActions: any[] = [];

    for (let i = 0; i < 5; i++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: chatMessages,
          tools: [...READ_TOOLS, ...WRITE_TOOLS],
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
          let args: any = {};
          try { args = JSON.parse(call.function?.arguments || "{}"); } catch { /* noop */ }
          const fname = call.function.name;
          let result: any;
          if (fname === "propose_stadium_update") {
            const fields: any = {};
            for (const [k, v] of Object.entries(args.fields || {})) {
              if (ALLOWED_STADIUM_FIELDS.has(k)) fields[k] = v;
            }
            const { data: stadium } = await supabase.from("stadiums").select("slug,stadium_name,city,country").eq("slug", args.slug).maybeSingle();
            const preview = { stadium, fields, reason: args.reason };
            result = await proposeAction("stadium_update", { slug: args.slug, fields }, preview, supabase, userId, thread_id);
            if (result.proposed_action) proposedActions.push(result.proposed_action);
          } else if (fname === "propose_attach_club") {
            const { data: club } = await supabase.from("club_ticketing_profiles").select("slug,club_name,logo_url").eq("slug", args.club_slug).maybeSingle();
            const { data: stadium } = await supabase.from("stadiums").select("slug,stadium_name,city").eq("slug", args.stadium_slug).maybeSingle();
            result = await proposeAction("attach_club_to_stadium", { club_slug: args.club_slug, stadium_slug: args.stadium_slug }, { club, stadium, reason: args.reason }, supabase, userId, thread_id);
            if (result.proposed_action) proposedActions.push(result.proposed_action);
          } else if (fname === "propose_detach_club") {
            const { data: club } = await supabase.from("club_ticketing_profiles").select("slug,club_name,logo_url,stadium_slug").eq("slug", args.club_slug).maybeSingle();
            result = await proposeAction("detach_club_from_stadium", { club_slug: args.club_slug }, { club, reason: args.reason }, supabase, userId, thread_id);
            if (result.proposed_action) proposedActions.push(result.proposed_action);
          } else if (fname === "propose_merge_stadiums") {
            const resolveStadium = async (input: string) => {
              if (!input) return null;
              const { data: bySlug } = await supabase.from("stadiums").select("id,slug,stadium_name,city,country,aliases,clubs,archived_at").eq("slug", input).maybeSingle();
              if (bySlug) return bySlug;
              const { data: byName } = await supabase.from("stadiums").select("id,slug,stadium_name,city,country,aliases,clubs,archived_at").ilike("stadium_name", input).maybeSingle();
              if (byName) return byName;
              const { data: byAlias } = await supabase.from("stadiums").select("id,slug,stadium_name,city,country,aliases,clubs,archived_at").contains("aliases", [input]).maybeSingle();
              return byAlias || null;
            };
            const canonical = await resolveStadium(args.canonical_slug);
            const duplicate = await resolveStadium(args.duplicate_slug);
            if (!canonical || !duplicate) {
              result = { error: "stadium_not_found", canonical_input: args.canonical_slug, duplicate_input: args.duplicate_slug, canonical_resolved: !!canonical, duplicate_resolved: !!duplicate, hint: "Use find_duplicate_stadiums first to obtain real slugs from the database." };
            } else if (canonical.archived_at || duplicate.archived_at) {
              result = { error: "stadium_archived", canonical, duplicate };
            } else if (canonical.id === duplicate.id) {
              result = { error: "same_stadium", canonical };
            } else {
              result = await proposeAction(
                "merge_stadium_duplicate",
                { canonical_slug: canonical.slug, duplicate_slug: duplicate.slug, reason: args.reason },
                { canonical, duplicate, reason: args.reason },
                supabase,
                userId,
                thread_id,
              );
              if (result.proposed_action) proposedActions.push(result.proposed_action);
            }
          } else if (fname === "propose_create_stadium") {
            const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
            const required = ["stadium_name", "slug", "country", "city"] as const;
            const missing = required.filter((k) => !args[k] || !String(args[k]).trim());
            if (missing.length) {
              result = { error: "missing_fields", missing };
            } else if (!slugRe.test(String(args.slug))) {
              result = { error: "invalid_slug", slug: args.slug, hint: "Slug must be kebab-case (a-z, 0-9, dashes)." };
            } else {
              const { data: existing } = await supabase.from("stadiums").select("slug,stadium_name,city,country,archived_at").eq("slug", args.slug).maybeSingle();
              if (existing) {
                result = { error: "slug_taken", existing, hint: "Pick a different slug or update the existing record." };
              } else {
                // Surface possible name-based duplicates in same country
                const { data: nameDupes } = await supabase.from("stadiums")
                  .select("slug,stadium_name,city,country,aliases")
                  .ilike("stadium_name", `%${args.stadium_name}%`)
                  .is("archived_at", null)
                  .limit(5);
                const payload: any = {
                  stadium_name: String(args.stadium_name).trim(),
                  slug: String(args.slug).trim(),
                  country: String(args.country).trim(),
                  city: String(args.city).trim(),
                  league: args.league ? String(args.league).trim() : "—",
                  aliases: Array.isArray(args.aliases) ? args.aliases.filter(Boolean) : [],
                };
                if (args.capacity != null) payload.capacity = Number(args.capacity);
                if (args.latitude != null) payload.latitude = Number(args.latitude);
                if (args.longitude != null) payload.longitude = Number(args.longitude);
                if (args.hero_image_url) payload.hero_image_url = String(args.hero_image_url);
                const preview = { stadium: payload, possible_duplicates: nameDupes || [], reason: args.reason };
                result = await proposeAction("create_stadium", payload, preview, supabase, userId, thread_id);
                if (result.proposed_action) proposedActions.push(result.proposed_action);
              }
            }
          } else {
            result = await runReadTool(fname, args, supabase);
          }
          chatMessages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 12000) });
        }
        continue;
      }

      const reply = msg.content || "";
      if (thread_id) {
        await supabase.from("admin_assistant_messages").insert({ thread_id, role: "assistant", content: reply });
        await supabase.from("admin_assistant_threads").update({ updated_at: new Date().toISOString() }).eq("id", thread_id);
      }
      return new Response(JSON.stringify({ reply, thread_id, proposed_actions: proposedActions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ reply: "I couldn't complete that reasoning loop.", thread_id, proposed_actions: proposedActions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-assistant error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
