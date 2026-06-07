import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WC_COMPETITION } from "@/hooks/useMatches";

export interface WcMatchSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  stadium: string;
  city: string;
  country: string;
  phase: string | null;
  groupCode: string | null;
  matchday: number | null;
  startingPrice: number | null;
  ticketStatus: string;
  ticombo_url: string | null;
}

export const useWorldCupMatches = () => {
  return useQuery({
    queryKey: ["wc-matches-assistant"],
    queryFn: async (): Promise<WcMatchSummary[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id,home_team,away_team,date,stadium,city,country,phase,group_code,matchday,starting_price,ticket_status,ticombo_url,fixture_confidence,home_team_status,away_team_status,archived_at",
        )
        .eq("competition", WC_COMPETITION)
        .is("archived_at", null)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || [])
        .filter(
          (r: any) =>
            r.fixture_confidence !== "projected" &&
            r.home_team_status === "confirmed" &&
            r.away_team_status === "confirmed",
        )
        .map((r: any) => ({
          id: r.id,
          homeTeam: r.home_team,
          awayTeam: r.away_team,
          date: r.date,
          stadium: r.stadium || "",
          city: r.city || "",
          country: r.country || "",
          phase: r.phase,
          groupCode: r.group_code,
          matchday: r.matchday,
          startingPrice: r.starting_price,
          ticketStatus: r.ticket_status,
          ticombo_url: r.ticombo_url,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
