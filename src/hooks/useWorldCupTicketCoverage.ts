import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WCCoverageKind = "official" | "hospitality" | "resale" | "affiliate";

export type WCTicketCoverage = {
  id: string;
  stadium_slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  kind: WCCoverageKind;
  provider: string;
  provider_logo: string | null;
  url: string;
  starting_price: number | null;
  currency: string;
  event_date: string | null;
  label: string | null;
  notes: string | null;
  status: string;
  priority: number;
};

const KIND_RANK: Record<string, number> = { official: 0, hospitality: 1, resale: 2, affiliate: 3 };

export const useWorldCupTicketCoverage = (opts: { adminAll?: boolean } = {}) =>
  useQuery({
    queryKey: ["wc-ticket-coverage", opts.adminAll ? "all" : "active"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<WCTicketCoverage[]> => {
      let q = supabase.from("wc_ticket_coverage" as never).select("*");
      if (!opts.adminAll) q = q.eq("status", "active");
      const { data, error } = await q.order("priority", { ascending: true }).order("starting_price", { ascending: true, nullsFirst: false });
      if (error) throw error;
      const rows = (data ?? []) as WCTicketCoverage[];
      return rows.slice().sort((a, b) => (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9));
    },
  });
