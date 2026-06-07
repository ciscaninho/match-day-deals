import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Trophy, Ticket, Compass, ShieldCheck, Calendar, Clock, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTeamLabel } from "@/lib/tournamentLabels";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";
import { getWorldCup2026Copy, type WorldCup2026Copy } from "@/i18n/worldCup2026";
import { BrandedStadiumImage } from "@/components/stadium/BrandedStadiumImage";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import type { Locale } from "@/i18n/translations";
import type { Database } from "@/integrations/supabase/types";
import { NewsletterCTA } from "@/components/marketing/NewsletterCTA";

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

type WorldCupMatchRow = Pick<
  Database["public"]["Tables"]["matches"]["Row"],
  | "id" | "home_team" | "away_team" | "home_logo" | "away_logo" | "competition"
  | "date" | "stadium" | "city" | "country" | "ticket_status" | "starting_price"
  | "fixture_confidence" | "home_team_status" | "away_team_status"
  | "home_team_projected" | "away_team_projected" | "ticombo_url"
  | "phase" | "group_code" | "matchday"
>;

function useWorldCupMatches() {
  return useQuery<WorldCupMatchRow[]>({
    queryKey: ["wc2026-matches-v2"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,home_team,away_team,home_logo,away_logo,competition,date,stadium,city,country,ticket_status,starting_price,fixture_confidence,home_team_status,away_team_status,home_team_projected,away_team_projected,ticombo_url,phase,group_code,matchday")
        .or("competition.ilike.%world cup%,competition.ilike.%fifa%,competition.ilike.%coupe du monde%,competition.ilike.%mundial%")
        .gte("date", new Date().toISOString())
        .is("archived_at", null)
        .order("date")
        .limit(150);
      return (data as WorldCupMatchRow[] | null) ?? [];
    },
  });
}

const PHASE_ORDER: Record<string, number> = { r32: 1, r16: 2, qf: 3, sf: 4, "3p": 5, final: 6 };

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

// Country flag emojis — keyed by lowercase team name.
const COUNTRY_FLAG: Record<string, string> = {
  argentina: "🇦🇷", australia: "🇦🇺", austria: "🇦🇹", belgium: "🇧🇪", brazil: "🇧🇷",
  cameroon: "🇨🇲", canada: "🇨🇦", chile: "🇨🇱", colombia: "🇨🇴", "costa rica": "🇨🇷",
  croatia: "🇭🇷", denmark: "🇩🇰", ecuador: "🇪🇨", egypt: "🇪🇬", england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  france: "🇫🇷", germany: "🇩🇪", ghana: "🇬🇭", greece: "🇬🇷", iran: "🇮🇷",
  italy: "🇮🇹", japan: "🇯🇵", "ivory coast": "🇨🇮", "côte d'ivoire": "🇨🇮",
  "south korea": "🇰🇷", korea: "🇰🇷", "korea republic": "🇰🇷",
  mexico: "🇲🇽", morocco: "🇲🇦", netherlands: "🇳🇱", nigeria: "🇳🇬", norway: "🇳🇴",
  paraguay: "🇵🇾", peru: "🇵🇪", poland: "🇵🇱", portugal: "🇵🇹", qatar: "🇶🇦",
  "saudi arabia": "🇸🇦", scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", senegal: "🇸🇳", serbia: "🇷🇸", spain: "🇪🇸",
  "south africa": "🇿🇦", sweden: "🇸🇪", switzerland: "🇨🇭", tunisia: "🇹🇳", turkey: "🇹🇷",
  ukraine: "🇺🇦", "united states": "🇺🇸", usa: "🇺🇸", "united states of america": "🇺🇸",
  uruguay: "🇺🇾", wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", uzbekistan: "🇺🇿", jordan: "🇯🇴", "cape verde": "🇨🇻",
  "bosnia and herzegovina": "🇧🇦", panama: "🇵🇦", curacao: "🇨🇼", curaçao: "🇨🇼",
  haiti: "🇭🇹", "new zealand": "🇳🇿", "dr congo": "🇨🇩", russia: "🇷🇺",
  algeria: "🇩🇿", "czech republic": "🇨🇿", czechia: "🇨🇿", iraq: "🇮🇶",
};
const flagFor = (label?: string | null): string => {
  if (!label) return "";
  return COUNTRY_FLAG[label.trim().toLowerCase()] ?? "🌐";
};

