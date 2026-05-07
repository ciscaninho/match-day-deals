import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Stadium = {
  id: string;
  stadium_name: string;
  slug: string;
  city: string;
  country: string;
  league: string;
  capacity: number | null;
  opened_year: number | null;
  club_name: string | null;
  clubs: string[];
  atmosphere_score: number | null;
  family_friendly_score: number | null;
  accessibility_score: number | null;
  popularity_score: number | null;
  value_score: number | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  background_image_url: string | null;
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  gallery_images: string[];
  description: string | null;
  best_sections: string[] | null;
  ultras_section: string | null;
  family_section: string | null;
  vip_available: boolean;
  official_ticket_provider: string | null;
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Fetch a stadium by its name. Tries an exact-ish match against stadium_name
 * (case/diacritic-insensitive), then a contains match.
 */
export const useStadium = (stadiumName?: string | null) => {
  return useQuery({
    queryKey: ["stadium", stadiumName],
    enabled: !!stadiumName,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Stadium | null> => {
      if (!stadiumName) return null;
      const { data, error } = await supabase.from("stadiums").select("*");
      if (error) {
        console.error("stadium fetch error", error);
        return null;
      }
      const list = (data ?? []) as Stadium[];
      const target = norm(stadiumName);
      // exact normalized match
      let hit = list.find((s) => norm(s.stadium_name) === target);
      // contains either way
      if (!hit) hit = list.find((s) => target.includes(norm(s.stadium_name)) || norm(s.stadium_name).includes(target));
      return hit ?? null;
    },
  });
};

export const useStadiums = (league?: string) => {
  return useQuery({
    queryKey: ["stadiums", league ?? "all"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Stadium[]> => {
      let q = supabase.from("stadiums").select("*").order("popularity_score", { ascending: false });
      if (league) q = q.eq("league", league);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Stadium[];
    },
  });
};
