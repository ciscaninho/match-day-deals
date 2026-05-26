import { useMemo } from "react";
import { Ticket, ArrowRight, ShieldCheck } from "lucide-react";
import { groupCoverageByEvent, useWorldCupTicketCoverage, type GroupedWCEvent } from "@/hooks/useWorldCupTicketCoverage";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { useLanguage } from "@/i18n/LanguageContext";

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

function buildHeadline(ev: GroupedWCEvent) {
  const hasRealTeams = !isSlotLabel(ev.home_label) && !isSlotLabel(ev.away_label);
  const phase = PHASE_LABEL[ev.event_status ?? ""] ?? null;
  if (hasRealTeams) {
    return {
      matchup: { home: ev.home_label!, away: ev.away_label!, homeFlag: flagFor(ev.home_label), awayFlag: flagFor(ev.away_label) },
      primary: `${ev.home_label} vs ${ev.away_label}`,
      secondary: phase ?? undefined,
    };
  }
  if (phase) return { primary: phase, secondary: "FIFA World Cup 2026", matchup: undefined };
  if (ev.event_name && !isSlotLabel(ev.event_name)) return { primary: ev.event_name, matchup: undefined };
  return { primary: "World Cup Match", matchup: undefined };
}

function formatEventDate(iso: string | null, time: string | null, locale: string): string {
  if (!iso) return "Date TBA";
  const datePart = iso.slice(0, 10);
  const timePart = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : null;
  const d = new Date(`${datePart}T${timePart ?? "12:00"}:00`);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  const dateStr = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  return timePart ? `${dateStr} • ${timePart}` : dateStr;
}

// Elegant placeholder when the provider has no image yet — pure CSS, no stock photo.
function HeroPlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-violet-950 flex items-center justify-center">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.4),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.4),transparent_60%)]" />
      <div className="relative text-center px-4">
        <div className="text-4xl mb-2 opacity-80">🏆</div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 font-bold">{label}</p>
      </div>
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "emerald" | "amber" | "violet" | "sky" }) {
  const tones: Record<string, string> = {
    default: "bg-white/15 text-white/90 backdrop-blur-md",
    emerald: "bg-emerald-500/90 text-white",
    amber: "bg-amber-400/95 text-slate-900",
    violet: "bg-violet-500/90 text-white",
    sky: "bg-sky-500/90 text-white",
  };
  return (
    <span className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ${tones[tone]}`}>
      {children}
    </span>
  );
}

function phaseBadge(ev: GroupedWCEvent): { label: string; tone: "amber" | "violet" | "emerald" } | null {
  const s = ev.event_status ?? "";
  if (s === "opening_match") return { label: "Opening Match", tone: "amber" };
  if (s === "final") return { label: "Final", tone: "violet" };
  if (s === "semi_final") return { label: "Semi-final", tone: "violet" };
  if (s === "quarter_final") return { label: "Quarter-final", tone: "violet" };
  if (s === "round_of_16") return { label: "Round of 16", tone: "violet" };
  if (s === "third_place") return { label: "3rd-place", tone: "violet" };
  if (s === "group_stage") return { label: "Group Stage", tone: "emerald" };
  return null;
}

function EventCard({ ev }: { ev: GroupedWCEvent }) {
  const { locale } = useLanguage();
  const p = ev.primary;
  const href = transformAffiliateUrl(p.ticket_url ?? p.url);
  const headline = buildHeadline(ev);
  const dateStr = formatEventDate(ev.event_date, ev.event_time, locale);
  const hasOfficial = ev.providers.some((x) => x.kind === "official");
  const phase = phaseBadge(ev);
  const heroUrl = ev.image_url || p.image_url || null;

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
      data-image-origin={heroUrl ? "provider" : "placeholder"}
      className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 flex flex-col bg-slate-900"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={headline.primary}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[700ms] ease-out"
          />
        ) : (
          <HeroPlaceholder label="World Cup 2026" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5 flex-wrap">
          {phase && <Chip tone={phase.tone}>{phase.label}</Chip>}
          {hasOfficial ? <Chip tone="sky">Official</Chip> : <Chip>Resale</Chip>}
        </div>

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 flex flex-col items-center text-center">
          {headline.matchup ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                {headline.matchup.homeFlag && <span className="text-sm leading-none opacity-90">{headline.matchup.homeFlag}</span>}
                <span className="font-display text-base sm:text-lg text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] line-clamp-1">{headline.matchup.home}</span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">vs</span>
              <div className="flex items-center gap-1.5">
                {headline.matchup.awayFlag && <span className="text-sm leading-none opacity-90">{headline.matchup.awayFlag}</span>}
                <span className="font-display text-base sm:text-lg text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] line-clamp-1">{headline.matchup.away}</span>
              </div>
            </div>
          ) : (
            <h3 className="font-display text-base sm:text-lg text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] line-clamp-2">
              {headline.primary}
            </h3>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-0.5 text-[11px] text-white/85">
          <p className="truncate">🏟 {ev.stadium_name}</p>
          {ev.city && <p className="text-white/65 truncate">📍 {ev.city}</p>}
          <p className="text-white/55 truncate">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 px-4 py-3 bg-slate-900">
        <div className="min-w-0">
          {ev.best_price != null ? (() => {
            const conf = ev.price_confidence ?? "medium";
            const priceStr = ev.best_price.toLocaleString(locale, { style: "currency", currency: ev.currency, maximumFractionDigits: 0 });
            const eyebrow = conf === "estimated" ? "Approx." : "From";
            return (
              <>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">{eyebrow}</p>
                <p className="font-display text-xl text-emerald-300 leading-none mt-0.5">{priceStr}</p>
              </>
            );
          })() : (
            <p className="text-sm font-medium text-emerald-300/90 leading-none">Tickets available</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-[12px] font-semibold text-white/90 shrink-0">
          View tickets
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
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
          {events.map((ev) => <EventCard key={ev.key} ev={ev} />)}
        </div>
      </div>
    </section>
  );
}

export default WorldCupTicketsSection;
