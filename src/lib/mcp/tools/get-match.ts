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
  name: "get_match",
  title: "Get match details",
  description:
    "Return full details for a single match by its id or slug: teams, kickoff, stadium, competition, ticket status, provider link and starting price.",
  inputSchema: {
    match: z.string().trim().min(1).max(200).describe("Match id or slug."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ match }, ctx) => {
    const sb = supabaseFor(ctx);
    const byId = await sb
      .from("matches")
      .select(
        "id,slug,date,home_team,away_team,home_short,away_short,stadium,city,country,competition,phase,group_code,ticket_status,starting_price,ticombo_url,official_link,lifecycle_status,publication_status,archived_at",
      )
      .or(`id.eq.${match},slug.eq.${match}`)
      .is("archived_at", null)
      .maybeSingle();

    if (byId.error)
      return { content: [{ type: "text", text: byId.error.message }], isError: true };
    if (!byId.data)
      return {
        content: [{ type: "text", text: `No match found for '${match}'.` }],
        isError: true,
      };

    return {
      content: [{ type: "text", text: JSON.stringify(byId.data, null, 2) }],
      structuredContent: { match: byId.data },
    };
  },
});
