import { MapPin, Users, Building2, Flame, Trophy, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Stadium } from "@/hooks/useStadium";
import { cn } from "@/lib/utils";

type Props = {
  stadium: Stadium;
  showBreadcrumb?: boolean;
  className?: string;
};

/**
 * Premium immersive stadium hero with dark gradient overlay,
 * lazy-loaded responsive background image, and key stats.
 */
export const StadiumHero = ({ stadium, showBreadcrumb = true, className }: Props) => {
  const { t } = useLanguage();
  const heroImg =
    stadium.hero_image_url || stadium.background_image_url || stadium.image_url || null;

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden text-white bg-[#0b1220]",
        className,
      )}
    >
      {/* Background image — lazy loaded via native <img> for perf */}
      {heroImg && (
        <img
          src={heroImg}
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-[1px] opacity-60"
        />
      )}
      {/* Dark premium overlay + glass gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220]/40 via-[#0b1220]/75 to-[#0b1220]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(46,204,113,0.18),transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto px-5 pt-6 pb-8 md:pt-10 md:pb-14">
        {showBreadcrumb && (
          <div className="text-xs text-white/55 mb-4 md:mb-6 truncate">
            <Link to="/" className="hover:text-[#2ECC71]">Home</Link>
            <span className="mx-1.5">/</span>
            <Link to="/stadiums" className="hover:text-[#2ECC71]">
              {t("stadium.explore_stadiums")}
            </Link>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold">
          <Building2 className="w-3.5 h-3.5" /> {stadium.league}
        </div>

        <h1 className="mt-3 text-3xl sm:text-4xl md:text-6xl font-black leading-[1.05] drop-shadow-[0_2px_20px_rgba(0,0,0,0.45)]">
          {stadium.stadium_name}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{stadium.city}, {stadium.country}</span>
          </span>
          {(stadium.club_name || (stadium.clubs && stadium.clubs.length > 0)) && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {stadium.club_name ?? stadium.clubs.join(" · ")}
              </span>
            </span>
          )}
        </div>

        {/* Key stat chips */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Chip
            icon={<Users className="w-3.5 h-3.5" />}
            label={t("stadium.capacity")}
            value={stadium.capacity ? stadium.capacity.toLocaleString() : "—"}
            sub={t("stadium.hero_capacity_short")}
          />
          <Chip
            icon={<Flame className="w-3.5 h-3.5 text-red-300" />}
            label={t("stadium.hero_atmosphere_short")}
            value={stadium.atmosphere_score != null ? stadium.atmosphere_score.toFixed(1) : "—"}
            sub="/10"
          />
          <Chip
            icon={<Trophy className="w-3.5 h-3.5 text-amber-300" />}
            label={t("stadium.popularity")}
            value={stadium.popularity_score != null ? stadium.popularity_score.toFixed(1) : "—"}
            sub="/10"
          />
          <Chip
            icon={<Ticket className="w-3.5 h-3.5 text-[#2ECC71]" />}
            label={t("stadium.value")}
            value={stadium.value_score != null ? stadium.value_score.toFixed(1) : "—"}
            sub="/10"
          />
        </div>
      </div>
    </section>
  );
};

const Chip = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 px-3 py-2.5">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/65 font-bold">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1 flex items-baseline gap-1">
      <span className="text-lg sm:text-xl font-extrabold">{value}</span>
      {sub && <span className="text-[10px] text-white/55 truncate">{sub}</span>}
    </div>
  </div>
);

export default StadiumHero;
