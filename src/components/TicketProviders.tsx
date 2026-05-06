import { ExternalLink, Loader2 } from "lucide-react";
import { useTicketmasterEvent } from "@/hooks/useTicketmasterEvent";

interface Props {
  homeTeam: string;
  awayTeam: string;
  variant?: "light" | "dark";
  compact?: boolean;
}

interface Provider {
  name: string;
  url: string;
  highlight?: boolean;
  meta?: string;
}

const buildSearchUrl = (homeTeam: string, awayTeam: string) => {
  const q = encodeURIComponent(`${homeTeam} ${awayTeam}`);
  return {
    ticketmaster: `https://www.ticketmaster.com/search?q=${q}`,
    stubhub: `https://www.stubhub.com/search?q=${q}`,
    viagogo: `https://www.viagogo.com/ww/Sports-Tickets?keyword=${q}`,
    ticombo: `https://www.ticombo.com/en/search?query=${q}`,
  };
};

export const TicketProviders = ({ homeTeam, awayTeam, variant = "light", compact }: Props) => {
  const { data: tmEvent, isLoading } = useTicketmasterEvent(homeTeam, awayTeam);
  const search = buildSearchUrl(homeTeam, awayTeam);

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
          : undefined,
    },
    { name: "StubHub", url: search.stubhub },
    { name: "Viagogo", url: search.viagogo },
    { name: "Ticombo", url: search.ticombo },
  ];

  const isDark = variant === "dark";

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-xs ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading ticket providers…
      </div>
    );
  }

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid sm:grid-cols-2 gap-3"}>
      {providers.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={[
            "group flex items-center justify-between gap-3 rounded-xl px-4 py-3 font-bold text-sm transition border",
            isDark
              ? "bg-white/10 hover:bg-white/15 border-white/15 text-white"
              : "bg-white hover:border-[#2ECC71]/40 border-slate-200 text-[#2C3E50]",
            p.highlight ? (isDark ? "ring-1 ring-[#2ECC71]/40" : "ring-1 ring-[#2ECC71]/30") : "",
          ].join(" ")}
        >
          <span className="flex flex-col items-start">
            <span>{p.name}</span>
            {p.meta && (
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#2ECC71]" : "text-[#27ae60]"}`}>
                {p.meta}
              </span>
            )}
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </a>
      ))}
    </div>
  );
};
