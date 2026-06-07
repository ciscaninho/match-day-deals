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
  publication_status?: string | null;
  home_team_status?: string | null;
  away_team_status?: string | null;
};

export const isPubliclyVisibleMatchRow = (row: MatchRow): boolean =>
  row.publication_status !== "draft" &&
  row.fixture_confidence !== "projected" &&
  row.home_team_status !== "projected" &&
  row.away_team_status !== "projected" &&
  row.home_team_status !== "tbd" &&
  row.away_team_status !== "tbd";

// (legacy publish-ready check kept as alias below — see end of file)


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

// World Cup 2026 fixtures are managed exclusively via /world-cup-2026 and
// /admin/world-cup-2026. They MUST NOT leak into the generic matches list.
export const WC_COMPETITION = "FIFA World Cup 2026";

export const useMatches = () => {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .neq("competition", WC_COMPETITION)
        .order("date", { ascending: true });
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
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


export interface UseMatchResult {
  match: Match | null;
  isDraftOrProjected: boolean;
}

export const useMatch = (id: string | undefined, opts?: { allowDraft?: boolean }) => {
  const allowDraft = !!opts?.allowDraft;
  return useQuery({
    queryKey: ["match", id, allowDraft],
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
      const row = data as MatchRow;
      const visible = isPubliclyVisibleMatchRow(row);
      if (!visible && !allowDraft) return null;
      const m = mapRow(row);
      if (isTbdMatch(m) && !allowDraft) return null;
      return m;
    },
    enabled: !!id,
  });
};

// Lightweight gate hook: returns whether a fixture exists but is draft/projected
// (so the detail page can render a 404 for non-admin visitors while still
// allowing admin previews via useMatch(id, { allowDraft: true })).
export const useMatchAccess = (id: string | undefined) => {
  return useQuery({
    queryKey: ["match-access", id],
    queryFn: async () => {
      if (!id) return { exists: false, isDraftOrProjected: false };
      const { data } = await supabase
        .from("matches")
        .select("id,publication_status,fixture_confidence,home_team_status,away_team_status")
        .eq("id", id)
        .maybeSingle();
      if (!data) return { exists: false, isDraftOrProjected: false };
      const row = data as MatchRow;
      return {
        exists: true,
        isDraftOrProjected: !isPubliclyVisibleMatchRow(row),
      };
    },
    enabled: !!id,
  });
};

// Backwards-compat alias used elsewhere in the codebase.
export const isPublishReadyMatchRow = isPubliclyVisibleMatchRow;

