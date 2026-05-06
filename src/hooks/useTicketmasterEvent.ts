import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export const useTicketmasterEvent = (homeTeam?: string, awayTeam?: string) => {
  const enabled = !!homeTeam && !!awayTeam;
  return useQuery({
    queryKey: ["ticketmaster", homeTeam, awayTeam],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TicketmasterEvent | null> => {
      const { data, error } = await supabase.functions.invoke("ticketmaster-event", {
        body: { homeTeam, awayTeam },
      });
      if (error) return null;
      return (data as { event: TicketmasterEvent | null })?.event ?? null;
    },
  });
};