// ISO 3166-1 alpha-2 codes for circular flag images (flagcdn.com).
const COUNTRY_ISO: Record<string, string> = {
  argentina: "ar", australia: "au", austria: "at", belgium: "be", brazil: "br",
  cameroon: "cm", canada: "ca", chile: "cl", colombia: "co", "costa rica": "cr",
  croatia: "hr", denmark: "dk", ecuador: "ec", egypt: "eg", england: "gb-eng",
  france: "fr", germany: "de", ghana: "gh", greece: "gr", iran: "ir",
  italy: "it", japan: "jp", "ivory coast": "ci", "côte d'ivoire": "ci",
  "south korea": "kr", korea: "kr", "korea republic": "kr",
  mexico: "mx", morocco: "ma", netherlands: "nl", nigeria: "ng", norway: "no",
  paraguay: "py", peru: "pe", poland: "pl", portugal: "pt", qatar: "qa",
  "saudi arabia": "sa", scotland: "gb-sct", senegal: "sn", serbia: "rs", spain: "es",
  "south africa": "za", sweden: "se", switzerland: "ch", tunisia: "tn", turkey: "tr",
  ukraine: "ua", "united states": "us", usa: "us", "united states of america": "us",
  uruguay: "uy", wales: "gb-wls", uzbekistan: "uz", jordan: "jo", "cape verde": "cv",
  "bosnia and herzegovina": "ba", panama: "pa", curacao: "cw", "curaçao": "cw",
  haiti: "ht", "new zealand": "nz", "dr congo": "cd", russia: "ru",
  algeria: "dz", "czech republic": "cz", czechia: "cz", iraq: "iq",
};
const isoFor = (label?: string | null): string | null => {
  if (!label) return null;
  return COUNTRY_ISO[label.trim().toLowerCase()] ?? null;
};
const flagImgUrl = (label?: string | null): string | null => {
  const iso = isoFor(label);
  return iso ? `https://flagcdn.com/w160/${iso}.png` : null;
};

function CircleFlag({ label, size = 56 }: { label: string; size?: number }) {
  const url = flagImgUrl(label);
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 ring-2 ring-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.4)] bg-white/95 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={label} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.6 }} aria-hidden>{flagFor(label)}</span>
      )}
    </div>
  );
}

const normalizeCountry = (c: string | null | undefined): string | null => {
  const k = (c ?? "").trim().toLowerCase();
  if (!k) return null;
  if (k.includes("united states") || k === "usa" || k === "us") return "USA";
  if (k.includes("canada")) return "Canada";
  if (k.includes("mexico") || k.includes("méxico")) return "Mexico";
  return c ?? null;
};

type SortKey = "date_asc" | "date_desc" | "price_asc" | "price_desc";

