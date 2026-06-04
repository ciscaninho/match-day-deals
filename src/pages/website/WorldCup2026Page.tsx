import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Trophy, Ticket, Compass, ShieldCheck, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTeamLabel } from "@/lib/tournamentLabels";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";
import { getWorldCup2026Copy, type WorldCup2026Copy } from "@/i18n/worldCup2026";
import { BrandedStadiumImage } from "@/components/stadium/BrandedStadiumImage";
import { WorldCupTicketsSection } from "@/components/website/WorldCupTicketsSection";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import type { Locale } from "@/i18n/translations";


type Host = {
  slug: string;
  stadium_name: string;
  city: string;
  country: string;
  hero_image_url: string | null;
  background_image_url: string | null;
  image_url: string | null;
  world_cup_role: string | null;
};

function useWorldCupHosts() {
  return useQuery<Host[]>({
    queryKey: ["wc2026-hosts"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,hero_image_url,background_image_url,image_url,world_cup_role")
        .is("archived_at", null)
        .eq("is_world_cup_host", true)
        .eq("publication_status", "published")
        .order("stadium_name");
      return (data as Host[]) ?? [];
    },
  });
}

function useWorldCupMatches() {
  return useQuery({
    queryKey: ["wc2026-matches"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,home_team,away_team,home_logo,away_logo,competition,date,stadium,city,country,ticket_status,starting_price,fixture_confidence,home_team_status,away_team_status,home_team_projected,away_team_projected,ticombo_url" as any)
        .or("competition.ilike.%world cup%,competition.ilike.%fifa%,competition.ilike.%coupe du monde%,competition.ilike.%mundial%")
        .gte("date", new Date().toISOString())
        .is("archived_at", null)
        .eq("fixture_confidence", "confirmed")
        .not("home_team_status", "in", "(tbd,projected)")
        .not("away_team_status", "in", "(tbd,projected)")
        .order("date")
        .limit(32);
      return data ?? [];
    },
  });
}

type StatusKey = "available" | "selling_fast" | "sold_out";

const statusFromRow = (s: string | null | undefined): StatusKey => {
  const k = (s ?? "").toLowerCase();
  if (k.includes("sold")) return "sold_out";
  if (k.includes("fast") || k.includes("low") || k.includes("limited")) return "selling_fast";
  return "available";
};

const statusStyles: Record<StatusKey, string> = {
  available: "bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/30",
  selling_fast: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  sold_out: "bg-red-500/15 text-red-300 border-red-500/30",
};

