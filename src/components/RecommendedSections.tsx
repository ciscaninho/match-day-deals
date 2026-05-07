import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Sparkles, Flame, TrendingDown, Trophy, Star, Clock } from "lucide-react";
import { useMemo } from "react";
import { useMatches } from "@/hooks/useMatches";
import { buildRecommendations } from "@/lib/smartSearch";
import { useLanguage } from "@/i18n/LanguageContext";

const SECTION_ICON: Record<string, typeof Sparkles> = {
  weekend: Calendar,
  derbies: Flame,
  ucl: Trophy,
  cheapest: TrendingDown,
  value: Star,
  trending: Sparkles,
  local: MapPin,
};

const providerCount = (id: string) => 6 + ((id.charCodeAt(0) ?? 0) % 9);

export const RecommendedSections = () => {
  const { data: matches = [], isLoading } = useMatches();
  const { locale } = useLanguage();

  const sections = useMemo(() => buildRecommendations(matches), [matches]);

  if (isLoading) return null;
  if (sections.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Discover</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-[#2C3E50]">Recommended matches</h2>
          <p className="mt-2 text-sm text-[#2C3E50]/60 max-w-xl mx-auto">
            Smart picks based on availability, atmosphere and best prices right now.
          </p>
        </div>

        <div className="space-y-12">
          {sections.map((sec) => {
            const Icon = SECTION_ICON[sec.id] ?? Sparkles;
            return (
              <div key={sec.id}>
                <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#2ECC71]/15 text-[#27ae60] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-[#2C3E50]">{sec.title}</h3>
                      {sec.subtitle && <p className="text-xs text-[#2C3E50]/55">{sec.subtitle}</p>}
                    </div>
                  </div>
                  <Link to="/matches" className="text-xs font-bold text-[#2C3E50] hover:text-[#2ECC71] inline-flex items-center gap-1">
                    See all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="-mx-5 px-5 overflow-x-auto md:overflow-visible">
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 snap-x snap-mandatory pb-2 md:pb-0">
                    {sec.matches.map((m) => {
                      const providers = providerCount(m.id);
                      return (
                        <Link
                          key={`${sec.id}-${m.id}`}
                          to={`/matches/${m.id}`}
                          className="group shrink-0 snap-start w-[85%] md:w-auto rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#2ECC71]/40 hover:shadow-xl transition flex flex-col"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C3E50]/50">{m.competition}</span>
                            {m.ticketStatus === "on_sale" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <Clock className="w-3 h-3" /> On sale
                              </span>
                            )}
                          </div>
                          <p className="mt-2 font-extrabold text-[#2C3E50] text-base leading-tight">
                            {m.homeTeam} <span className="text-[#2C3E50]/40 font-bold">vs</span> {m.awayTeam}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-xs text-[#2C3E50]/60 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(m.date).toLocaleDateString(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short" })}
                            </span>
                            {m.city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {m.city}
                              </span>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
                            <div>
                              {m.startingPrice != null ? (
                                <p className="text-sm font-extrabold text-[#27ae60]">From €{m.startingPrice}</p>
                              ) : (
                                <p className="text-xs text-[#2C3E50]/50">Coming soon</p>
                              )}
                              <p className="text-[11px] text-[#2C3E50]/55 mt-0.5">{providers} providers</p>
                            </div>
                            <span className="text-xs font-bold text-white bg-[#2ECC71] group-hover:bg-[#27ae60] inline-flex items-center gap-1 px-3 py-2 rounded-lg transition">
                              View <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
