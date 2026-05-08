import { Link } from "react-router-dom";
import { Flame, MapPin, Quote, Star, TrendingUp, Users } from "lucide-react";
import { useStadiumSocialProof } from "@/hooks/useStadiumSocialProof";
import { useLanguage } from "@/i18n/LanguageContext";

type Variant = "light" | "dark";

export const StadiumSocialProof = ({ variant = "light" }: { variant?: Variant }) => {
  const { t, locale } = useLanguage();
  const { data, isLoading } = useStadiumSocialProof();
  if (isLoading || !data) return null;
  const { topReviews, recentVisits, atmospheric, popular } = data;
  if (!topReviews.length && !recentVisits.length && !atmospheric.length && !popular.length) return null;

  const isDark = variant === "dark";
  const sectionBg = isDark ? "bg-[#0b1220] text-white" : "bg-slate-50";
  const eyebrow = isDark ? "text-[#2ECC71]" : "text-[#2ECC71]";
  const heading = isDark ? "text-white" : "text-[#2C3E50]";
  const card = isDark
    ? "rounded-2xl bg-white/[0.04] border border-white/10 p-4"
    : "rounded-2xl bg-white border border-slate-200 p-4";
  const muted = isDark ? "text-white/60" : "text-[#2C3E50]/60";
  const sub = isDark ? "text-white/70" : "text-[#2C3E50]/70";

  return (
    <section className={`py-12 md:py-16 ${sectionBg}`}>
      <div className="max-w-6xl mx-auto px-5 space-y-10">
        <div className="text-center">
          <span className={`text-xs font-bold uppercase tracking-wider ${eyebrow}`}>
            {t("social.eyebrow")}
          </span>
          <h2 className={`mt-2 text-2xl md:text-3xl font-extrabold ${heading}`}>
            {t("social.title")}
          </h2>
          <p className={`mt-2 max-w-2xl mx-auto text-sm ${sub}`}>{t("social.subtitle")}</p>
        </div>

        {atmospheric.length > 0 && (
          <div>
            <div className={`text-xs uppercase tracking-wider ${muted} font-bold mb-3 flex items-center gap-1.5`}>
              <Flame className="w-3.5 h-3.5" /> {t("social.most_atmospheric")}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {atmospheric.map((s) => {
                const bg = s.hero_image_url || s.background_image_url || s.image_url;
                return (
                  <Link
                    key={s.slug}
                    to={`/stadiums/${s.slug}`}
                    className="group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#2ECC71]/30 to-indigo-500/30 aspect-[4/5] hover:-translate-y-0.5 transition-transform"
                  >
                    {bg && (
                      <img src={bg} alt={s.stadium_name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Flame className="w-3 h-3 text-red-300" />
                      {s.atmosphere_score != null ? Number(s.atmosphere_score).toFixed(1) : "—"}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="text-xs font-extrabold leading-tight line-clamp-2">{s.stadium_name}</div>
                      <div className="text-[10px] opacity-80 truncate">{s.city}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {topReviews.length > 0 && (
          <div>
            <div className={`text-xs uppercase tracking-wider ${muted} font-bold mb-3 flex items-center gap-1.5`}>
              <Star className="w-3.5 h-3.5" /> {t("social.top_comments")}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {topReviews.slice(0, 3).map((r) => (
                <Link key={r.id} to={`/stadiums/${r.stadium_slug}`} className={`${card} block hover:border-[#2ECC71]/40 transition`}>
                  <Quote className="w-4 h-4 text-[#2ECC71] mb-2" />
                  <p className={`text-sm ${heading} leading-relaxed line-clamp-4`}>{r.comment}</p>
                  <div className={`mt-3 flex items-center justify-between text-[11px] ${muted}`}>
                    <span className="truncate font-semibold">{r.stadium_name}</span>
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" /> {r.atmosphere}/5
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {popular.length > 0 && (
            <div>
              <div className={`text-xs uppercase tracking-wider ${muted} font-bold mb-3 flex items-center gap-1.5`}>
                <TrendingUp className="w-3.5 h-3.5" /> {t("social.best_rated")}
              </div>
              <ul className="space-y-2">
                {popular.slice(0, 5).map((s, i) => (
                  <li key={s.slug}>
                    <Link to={`/stadiums/${s.slug}`} className={`${card} flex items-center gap-3 hover:border-[#2ECC71]/40 transition`}>
                      <span className={`text-lg font-black ${eyebrow} w-6 text-center shrink-0`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-extrabold ${heading} truncate`}>{s.stadium_name}</div>
                        <div className={`text-[11px] ${muted} truncate`}>{s.city}, {s.country}</div>
                      </div>
                      {s.atmosphere_score != null && (
                        <span className="text-[11px] font-bold text-red-500 inline-flex items-center gap-1 shrink-0">
                          <Flame className="w-3 h-3" /> {Number(s.atmosphere_score).toFixed(1)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentVisits.length > 0 && (
            <div>
              <div className={`text-xs uppercase tracking-wider ${muted} font-bold mb-3 flex items-center gap-1.5`}>
                <Users className="w-3.5 h-3.5" /> {t("social.recent_visits")}
              </div>
              <ul className="space-y-2">
                {recentVisits.slice(0, 5).map((v) => (
                  <li key={v.id}>
                    <Link to={`/stadiums/${v.stadium_slug}`} className={`${card} flex items-center gap-3 hover:border-[#2ECC71]/40 transition`}>
                      <MapPin className="w-4 h-4 text-[#2ECC71] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-extrabold ${heading} truncate`}>{v.stadium_name}</div>
                        <div className={`text-[11px] ${muted} truncate`}>
                          {[v.city, v.country].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <span className={`text-[11px] ${muted} shrink-0`}>
                        {new Date(v.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
