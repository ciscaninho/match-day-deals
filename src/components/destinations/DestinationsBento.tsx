import { Link } from "react-router-dom";
import { ArrowRight, Flame, MapPin, Ticket } from "lucide-react";
import { useStadiumSocialProof, type RankedStadium } from "@/hooks/useStadiumSocialProof";
import { useLanguage } from "@/i18n/LanguageContext";
import { stadiumImageFor } from "@/lib/stadiumImages";
import { BrandedStadiumImage } from "@/components/stadium/BrandedStadiumImage";
import { getDestinationsCopy } from "@/i18n/destinationsPage";

const applyParams = (text: string, params?: Record<string, string | number>) => {
  if (!params) return text;
  let out = text;
  Object.entries(params).forEach(([k, v]) => { out = out.replace(`{${k}}`, String(v)); });
  return out;
};

const Card = ({
  s,
  size,
  upcomingLabel,
}: {
  s: RankedStadium;
  size: "large" | "wide" | "tall" | "small";
  upcomingLabel: string;
}) => {
  const bg = stadiumImageFor(s.slug, s.hero_image_url, s.background_image_url, s.image_url);
  const sizeCls =
    size === "large"
      ? "md:col-span-2 md:row-span-2 aspect-[4/5] md:aspect-auto md:min-h-[520px]"
      : size === "wide"
        ? "md:col-span-2 aspect-[16/9] md:min-h-[240px]"
        : size === "tall"
          ? "md:row-span-2 aspect-[3/4] md:min-h-[520px]"
          : "aspect-[4/5] md:min-h-[240px]";

  const headlineSize =
    size === "large" ? "text-3xl md:text-4xl" : size === "wide" ? "text-2xl md:text-3xl" : "text-lg md:text-xl";

  return (
    <Link
      to={`/stadiums/${s.slug}`}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F1A2E] hover:border-[#2ECC71]/50 transition-all duration-500 ${sizeCls}`}
    >
      <BrandedStadiumImage
        src={bg}
        alt={s.stadium_name}
        seed={s.slug}
        imgClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-110"
        overlay={
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1A2E]/30 via-transparent to-transparent" />
          </>
        }
      />

      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        {s.upcoming_count > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2ECC71]/95 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-[#0F1A2E] shadow-sm">
            <Ticket className="w-3 h-3" />
            {applyParams(upcomingLabel, { count: s.upcoming_count })}
          </span>
        )}
        {s.atmosphere_score != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur border border-white/15 px-2.5 py-1 text-[10px] font-bold text-white">
            <Flame className="w-3 h-3 text-amber-300" />
            {Number(s.atmosphere_score).toFixed(1)}
          </span>
        )}
      </div>

      {/* Bottom editorial copy */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#2ECC71] font-bold mb-2 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {s.city}, {s.country}
        </div>
        <h3 className={`font-display leading-tight tracking-tight ${headlineSize}`} style={{ fontWeight: 400 }}>
          {s.stadium_name}
        </h3>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 group-hover:text-[#2ECC71] transition-colors">
          <span className="font-body">→</span>
          <span className="font-body">Explore</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export const DestinationsBento = () => {
  const { locale } = useLanguage();
  const copy = getDestinationsCopy(locale);
  const { data, isLoading } = useStadiumSocialProof();

  // Merge popular + atmospheric, dedupe by slug, keep 6
  const list: RankedStadium[] = (() => {
    const merged = [...(data?.popular ?? []), ...(data?.atmospheric ?? [])];
    const seen = new Set<string>();
    return merged.filter((s) => {
      if (seen.has(s.slug)) return false;
      seen.add(s.slug);
      return true;
    }).slice(0, 6);
  })();

  return (
    <section id="featured-destinations" className="bg-[#0F1A2E] text-white py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#2ECC71] font-bold mb-3">
              {copy.featured_eyebrow}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight" style={{ fontWeight: 400 }}>
              {copy.featured_title}
            </h2>
            <p className="font-body mt-3 text-sm sm:text-base text-white/65 leading-relaxed">
              {copy.featured_subtitle}
            </p>
          </div>
          <Link
            to="/stadiums"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-[#2ECC71] transition-colors"
          >
            {copy.cta_view_all}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-white/[0.04] border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center text-white/55 text-sm py-20">{copy.no_destinations}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 md:auto-rows-[240px]">
            {list.map((s, i) => {
              // Bento sizing: first card large, then varied
              const size: "large" | "wide" | "tall" | "small" =
                i === 0 ? "large" : i === 3 ? "wide" : i === 1 ? "tall" : "small";
              return <Card key={s.slug} s={s} size={size} upcomingLabel={copy.upcoming_label} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default DestinationsBento;
