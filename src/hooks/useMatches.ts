import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Match, TicketSource, TicketStatus } from "@/data/matches";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  home_short: string;
  away_short: string;
  competition: string;
  country: string | null;
  date: string;
  stadium: string | null;
  city: string | null;
  starting_price: number | null;
  ticket_status: string;
  ticket_release_date: string | null;
  ticket_sources: unknown;
  featured: boolean;
  priority: boolean;
};

const mapRow = (row: MatchRow): Match => ({
  id: row.id,
  homeTeam: row.home_team,
  awayTeam: row.away_team,
  homeShort: row.home_short,
  awayShort: row.away_short,
  competition: row.competition,
  country: row.country ?? "",
  date: row.date,
  stadium: row.stadium ?? "",
  city: row.city ?? "",
  startingPrice: row.starting_price,
  ticketStatus: (row.ticket_status as TicketStatus) ?? "not_released",
  ticketReleaseDate: row.ticket_release_date ?? row.date,
  ticketSources: Array.isArray(row.ticket_sources)
    ? (row.ticket_sources as TicketSource[])
    : [],
  featured: row.featured,
  priority: row.priority,
});

export const useMatches = () => {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data as MatchRow[]).map(mapRow);
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useMatch = (id: string | undefined) => {
  return useQuery({
    queryKey: ["match", id],
    queryFn: async (): Promise<Match | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data as MatchRow) : null;
    },
    enabled: !!id,
  });
};
