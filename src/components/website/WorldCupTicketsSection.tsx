import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket, MapPin, ArrowRight, ShieldCheck, CalendarDays } from "lucide-react";
import { groupCoverageByEvent, useWorldCupTicketCoverage, type GroupedWCEvent } from "@/hooks/useWorldCupTicketCoverage";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { stadiumImageFor } from "@/lib/stadiumImages";

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

/** Parse "Match 2 Group A" → { matchday: 2, group: "A" }. */
function parseGenericMatchName(name?: string | null): { matchday?: number; group?: string } | null {
  if (!name) return null;
  const m = name.match(/^\s*Match\s+(\d+)\s+Group\s+([A-L])\s*$/i);
  if (!m) return null;
  return { matchday: Number(m[1]), group: m[2].toUpperCase() };
}

/** Friendly headline for a card. Falls back gracefully. */
function buildHeadline(ev: GroupedWCEvent): { primary: string; secondary?: string } {
  const status = ev.event_status ?? "";
  if (status === "opening_match") return { primary: "Opening Match", secondary: "FIFA World Cup 2026" };
  if (status === "final") return { primary: "Final", secondary: "FIFA World Cup 2026" };
  if (status === "third_place") return { primary: "Third-place Playoff" };
  if (status === "semi_final") return { primary: "Semi Final" };
  if (status === "quarter_final") return { primary: "Quarter Final" };
  if (status === "round_of_16") return { primary: "Round of 16" };
  if (status === "round_of_32") return { primary: "Round of 32" };

  // Real teams
  const hasRealTeams = !isSlotLabel(ev.home_label) && !isSlotLabel(ev.away_label);
  if (hasRealTeams) return { primary: `${ev.home_label} vs ${ev.away_label}` };

  // Generic "Match N Group X" → "Group X — Matchday N"
  const parsed = parseGenericMatchName(ev.event_name);
  if (parsed && parsed.group) {
    return {
      primary: `Group ${parsed.group}${parsed.matchday ? ` — Matchday ${parsed.matchday}` : ""}`,
      secondary: "Group Stage",
    };
  }

  if (ev.event_name && !isSlotLabel(ev.event_name)) return { primary: ev.event_name };
  return { primary: PHASE_LABEL[status] ?? "World Cup Match" };
}

/** Robust localized date — never returns "Invalid Date". */
function formatEventDate(iso: string | null, time: string | null, locale: string): string {
  if (!iso) return "Date to be confirmed";
  const datePart = iso.slice(0, 10);
  const timePart = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : null;
  const d = new Date(`${datePart}T${timePart ?? "12:00"}:00`);
  if (Number.isNaN(d.getTime())) return "Date to be confirmed";
  const dateStr = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  return timePart ? `${dateStr} • ${timePart}` : dateStr;
}

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = Date.now() - t;
  if (diff < 0) return null;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// --- Stadium image fallback --------------------------------------------------

type StadiumMedia = { slug: string; hero_image_url: string | null; image_url: string | null; background_image_url: string | null; gallery_images: string[] | null };

function useStadiumMediaMap(slugs: string[]) {
  const key = slugs.slice().sort().join("|");
  return useQuery({
    queryKey: ["wc-stadium-media", key],
    enabled: slugs.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Record<string, string | null>> => {
      const { data, error } = await supabase
        .from("stadiums")
        .select("slug, hero_image_url, image_url, background_image_url, gallery_images")
        .in("slug", slugs);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      for (const s of (data ?? []) as StadiumMedia[]) {
        const gallery = Array.isArray(s.gallery_images) ? s.gallery_images : [];
        map[s.slug] = s.hero_image_url || s.image_url || s.background_image_url || gallery[0] || null;
      }
      return map;
    },
  });
}

// --- UI ----------------------------------------------------------------------

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "emerald" | "amber" | "violet" | "sky" }) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-white/85 border-white/10",
    emerald: "bg-emerald-500/95 text-white border-transparent",
    amber: "bg-amber-400/95 text-slate-900 border-transparent",
    violet: "bg-violet-500/95 text-white border-transparent",
    sky: "bg-sky-500/95 text-white border-transparent",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function EventCard({ ev, stadiumFallback }: { ev: GroupedWCEvent; stadiumFallback: string | null }) {
  const { locale } = useLanguage();
  const p = ev.primary;
  const href = transformAffiliateUrl(p.ticket_url ?? p.url);

  const image = ev.image_url || stadiumFallback || stadiumImageFor(ev.stadium_slug);
  const headline = buildHeadline(ev);
  const dateStr = formatEventDate(ev.event_date, ev.event_time, locale);
  const isOpening = ev.event_status === "opening_match";
  const isFinal = ev.event_status === "final";
  const hasOfficial = ev.providers.some((x) => x.kind === "official");
  const hasResale = ev.providers.some((x) => x.kind === "resale" || x.kind === "affiliate");
  const freshness = relativeTime(ev.last_price_check);

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
      className="group relative rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-emerald-400/50 hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.35)] transition-all duration-300 flex flex-col"
    >
      {/* Hero image — 16:9, gradient overlay, badges on top */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={image}
          alt={`${ev.stadium_name} — ${headline.primary}`}
          loading="lazy"
          className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[700ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/10" />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {isOpening && <Chip tone="amber">Opening</Chip>}
            {isFinal && <Chip tone="violet">Final</Chip>}
            {!isOpening && !isFinal && headline.secondary && <Chip tone="emerald">{headline.secondary}</Chip>}
            {hasOfficial && <Chip tone="sky">Official</Chip>}
            {!hasOfficial && hasResale && <Chip>Resale</Chip>}
          </div>
          {ev.is_limited && <Chip tone="amber">Limited</Chip>}
        </div>
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="font-display text-base sm:text-lg text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {headline.primary}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex flex-col gap-1 text-[11px] text-white/70">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-white/50 shrink-0" />
            <span className="truncate">{dateStr}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-white/50 shrink-0" />
            <span className="truncate">{ev.stadium_name}{ev.city ? ` · ${ev.city}` : ""}</span>
          </p>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-white/10">
          <div className="min-w-0">
            {ev.best_price != null ? (() => {
              const conf = ev.price_confidence ?? "medium";
              const priceStr = ev.best_price.toLocaleString(locale, { style: "currency", currency: ev.currency, maximumFractionDigits: 0 });
              const eyebrow = conf === "high" ? "From" : conf === "medium" ? "From ~" : "Approx.";
              const tip = conf === "high" ? "Verified provider price" : conf === "medium" ? "Detected from provider data" : "Estimated from listing text";
              return (
                <>
                  <p className="text-[9px] uppercase tracking-wider text-white/45">{eyebrow}</p>
                  <p title={tip} className="font-display text-lg text-emerald-300 leading-none">{priceStr}</p>
                </>
              );
            })() : (
              <>
                <p className="text-[9px] uppercase tracking-wider text-white/45">Price</p>
                <p className="text-[12px] font-semibold text-emerald-300 leading-none">Coming soon</p>
              </>
            )}
            {freshness && (
              <p className="text-[9px] text-white/35 mt-1">Updated {freshness}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-white group-hover:text-emerald-300 transition shrink-0">
            Compare tickets
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
  const { data: stadiumMap = {} } = useStadiumMediaMap(slugs);

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
          {events.map((ev) => (
            <EventCard key={ev.key} ev={ev} stadiumFallback={stadiumMap[ev.stadium_slug] ?? null} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default WorldCupTicketsSection;
