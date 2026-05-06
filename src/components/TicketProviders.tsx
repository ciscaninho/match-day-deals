import { ExternalLink, Loader2 } from "lucide-react";
import { useTicketmasterEvent } from "@/hooks/useTicketmasterEvent";

interface Props {
  homeTeam?: string | null;
  awayTeam?: string | null;
  variant?: "light" | "dark";
  compact?: boolean;
}

interface Provider {
  name: string;
  url: string;
  highlight?: boolean;
  meta?: string;
}

const buildSearchUrls = (homeTeam: string, awayTeam: string) => {
  const query = `${homeTeam} ${awayTeam}`.trim();
  const q = encodeURIComponent(query);
  return {
    query,
    ticketmaster: `https://www.ticketmaster.com/search?q=${q}`,
    stubhub: `https://www.stubhub.com/search?q=${q}`,
    viagogo: `https://www.viagogo.com/ww/Sports-Tickets?keyword=${q}`,
    ticombo: `https://www.ticombo.com/en/search?query=${q}`,
  };
};

export const TicketProviders = ({ homeTeam, awayTeam, variant = "light", compact }: Props) => {
  const home = (homeTeam ?? "").trim();
  const away = (awayTeam ?? "").trim();
  const isDark = variant === "dark";

  const { data: tmEvent, isLoading: tmLoading } = useTicketmasterEvent(home, away);

  if (!home || !away) {
    return (
      <div className={`text-xs ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
        Match details unavailable — providers cannot be loaded.
      </div>
    );
  }

  const search = buildSearchUrls(home, away);

  const providers: Provider[] = [
    {
      name: "Ticketmaster",
      url: tmEvent?.url ?? search.ticketmaster,
      highlight: !!tmEvent,
      meta:
        tmEvent?.minPrice != null
          ? `From ${tmEvent.currency ?? ""} ${tmEvent.minPrice}`.trim()
          : tmEvent
          ? "Event found"
          : tmLoading
          ? "Checking…"
          : undefined,
    },
    { name: "StubHub", url: search.stubhub },
    { name: "Viagogo", url: search.viagogo },
    { name: "Ticombo", url: search.ticombo },
  ];

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid sm:grid-cols-2 gap-3"}>
      {providers.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`Search ${p.name} tickets for ${search.query}`}
          className={[
            "group flex items-center justify-between gap-3 rounded-xl px-4 py-3 font-bold text-sm transition border",
            isDark
              ? "bg-white/10 hover:bg-white/15 border-white/15 text-white"
              : "bg-white hover:border-[#2ECC71]/40 border-slate-200 text-[#2C3E50]",
            p.highlight ? (isDark ? "ring-1 ring-[#2ECC71]/40" : "ring-1 ring-[#2ECC71]/30") : "",
          ].join(" ")}
        >
          <span className="flex flex-col items-start min-w-0">
            <span className="truncate">{p.name}</span>
            {p.meta && (
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                  isDark ? "text-[#2ECC71]" : "text-[#27ae60]"
                }`}
              >
                {p.name === "Ticketmaster" && tmLoading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                {p.meta}
              </span>
            )}
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
        </a>
      ))}
    </div>
  );
};
