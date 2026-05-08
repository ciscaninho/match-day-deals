import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TopReview = {
  id: string;
  stadium_name: string;
  stadium_slug: string;
  comment: string | null;
  view_rating: number;
  atmosphere: number;
  created_at: string;
};

export type RecentVisit = {
  id: string;
  stadium_slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  visit_date: string | null;
  created_at: string;
};

export type RankedStadium = {
  slug: string;
  stadium_name: string;
  city: string;
  country: string;
  hero_image_url: string | null;
  background_image_url: string | null;
  image_url: string | null;
  atmosphere_score: number | null;
  popularity_score: number | null;
  capacity: number | null;
};

export const useStadiumSocialProof = () =>
  useQuery({
    queryKey: ["stadium-social-proof"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [reviews, visits, atmospheric, popular] = await Promise.all([
        supabase
          .from("stadium_reviews")
          .select("id, stadium_name, stadium_slug, comment, view_rating, atmosphere, created_at")
          .not("comment", "is", null)
          .gte("atmosphere", 4)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("stadium_visits")
          .select("id, stadium_slug, stadium_name, city, country, visit_date, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("stadiums")
          .select("slug, stadium_name, city, country, hero_image_url, background_image_url, image_url, atmosphere_score, popularity_score, capacity")
          .order("atmosphere_score", { ascending: false, nullsFirst: false })
          .limit(6),
        supabase
          .from("stadiums")
          .select("slug, stadium_name, city, country, hero_image_url, background_image_url, image_url, atmosphere_score, popularity_score, capacity")
          .order("popularity_score", { ascending: false, nullsFirst: false })
          .limit(6),
      ]);
      return {
        topReviews: (reviews.data ?? []) as TopReview[],
        recentVisits: (visits.data ?? []) as RecentVisit[],
        atmospheric: (atmospheric.data ?? []) as RankedStadium[],
        popular: (popular.data ?? []) as RankedStadium[],
      };
    },
  });
