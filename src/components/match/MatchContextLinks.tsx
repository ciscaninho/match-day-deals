import { Link } from "react-router-dom";
import { ArrowRight, Building2, Flame, Shield, Ticket, Users, ExternalLink } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMatchContext } from "@/hooks/useMatchContext";
import { DifficultyBadge } from "@/components/clubs/DifficultyBadge";

type Props = {
  homeTeam: string;
  awayTeam: string;
  stadiumName?: string | null;
  variant?: "light" | "dark";
};

/**
 * Wires a match to its surrounding ecosystem:
 * – linked club guides (home + away)
 * – linked stadium card with atmosphere
 * – official ticketing CTA from the home club
 */
export const MatchContextLinks = ({ homeTeam, awayTeam, stadiumName, variant = "dark" }: Props) => {
  const { t } = useLanguage();
  const { data, isLoading } = useMatchContext({ homeTeam, awayTeam, stadiumName });

  if (isLoading) return null;
  const { homeClub, awayClub, stadium } = data ?? {};
  if (!homeClub && !awayClub && !stadium) return null;

  const isDark = variant === "dark";
  const card = isDark
    ? "rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-[#2ECC71]/40 transition"
    : "rounded-2xl bg-white border border-slate-200 p-4 hover:border-[#2ECC71]/40 hover:shadow-md transition";
  const muted = isDark ? "text-white/60" : "text-[#2C3E50]/60";
  const heading = isDark ? "text-white" : "text-[#2C3E50]";
  const eyebrow = isDark ? "text-white/55" : "text-[#2C3E50]/55";

  return (
    <section className="max-w-5xl mx-auto px-5 pb-8">
      <div className={`text-[10px] uppercase tracking-wider ${eyebrow} font-bold mb-3 flex items-center gap-1.5`}>
        <Shield className="w-3.5 h-3.5" /> {t("match.context.title")}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {homeClub && (
          <Link to={`/clubs/${homeClub.slug}`} className={card}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/15 flex items-center justify-center shrink-0 overflow-hidden">
                {homeClub.logo_url ? (
                  <img src={homeClub.logo_url} alt={homeClub.club_name} className="w-full h-full object-contain" />
                ) : (
                  <Ticket className="w-5 h-5 text-[#2ECC71]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] uppercase tracking-wider font-bold ${eyebrow}`}>
                  {t("match.context.home_guide")}
                </div>
                <div className={`font-extrabold text-sm ${heading} truncate`}>{homeClub.club_name}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <DifficultyBadge level={homeClub.average_difficulty} showLabel={false} />
                  {homeClub.membership_required && (
                    <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 ${isDark ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-700"}`}>
                      <Users className="w-3 h-3" /> {t("clubs.badge.membership")}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 shrink-0 ${muted}`} />
            </div>
          </Link>
        )}

        {awayClub && (
          <Link to={`/clubs/${awayClub.slug}`} className={card}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/15 flex items-center justify-center shrink-0 overflow-hidden">
                {awayClub.logo_url ? (
                  <img src={awayClub.logo_url} alt={awayClub.club_name} className="w-full h-full object-contain" />
                ) : (
                  <Ticket className="w-5 h-5 text-[#2ECC71]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] uppercase tracking-wider font-bold ${eyebrow}`}>
                  {t("match.context.away_guide")}
                </div>
                <div className={`font-extrabold text-sm ${heading} truncate`}>{awayClub.club_name}</div>
                <div className="mt-1.5">
                  <DifficultyBadge level={awayClub.average_difficulty} showLabel={false} />
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 shrink-0 ${muted}`} />
            </div>
          </Link>
        )}

        {stadium && (
          <Link to={`/stadiums/${stadium.slug}`} className={card}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] uppercase tracking-wider font-bold ${eyebrow}`}>
                  {t("match.context.stadium_guide")}
                </div>
                <div className={`font-extrabold text-sm ${heading} truncate`}>{stadium.stadium_name}</div>
                <div className={`text-[11px] ${muted} mt-0.5 truncate`}>{stadium.city}, {stadium.country}</div>
                {stadium.atmosphere_score != null && (
                  <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-red-500/15 text-red-300" : "bg-red-50 text-red-700"}`}>
                    <Flame className="w-3 h-3" /> {Number(stadium.atmosphere_score).toFixed(1)}/10
                  </div>
                )}
              </div>
              <ArrowRight className={`w-4 h-4 shrink-0 ${muted}`} />
            </div>
          </Link>
        )}
      </div>

      {homeClub?.official_ticketing_url && (
        <a
          href={homeClub.official_ticketing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] px-4 py-2.5 text-sm font-bold text-white transition shadow-lg shadow-[#2ECC71]/20"
        >
          <Ticket className="w-4 h-4" />
          {t("match.context.official_cta", { club: homeClub.short_name || homeClub.club_name })}
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      )}
    </section>
  );
};
