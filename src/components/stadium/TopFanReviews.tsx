import { useQuery } from "@tanstack/react-query";
import { Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

type Review = {
  id: string;
  comment: string | null;
  view_rating: number;
  atmosphere: number;
  facilities: number;
  value: number;
  created_at: string;
};

export const TopFanReviews = ({ stadiumSlug }: { stadiumSlug: string }) => {
  const { t } = useLanguage();
  const { data = [] } = useQuery({
    queryKey: ["top-fan-reviews", stadiumSlug],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Review[]> => {
      const { data } = await supabase
        .from("stadium_reviews")
        .select("id, comment, view_rating, atmosphere, facilities, value, created_at")
        .eq("stadium_slug", stadiumSlug)
        .not("comment", "is", null)
        .order("atmosphere", { ascending: false })
        .limit(3);
      return (data ?? []) as Review[];
    },
  });

  if (!data.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-5 py-6">
      <div className="text-xs uppercase tracking-wider text-white/55 font-bold mb-3 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5" /> {t("stadium.top_fan_reviews")}
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {data.map((r) => {
          const avg = (r.view_rating + r.atmosphere + r.facilities + r.value) / 4;
          return (
            <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <Quote className="w-4 h-4 text-[#2ECC71] mb-2" />
              <p className="text-sm text-white/85 leading-relaxed line-clamp-5">{r.comment}</p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                <Star className="w-3 h-3 fill-amber-300" /> {avg.toFixed(1)}/5
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
