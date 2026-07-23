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
  name: "search_matches",
  title: "Search upcoming matches",
  description:
    "Search upcoming football matches on Foot Ticket Finder. Filter by team name, city, competition, or country. Returns kickoff date, venue, teams, ticket status, and ticket link when available.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .max(120)
      .describe("Free-text search over team names, city, or competition.")
      .optional(),
    country: z.string().trim().max(80).describe("Filter by country (e.g. 'England').").optional(),
    competition: z
      .string()
      .trim()
      .max(120)
      .describe("Filter by competition (e.g. 'Premier League', 'FIFA World Cup 2026').")
      .optional(),
    limit: z.number().int().min(1).max(50).default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, country, competition, limit }, ctx) => {
    let q = supabaseFor(ctx)
      .from("matches")
      .select(
        "id,slug,date,home_team,away_team,stadium,city,country,competition,ticket_status,starting_price,ticombo_url,lifecycle_status,publication_status,archived_at",
      )
      .is("archived_at", null)
      .eq("publication_status", "published")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(limit ?? 15);

    if (country) q = q.ilike("country", `%${country}%`);
    if (competition) q = q.ilike("competition", `%${competition}%`);
    if (query) {
      const like = `%${query}%`;
      q = q.or(
        `home_team.ilike.${like},away_team.ilike.${like},city.ilike.${like},stadium.ilike.${like},competition.ilike.${like}`,
      );
    }

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? []).map((m: any) => ({
      id: m.id,
      slug: m.slug,
      kickoff: m.date,
      match: `${m.home_team} vs ${m.away_team}`,
      venue: `${m.stadium}, ${m.city}, ${m.country}`,
      competition: m.competition,
      ticket_status: m.ticket_status,
      starting_price: m.starting_price,
      tickets_url: m.ticombo_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { matches: rows, count: rows.length },
    };
  },
});
