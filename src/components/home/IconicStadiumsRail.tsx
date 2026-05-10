import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { useStadiumSocialProof } from "@/hooks/useStadiumSocialProof";
import { useLanguage } from "@/i18n/LanguageContext";
import { stadiumImageFor } from "@/lib/stadiumImages";
import { BrandedStadiumImage } from "@/components/stadium/BrandedStadiumImage";

export const IconicStadiumsRail = () => {
  const { t } = useLanguage();
  const { data } = useStadiumSocialProof();
  const list = (data?.atmospheric ?? []).slice(0, 6);
  if (!list.length) return null;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">{t("home.iconic.eyebrow")}</span>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-[#2C3E50]">{t("home.iconic.title")}</h2>
            <p className="text-sm text-[#2C3E50]/60 mt-1 max-w-xl">{t("home.iconic.subtitle")}</p>
          </div>
          <Link to="/stadiums" className="text-sm font-bold text-[#2C3E50] hover:text-[#2ECC71] inline-flex items-center gap-1.5">
            {t("home.iconic.view_all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {list.map((s) => {
            const bg = stadiumImageFor(s.slug, s.hero_image_url, s.background_image_url, s.image_url);
            return (
              <Link
                key={s.slug}
                to={`/stadiums/${s.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[4/5] hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                <BrandedStadiumImage
                  src={bg}
                  alt={s.stadium_name}
                  seed={s.slug}
                  imgClassName="transition-transform duration-500 group-hover:scale-110"
                  overlay={<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />}
                />
                <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white">
                  <Flame className="w-3 h-3 text-red-300" />
                  {s.atmosphere_score != null ? Number(s.atmosphere_score).toFixed(1) : "—"}
                </div>
                {s.upcoming_count > 0 && (
                  <div className="absolute top-2 left-2 inline-flex items-center rounded-full bg-[#2ECC71]/95 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {t("social.upcoming_count", { count: s.upcoming_count })}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="text-sm font-extrabold leading-tight line-clamp-2">{s.stadium_name}</div>
                  <div className="text-[11px] opacity-80 truncate">{s.city}, {s.country}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
