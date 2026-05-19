import { useMemo, useState } from "react";
import {
  Activity, BadgeCheck, ShieldCheck, Sparkles, Flame, Crown, Clock,
  TrendingDown, ChevronRight, ExternalLink, Ticket, Zap, AlertTriangle,
  Trophy, Heart, Users,
} from "lucide-react";
import type { Match } from "@/data/matches";
import type { TicketOffer } from "@/hooks/useTicketOffers";
import { useLanguage } from "@/i18n/LanguageContext";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";

// ---------- types ----------
type TmEvent = { url?: string; minPrice?: number | null; currency?: string | null } | null | undefined;

type SortKey = "lowest" | "official" | "value" | "premium";

interface ProviderCard {
  key: string;
  name: string;
  url: string;
  type: "official" | "resale" | "partner";
  trusted: boolean;
  price: number | null;
  estimated: boolean;
  inStock: boolean;
  meta?: string;
  availability: "live" | "limited" | "selling_fast" | "unknown" | "out";
  badges: string[]; // i18n keys
  score: { value: number; premium: number };
}

interface Props {
  match: Match;
  offers: TicketOffer[];
  tmEvent: TmEvent;
  cheapest: number | null;
  avg: number | null;
  lastChecked: string | null;
  derby: boolean;
  isBigMatch: boolean;
  stadiumAtmosphere: number;
}

// ---------- helpers ----------
const FALLBACK_PROVIDERS: { key: string; name: string; type: "resale" | "partner"; trusted: boolean; mult: number; build: (q: string) => string }[] = [
  { key: "stubhub",  name: "StubHub",  type: "resale",  trusted: true,  mult: 1.45, build: (q) => `https://www.stubhub.com/search?q=${q}` },
  { key: "viagogo",  name: "Viagogo",  type: "resale",  trusted: false, mult: 1.6,  build: (q) => `https://www.viagogo.com/ww/Sports-Tickets?keyword=${q}` },
  { key: "ticombo",  name: "Ticombo",  type: "resale",  trusted: true,  mult: 1.35, build: (q) => `https://www.ticombo.com/en/search?query=${q}` },
  { key: "seatpick", name: "SeatPick", type: "partner", trusted: true,  mult: 1.2,  build: (q) => `https://seatpick.com/search?q=${q}` },
];

const fmtRel = (iso: string | null, justNow: string, m: string, h: string, d: string) => {
  if (!iso) return justNow;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return justNow;
  if (mins < 60) return `${mins} ${m}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${h}`;
  return `${Math.floor(hrs / 24)}${d}`;
};

const Pill = ({ tone = "neutral", icon: Icon, children }: any) => {
  const tones: Record<string, string> = {
    neutral: "bg-white/10 text-white/85 border-white/15",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    danger: "bg-red-500/15 text-red-300 border-red-400/30",
    premium: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    info: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      {Icon && <Icon className="w-3 h-3" />} {children}
    </span>
  );
};

const ScoreBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
    <div className="flex items-center justify-between">
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/55 font-bold">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-sm font-extrabold text-white">{value}<span className="text-white/40 text-xs font-bold">/100</span></div>
    </div>
    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