function WorldCupMatchCard({
  match,
  copy,
  locale,
  stadiumImage,
}: {
  match: WorldCupMatchRow;
  copy: WorldCup2026Copy;
  locale: Locale;
  stadiumImage: string | null;
}) {
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
    <article className="group relative rounded-2xl border border-white/10 hover:border-[#2ECC71]/40 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(46,204,113,0.35)] flex flex-col bg-[#0F1A2E]">
      {/* Stadium background */}
      {stadiumImage && (
        <img
          src={stadiumImage}
          alt={match.stadium ?? ""}
          loading="lazy"
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-[1.04] transition-transform duration-[700ms] ease-out"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F1A2E]/70 via-[#0F1A2E]/85 to-[#0F1A2E]/97" />

      <div className="relative flex flex-col h-full">
        <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2ECC71] truncate">{match.competition}</div>
            {match.group_code && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15 backdrop-blur-sm shrink-0">
                {copy.filter_group} {match.group_code}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm shrink-0 ${statusStyles[status]}`}>
            {statusLabel}
          </span>
        </div>

        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-col items-center text-center gap-1.5 min-w-0">
            <CircleFlag label={home} size={52} />
            <p className="font-display text-sm sm:text-base text-white leading-tight line-clamp-2">{home}</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 shrink-0">vs</span>
          <div className="flex-1 flex flex-col items-center text-center gap-1.5 min-w-0">
            <CircleFlag label={away} size={52} />
            <p className="font-display text-sm sm:text-base text-white leading-tight line-clamp-2">{away}</p>
          </div>
        </div>

        <div className="px-4 pb-3 space-y-1 text-xs text-white/75">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-white/50 shrink-0" />
            <span>{dateStr}</span>
            <Clock className="w-3 h-3 text-white/50 shrink-0 ml-1" />
            <span>{timeStr}</span>
          </div>
          {match.stadium && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-white/50 shrink-0" />
              <span className="truncate">
                {match.stadium}
                {match.city ? ` · ${match.city}` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto px-4 pb-4">
          {match.starting_price != null && (
            <p className="mb-2 text-sm font-semibold text-[#2ECC71]">
              {(copy.tickets_from ?? "Tickets from")} €{match.starting_price}
            </p>
          )}
          <button
            onClick={handleClick}
            disabled={isSoldOut}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
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

  // Map stadium name -> image (for fixture card backgrounds).
  const stadiumImageByName = useMemo(() => {
    const map = new Map<string, string>();
    const norm = (s: string) => s.trim().toLowerCase();
    for (const h of hosts) {
      const img = h.hero_image_url || h.background_image_url || h.image_url;
      if (img && h.stadium_name) map.set(norm(h.stadium_name), img);
    }
    return map;
  }, [hosts]);
  const imageForStadium = (name: string | null | undefined): string | null => {
    if (!name) return null;
    return stadiumImageByName.get(name.trim().toLowerCase()) ?? null;
  };

  const [slide, setSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const id = setInterval(() => setSlide((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(id);
  }, [heroSlides.length]);
  const current = heroSlides[slide];

  const { confirmedMatches, knockoutMatches } = useMemo(() => {
    const confirmed: WorldCupMatchRow[] = [];
    const knockout: WorldCupMatchRow[] = [];
    for (const m of matches) {
      const bothConfirmed = m.home_team_status === "confirmed" && m.away_team_status === "confirmed";
      if (bothConfirmed) confirmed.push(m);
      else if (m.phase && m.phase !== "group") {
        // Hide knockout entries where BOTH teams are unknown.
        if (m.home_team_status === "confirmed" || m.away_team_status === "confirmed") {
          knockout.push(m);
        }
      }
    }
    knockout.sort((a, b) => {
      const pa = PHASE_ORDER[a.phase ?? ""] ?? 99;
      const pb = PHASE_ORDER[b.phase ?? ""] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return { confirmedMatches: confirmed, knockoutMatches: knockout };
  }, [matches]);

  // Filter/sort/search state
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [stadiumFilter, setStadiumFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_asc");

  const teamOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of confirmedMatches) {
      const h = formatTeamLabel({ raw: m.home_team, projected: m.home_team_projected, status: m.home_team_status });
      const a = formatTeamLabel({ raw: m.away_team, projected: m.away_team_projected, status: m.away_team_status });
      if (h) set.add(h);
      if (a) set.add(a);
    }
    return [...set].sort((x, y) => x.localeCompare(y));
  }, [confirmedMatches]);

  const groupOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of confirmedMatches) if (m.group_code) set.add(m.group_code);
    return [...set].sort();
  }, [confirmedMatches]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of confirmedMatches) {
      const n = normalizeCountry(m.country);
      if (n) set.add(n);
    }
    return [...set].sort();
  }, [confirmedMatches]);

  const stadiumOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of confirmedMatches) if (m.stadium) set.add(m.stadium);
    return [...set].sort();
  }, [confirmedMatches]);

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = confirmedMatches.filter((m) => {
      const h = formatTeamLabel({ raw: m.home_team, projected: m.home_team_projected, status: m.home_team_status });
      const a = formatTeamLabel({ raw: m.away_team, projected: m.away_team_projected, status: m.away_team_status });
      if (q && !h.toLowerCase().includes(q) && !a.toLowerCase().includes(q)) return false;
      if (teamFilter !== "all" && h !== teamFilter && a !== teamFilter) return false;
      if (groupFilter !== "all" && m.group_code !== groupFilter) return false;
      if (countryFilter !== "all" && normalizeCountry(m.country) !== countryFilter) return false;
      if (stadiumFilter !== "all" && m.stadium !== stadiumFilter) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case "date_desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "price_asc": {
          const pa = a.starting_price ?? Number.POSITIVE_INFINITY;
          const pb = b.starting_price ?? Number.POSITIVE_INFINITY;
          return pa - pb;
        }
        case "price_desc": {
          const pa = a.starting_price ?? Number.NEGATIVE_INFINITY;
          const pb = b.starting_price ?? Number.NEGATIVE_INFINITY;
          return pb - pa;
        }
        case "date_asc":
        default: return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
    return arr;
  }, [confirmedMatches, search, teamFilter, groupFilter, countryFilter, stadiumFilter, sort]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(12); }, [search, teamFilter, groupFilter, countryFilter, stadiumFilter, sort]);

  const hasFilters = search !== "" || teamFilter !== "all" || groupFilter !== "all" || countryFilter !== "all" || stadiumFilter !== "all";
  const resetFilters = () => {
    setSearch(""); setTeamFilter("all"); setGroupFilter("all"); setCountryFilter("all"); setStadiumFilter("all"); setSort("date_asc");
  };

  const resultsLabel = (filteredMatches.length === 1 ? copy.results_count_one : copy.results_count_other).replace("{count}", String(filteredMatches.length));

  const phaseLabel = (phase: string | null) => {
    switch (phase) {
      case "r32": return copy.phase_r32;
      case "r16": return copy.phase_r16;
      case "qf": return copy.phase_qf;
      case "sf": return copy.phase_sf;
      case "3p": return copy.phase_3p;
      case "final": return copy.phase_final;
      default: return "";
    }
  };

  const roleLabel = (r: string | null) => {
    if (!r) return null;
    const k = r.toLowerCase();
    if (k.includes("opening")) return copy.role_opening;
    if (k.includes("final")) return copy.role_final;
    return copy.role_main;
  };

  const selectCls = "h-10 rounded-lg bg-white/[0.06] border border-white/15 hover:border-white/25 focus:border-[#2ECC71]/60 focus:outline-none text-white text-sm px-3 transition-colors min-w-0";

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
                <a href="#wc-matches" className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71] hover:bg-[#27ae60] text-[#0F1A2E] px-6 py-3 text-sm font-bold transition-all shadow-[0_10px_30px_-10px_rgba(46,204,113,0.6)] hover:-translate-y-0.5">
                  {copy.cta_tickets}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#wc-hosts" className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-all">
                  <Compass className="w-4 h-4" />
                  {copy.cta_explore_hosts}
                </a>
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

        {/* CONFIRMED MATCHES — marketplace */}
        <section id="wc-matches" className="bg-[#0a1220] py-14 sm:py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <Ticket className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{copy.eyebrow}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl text-white mb-3 max-w-3xl leading-tight">{copy.confirmed_section_title}</h2>
            <p className="text-white/65 font-body mb-8 max-w-2xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              {copy.confirmed_section_subtitle}
            </p>

            {/* Filter bar */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 sm:p-5 mb-6 backdrop-blur-sm">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={copy.search_placeholder}
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-white/[0.06] border border-white/15 hover:border-white/25 focus:border-[#2ECC71]/60 focus:outline-none text-white text-sm placeholder:text-white/40 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{copy.filter_team}</span>
                  <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className={selectCls}>
                    <option value="all">{copy.all_teams}</option>
                    {teamOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{copy.filter_group}</span>
                  <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className={selectCls}>
                    <option value="all">{copy.all_groups}</option>
                    {groupOptions.map((g) => <option key={g} value={g}>{copy.filter_group} {g}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{copy.filter_country}</span>
                  <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={selectCls}>
                    <option value="all">{copy.all_countries}</option>
                    {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{copy.filter_stadium}</span>
                  <select value={stadiumFilter} onChange={(e) => setStadiumFilter(e.target.value)} className={selectCls}>
                    <option value="all">{copy.all_stadiums}</option>
                    {stadiumOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{copy.sort_label}</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
                    <option value="date_asc">{copy.sort_date_asc}</option>
                    <option value="date_desc">{copy.sort_date_desc}</option>
                    <option value="price_asc">{copy.sort_price_asc}</option>
                    <option value="price_desc">{copy.sort_price_desc}</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between mb-5 gap-3">
              <p className="text-sm text-white/70">
                <span className="font-display text-lg text-white">{filteredMatches.length}</span>
                <span className="ml-2">{resultsLabel.replace(/^\d+\s*/, "")}</span>
              </p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30 transition-colors"
                >
                  <X className="w-3 h-3" />
                  {copy.reset_filters}
                </button>
              )}
            </div>

            {filteredMatches.length === 0 ? (
              <p className="text-white/60 font-body py-12 text-center">{confirmedMatches.length === 0 ? copy.matches_empty : copy.no_results}</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredMatches.slice(0, visibleCount).map((m) => (
                    <WorldCupMatchCard key={m.id} match={m} copy={copy} locale={locale} stadiumImage={imageForStadium(m.stadium)} />
                  ))}
                </div>
                {visibleCount < filteredMatches.length && (
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

        {/* KNOCKOUT STAGE (TEAMS TBD) */}
        {knockoutMatches.length > 0 && (
          <section className="bg-[#0a1220] py-14 sm:py-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="font-display text-2xl sm:text-4xl text-white mb-2">{copy.knockout_section_title}</h2>
              <p className="text-white/60 font-body mb-8 max-w-2xl">{copy.knockout_section_subtitle}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {knockoutMatches.map((m) => {
                  const d = new Date(m.date);
                  const dateStr = d.toLocaleDateString(locale, { day: "numeric", month: "short" });
                  const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                  return (
                    <article key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2ECC71]">
                        {phaseLabel(m.phase ?? null)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display text-base text-white/85 truncate">
                          {m.home_team_status === "confirmed"
                            ? formatTeamLabel({ raw: m.home_team, projected: m.home_team_projected, status: m.home_team_status })
                            : copy.team_tbd}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 shrink-0">vs</span>
                        <span className="font-display text-base text-white/85 truncate text-right">
                          {m.away_team_status === "confirmed"
                            ? formatTeamLabel({ raw: m.away_team, projected: m.away_team_projected, status: m.away_team_status })
                            : copy.team_tbd}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-white/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          <span>{dateStr}</span>
                          <Clock className="w-3.5 h-3.5 text-white/40 shrink-0 ml-1" />
                          <span>{timeStr}</span>
                        </div>
                        {m.stadium && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <span className="truncate">{m.stadium}{m.city ? ` · ${m.city}` : ""}</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* HOST STADIUMS GRID */}
        <section id="wc-hosts" className="bg-gradient-to-b from-[#0a1220] to-[#0F1A2E] py-16 sm:py-24 border-t border-white/5">
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
                        <img src={bg} alt={s.stadium_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
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

        {/* TICKETS + TRAVEL */}
        <section className="bg-gradient-to-b from-[#0F1A2E] to-[#0a1220] py-16 sm:py-24">
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

        <section className="px-5 sm:px-8 lg:px-12 pb-16">
          <div className="max-w-2xl mx-auto">
            <NewsletterCTA source="world_cup_2026" />
          </div>
        </section>
       </div>
     </WebsiteLayout>
  );
};

export default WorldCup2026Page;
