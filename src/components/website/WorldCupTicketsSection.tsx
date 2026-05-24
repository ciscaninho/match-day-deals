import { Ticket, MapPin, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useWorldCupTicketCoverage, type WCTicketCoverage } from "@/hooks/useWorldCupTicketCoverage";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { useLanguage } from "@/i18n/LanguageContext";

const KIND_LABEL: Record<string, string> = {
  official: "Official",
  hospitality: "Hospitality",
  resale: "Trusted resale",
  affiliate: "Marketplace",
};

const KIND_CLASS: Record<string, string> = {
  official: "bg-emerald-500/90 text-white",
  hospitality: "bg-amber-500/90 text-white",
  resale: "bg-sky-500/90 text-white",
  affiliate: "bg-violet-500/90 text-white",
};

function CoverageCard({ c }: { c: WCTicketCoverage }) {
  const { locale } = useLanguage();
  const href = transformAffiliateUrl(c.url);
  const onClick = () =>
    trackAffiliateClick({
      event: "ticket_click",
      destination: c.url,
      provider: c.provider,
      stadiumName: c.stadium_name,
      league: "FIFA World Cup 2026",
    });

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      onClick={onClick}
      className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-all flex flex-col"
    >
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${KIND_CLASS[c.kind] ?? "bg-white/10 text-white"}`}>
            {KIND_LABEL[c.kind] ?? c.kind}
          </span>
          <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-emerald-300 transition" />
        </div>
        <div>
          <h3 className="font-display text-lg text-white leading-tight">{c.stadium_name}</h3>
          <p className="text-[11px] text-white/65 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> {[c.city, c.country].filter(Boolean).join(", ")}
          </p>
        </div>
        {c.label && <p className="text-xs text-white/70">{c.label}</p>}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50">{c.provider}</p>
            {c.event_date && (
              <p className="text-[11px] text-white/60 mt-0.5">{new Date(c.event_date).toLocaleDateString(locale)}</p>
            )}
          </div>
          <div className="text-right">
            {c.starting_price != null ? (
              <>
                <p className="text-[10px] uppercase tracking-wider text-white/50">From</p>
                <p className="font-display text-xl text-emerald-300 leading-none">
                  {c.starting_price.toLocaleString(locale, { style: "currency", currency: c.currency, maximumFractionDigits: 0 })}
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
  if (data.length === 0) return null;

  return (
    <section className="bg-[#0a1220] py-16 sm:py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <Ticket className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">World Cup tickets available now</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl text-white mb-4 max-w-3xl leading-tight">
          Secure your seat to football's biggest summer
        </h2>
        <p className="text-slate-300 max-w-2xl mb-8 font-body flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          Verified marketplaces and trusted resale partners. We never sell tickets directly.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.map((c) => <CoverageCard key={c.id} c={c} />)}
        </div>
      </div>
    </section>
  );
}

export default WorldCupTicketsSection;
