import { Link, useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  Calendar, MapPin, Trophy, ArrowRight, ShieldCheck, BellRing, ArrowLeft,
  TrendingDown, Heart, Bell, Zap, Check, Flame, Crown, Sparkles, Users,
  Star, Clock, Ticket, BadgeCheck, Building2, Activity, Lightbulb, ChevronRight,
} from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useMatch, useMatches } from "@/hooks/useMatches";
import { useTicketOffers } from "@/hooks/useTicketOffers";
import { useTicketmasterEvent } from "@/hooks/useTicketmasterEvent";
import { useLanguage } from "@/i18n/LanguageContext";

import { useSEO, slugify } from "@/lib/seo";
import { useTrackSheet } from "@/components/track/TrackPriceSheet";
import type { Match } from "@/data/matches";
import { ClubLogo } from "@/components/ClubLogo";
import { StadiumReviews } from "@/components/StadiumReviews";
import { TicketIntelligence } from "@/components/TicketIntelligence";
import { useStadium } from "@/hooks/useStadium";
import { MatchContextLinks } from "@/components/match/MatchContextLinks";
import { ImmersiveMatchHero } from "@/components/match/ImmersiveMatchHero";
import { MatchEmotionalContext } from "@/components/match/MatchEmotionalContext";
import { MatchdayExperience } from "@/components/match/MatchdayExperience";