function WorldCupMatchCard({ match, copy, locale }: { match: any; copy: WorldCup2026Copy; locale: Locale }) {
  const navigate = useNavigate();
  const ticombo: string | null = match.ticombo_url ?? null;
  const status = statusFromRow(match.ticket_status);
  const statusLabel =
    status === "available" ? copy.status_available : status === "selling_fast" ? copy.status_selling_fast : copy.status_sold_out;
  const d = new Date(match.date);
  const dateStr = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const home = formatTeamLabel({ raw: match.home_team, projected: match.home_team_projected, status: match.home_team_status });
  const away = formatTeamLabel({ raw: match.away_team, projected: match.away_team_projected, status: match.away_team_status });
  const isSoldOut = status === "sold_out";

  const handleClick = () => {
    if (ticombo && !isSoldOut) {
      const url = transformAffiliateUrl(ticombo);
      trackAffiliateClick({
        event: "ticket_click",
        destination: ticombo,
        provider: "ticombo",
        stadiumName: match.stadium ?? null,
        league: "FIFA World Cup 2026",
        matchId: match.id,
      });
      window.open(url, "_blank", "noopener");
    } else {
      navigate(`/matches/${match.id}`);
    }
  };

  return (
    <article className="group rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/10 hover:border-[#2ECC71]/40 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(46,204,113,0.35)] flex flex-col">
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2ECC71]">{match.competition}</div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusStyles[status]}`}>
          {statusLabel}
        </span>
      </div>

      <div className="px-5 pb-4 flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center overflow-hidden shrink-0">
            {match.home_logo ? (
              <img src={match.home_logo} alt={home} loading="lazy" className="w-full h-full object-contain p-1.5" />
            ) : (
              <span className="text-sm font-extrabold text-slate-900">{home.slice(0, 3).toUpperCase()}</span>
            )}
          </div>
          <p className="font-display text-base sm:text-lg text-white leading-tight line-clamp-2">{home}</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 shrink-0">vs</span>
        <div className="flex-1 flex flex-col items-center text-center gap-2 min-w-0">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center overflow-hidden shrink-0">
            {match.away_logo ? (
              <img src={match.away_logo} alt={away} loading="lazy" className="w-full h-full object-contain p-1.5" />
            ) : (
              <span className="text-sm font-extrabold text-slate-900">{away.slice(0, 3).toUpperCase()}</span>
            )}
          </div>
          <p className="font-display text-base sm:text-lg text-white leading-tight line-clamp-2">{away}</p>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-1.5 text-sm text-white/75">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <span>{dateStr}</span>
          <Clock className="w-3.5 h-3.5 text-white/50 shrink-0 ml-2" />
          <span>{timeStr}</span>
        </div>
        {match.stadium && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <span className="truncate">
              {match.stadium}
              {match.city ? ` · ${match.city}` : ""}
              {match.country ? `, ${match.country}` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto px-5 pb-5">
        {match.starting_price != null && (
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-bold">{copy.from_label}</span>
            <span className="font-display text-2xl sm:text-3xl text-[#2ECC71] leading-none">€{match.starting_price}</span>
          </div>
        )}
        <button
          onClick={handleClick}
          disabled={isSoldOut}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all ${
            isSoldOut
              ? "bg-white/10 text-white/50 cursor-not-allowed"
              : "bg-[#2ECC71] hover:bg-[#27ae60] text-[#0F1A2E] shadow-[0_10px_24px_-10px_rgba(46,204,113,0.7)] hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          <Ticket className="w-4 h-4" />
          {isSoldOut ? copy.status_sold_out : copy.view_tickets}
          {!isSoldOut && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </div>
    </article>
  );
}


const WorldCup2026Page = () => {
  const { locale, dir } = useLanguage();
  const copy = getWorldCup2026Copy(locale);
  const { data: hosts = [] } = useWorldCupHosts();
  const { data: matches = [] } = useWorldCupMatches();

  useSEO({ title: copy.meta_title, description: copy.meta_description });

  const heroSlides = useMemo(
    () => hosts.filter((h) => h.hero_image_url || h.background_image_url || h.image_url).slice(0, 6),
    [hosts]
  );

  const [slide, setSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const id = setInterval(() => setSlide((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(id);
  }, [heroSlides.length]);

  const current = heroSlides[slide];

  const roleLabel = (r: string | null) => {
    if (!r) return null;
    const k = r.toLowerCase();
    if (k.includes("opening")) return copy.role_opening;
    if (k.includes("final")) return copy.role_final;
    return copy.role_main;
  };

  return (
    <WebsiteLayout>
      <div dir={dir} className="bg-[#0F1A2E] text-white">
        {/* HERO */}
        <section className="relative w-full h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden bg-[#0F1A2E]">
          {heroSlides.map((s, i) => {
            const bg = s.hero_image_url || s.background_image_url || s.image_url || "";
            const active = i === slide;
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
                  imgClassName={active ? "animate-kenburns" : ""}
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
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(15,26,46,0.65)_100%)]" />

          <div className="relative z-10 h-full max-w-6xl mx-auto px-5 sm:px-8 flex flex-col justify-end pb-16 sm:pb-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/15 backdrop-blur-sm border border-[#2ECC71]/40 px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#2ECC71]">
                <Trophy className="w-3 h-3" />
                {copy.eyebrow}
              </div>
              <h1 className="font-display mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white animate-fade-in-up" style={{ fontWeight: 400 }}>
                {copy.hero_title}
              </h1>
              <p className="font-body mt-5 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed">
                {copy.hero_subtitle}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#wc-hosts" className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#0F1A2E] px-6 py-3 text-sm font-bold transition-all shadow-[0_10px_30px_-10px_rgba(46,204,113,0.6)] hover:-translate-y-0.5">
                  {copy.cta_explore_hosts}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link to="/matches" className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-all">
                  <Ticket className="w-4 h-4" />
                  {copy.cta_tickets}
                </Link>
                {current && (
                  <span className="inline-flex items-center gap-2 text-xs text-white/65">
                    <MapPin className="w-3 h-3" />
                    {current.stadium_name} · {current.city}, {current.country}
                  </span>
                )}
              </div>
            </div>

            {heroSlides.length > 1 && (
              <div className="mt-10 flex items-center gap-2">
                {heroSlides.map((s, i) => (
                  <button
                    key={s.slug}
                    onClick={() => setSlide(i)}
                    aria-label={s.stadium_name}
                    className={`h-1 rounded-full transition-all duration-500 ${i === slide ? "w-12 bg-[#2ECC71]" : "w-6 bg-white/30 hover:bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* WORLD CUP TICKETS (independent of fixtures) */}
        <WorldCupTicketsSection />

        {/* HOST STADIUMS GRID */}
        <section id="wc-hosts" className="bg-gradient-to-b from-[#0F1A2E] to-[#0a1220] py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{copy.hosts_eyebrow}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl text-white mb-4 max-w-3xl leading-tight">{copy.hosts_title}</h2>
            <p className="text-slate-300 max-w-2xl mb-10 font-body">{copy.hosts_subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {hosts.map((s) => {
                const role = roleLabel(s.world_cup_role);
                const bg = s.hero_image_url || s.background_image_url || s.image_url;
                return (
                  <Link
                    key={s.slug}
                    to={`/stadiums/${s.slug}`}
                    className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-all"
                  >
                    <div className="aspect-[16/10] bg-slate-800 overflow-hidden relative">
                      {bg ? (
                        <img
                          src={bg}
                          alt={s.stadium_name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      {role && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/90 text-white">
                          {role}
                        </span>
                      )}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-display text-lg sm:text-xl text-white leading-tight">{s.stadium_name}</h3>
                        <p className="text-[11px] text-white/75 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {s.city}, {s.country}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* UPCOMING MATCHES */}
        <section className="bg-[#0a1220] py-16 sm:py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-display text-2xl sm:text-4xl text-white mb-8">{copy.matches_title}</h2>
            {matches.length === 0 ? (
              <p className="text-white/60 font-body">{copy.matches_empty}</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {matches.slice(0, visibleCount).map((m: any) => (
                    <WorldCupMatchCard key={m.id} match={m} copy={copy} locale={locale} />
                  ))}
                </div>
                {visibleCount < matches.length && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={() => setVisibleCount((c) => c + 12)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white px-6 py-3 text-sm font-semibold transition-all"
                    >
                      {copy.load_more}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* TICKETS + TRAVEL */}
        <section className="bg-gradient-to-b from-[#0a1220] to-[#0F1A2E] py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
              <div className="inline-flex items-center gap-2 text-emerald-400 mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Tickets</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-white mb-3">{copy.ticombo_title}</h3>
              <p className="text-white/70 font-body mb-6">{copy.ticombo_subtitle}</p>
              <Link to="/matches" className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#0F1A2E] px-5 py-3 text-sm font-bold transition-all">
                {copy.ticombo_cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
              <div className="inline-flex items-center gap-2 text-emerald-400 mb-3">
                <Compass className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Travel</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-white mb-3">{copy.travel_title}</h3>
              <p className="text-white/70 font-body mb-6">{copy.travel_subtitle}</p>
              <a href="#wc-hosts" className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white px-5 py-3 text-sm font-semibold transition-all">
                {copy.travel_cta} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default WorldCup2026Page;
