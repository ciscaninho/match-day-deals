import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClubDifficulty = "easy" | "medium" | "hard" | "extreme";

export type ClubTicketingProfile = {
  id: string;
  slug: string;
  club_name: string;
  short_name: string | null;
  country: string | null;
  city: string | null;
  league: string | null;
  stadium_name: string | null;
  stadium_slug: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  official_website: string | null;
  official_ticketing_url: string | null;
  membership_required: boolean;
  membership_name: string | null;
  membership_required_for_big_games: boolean;
  public_sale_possible: boolean;
  resale_exchange_available: boolean;
  resale_exchange_name: string | null;
  resale_exchange_url: string | null;
  average_difficulty: ClubDifficulty;
  ticket_release_process: string | null;
  important_restrictions: string | null;
  hospitality_available: boolean;
  hospitality_url: string | null;
  queue_system: string | null;
  ballot_system: boolean;
  ballot_notes: string | null;
  local_fan_restrictions: string | null;
  notes: string | null;
  best_matches: string | null;
  seo_title: string | null;
  seo_description: string | null;
  last_verified_at: string | null;
};

export const useClubTicketingList = () =>
  useQuery({
    queryKey: ["club_ticketing_profiles"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ClubTicketingProfile[]> => {
      const { data, error } = await supabase
        .from("club_ticketing_profiles")
        .select("*")
        .order("club_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClubTicketingProfile[];
    },
  });

export const useClubTicketing = (slug?: string) =>
  useQuery({
    queryKey: ["club_ticketing_profile", slug],
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ClubTicketingProfile | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("club_ticketing_profiles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as ClubTicketingProfile) ?? null;
    },
  });
