import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClubTicketingProfile } from "@/hooks/useClubTicketing";
import type { Stadium } from "@/hooks/useStadium";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const matchClub = (club: ClubTicketingProfile, team: string) => {
  const t = norm(team);
  const candidates = [club.club_name, club.short_name].filter(Boolean) as string[];
  return candidates.some((c) => {
    const n = norm(c);
    return n === t || n.includes(t) || t.includes(n);
  });
};

export type MatchContext = {
  homeClub: ClubTicketingProfile | null;
  awayClub: ClubTicketingProfile | null;
  stadium: Stadium | null;
};

export const useMatchContext = (params: {
  homeTeam?: string | null;
  awayTeam?: string | null;
  stadiumName?: string | null;
}) => {
  const { homeTeam, awayTeam, stadiumName } = params;
  return useQuery({
    queryKey: ["match-context", homeTeam, awayTeam, stadiumName],
    enabled: !!(homeTeam || awayTeam || stadiumName),
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MatchContext> => {
      const [clubsRes, stadiumsRes] = await Promise.all([
        supabase.from("club_ticketing_profiles").select("*").is("archived_at", null),
        supabase.from("stadiums").select("*").is("archived_at", null),
      ]);
      const clubs = (clubsRes.data ?? []) as ClubTicketingProfile[];
      const stadiums = (stadiumsRes.data ?? []) as Stadium[];

      const homeClub = homeTeam ? clubs.find((c) => matchClub(c, homeTeam)) ?? null : null;
      const awayClub = awayTeam ? clubs.find((c) => matchClub(c, awayTeam)) ?? null : null;

      let stadium: Stadium | null = null;
      if (stadiumName) {
        const t = norm(stadiumName);
        stadium =
          stadiums.find((s) => norm(s.stadium_name) === t) ??
          stadiums.find((s) => norm(s.stadium_name).includes(t) || t.includes(norm(s.stadium_name))) ??
          null;
      }
      return { homeClub, awayClub, stadium };
    },
  });
};
