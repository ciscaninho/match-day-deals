import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPinned, Trophy, Globe2, Star, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";

interface VisitRow {
  stadium_slug: string;
  stadium_name: string;
  country: string | null;
  match_label: string | null;
  overall_rating: number | null;
  atmosphere_rating: number | null;
}

export const StadiumPassportCard = () => {
  const { user } = useUser();
  const { t } = useLanguage();

  const { data: visits = [] } = useQuery({
    queryKey: ["my-passport", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<VisitRow[]> => {
      const { data } = await supabase
        .from("stadium_visits")
        .select("stadium_slug,stadium_name,country,match_label,overall_rating,atmosphere_rating")
        .eq("user_id", user!.id);
      return (data ?? []) as VisitRow[];
    },
  });

  const stadiumsCount = new Set(visits.map((v) => v.stadium_slug)).size;
  const matchesCount = visits.filter((v) => v.match_label).length;
  const countriesCount = new Set(visits.filter((v) => v.country).map((v) => v.country!)).size;

  // Favorite stadium = the one with highest avg overall rating across visits
  const favStadium = (() => {
    const map = new Map<string, { name: string; total: number; n: number }>();
    visits.forEach((v) => {
      if (v.overall_rating == null) return;
      const cur = map.get(v.stadium_slug) ?? { name: v.stadium_name, total: 0, n: 0 };
      cur.total += v.overall_rating;
      cur.n += 1;
      map.set(v.stadium_slug, cur);
    });
    let best: { slug: string; name: string; avg: number } | null = null;
    map.forEach((val, slug) => {
      const avg = val.total / val.n;
      if (!best || avg > best.avg) best = { slug, name: val.name, avg };
    });
    return best;
  })();

  // Favorite atmosphere = stadium with highest atmosphere rating
  const favAtmosphere = (() => {
    let best: { name: string; score: number } | null = null;
    visits.forEach((v) => {
      if (v.atmosphere_rating == null) return;
      if (!best || v.atmosphere_rating > best.score)
        best = { name: v.stadium_name, score: v.atmosphere_rating };
    });
    return best;
  })();

  const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="rounded-xl bg-secondary/50 border border-border/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold text-foreground">{value}</div>
    </div>
  );

  return (
    <div className="mt-4 rounded-2xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary font-bold">
            <MapPinned className="w-3 h-3" /> {t("passport.title")}
          </div>
          <div className="text-sm font-bold text-foreground">{t("passport.subtitle")}</div>
        </div>
        <Link
          to="/stadiums/suggest"
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          {t("suggest.cta")}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={MapPinned} label={t("passport.stadiums_visited")} value={stadiumsCount} />
        <Stat icon={Trophy} label={t("passport.matches_attended")} value={matchesCount} />
        <Stat icon={Globe2} label={t("passport.countries")} value={countriesCount} />
      </div>

      {(favStadium || favAtmosphere) && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {favStadium && (
            <Link
              to={`/stadiums/${favStadium.slug}`}
              className="rounded-xl bg-secondary/30 border border-border/40 p-3 hover:border-primary/40 transition"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-500 font-bold">
                <Star className="w-3 h-3" /> {t("passport.favorite_stadium")}
              </div>
              <div className="text-sm font-bold text-foreground truncate">{favStadium.name}</div>
            </Link>
          )}
          {favAtmosphere && (
            <div className="rounded-xl bg-secondary/30 border border-border/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-red-400 font-bold">
                <Flame className="w-3 h-3" /> {t("passport.favorite_atmosphere")}
              </div>
              <div className="text-sm font-bold text-foreground truncate">{favAtmosphere.name}</div>
            </div>
          )}
        </div>
      )}

      {visits.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">{t("passport.empty")}</p>
      )}
    </div>
  );
};
