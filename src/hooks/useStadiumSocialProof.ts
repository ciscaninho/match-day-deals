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
  upcoming_count: number;
};

const normalize = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");

export const useStadiumSocialProof = () =>
  useQuery({
    queryKey: ["stadium-social-proof"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const [reviews, visits, atmospheric, popular, upcomingMatches] = await Promise.all([
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
          .limit(60),
        supabase
          .from("stadiums")
          .select("slug, stadium_name, city, country, hero_image_url, background_image_url, image_url, atmosphere_score, popularity_score, capacity")
          .order("popularity_score", { ascending: false, nullsFirst: false })
          .limit(60),
        supabase
          .from("matches")
          .select("stadium, city")
          .gte("date", nowIso)
          .limit(1000),
      ]);

      // Build map: normalized stadium name -> upcoming match count
      const countMap = new Map<string, number>();
      for (const m of upcomingMatches.data ?? []) {
        const key = normalize((m as { stadium: string | null }).stadium);
        if (!key) continue;
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
      }

      const attachAndFilter = (rows: Omit<RankedStadium, "upcoming_count">[]): RankedStadium[] =>
        rows
          .map((s) => ({ ...s, upcoming_count: countMap.get(normalize(s.stadium_name)) ?? 0 }))
          .filter((s) => s.upcoming_count > 0)
          .sort((a, b) => {
            // Prioritize: more upcoming matches, then higher atmosphere
            const diff = b.upcoming_count - a.upcoming_count;
            if (diff !== 0) return diff;
            return (Number(b.atmosphere_score) || 0) - (Number(a.atmosphere_score) || 0);
          })
          .slice(0, 6);

      return {
        topReviews: (reviews.data ?? []) as TopReview[],
        recentVisits: (visits.data ?? []) as RecentVisit[],
        atmospheric: attachAndFilter((atmospheric.data ?? []) as Omit<RankedStadium, "upcoming_count">[]),
        popular: attachAndFilter((popular.data ?? []) as Omit<RankedStadium, "upcoming_count">[]),
      };
    },
  });
