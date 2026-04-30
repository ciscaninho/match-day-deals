import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TicketOffer {
  id: string;
  matchId: string;
  provider: string;
  providerLogo: string | null;
  price: number | null;
  currency: string;
  category: string | null;
  url: string;
  inStock: boolean;
  lastCheckedAt: string;
}

type Row = {
  id: string;
  match_id: string;
  provider: string;
  provider_logo: string | null;
  price: number | null;
  currency: string;
  category: string | null;
  url: string;
  in_stock: boolean;
  last_checked_at: string;
};

const mapRow = (r: Row): TicketOffer => ({
  id: r.id,
  matchId: r.match_id,
  provider: r.provider,
  providerLogo: r.provider_logo,
  price: r.price,
  currency: r.currency,
  category: r.category,
  url: r.url,
  inStock: r.in_stock,
  lastCheckedAt: r.last_checked_at,
});

export const useTicketOffers = (matchId: string | undefined) =>
  useQuery({
    queryKey: ["ticket_offers", matchId],
    queryFn: async (): Promise<TicketOffer[]> => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from("ticket_offers" as never)
        .select("*")
        .eq("match_id", matchId)
        .order("price", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return ((data ?? []) as Row[]).map(mapRow);
    },
    enabled: !!matchId,
  });