// ---------- helpers ----------
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtRelative = (iso?: string | null) => {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// Derby detection
const DERBIES: Record<string, string[][]> = {
  default: [
    ["Real Madrid", "Atletico"], ["Real Madrid", "Atlético"], ["Real Madrid", "Barcelona"],
    ["Inter", "Milan"], ["Inter", "AC Milan"], ["AS Roma", "Lazio"], ["Roma", "Lazio"],
    ["Arsenal", "Tottenham"], ["Liverpool", "Everton"], ["Manchester United", "Manchester City"],
    ["Chelsea", "Tottenham"], ["Bayern", "Dortmund"], ["PSG", "Marseille"], ["PSG", "Olympique"],
    ["Boca", "River"], ["Celtic", "Rangers"], ["Galatasaray", "Fenerbahçe"], ["Ajax", "Feyenoord"],
    ["Porto", "Benfica"], ["Sporting", "Benfica"],
  ],
};
const isDerby = (h: string, a: string) =>
  DERBIES.default.some(([x, y]) =>
    (h.toLowerCase().includes(x.toLowerCase()) && a.toLowerCase().includes(y.toLowerCase())) ||
    (h.toLowerCase().includes(y.toLowerCase()) && a.toLowerCase().includes(x.toLowerCase())),
  );

// Stadium meta (best-effort static info; fallbacks are generic)
const STADIUM_META: Record<string, { capacity?: number; atmosphere?: number; bestSections?: string[]; family?: string; bestValue?: string }> = {
  "Santiago Bernabéu": { capacity: 78297, atmosphere: 4.7, bestSections: ["Fondo Sur", "Lateral Bajo"], family: "Anfiteatro", bestValue: "Lateral Alto" },
  "Camp Nou": { capacity: 99354, atmosphere: 4.8, bestSections: ["Gol Sud", "Tribuna"], family: "Lateral", bestValue: "Gol Nord" },
  "Old Trafford": { capacity: 74310, atmosphere: 4.6, bestSections: ["Stretford End", "East Stand"], family: "Family Stand", bestValue: "North Stand Tier 2" },
  "Anfield": { capacity: 61276, atmosphere: 4.9, bestSections: ["The Kop"], family: "Family Park", bestValue: "Sir Kenny Dalglish Stand" },
  "Allianz Arena": { capacity: 75000, atmosphere: 4.7, bestSections: ["Südkurve"], family: "Familienblock", bestValue: "Oberrang Längsseite" },
  "Stadio Olimpico": { capacity: 70634, atmosphere: 4.6, bestSections: ["Curva Sud", "Curva Nord"], family: "Tribuna Tevere", bestValue: "Distinti" },
  "San Siro": { capacity: 75817, atmosphere: 4.8, bestSections: ["Curva Sud", "Curva Nord"], family: "Primo Arancio", bestValue: "Secondo Verde" },
  "Parc des Princes": { capacity: 47929, atmosphere: 4.5, bestSections: ["Auteuil", "Boulogne"], family: "Borelli", bestValue: "Paris Tribune" },
  "Signal Iduna Park": { capacity: 81365, atmosphere: 4.9, bestSections: ["Südtribüne (Yellow Wall)"], family: "Familienblock", bestValue: "Nordtribüne" },
  "Emirates Stadium": { capacity: 60704, atmosphere: 4.4, bestSections: ["North Bank", "Clock End"], family: "Family Enclosure", bestValue: "Upper Tier" },
  "Stamford Bridge": { capacity: 40173, atmosphere: 4.4, bestSections: ["Matthew Harding"], family: "Family Section", bestValue: "Shed End Upper" },
};

const stadiumInfo = (stadium: string) => {
  const key = Object.keys(STADIUM_META).find((k) => stadium.toLowerCase().includes(k.toLowerCase()));
  return key
    ? { name: key, ...STADIUM_META[key] }
    : { name: stadium, capacity: undefined, atmosphere: 4.3, bestSections: ["Behind the goals", "Lower tier"], family: "Family stand", bestValue: "Upper tier sides" };
};

// ---------- small UI primitives ----------
const Chip = ({ icon: Icon, label, tone = "neutral" }: { icon: any; label: string; tone?: "neutral" | "hot" | "official" | "derby" | "premium" }) => {
  const tones: Record<string, string> = {
    neutral: "bg-white/10 text-white/85 border-white/15",
    hot: "bg-red-500/15 text-red-300 border-red-400/30",
    official: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    derby: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    premium: "bg-violet-500/15 text-violet-300 border-violet-400/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
};

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
    <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{label}</div>
    <div className="mt-1.5 text-xl font-extrabold text-white">{value}</div>
    {sub && <div className="text-[11px] text-white/55 mt-0.5">{sub}</div>}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#2ECC71]" /> {title}
      </h2>
      {subtitle && <p className="text-xs text-white/55 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// ---------- page ----------
const WebsiteMatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: match, isLoading } = useMatch(id);
  const { data: allMatches = [] } = useMatches();
  const { data: offers = [] } = useTicketOffers(id);
  const { data: tmEvent } = useTicketmasterEvent(match?.homeTeam ?? "", match?.awayTeam ?? "");
  const { data: dbStadium } = useStadium(match?.stadium);
  const { openTrackSheet } = useTrackSheet();

  const handleTrack = () => match && openTrackSheet({ intent: "track", matchId: match.id, matchLabel: `${match.homeTeam} vs ${match.awayTeam}` });
  const handleSave = () => match && openTrackSheet({ intent: "save", matchId: match.id, matchLabel: `${match.homeTeam} vs ${match.awayTeam}` });

  // Ticket intelligence
  const intel = useMemo(() => {
    const prices = offers.map((o) => o.price).filter((p): p is number => typeof p === "number" && p > 0);
    const tmMin = (tmEvent?.minPrice as number | undefined) ?? null;
    const allPrices = [...prices, ...(tmMin ? [tmMin] : []), ...(match?.startingPrice ? [match.startingPrice] : [])];
    const cheapest = allPrices.length ? Math.min(...allPrices) : null;
    const avg = allPrices.length ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : null;
    const cheapestOffer = offers.filter((o) => o.price === cheapest)[0] ?? null;
    const officialOffer = (match?.ticketSources ?? []).find((s) => s.type === "official") ?? null;
    const lastChecked = offers.length
      ? offers.reduce((latest, o) => (new Date(o.lastCheckedAt) > new Date(latest) ? o.lastCheckedAt : latest), offers[0].lastCheckedAt)
      : null;
    return { cheapest, avg, cheapestOffer, officialOffer, lastChecked, allPrices };
  }, [offers, tmEvent, match]);

  // Related matches
  const related = useMemo(() => {
    if (!match) return { same: [] as Match[], nearby: [] as Match[], similar: [] as Match[] };
    const others = allMatches.filter((m) => m.id !== match.id && new Date(m.date) > new Date());
    const same = others.filter((m) => m.competition === match.competition).slice(0, 3);
    const nearby = others.filter((m) => m.city && m.city === match.city).slice(0, 3);
    const teams = [match.homeTeam, match.awayTeam].map((t) => t.toLowerCase());
    const similar = others.filter((m) => teams.some((t) => m.homeTeam.toLowerCase().includes(t) || m.awayTeam.toLowerCase().includes(t))).slice(0, 3);
    return { same, nearby, similar };
  }, [allMatches, match]);

  const title = match
    ? `${match.homeTeam} vs ${match.awayTeam} tickets — ${match.competition} | Foot Ticket Finder`
    : "Match tickets | Foot Ticket Finder";
  const description = match
    ? `Compare ${match.homeTeam} vs ${match.awayTeam} ticket prices for the ${match.competition} on ${fmtDate(match.date)} at ${match.stadium || match.city}. Official providers only.`
    : "Compare football ticket prices.";
  const canonical = match ? `https://footticketfinder.com/matches/${match.id}` : undefined;

  useSEO({
    title, description, canonical,
    jsonLd: match ? {
      "@context": "https://schema.org", "@type": "SportsEvent",
      name: `${match.homeTeam} vs ${match.awayTeam}`, startDate: match.date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: match.stadium || match.city, address: { "@type": "PostalAddress", addressLocality: match.city, addressCountry: match.country } },
      homeTeam: { "@type": "SportsTeam", name: match.homeTeam },
      awayTeam: { "@type": "SportsTeam", name: match.awayTeam },
    } : undefined,
  });

  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center text-sm text-[#2C3E50]/60">{t("md.loading")}</div>
      </WebsiteLayout>
    );
  }
  if (!match) {
    return (
      <WebsiteLayout>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h1 className="text-2xl font-extrabold text-[#2C3E50]">{t("md.not_found")}</h1>
          <Link to="/matches" className="mt-4 inline-flex items-center gap-2 text-[#2ECC71] font-bold">
            <ArrowLeft className="w-4 h-4" /> {t("md.back_to_matches")}
          </Link>
        </div>
      </WebsiteLayout>
    );
  }

  const fallbackStadium = stadiumInfo(match.stadium || "");
  const stadium = dbStadium
    ? {
        name: dbStadium.stadium_name,
        capacity: dbStadium.capacity ?? fallbackStadium.capacity,
        // normalize DB 0-10 score to 0-5 for legacy displays
        atmosphere: dbStadium.atmosphere_score != null ? dbStadium.atmosphere_score / 2 : fallbackStadium.atmosphere,
        bestSections: dbStadium.best_sections?.length ? dbStadium.best_sections : fallbackStadium.bestSections,
        family: dbStadium.family_section ?? fallbackStadium.family,
        bestValue: fallbackStadium.bestValue,
      }
    : fallbackStadium;
  const derby = isDerby(match.homeTeam, match.awayTeam);
  const onSale = match.ticketStatus === "on_sale";
  const sellingFast = onSale && (intel.cheapest ? intel.cheapest > 80 : false);
  const officialAvail = !!intel.officialOffer || !!match.ticketSources?.length;

  // Recommendations
  const recos = [
    { icon: Flame, title: t("recommendations.best_atmosphere"), desc: `${stadium.bestSections?.[0] ?? "Behind the goal"} — loudest, most passionate area.` },
    { icon: ShieldCheck, title: t("recommendations.best_price"), desc: intel.cheapest ? `From €${intel.cheapest} via ${intel.cheapestOffer?.provider ?? "official channel"}. Verified seller.` : "Wait for official sale to open for guaranteed delivery." },
    { icon: Sparkles, title: t("recommendations.best_value"), desc: `${stadium.bestValue ?? "Upper tier sides"} — great view, mid-range price.` },
    { icon: BadgeCheck, title: t("recommendations.official_provider"), desc: intel.officialOffer ? `${intel.officialOffer.name} (official)` : intel.cheapestOffer?.provider ?? "Ticketmaster (verified)" },
  ];

  return (
    <WebsiteLayout>
      {/* CINEMATIC HERO */}
      <ImmersiveMatchHero match={match} stadium={dbStadium} backHref="/matches" />

      {/* Sticky-feel CTA bar — directly under the hero, mobile-first */}
      <section className="bg-[#06080f] text-white">
        <div className="max-w-5xl mx-auto px-5 pt-4 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sellingFast && <Chip icon={Flame} label={t("md.selling_fast")} tone="hot" />}
            {onSale && <Chip icon={Activity} label={t("md.high_demand")} tone="hot" />}
            {officialAvail && <Chip icon={ShieldCheck} label={t("md.official_tickets")} tone="official" />}
            {!onSale && <Chip icon={Clock} label={t("md.not_on_sale")} tone="neutral" />}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5 sm:gap-3 sm:justify-center">
            <button onClick={handleTrack} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-3 sm:py-2.5 font-bold text-sm transition shadow-lg shadow-[#2ECC71]/20">
              <TrendingDown className="w-4 h-4" /> {t("md.track_price")}
            </button>
            <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white px-5 py-3 sm:py-2.5 font-bold text-sm transition">
              <Heart className="w-4 h-4" /> {t("md.save_match")}
            </button>
          </div>
        </div>
      </section>

      {/* DARK BODY */}
      <div className="bg-[#0b1220] text-white">
        {/* TICKET INTELLIGENCE */}
        <TicketIntelligence
          match={match}
          offers={offers}
          tmEvent={tmEvent ?? null}
          cheapest={intel.cheapest}
          avg={intel.avg}
          lastChecked={intel.lastChecked}
          derby={derby}
          isBigMatch={!!(match.featured || match.priority || derby)}
          stadiumAtmosphere={stadium.atmosphere ?? 4.3}
        />

        <MatchEmotionalContext
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          competition={match.competition}
          stadiumName={match.stadium}
          atmosphereScore={dbStadium?.atmosphere_score ?? null}
          variant="dark"
        />

        <MatchContextLinks
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          stadiumName={match.stadium}
          variant="dark"
        />

        <MatchdayExperience stadium={dbStadium ?? null} fallbackBest={stadium.bestSections} variant="dark" />

        {/* OFFICIAL SALES */}
        <section className="max-w-5xl mx-auto px-5 pb-10">
          <SectionTitle icon={Ticket} title={t("md.official_sales")} subtitle={t("md.official_sales_subtitle")} />
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{t("md.members_presale")}</div>
              <div className="mt-1.5 font-extrabold text-white">{fmtShort(new Date(new Date(match.ticketReleaseDate).getTime() - 5 * 86400000).toISOString())}</div>
              <div className="text-[11px] text-white/55 mt-0.5">{t("md.members_presale_desc")}</div>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">{t("md.public_sale")}</div>
              <div className="mt-1.5 font-extrabold text-white">{fmtShort(match.ticketReleaseDate)}</div>
              <div className="text-[11px] text-white/55 mt-0.5">{t("md.public_sale_desc")}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{t("md.sale_closes")}</div>
              <div className="mt-1.5 font-extrabold text-white">{fmtShort(match.date)}</div>
              <div className="text-[11px] text-white/55 mt-0.5">{t("md.sale_closes_desc")}</div>
            </div>
          </div>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-300 mt-0.5" />
              <div>
                <div className="font-bold">{t("md.hospitality")}</div>
                <div className="text-xs text-white/60 mt-0.5">{t("md.hospitality_desc")}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-300 mt-0.5" />
              <div>
                <div className="font-bold">{t("md.membership_priority")}</div>
                <div className="text-xs text-white/60 mt-0.5">{t("md.membership_priority_desc")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* STADIUM EXPERIENCE */}
        <section className="max-w-5xl mx-auto px-5 pb-10">
          <SectionTitle icon={Building2} title={t("md.stadium_experience")} subtitle={stadium.name} />

          {dbStadium && (
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 mb-3 h-40 md:h-56 bg-cover bg-center"
              style={dbStadium.background_image_url || dbStadium.image_url
                ? { backgroundImage: `url(${dbStadium.background_image_url || dbStadium.image_url})` }
                : { backgroundImage: "linear-gradient(135deg, rgba(46,204,113,0.25), rgba(99,102,241,0.25))" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/40 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-4">
                <div className="text-[10px] uppercase tracking-wider text-white/60 font-bold">{dbStadium.club_name}</div>
                <div className="text-lg md:text-2xl font-extrabold">{dbStadium.stadium_name}</div>
                <div className="text-xs text-white/70">
                  {[dbStadium.city, dbStadium.country].filter(Boolean).join(", ")}
                  {dbStadium.opened_year ? ` · ${t("md.opened")} ${dbStadium.opened_year}` : ""}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label={t("md.capacity")} value={stadium.capacity ? stadium.capacity.toLocaleString() : "—"} sub={t("md.capacity_sub")} />
            <Stat label={t("md.atmosphere")} value={`${stadium.atmosphere?.toFixed(1) ?? "4.3"}/5`} sub={t("md.atmosphere_sub")} />
            <Stat
              label={t("md.accessibility")}
              value={dbStadium?.accessibility_score != null ? `${dbStadium.accessibility_score.toFixed(1)}/10` : "—"}
              sub={t("md.accessibility_sub")}
            />
            <Stat
              label={t("md.family_score")}
              value={dbStadium?.family_friendly_score != null ? `${dbStadium.family_friendly_score.toFixed(1)}/10` : "—"}
              sub={t("md.family_score_sub")}
            />
          </div>

          {dbStadium?.description && (
            <div className="mt-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/75 leading-relaxed">
              {dbStadium.description}
            </div>
          )}

          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
              <Flame className="w-5 h-5 text-red-300 mt-0.5" />
              <div>
                <div className="font-bold">{t("md.best_atmosphere")}</div>
                <div className="text-xs text-white/60 mt-0.5">
                  {dbStadium?.ultras_section ?? stadium.bestSections?.[0] ?? "—"} — {t("md.best_atmosphere_desc")}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-300 mt-0.5" />
              <div>
                <div className="font-bold">{t("md.family_area")}</div>
                <div className="text-xs text-white/60 mt-0.5">{stadium.family ?? "—"} — {t("md.family_area_desc")}</div>
              </div>
            </div>
          </div>

          {dbStadium && (
            <div className="mt-3">
              <Link
                to={`/stadiums/${dbStadium.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2ECC71] hover:text-[#27ae60]"
              >
                {t("md.full_stadium_guide")} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* RECOMMENDATIONS */}
        <section className="max-w-5xl mx-auto px-5 pb-10">
          <SectionTitle icon={Lightbulb} title={t("recommendations.title")} subtitle={t("recommendations.subtitle")} />
          <div className="grid md:grid-cols-2 gap-3">
            {recos.map((r) => (
              <div key={r.title} className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 p-4 flex items-start gap-3 hover:border-[#2ECC71]/40 transition">
                <div className="w-9 h-9 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center shrink-0">
                  <r.icon className="w-4 h-4 text-[#2ECC71]" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">{r.title}</div>
                  <div className="text-xs text-white/65 mt-1">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* STADIUM EXPERIENCE REVIEWS */}
        <StadiumReviews stadium={match.stadium} matchDate={match.date} />
        {(related.same.length + related.nearby.length + related.similar.length) > 0 && (
          <section className="max-w-5xl mx-auto px-5 pb-16">
            <SectionTitle icon={Trophy} title={t("md.related")} subtitle={t("md.related_subtitle")} />
            <div className="grid md:grid-cols-3 gap-3">
              {[...related.similar, ...related.same, ...related.nearby].slice(0, 6).map((m) => (
                <Link key={m.id} to={`/matches/${m.id}`} className="group rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-[#2ECC71]/40 hover:bg-white/[0.06] transition">
                  <div className="text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold">{m.competition}</div>
                  <div className="mt-1.5 font-extrabold text-sm">{m.homeTeam} <span className="text-white/40">vs</span> {m.awayTeam}</div>
                  <div className="text-[11px] text-white/55 mt-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" />{fmtShort(m.date)} · <MapPin className="w-3 h-3" />{m.city}</div>
                  {m.startingPrice && <div className="mt-2 text-xs font-bold text-[#2ECC71]">{t("md.from_price")} €{m.startingPrice}</div>}
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-white/70 group-hover:gap-2 transition-all">{t("md.view_match")} <ChevronRight className="w-3 h-3" /></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CONVERSION FOOTER */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="rounded-3xl bg-gradient-to-br from-[#2ECC71]/15 via-white/[0.04] to-violet-500/10 border border-white/10 p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD93D]/15 border border-[#FFD93D]/30 px-2.5 py-1 text-[10px] font-bold text-[#FFD93D] uppercase tracking-wider">
                <Zap className="w-3 h-3" /> {t("md.tickets_sell_fast")}
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-extrabold">{t("md.never_miss_price")}</h3>
              <p className="mt-1.5 text-sm text-white/70">{t("md.never_miss_desc")}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {[t("md.bullet_free_tracking"), t("md.bullet_alerts"), t("md.bullet_buy")].map((x) => (
                  <li key={x} className="flex items-center gap-2 text-white/85"><Check className="w-4 h-4 text-[#2ECC71]" />{x}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 md:min-w-[220px]">
              <button onClick={handleTrack} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-3.5 font-extrabold text-sm transition shadow-lg shadow-[#2ECC71]/20">
                <Bell className="w-4 h-4" /> {t("md.start_tracking")}
              </button>
              <button onClick={() => navigate("/auth")} className="text-xs text-white/60 hover:text-white">{t("md.have_account")}</button>
            </div>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default WebsiteMatchDetailPage;
