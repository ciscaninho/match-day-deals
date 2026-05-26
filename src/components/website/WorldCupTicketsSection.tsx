import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket, MapPin, ArrowRight, ShieldCheck, CalendarDays, Flame, Trophy, Globe2, Star, Target } from "lucide-react";
import { groupCoverageByEvent, useWorldCupTicketCoverage, type GroupedWCEvent } from "@/hooks/useWorldCupTicketCoverage";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

// --- Editorial WC2026 image pool (host cities) ------------------------------
// Used as last resort so cards never collapse onto the same stadium photo.
const EDITORIAL_POOL: string[] = [
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80", // crowd
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80", // pitch
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80", // stadium dusk
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540552103450-1ce63b3eaaee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493673272479-a20888bcee10?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1592231487929-eb45ab1cb0e3?auto=format&fit=crop&w=1200&q=80",
];

// City-keyed editorial overrides (host cities for WC2026).
const CITY_POOL: Record<string, string> = {
  "los angeles": "https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80",
  "new york": "https://images.unsplash.com/photo-1496588152823-86ff7695e68f?auto=format&fit=crop&w=1200&q=80",
  "miami": "https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=1200&q=80",
  "dallas": "https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=1200&q=80",
  "houston": "https://images.unsplash.com/photo-1571415060716-baff5f717066?auto=format&fit=crop&w=1200&q=80",
  "atlanta": "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?auto=format&fit=crop&w=1200&q=80",
  "boston": "https://images.unsplash.com/photo-1501979376754-99ab3a6b8a93?auto=format&fit=crop&w=1200&q=80",
  "philadelphia": "https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?auto=format&fit=crop&w=1200&q=80",
  "kansas city": "https://images.unsplash.com/photo-1568445722683-1f1d9c6c83a9?auto=format&fit=crop&w=1200&q=80",
  "seattle": "https://images.unsplash.com/photo-1502175353174-a7a1f0d7b3a3?auto=format&fit=crop&w=1200&q=80",
  "san francisco": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80",
  "mexico city": "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80",
  "guadalajara": "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80",
  "monterrey": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
  "toronto": "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?auto=format&fit=crop&w=1200&q=80",
  "vancouver": "https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&w=1200&q=80",
};

