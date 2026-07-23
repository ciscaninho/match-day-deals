import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_stadiums",
  title: "Search stadiums",
  description:
    "Search football stadiums by name, city or country. Returns capacity, coordinates, resident clubs and Foot Ticket Finder slug.",
  inputSchema: {
    query: z.string().trim().max(120).describe("Free-text search over stadium name, city, aliases.").optional(),
    country: z.string().trim().max(80).describe("Filter by country.").optional(),
    world_cup_host: z
      .boolean()
      .describe("If true, only return 2026 World Cup host stadiums.")
      .optional(),
    limit: z.number().int().min(1).max(50).default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, country, world_cup_host, limit }, ctx) => {
    let q = supabaseFor(ctx)
      .from("stadiums")
      .select("id,slug,name,city,country,capacity,latitude,longitude,clubs,is_world_cup_host")
      .is("archived_at", null)
      .limit(limit ?? 15);

    if (country) q = q.ilike("country", `%${country}%`);
    if (world_cup_host === true) q = q.eq("is_world_cup_host", true);
    if (query) {
      const like = `%${query}%`;
      q = q.or(`name.ilike.${like},city.ilike.${like},club_name.ilike.${like}`);
    }

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { stadiums: data ?? [], count: (data ?? []).length },
    };
  },
});
