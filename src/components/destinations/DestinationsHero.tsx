import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { useStadiumSocialProof } from "@/hooks/useStadiumSocialProof";
import { useLanguage } from "@/i18n/LanguageContext";
import { stadiumImageFor } from "@/lib/stadiumImages";
import { BrandedStadiumImage } from "@/components/stadium/BrandedStadiumImage";
import { getDestinationsCopy } from "@/i18n/destinationsPage";

/**
 * Cinematic rotating hero for /destinations.
 * Uses approved published stadium media (via useStadiumSocialProof, which
 * already filters to stadiums with upcoming matches).
 * Respects prefers-reduced-motion: no crossfade or ken-burns when set.
 */
export const DestinationsHero = () => {
  const { locale } = useLanguage();
  const copy = getDestinationsCopy(locale);
  const { data } = useStadiumSocialProof();

  const slides = useMemo(() => {
    const merged = [...(data?.popular ?? []), ...(data?.atmospheric ?? [])];
    const seen = new Set<string>();
    return merged
      .filter((s) => {
        if (seen.has(s.slug)) return false;
        seen.add(s.slug);
        return !!(s.hero_image_url || s.background_image_url || s.image_url);
      })
      .slice(0, 6);
  }, [data]);

  const [index, setIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion || paused || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [reducedMotion, paused, slides.length]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(
      () => setHeadlineIndex((i) => (i + 1) % copy.hero_headlines.length),
      6000
    );
    return () => clearInterval(id);
  }, [reducedMotion, copy.hero_headlines.length]);

  const current = slides[index];
  const headline = copy.hero_headlines[headlineIndex] ?? copy.hero_headlines[0];

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden bg-[#0F1A2E] text-white"
    >
      {/* Slides */}
      {slides.map((s, i) => {
        const bg = stadiumImageFor(s.slug, s.hero_image_url, s.background_image_url, s.image_url);
        const active = i === index;
        return (
          <div
            key={s.slug}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${active ? "opacity-100" : "opacity-0"}`}
          >
            <BrandedStadiumImage
              src={bg}
              alt={s.stadium_name}
              seed={s.slug}
              imgClassName={active && !reducedMotion ? "animate-kenburns" : ""}
              overlay={
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0F1A2E]/30 via-[#0F1A2E]/55 to-[#0F1A2E]/95" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F1A2E]/70 via-transparent to-transparent" />
                </>
              }
            />
          </div>
        );
      })}

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(15,26,46,0.65)_100%)]" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-6xl mx-auto px-5 sm:px-8 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/15 backdrop-blur-sm border border-[#2ECC71]/40 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#2ECC71]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
            {copy.eyebrow}
          </div>

          <h1
            key={headlineIndex}
            className="font-display mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white animate-fade-in-up"
            style={{ fontWeight: 400 }}
          >
            {headline}
          </h1>

          <p className="font-body mt-5 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed">
            {copy.hero_subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#featured-destinations"
              className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#0F1A2E] px-6 py-3 text-sm font-bold transition-all shadow-[0_10px_30px_-10px_rgba(46,204,113,0.6)] hover:-translate-y-0.5"
            >
              {copy.cta_explore}
              <ArrowRight className="w-4 h-4" />
            </a>
            {current && (
              <Link
                to={`/stadiums/${current.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[12rem]">{current.stadium_name}</span>
                <span className="text-white/55">·</span>
                <span className="text-white/70 truncate max-w-[10rem]">
                  {current.city}, {current.country}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="mt-10 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.slug}
                onClick={() => setIndex(i)}
                aria-label={`Show ${s.stadium_name}`}
                className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-12 bg-[#2ECC71]" : "w-6 bg-white/30 hover:bg-white/50"}`}
              />
            ))}
            {current?.atmosphere_score != null && (
              <span className="ml-4 inline-flex items-center gap-1 text-[11px] font-bold text-white/70">
                <Flame className="w-3 h-3 text-amber-300" />
                {Number(current.atmosphere_score).toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DestinationsHero;
