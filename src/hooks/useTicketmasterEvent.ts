import { useQuery } from "@tanstack/react-query";

const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY as string | undefined;

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  date?: string;
  venue?: string;
  city?: string;
  minPrice?: number | null;
  currency?: string | null;
}

interface RawEvent {
  id: string;
  name: string;
  url: string;
  dates?: { start?: { dateTime?: string; localDate?: string } };
  priceRanges?: Array<{ min?: number; currency?: string }>;
  _embedded?: {
    venues?: Array<{ name?: string; city?: { name?: string } }>;
  };
}

const mapEvent = (e: RawEvent): TicketmasterEvent => ({
  id: e.id,
  name: e.name,
  url: e.url,
  date: e.dates?.start?.dateTime ?? e.dates?.start?.localDate,
  venue: e._embedded?.venues?.[0]?.name,
  city: e._embedded?.venues?.[0]?.city?.name,
  minPrice: e.priceRanges?.[0]?.min ?? null,
  currency: e.priceRanges?.[0]?.currency ?? null,
});

export const useTicketmasterEvent = (homeTeam?: string, awayTeam?: string) => {
  const enabled = !!API_KEY && !!homeTeam && !!awayTeam;
  return useQuery({
    queryKey: ["ticketmaster", homeTeam, awayTeam],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TicketmasterEvent | null> => {
      const keyword = `${homeTeam} ${awayTeam}`.trim();
      const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
      url.searchParams.set("keyword", keyword);
      url.searchParams.set("classificationName", "soccer");
      url.searchParams.set("size", "5");
      url.searchParams.set("sort", "date,asc");
      url.searchParams.set("apikey", API_KEY!);

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const json = await res.json();
      const events: RawEvent[] | undefined = json?._embedded?.events;
      if (!events || events.length === 0) return null;

      const home = homeTeam!.toLowerCase();
      const away = awayTeam!.toLowerCase();
      const best =
        events.find((e) => {
          const n = e.name.toLowerCase();
          return n.includes(home) && n.includes(away);
        }) ?? events[0];
      return mapEvent(best);
    },
  });
};
