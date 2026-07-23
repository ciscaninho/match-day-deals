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
  name: "search_clubs",
  title: "Search football clubs",
  description:
    "Search football clubs in the Foot Ticket Finder catalog by name, league or country.",
  inputSchema: {
    query: z.string().trim().max(120).describe("Free-text search over club name and aliases.").optional(),
    country: z.string().trim().max(80).describe("Filter by country name.").optional(),
    limit: z.number().int().min(1).max(50).default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, country, limit }, ctx) => {
    let q = supabaseFor(ctx)
      .from("clubs")
      .select("id,slug,name,display_name,short_name,country,league,city")
      .is("archived_at", null)
      .eq("publication_status", "published")
      .limit(limit ?? 15);

    if (country) q = q.ilike("country", `%${country}%`);
    if (query) {
      const like = `%${query}%`;
      q = q.or(`name.ilike.${like},display_name.ilike.${like},short_name.ilike.${like}`);
    }

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { clubs: data ?? [], count: (data ?? []).length },
    };
  },
});
