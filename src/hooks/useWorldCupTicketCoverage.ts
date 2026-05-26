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
  // Event-model fields
  event_name: string | null;
  event_slug: string | null;
  event_time: string | null;
  event_status: string | null;
  home_label: string | null;
  away_label: string | null;
  ticket_source_type: string | null;
  image_url: string | null;
  last_price_check: string | null;
};

const KIND_RANK: Record<string, number> = { official: 0, hospitality: 1, resale: 2, affiliate: 3 };

export type GroupedWCEvent = {
  key: string;
  event_name: string | null;
  event_slug: string | null;
  event_date: string | null;
  event_time: string | null;
  event_status: string | null;
  home_label: string | null;
  away_label: string | null;
  stadium_name: string;
  stadium_slug: string;
  city: string | null;
  country: string | null;
  image_url: string | null;
  best_price: number | null;
  currency: string;
  providers: WCTicketCoverage[];
  primary: WCTicketCoverage;
};

export const groupCoverageByEvent = (rows: WCTicketCoverage[]): GroupedWCEvent[] => {
  const map = new Map<string, WCTicketCoverage[]>();
  for (const r of rows) {
    const key = r.event_slug ?? `stadium:${r.stadium_slug}:${r.id}`;
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([key, group]) => {
    const sorted = group.slice().sort((a, b) => (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9));
    const primary = sorted[0];
    const prices = group.map((g) => g.starting_price).filter((p): p is number => p != null);
    const best_price = prices.length > 0 ? Math.min(...prices) : null;
    return {
      key,
      event_name: primary.event_name,
      event_slug: primary.event_slug,
      event_date: primary.event_date,
      event_time: primary.event_time,
      event_status: primary.event_status,
      home_label: primary.home_label,
      away_label: primary.away_label,
      stadium_name: primary.stadium_name,
      stadium_slug: primary.stadium_slug,
      city: primary.city,
      country: primary.country,
      image_url: primary.image_url,
      best_price,
      currency: primary.currency,
      providers: sorted,
      primary,
    };
  }).sort((a, b) => {
    const da = a.event_date ?? "9999-12-31";
    const db = b.event_date ?? "9999-12-31";
    return da.localeCompare(db);
  });
};

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

export const useWorldCupEvents = () => {
  const q = useWorldCupTicketCoverage();
  return {
    ...q,
    events: groupCoverageByEvent(q.data ?? []).filter((e) => e.event_slug != null),
  };
};
