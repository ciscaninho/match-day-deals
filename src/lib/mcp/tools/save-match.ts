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
  name: "save_match",
  title: "Save match to favorites",
  description:
    "Save a match to the signed-in user's favorites on Foot Ticket Finder. Optionally enable ticket alerts for that match.",
  inputSchema: {
    match_id: z.string().trim().min(1).max(120).describe("The match id (from search_matches / get_match)."),
    alerts_enabled: z.boolean().default(true).describe("Enable ticket alerts for this match."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ match_id, alerts_enabled }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const sb = supabaseFor(ctx);
    const { data, error } = await sb
      .from("saved_matches")
      .upsert(
        { user_id: ctx.getUserId()!, match_id, alerts_enabled },
        { onConflict: "user_id,match_id" },
      )
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved match ${match_id}.` }],
      structuredContent: { saved: data },
    };
  },
});