// ---------- component ----------
export const TicketIntelligence = ({ match, offers, tmEvent, cheapest, avg, lastChecked, derby, isBigMatch, stadiumAtmosphere }: Props) => {
  const { t } = useLanguage();
  const tr = (k: string, p?: Record<string, any>) => t(`ticket_intel.${k}`, p);
  const [sort, setSort] = useState<SortKey>("lowest");

  // Build provider cards from real data + fallbacks
  const providers: ProviderCard[] = useMemo(() => {
    const cards: ProviderCard[] = [];
    const onSale = match.ticketStatus === "on_sale";
    const baseAnchor = cheapest ?? match.startingPrice ?? (tmEvent?.minPrice ?? null);

    // 1. Official sources (from match.ticketSources)
    (match.ticketSources ?? []).forEach((s, i) => {
      cards.push({
        key: `src-${i}`,
        name: s.name,
        url: s.url,
        type: s.type,
        trusted: true,
        price: s.type === "official" && baseAnchor ? Math.round(baseAnchor * 0.9) : null,
        estimated: true,
        inStock: onSale,
        availability: onSale ? "live" : "unknown",
        badges: [s.type === "official" ? "official" : s.type === "partner" ? "partner" : "resale"],
        score: { value: s.type === "official" ? 95 : 70, premium: s.recommended ? 90 : 60 },
      });
    });

    // 2. Real offers
    offers.forEach((o) => {
      cards.push({
        key: `offer-${o.id}`,
        name: o.provider,
        url: o.url,
        type: "resale",
        trusted: true,
        price: o.price,
        estimated: false,
        inStock: o.inStock,
        availability: o.inStock ? "live" : "out",
        badges: ["live_data"],
        score: { value: o.price ? Math.max(20, 100 - Math.round(((o.price - (cheapest ?? o.price)) / (cheapest ?? o.price)) * 100)) : 50, premium: 65 },
      });
    });

    // 3. Ticketmaster
    if (tmEvent?.url || tmEvent?.minPrice) {
      cards.push({
        key: "tm",
        name: "Ticketmaster",
        url: tmEvent.url ?? `https://www.ticketmaster.com/search?q=${encodeURIComponent(`${match.homeTeam} ${match.awayTeam}`)}`,
        type: "partner",
        trusted: true,
        price: tmEvent.minPrice ?? null,
        estimated: false,
        inStock: true,
        availability: "live",
        badges: ["partner"],
        score: { value: 85, premium: 75 },
      });
    }

    // 4. Fallback resale providers (estimated only when we have an anchor)
    const q = encodeURIComponent(`${match.homeTeam} ${match.awayTeam}`);
    FALLBACK_PROVIDERS.forEach((fp) => {
      if (cards.some((c) => c.name.toLowerCase() === fp.name.toLowerCase())) return;
      const est = baseAnchor ? Math.round(baseAnchor * fp.mult) : null;
      cards.push({
        key: `fb-${fp.key}`,
        name: fp.name,
        url: fp.build(q),
        type: fp.type,
        trusted: fp.trusted,
        price: est,
        estimated: est !== null,
        inStock: onSale,
        availability: onSale ? "live" : "unknown",
        badges: [fp.type === "partner" ? "partner" : "resale"],
        score: { value: est ? Math.max(20, 100 - Math.round(((est - (baseAnchor ?? est)) / (baseAnchor ?? est)) * 100)) : 40, premium: fp.trusted ? 60 : 30 },
      });
    });

    // De-dupe & enrich smart badges
    const minP = cards.reduce<number | null>((m, c) => (c.price != null && (m == null || c.price < m) ? c.price : m), null);
    return cards.map((c) => {
      const badges = [...c.badges];
      if (c.type === "official") badges.unshift("official");
      if (c.price != null && minP != null && c.price === minP) badges.unshift("best_deal");
      if (c.trusted) badges.push("trusted");
      if (isBigMatch && c.type === "resale") badges.push("selling_fast");
      if (!c.inStock) badges.push("limited");
      return { ...c, badges: Array.from(new Set(badges)).slice(0, 4) };
    });
  }, [match, offers, tmEvent, cheapest, isBigMatch]);

  const sorted = useMemo(() => {
    const arr = [...providers];
    if (sort === "lowest") arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "official") arr.sort((a, b) => (a.type === "official" ? -1 : 1) - (b.type === "official" ? -1 : 1));
    if (sort === "value") arr.sort((a, b) => b.score.value - a.score.value);
    if (sort === "premium") arr.sort((a, b) => b.score.premium - a.score.premium);
    return arr;
  }, [providers, sort]);

  // Match intelligence scores
  const intelScores = useMemo(() => {
    const onSale = match.ticketStatus === "on_sale";
    const demand = Math.min(100, (isBigMatch ? 70 : 40) + (derby ? 20 : 0) + (onSale ? 10 : 0));
    const atmosphere = Math.min(100, Math.round(stadiumAtmosphere * 18) + (derby ? 12 : 0));
    const popularity = Math.min(100, (isBigMatch ? 75 : 45) + (derby ? 15 : 0) + (offers.length > 2 ? 10 : 0));
    return { demand, atmosphere, popularity };
  }, [match, derby, isBigMatch, stadiumAtmosphere, offers.length]);

  const cheapestProvider = providers.find((p) => p.price != null && p.price === cheapest);
  const officialProvider = providers.find((p) => p.type === "official");
  const onSale = match.ticketStatus === "on_sale";

  const availabilityLabel =
    match.ticketStatus === "on_sale" ? tr("avail_on_sale")
    : match.ticketStatus === "sold_out" ? tr("avail_sold_out")
    : tr("avail_not_released");

  const lastUpdated = fmtRel(lastChecked, tr("just_now"), tr("min_ago"), "h", "d");

  const badgeMeta = (k: string): { label: string; tone: string; icon: any } => {
    const map: Record<string, { tone: string; icon: any }> = {
      best_deal:    { tone: "success", icon: Sparkles },
      official:     { tone: "premium", icon: ShieldCheck },
      selling_fast: { tone: "danger",  icon: Flame },
      limited:      { tone: "warning", icon: AlertTriangle },
      cheapest:     { tone: "success", icon: TrendingDown },
      trusted:      { tone: "info",    icon: BadgeCheck },
      live_data:    { tone: "success", icon: Zap },
      resale:       { tone: "neutral", icon: Ticket },
      partner:      { tone: "info",    icon: BadgeCheck },
    };
    return { label: tr(`badge_${k}`), ...(map[k] ?? { tone: "neutral", icon: Ticket }) };
  };

  return (
    <section className="max-w-5xl mx-auto px-5 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">
            <Activity className="w-3.5 h-3.5" /> {tr("eyebrow")}
          </span>
          <h2 className="mt-1 text-xl md:text-2xl font-extrabold text-white">{tr("title")}</h2>
          <p className="text-xs text-white/55 mt-1 inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {tr("updated")} {lastUpdated}
          </p>
        </div>
      </div>

      {/* Top intelligence stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-400/30 p-4">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold inline-flex items-center gap-1"><TrendingDown className="w-3 h-3" /> {tr("cheapest")}</div>
          <div className="mt-1.5 text-xl font-extrabold text-white">{cheapest ? `€${cheapest}` : "—"}</div>
          <div className="text-[11px] text-white/60 mt-0.5">{cheapestProvider?.name ?? tr("no_data")}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-bold">{tr("avg_price")}</div>
          <div className="mt-1.5 text-xl font-extrabold text-white">{avg ? `~€${avg}` : "—"}</div>
          <div className="text-[11px] text-white/55 mt-0.5">{avg ? tr("estimated") : tr("awaiting_data")}</div>
        </div>
        <div className="rounded-2xl bg-violet-500/10 border border-violet-400/30 p-4">
          <div className="text-[10px] uppercase tracking-wider text-violet-300 font-bold inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {tr("official_provider")}</div>
          <div className="mt-1.5 text-base font-extrabold text-white truncate">{officialProvider?.name ?? tr("pending")}</div>
          <div className="text-[11px] text-white/55 mt-0.5">{officialProvider ? tr("verified") : tr("check_club_site")}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-bold">{tr("availability")}</div>
          <div className="mt-1.5 text-base font-extrabold text-white">{availabilityLabel}</div>
          <div className="text-[11px] text-white/55 mt-0.5">{onSale ? tr("buy_now") : tr("stay_tuned")}</div>
        </div>
      </div>

      {/* Match intelligence scores */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScoreBar label={tr("demand_score")}     value={intelScores.demand}     icon={Flame}  color="linear-gradient(90deg, #f97316, #ef4444)" />
        <ScoreBar label={tr("atmosphere_score")} value={intelScores.atmosphere} icon={Crown}  color="linear-gradient(90deg, #f59e0b, #ec4899)" />
        <ScoreBar label={tr("popularity_score")} value={intelScores.popularity} icon={Heart}  color="linear-gradient(90deg, #2ECC71, #10b981)" />
      </div>

      {/* Provider cards header + sort */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">{tr("providers_title")}</h3>
          <p className="text-xs text-white/55 mt-0.5">{tr("providers_subtitle", { count: providers.length })}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["lowest", "official", "value", "premium"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition border ${
                sort === k ? "bg-[#2ECC71] text-white border-[#2ECC71]" : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              {tr(`sort_${k}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {sorted.map((p) => (
          <a
            key={p.key}
            href={transformAffiliateUrl(p.url)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 hover:border-[#2ECC71]/40 hover:from-white/[0.08] transition-all duration-300 animate-fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-white truncate">{p.name}</div>
                  {p.type === "official" && <ShieldCheck className="w-3.5 h-3.5 text-violet-300 shrink-0" />}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.badges.map((b) => {
                    const m = badgeMeta(b);
                    return <Pill key={b} tone={m.tone} icon={m.icon}>{m.label}</Pill>;
                  })}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-[#2ECC71] shrink-0 transition" />
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/45 font-bold">
                  {p.estimated ? tr("estimated_from") : tr("from")}
                </div>
                <div className="text-lg font-extrabold text-white">
                  {p.price != null ? `€${p.price}` : tr("check_site")}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] uppercase tracking-wider font-bold ${
                  p.availability === "live" ? "text-emerald-300"
                  : p.availability === "out" ? "text-red-300"
                  : "text-white/45"
                }`}>
                  {p.availability === "live" ? tr("status_available")
                    : p.availability === "out" ? tr("status_unavailable")
                    : tr("status_pending")}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#2ECC71] group-hover:gap-2 transition-all">
                  {tr("view_offer")} <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-white/40 text-center">
        <Users className="w-3 h-3 inline mr-1" /> {tr("disclaimer")}
      </p>
    </section>
  );
};

export default TicketIntelligence;
