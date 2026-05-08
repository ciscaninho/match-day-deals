import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowLeft, Trophy, ShieldCheck } from "lucide-react";
import { ClubLogo } from "@/components/ClubLogo";
import { useLanguage } from "@/i18n/LanguageContext";
import { stadiumImageFor } from "@/lib/stadiumImages";
import type { Stadium } from "@/hooks/useStadium";
import { MatchdayVibes } from "@/components/match/MatchdayVibes";
import { vibesForMatch } from "@/lib/matchdayVibes";

type Props = {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeShort: string;
    awayShort: string;
    homeLogo: string | null;
    awayLogo: string | null;
    competition: string;
    date: string;
    stadium: string;
    city: string;
    country: string;
    featured?: boolean;
    priority?: boolean;
  };
  stadium?: Stadium | null;
  backHref?: string;
};

const fmtDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * Cinematic, emotional match hero.
 * Uses stadium imagery + dark gradients for an editorial, "experience-first" feel.
 * Mobile-first: tight spacing, large team identities, immersive overlay.
 */
export const ImmersiveMatchHero = ({ match, stadium, backHref = "/matches" }: Props) => {
  const { t, locale } = useLanguage();
  const bg = stadiumImageFor(
    match.stadium || match.city || match.id,
    stadium?.hero_image_url,
    stadium?.background_image_url,
    stadium?.image_url,
  );

  const vibes = vibesForMatch(match, stadium ?? undefined);

  return (
    <section className="relative isolate overflow-hidden text-white bg-[#06080f]">
      {/* Cinematic background image */}
      <img
        src={bg}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      {/* Layered overlays for depth + readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080f]/30 via-[#06080f]/80 to-[#06080f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(46,204,113,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(99,102,241,0.18),transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-5 pt-5 pb-8 md:pt-8 md:pb-14">
        {/* Top bar */}
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <Link to={backHref} className="inline-flex items-center gap-1 hover:text-white transition">
            <ArrowLeft className="w-3.5 h-3.5" /> {t("md.breadcrumb_matches")}
          </Link>
          <span className="inline-flex items-center gap-1 text-[#2ECC71] font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> {match.competition}
          </span>
        </div>

        {/* Teams */}
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6 md:gap-10">
          <div className="flex flex-col items-center text-center">
            <ClubLogo logo={match.homeLogo} name={match.homeTeam} short={match.homeShort} />
            <div className="mt-3 text-base sm:text-xl md:text-2xl font-black leading-tight tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)]">
              {match.homeTeam}
            </div>
          </div>
          <div className="text-center px-1">
            <div className="text-3xl sm:text-5xl md:text-6xl font-black text-white/20 leading-none tracking-tighter">
              VS
            </div>
            <div className="mt-2 text-xs sm:text-sm text-white/85 font-bold tabular-nums">
              {fmtTime(match.date)}
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <ClubLogo logo={match.awayLogo} name={match.awayTeam} short={match.awayShort} />
            <div className="mt-3 text-base sm:text-xl md:text-2xl font-black leading-tight tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)]">
              {match.awayTeam}
            </div>
          </div>
        </div>

        {/* Meta strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            {fmtDate(match.date, locale)}
          </span>
          {(match.stadium || match.city) && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{[match.stadium, match.city].filter(Boolean).join(" · ")}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> {t("md.verified_short")}
          </span>
        </div>

        {/* Matchday vibes */}
        {vibes.length > 0 && (
          <div className="mt-5 flex justify-center">
            <MatchdayVibes vibes={vibes} variant="dark" size="sm" showLabel={false} />
          </div>
        )}
      </div>
    </section>
  );
};

export default ImmersiveMatchHero;
