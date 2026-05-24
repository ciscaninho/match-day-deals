import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Match, TicketSource, TicketStatus } from "@/data/matches";
import { deriveLifecycle, isPublicDiscoverable, isTbdMatch, type MatchLifecycleStatus } from "@/lib/matchLifecycle";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  home_short: string;
  away_short: string;
  home_logo: string | null;
  away_logo: string | null;
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
  archived_at?: string | null;
  lifecycle_status?: string | null;
  fixture_confidence?: string | null;
  home_team_status?: string | null;
  away_team_status?: string | null;
};

const isProjectedOrTbdStatus = (s?: string | null) =>
  s === "tbd" || s === "projected";

export const isPublishReadyMatchRow = (row: MatchRow): boolean =>
  !isProjectedOrTbdStatus(row.home_team_status) &&
  !isProjectedOrTbdStatus(row.away_team_status) &&
  row.fixture_confidence !== "projected";

const mapRow = (row: MatchRow): Match => {
  const archivedAt = row.archived_at ?? null;
  // Prefer DB column when present, but always re-derive client-side so the UI
  // stays correct between trigger updates (e.g. a match crossing into "completed").
  const lifecycle: MatchLifecycleStatus = deriveLifecycle(row.date, archivedAt);
  return {
    id: row.id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeShort: row.home_short,
    awayShort: row.away_short,
    homeLogo: row.home_logo,
    awayLogo: row.away_logo,
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
    archivedAt,
    lifecycleStatus: lifecycle,
  };
};

export const useMatches = () => {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("date", { ascending: true });
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
      // Public surfaces only show upcoming/live fixtures. Completed and
      // archived matches are excluded unless surfaced via a dedicated
      // historical section. TBD/placeholder fixtures are also hidden.
      return (data as MatchRow[])
        .filter(isPublishReadyMatchRow)
        .map(mapRow)
        .filter((m) => !isTbdMatch(m) && isPublicDiscoverable(m.lifecycleStatus));
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
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
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
      if (!data) return null;
      const m = mapRow(data as MatchRow);
      return isTbdMatch(m) ? null : m;
    },
    enabled: !!id,
  });
};
