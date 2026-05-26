import { Ticket, MapPin, ArrowUpRight, ShieldCheck, CalendarDays, Trophy } from "lucide-react";
import { groupCoverageByEvent, useWorldCupTicketCoverage, type GroupedWCEvent } from "@/hooks/useWorldCupTicketCoverage";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { useLanguage } from "@/i18n/LanguageContext";

const STATUS_LABEL: Record<string, string> = {
  opening_match: "Opening Match",
  group_stage: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter Final",
  semi_final: "Semi Final",
  third_place: "Third Place",
  final: "Final",
};

const SLOT_RE = /^(tbd|tba|winner|runner[- ]?up|loser|group\s+[a-h]\s*(position|pos|runner|winner)?\s*\d*|[a-h][1-4]|w\d+|r\d+|l\d+)$/i;
const isSlotLabel = (s: string | null | undefined): boolean => !s || SLOT_RE.test(s.trim());

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "emerald" | "amber" | "violet" | "sky" }) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-white/80 border-white/15",
    emerald: "bg-emerald-500/90 text-white border-transparent",
    amber: "bg-amber-500/90 text-slate-900 border-transparent",
    violet: "bg-violet-500/90 text-white border-transparent",
    sky: "bg-sky-500/90 text-white border-transparent",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function EventCard({ ev }: { ev: GroupedWCEvent }) {
  const { locale } = useLanguage();
  const p = ev.primary;
  const href = transformAffiliateUrl(p.url);
  const onClick = () =>
    trackAffiliateClick({
      event: "ticket_click",
      destination: p.url,
      provider: p.provider,
      stadiumName: ev.stadium_name,
      league: "FIFA World Cup 2026",
      matchId: ev.match_id ?? ev.event_slug ?? null,
    });

  const matchup = ev.home_label && ev.away_label
    ? `${ev.home_label} vs ${ev.away_label}`
    : ev.event_name ?? (ev.event_status ? STATUS_LABEL[ev.event_status] ?? ev.event_status : "World Cup match");

  const phaseLabel = ev.event_status ? STATUS_LABEL[ev.event_status] ?? ev.event_status : null;
  const isOpening = ev.event_status === "opening_match";
  const isFinal = ev.event_status === "final";
  const hasOfficial = ev.providers.some((x) => x.kind === "official");
  const hasResale = ev.providers.some((x) => x.kind === "resale" || x.kind === "affiliate");
  const freshness = relativeTime(ev.last_price_check);

  const dateStr = ev.event_date
    ? new Date(ev.event_date + (ev.event_time ? `T${ev.event_time}` : "T12:00")).toLocaleDateString(locale, {
        weekday: "short", day: "numeric", month: "short",
      })
    : null;

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      onClick={onClick}
      className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-all flex flex-col"
    >
      {ev.image_url ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-white/5">
          <img src={ev.image_url} alt={matchup} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        </div>
      ) : (
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-emerald-900/40 to-slate-900 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-emerald-400/60" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {isOpening && <Chip tone="amber">Opening</Chip>}
            {isFinal && <Chip tone="violet">Final</Chip>}
            {!isOpening && !isFinal && phaseLabel && <Chip tone="emerald">{phaseLabel}</Chip>}
            {hasOfficial && <Chip tone="sky">Official</Chip>}
            {!hasOfficial && hasResale && <Chip>Resale</Chip>}
            {ev.is_limited && <Chip tone="amber">Limited</Chip>}
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-emerald-300 transition ml-auto shrink-0" />
        </div>
        <div>
          <h3 className="font-display text-lg text-white leading-tight">{matchup}</h3>
          <div className="flex flex-col gap-1 mt-2 text-[11px] text-white/65">
            {dateStr && <p className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {dateStr}</p>}
            <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.stadium_name}{ev.city ? ` · ${ev.city}` : ""}</p>
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50">{p.provider}</p>
            {ev.providers.length > 1 && (
              <p className="text-[10px] text-white/50 mt-0.5">+{ev.providers.length - 1} more</p>
            )}
            {freshness && (
              <p className="text-[10px] text-white/40 mt-0.5">Updated {freshness}</p>
            )}
          </div>
          <div className="text-right">
            {ev.best_price != null ? (
              <>
                <p className="text-[10px] uppercase tracking-wider text-white/50">From</p>
                <p className="font-display text-xl text-emerald-300 leading-none">
                  {ev.best_price.toLocaleString(locale, { style: "currency", currency: ev.currency, maximumFractionDigits: 0 })}
                </p>
              </>
            ) : (
              <p className="text-[11px] font-semibold text-emerald-300">Compare tickets</p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export function WorldCupTicketsSection() {
  const { data = [] } = useWorldCupTicketCoverage();
  const events = groupCoverageByEvent(data).filter((e) => e.event_slug != null && e.is_available !== false);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((ev) => <EventCard key={ev.key} ev={ev} />)}
        </div>
      </div>
    </section>
  );
}

export default WorldCupTicketsSection;