// Country flag emojis for visible matchup labels.
const COUNTRY_FLAG: Record<string, string> = {
  argentina: "🇦🇷", australia: "🇦🇺", austria: "🇦🇹", belgium: "🇧🇪", brazil: "🇧🇷",
  cameroon: "🇨🇲", canada: "🇨🇦", chile: "🇨🇱", colombia: "🇨🇴", "costa rica": "🇨🇷",
  croatia: "🇭🇷", denmark: "🇩🇰", ecuador: "🇪🇨", egypt: "🇪🇬", england: "🏴",
  france: "🇫🇷", germany: "🇩🇪", ghana: "🇬🇭", greece: "🇬🇷", iran: "🇮🇷",
  italy: "🇮🇹", japan: "🇯🇵", "ivory coast": "🇨🇮", "south korea": "🇰🇷", korea: "🇰🇷",
  mexico: "🇲🇽", morocco: "🇲🇦", netherlands: "🇳🇱", nigeria: "🇳🇬", norway: "🇳🇴",
  paraguay: "🇵🇾", peru: "🇵🇪", poland: "🇵🇱", portugal: "🇵🇹", qatar: "🇶🇦",
  "saudi arabia": "🇸🇦", scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", senegal: "🇸🇳", serbia: "🇷🇸", spain: "🇪🇸",
  "south africa": "🇿🇦", sweden: "🇸🇪", switzerland: "🇨🇭", tunisia: "🇹🇳", turkey: "🇹🇷",
  ukraine: "🇺🇦", "united states": "🇺🇸", usa: "🇺🇸", uruguay: "🇺🇾", wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

const flagFor = (label?: string | null): string => {
  if (!label) return "";
  return COUNTRY_FLAG[label.trim().toLowerCase()] ?? "";
};

// --- Helpers -----------------------------------------------------------------

const PHASE_LABEL: Record<string, string> = {
  opening_match: "Opening Match",
  group_stage: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter Final",
  semi_final: "Semi Final",
  third_place: "Third-place Playoff",
  final: "Final",
};

const SLOT_RE = /^(tbd|tba|winner|runner[- ]?up|loser|group\s+[a-h]\s*(position|pos|runner|winner)?\s*\d*|[a-h][1-4]|w\d+|r\d+|l\d+)$/i;
const isSlotLabel = (s: string | null | undefined): boolean => !s || SLOT_RE.test(s.trim());

function parseGenericMatchName(name?: string | null): { matchday?: number; group?: string } | null {
  if (!name) return null;
  const m = name.match(/^\s*Match\s+(\d+)\s+Group\s+([A-L])\s*$/i);
  if (!m) return null;
  return { matchday: Number(m[1]), group: m[2].toUpperCase() };
}

type Headline = { matchup?: { home: string; away: string; homeFlag: string; awayFlag: string }; primary: string; secondary?: string };

function buildHeadline(ev: GroupedWCEvent): Headline {
  const hasRealTeams = !isSlotLabel(ev.home_label) && !isSlotLabel(ev.away_label);
  const parsed = parseGenericMatchName(ev.event_name);
  const phase = PHASE_LABEL[ev.event_status ?? ""] ?? null;
  const secondary = phase ?? (parsed?.group ? `Group ${parsed.group}${parsed.matchday ? ` — Matchday ${parsed.matchday}` : ""}` : undefined);

  if (hasRealTeams) {
    return {
      matchup: {
        home: ev.home_label!,
        away: ev.away_label!,
        homeFlag: flagFor(ev.home_label),
        awayFlag: flagFor(ev.away_label),
      },
      primary: `${ev.home_label} vs ${ev.away_label}`,
      secondary,
    };
  }
  if (parsed?.group) return { primary: `Group ${parsed.group}${parsed.matchday ? ` — Matchday ${parsed.matchday}` : ""}`, secondary: "Group Stage" };
  if (phase) return { primary: phase, secondary: "FIFA World Cup 2026" };
  if (ev.event_name && !isSlotLabel(ev.event_name)) return { primary: ev.event_name };
  return { primary: "World Cup Match" };
}

function formatEventDate(iso: string | null, time: string | null, locale: string): string {
  if (!iso) return "Date to be confirmed";
  const datePart = iso.slice(0, 10);
  const timePart = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : null;
  const d = new Date(`${datePart}T${timePart ?? "12:00"}:00`);
  if (Number.isNaN(d.getTime())) return "Date to be confirmed";
  const dateStr = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  return timePart ? `${dateStr} • ${timePart}` : dateStr;
}

// --- Stadium media -----------------------------------------------------------

type StadiumMedia = {
  slug: string;
  hero_image_url: string | null;
  image_url: string | null;
  background_image_url: string | null;
  gallery_images: string[] | null;
};

type StadiumAssets = { hero: string | null; gallery: string[] };

function useStadiumAssetsMap(slugs: string[]) {
  const key = slugs.slice().sort().join("|");
  return useQuery({
    queryKey: ["wc-stadium-assets", key],
    enabled: slugs.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Record<string, StadiumAssets>> => {
      const { data, error } = await supabase
        .from("stadiums")
        .select("slug, hero_image_url, image_url, background_image_url, gallery_images")
        .in("slug", slugs);
      if (error) throw error;
      const map: Record<string, StadiumAssets> = {};
      for (const s of (data ?? []) as StadiumMedia[]) {
        const gallery = Array.isArray(s.gallery_images) ? s.gallery_images.filter(Boolean) : [];
        map[s.slug] = {
          hero: s.hero_image_url || s.image_url || s.background_image_url || gallery[0] || null,
          gallery,
        };
      }
      return map;
    },
  });
}

// --- Image distribution algorithm -------------------------------------------
// Goals: no same image twice in a row, same stadium ≤2 consecutive,
// distribute host countries. Returns map keyed by event.key.

type ImageOrigin = "event" | "stadium_hero" | "stadium_gallery" | "city" | "editorial";

function assignImages(
  events: GroupedWCEvent[],
  assets: Record<string, StadiumAssets>,
): Map<string, { url: string; origin: ImageOrigin }> {
  const out = new Map<string, { url: string; origin: ImageOrigin }>();
  const usedCount = new Map<string, number>();
  let prevUrl: string | null = null;
  let prevStadium: string | null = null;
  let prevStadiumStreak = 0;
  let editorialIdx = 0;

  const pick = (url: string | null | undefined, origin: ImageOrigin): { url: string; origin: ImageOrigin } | null => {
    if (!url) return null;
    if (url === prevUrl) return null;
    return { url, origin };
  };

  for (const ev of events) {
    const a = assets[ev.stadium_slug];
    const cityKey = (ev.city ?? "").trim().toLowerCase();
    const cityImg = CITY_POOL[cityKey] ?? null;

    // Build priority candidates
    const stadiumStreakBlocked = prevStadium === ev.stadium_slug && prevStadiumStreak >= 2;
    const candidates: Array<{ url: string | null | undefined; origin: ImageOrigin; isStadium: boolean }> = [];
    candidates.push({ url: ev.image_url, origin: "event", isStadium: false });
    if (!stadiumStreakBlocked) {
      candidates.push({ url: a?.hero, origin: "stadium_hero", isStadium: true });
      for (const g of a?.gallery ?? []) candidates.push({ url: g, origin: "stadium_gallery", isStadium: true });
    }
    candidates.push({ url: cityImg, origin: "city", isStadium: false });

    let chosen: { url: string; origin: ImageOrigin } | null = null;
    let chosenIsStadium = false;
    for (const c of candidates) {
      const got = pick(c.url, c.origin);
      if (got) {
        // Prefer not-yet-used to spread variety
        if ((usedCount.get(got.url) ?? 0) === 0) { chosen = got; chosenIsStadium = c.isStadium; break; }
        if (!chosen) { chosen = got; chosenIsStadium = c.isStadium; }
      }
    }
    if (!chosen) {
      // Editorial fallback — rotate, skip prevUrl
      for (let i = 0; i < EDITORIAL_POOL.length; i++) {
        const url = EDITORIAL_POOL[(editorialIdx + i) % EDITORIAL_POOL.length];
        if (url !== prevUrl) { chosen = { url, origin: "editorial" }; editorialIdx = (editorialIdx + i + 1) % EDITORIAL_POOL.length; break; }
      }
    }
    if (!chosen) chosen = { url: EDITORIAL_POOL[0], origin: "editorial" };

    out.set(ev.key, chosen);
    usedCount.set(chosen.url, (usedCount.get(chosen.url) ?? 0) + 1);
    if (chosenIsStadium && prevStadium === ev.stadium_slug) prevStadiumStreak++;
    else prevStadiumStreak = chosenIsStadium ? 1 : 0;
    prevStadium = chosenIsStadium ? ev.stadium_slug : null;
    prevUrl = chosen.url;
  }
  return out;
}

// --- UI ----------------------------------------------------------------------

function Chip({ children, tone = "default", icon: Icon }: { children: React.ReactNode; tone?: "default" | "emerald" | "amber" | "violet" | "sky" | "rose"; icon?: React.ComponentType<{ className?: string }> }) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-white/85 border-white/10 backdrop-blur",
    emerald: "bg-emerald-500/95 text-white border-transparent",
    amber: "bg-amber-400/95 text-slate-900 border-transparent",
    violet: "bg-violet-500/95 text-white border-transparent",
    sky: "bg-sky-500/95 text-white border-transparent",
    rose: "bg-rose-500/95 text-white border-transparent",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md border ${tones[tone]}`}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {children}
    </span>
  );
}

function signalsFor(ev: GroupedWCEvent): Array<{ key: string; label: string; tone: "amber" | "rose" | "violet" | "emerald" | "sky"; icon: React.ComponentType<{ className?: string }> }> {
  const out: Array<{ key: string; label: string; tone: "amber" | "rose" | "violet" | "emerald" | "sky"; icon: React.ComponentType<{ className?: string }> }> = [];
  if (ev.event_status === "opening_match") out.push({ key: "opening", label: "Opening match", tone: "amber", icon: Star });
  if (ev.event_status === "final") out.push({ key: "final", label: "Final", tone: "violet", icon: Trophy });
  if (ev.event_status === "semi_final") out.push({ key: "semi", label: "Semi-final", tone: "violet", icon: Trophy });
  const host = (ev.country ?? "").toLowerCase();
  if (host === "united states" || host === "usa" || host === "mexico" || host === "canada") {
    out.push({ key: "host", label: "Host nation", tone: "sky", icon: Globe2 });
  }
  if (ev.is_limited) out.push({ key: "limited", label: "Limited", tone: "rose", icon: Target });
  // High demand: knockout phase + price under €200
  if (ev.event_status && ["quarter_final", "semi_final", "final", "round_of_16"].includes(ev.event_status)) {
    out.push({ key: "demand", label: "High demand", tone: "rose", icon: Flame });
  }
  return out.slice(0, 2);
}

function EventCard({ ev, image }: { ev: GroupedWCEvent; image: { url: string; origin: ImageOrigin } }) {
  const { locale } = useLanguage();
  const p = ev.primary;
  const href = transformAffiliateUrl(p.ticket_url ?? p.url);
  const headline = buildHeadline(ev);
  const dateStr = formatEventDate(ev.event_date, ev.event_time, locale);
  const hasOfficial = ev.providers.some((x) => x.kind === "official");
  const hasResale = ev.providers.some((x) => x.kind === "resale" || x.kind === "affiliate");
  const signals = signalsFor(ev);

  const onClick = () =>
    trackAffiliateClick({
      event: "ticket_click",
      destination: p.ticket_url ?? p.url,
      provider: p.provider,
      stadiumName: ev.stadium_name,
      league: "FIFA World Cup 2026",
      matchId: ev.match_id ?? ev.event_slug ?? null,
    });

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      onClick={onClick}
      data-image-origin={image.origin}
      className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400/60 hover:shadow-[0_10px_40px_-12px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col bg-slate-900"
    >
      {/* Background image — full card with strong gradient so the MATCH is the hero */}
      <div className="absolute inset-0">
        <img
          src={image.url}
          alt={headline.primary}
          loading="lazy"
          className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-[700ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/85 to-slate-950" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col gap-3 p-4 min-h-[280px]">
        {/* Top row: phase + signals */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {headline.secondary && <Chip tone="emerald">{headline.secondary}</Chip>}
            {hasOfficial ? <Chip tone="sky">Official</Chip> : hasResale ? <Chip>Resale</Chip> : null}
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {signals.map((s) => (
              <Chip key={s.key} tone={s.tone} icon={s.icon}>{s.label}</Chip>
            ))}
          </div>
        </div>

        {/* Matchup centerpiece */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
          {headline.matchup ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                {headline.matchup.homeFlag && <span className="text-base leading-none">{headline.matchup.homeFlag}</span>}
                <span className="font-display text-lg sm:text-xl text-white leading-tight">{headline.matchup.home}</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">vs</span>
              <div className="flex items-center gap-2">
                {headline.matchup.awayFlag && <span className="text-base leading-none">{headline.matchup.awayFlag}</span>}
                <span className="font-display text-lg sm:text-xl text-white leading-tight">{headline.matchup.away}</span>
              </div>
            </div>
          ) : (
            <h3 className="font-display text-xl sm:text-2xl text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {headline.primary}
            </h3>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1 text-[11px] text-white/75">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-white/50 shrink-0" />
            <span className="truncate">{dateStr}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-white/50 shrink-0" />
            <span className="truncate">{ev.city ? `${ev.city} · ` : ""}{ev.stadium_name}</span>
          </p>
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-white/10">
          <div className="min-w-0">
            {ev.best_price != null ? (() => {
              const conf = ev.price_confidence ?? "medium";
              const priceStr = ev.best_price.toLocaleString(locale, { style: "currency", currency: ev.currency, maximumFractionDigits: 0 });
              const eyebrow = conf === "estimated" ? "Approx." : "From";
              const tip = conf === "high" ? "Verified provider price" : conf === "medium" ? "Detected from provider data" : "Estimated from listing text";
              return (
                <>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">{eyebrow}</p>
                  <p title={tip} className="font-display text-2xl text-emerald-300 leading-none">{priceStr}</p>
                </>
              );
            })() : (
              <>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">Status</p>
                <p className="text-sm font-semibold text-emerald-300 leading-none mt-0.5">Tickets available</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12px] font-semibold text-white shrink-0">
            <span className="group-hover:hidden">View prices</span>
            <span className="hidden group-hover:inline text-emerald-300">Find seats</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </a>
  );
}

export function WorldCupTicketsSection() {
  const { data = [] } = useWorldCupTicketCoverage();
  const events = useMemo(
    () => groupCoverageByEvent(data).filter((e) => e.event_slug != null && e.is_available !== false),
    [data],
  );
  const slugs = useMemo(() => Array.from(new Set(events.map((e) => e.stadium_slug).filter(Boolean))), [events]);
  const { data: assets = {} } = useStadiumAssetsMap(slugs);
  const imageMap = useMemo(() => assignImages(events, assets), [events, assets]);

  if (events.length === 0) return null;

  return (
    <section className="bg-[#0a1220] py-16 sm:py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <Ticket className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Upcoming World Cup events</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl text-white mb-4 max-w-3xl leading-tight">
          Real matches. Real tickets.
        </h2>
        <p className="text-slate-300 max-w-2xl mb-8 font-body flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          Each card is a purchasable event — verified marketplace or official provider. We never sell tickets directly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((ev) => {
            const img = imageMap.get(ev.key) ?? { url: EDITORIAL_POOL[0], origin: "editorial" as const };
            return <EventCard key={ev.key} ev={ev} image={img} />;
          })}
        </div>
      </div>
    </section>
  );
}

export default WorldCupTicketsSection;
