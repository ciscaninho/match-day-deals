import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_favorites",
  title: "List my saved matches",
  description:
    "List the matches the signed-in Foot Ticket Finder user has saved to their favorites, with kickoff, teams, venue and ticket status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };

    const sb = supabaseFor(ctx);
    const { data: saved, error } = await sb
      .from("saved_matches")
      .select("match_id,alerts_enabled,created_at")
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!saved || saved.length === 0)
      return {
        content: [{ type: "text", text: "No saved matches yet." }],
        structuredContent: { matches: [] },
      };

    const ids = saved.map((s) => s.match_id);
    const { data: matches, error: mErr } = await sb
      .from("matches")
      .select("id,slug,date,home_team,away_team,stadium,city,country,competition,ticket_status,ticombo_url")
      .in("id", ids);
    if (mErr) return { content: [{ type: "text", text: mErr.message }], isError: true };

    const alertMap = new Map(saved.map((s) => [s.match_id, s.alerts_enabled]));
    const rows = (matches ?? []).map((m: any) => ({ ...m, alerts_enabled: alertMap.get(m.id) ?? false }));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { matches: rows, count: rows.length },
    };
  },
});
