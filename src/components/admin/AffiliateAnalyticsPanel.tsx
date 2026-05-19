import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, MousePointerClick, Building2, Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AFFILIATE_REGISTRY } from "@/lib/affiliate";

interface ClickRow {
  id: string;
  created_at: string;
  event_type: string;
  club_slug: string | null;
  club_name: string | null;
  league: string | null;
  provider: string | null;
  merchant: string | null;
  network: string | null;
  is_tracked: boolean;
  destination: string | null;
}

interface MerchantStat {
  merchant: string;
  network: string;
  clicks: number;
  clubs: Set<string>;
  leagues: Set<string>;
}

interface ClubLite {
  slug: string;
  league: string | null;
}

interface Props {
  clubs?: ClubLite[];
  affiliateClubs?: Set<string>;
}

const StatPill = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1">
    <Icon className="w-3 h-3 text-muted-foreground" />
    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</span>
    <span className="text-xs font-extrabold text-foreground">{value}</span>
  </div>
);

export const AffiliateAnalyticsPanel = ({ clubs = [], affiliateClubs }: Props) => {
  const { data: clicks = [], isLoading } = useQuery({
    queryKey: ["affiliate_clicks_recent"],
    staleTime: 60_000,
    queryFn: async (): Promise<ClickRow[]> => {
      const { data, error } = await supabase
        .from("affiliate_clicks" as never)
        .select("id,created_at,event_type,club_slug,club_name,league,provider,merchant,network,is_tracked,destination")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as ClickRow[];
    },
  });

  const totalLeagues = useMemo(
    () => new Set(clubs.map((c) => c.league).filter(Boolean) as string[]).size,
    [clubs],
  );

  const merchantStats = useMemo(() => {
    const map = new Map<string, MerchantStat>();
    // seed registry so merchants with zero clicks still show
    AFFILIATE_REGISTRY.forEach((p) => {
      map.set(p.merchant, {
        merchant: p.merchant,
        network: p.network,
        clicks: 0,
        clubs: new Set(),
        leagues: new Set(),
      });
    });
    clicks.forEach((c) => {
      if (!c.is_tracked || !c.merchant) return;
      const stat =
        map.get(c.merchant) ?? {
          merchant: c.merchant,
          network: c.network ?? "direct",
          clicks: 0,
          clubs: new Set<string>(),
          leagues: new Set<string>(),
        };
      stat.clicks += 1;
      if (c.club_slug) stat.clubs.add(c.club_slug);
      if (c.league) stat.leagues.add(c.league);
      map.set(c.merchant, stat);
    });
    return [...map.values()].sort((a, b) => b.clicks - a.clicks);
  }, [clicks]);

  const perClub = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; clicks: number; providers: Set<string>; last: string }>();
    clicks.forEach((c) => {
      if (!c.club_slug) return;
      const e =
        map.get(c.club_slug) ?? {
          slug: c.club_slug,
          name: c.club_name ?? c.club_slug,
          clicks: 0,
          providers: new Set<string>(),
          last: c.created_at,
        };
      e.clicks += 1;
      if (c.provider) e.providers.add(c.provider);
      if (c.created_at > e.last) e.last = c.created_at;
      map.set(c.club_slug, e);
    });
    return [...map.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 12);
  }, [clicks]);

  const totals = useMemo(() => {
    const tracked = clicks.filter((c) => c.is_tracked).length;
    return {
      total: clicks.length,
      tracked,
      passthrough: clicks.length - tracked,
      affiliateClubs: affiliateClubs?.size ?? 0,
    };
  }, [clicks, affiliateClubs]);

  return (
    <section className="rounded-xl border border-border bg-background p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-600" />
          <h2 className="text-sm font-extrabold text-foreground">Affiliate analytics</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phase 1</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatPill icon={MousePointerClick} label="Total" value={totals.total} />
          <StatPill icon={MousePointerClick} label="Tracked" value={totals.tracked} />
          <StatPill icon={MousePointerClick} label="Pass-through" value={totals.passthrough} />
          <StatPill icon={Building2} label="Affiliate clubs" value={totals.affiliateClubs} />
        </div>
      </div>

      {/* Per merchant */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-muted/40">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Per merchant</div>
        </div>
        <div className="divide-y divide-border">
          {merchantStats.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No merchants registered.</div>
          ) : (
            merchantStats.map((m) => {
              const coverage = totalLeagues > 0 ? Math.round((m.leagues.size / totalLeagues) * 100) : 0;
              return (
                <div key={m.merchant} className="px-3 py-2 grid grid-cols-2 md:grid-cols-5 gap-2 items-center text-xs">
                  <div className="font-extrabold text-foreground">
                    {m.merchant}
                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">{m.network}</span>
                  </div>
                  <Cell label="Clicks" value={m.clicks} />
                  <Cell label="Clubs" value={m.clubs.size} />
                  <Cell label="Leagues" value={m.leagues.size} />
                  <Cell label="Est. coverage" value={`${coverage}%`} hint={`of ${totalLeagues}`} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Per club (top recent) */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Per club — top recent</div>
          <Globe2 className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-3 text-xs text-muted-foreground">Loading…</div>
          ) : perClub.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No clicks recorded yet.</div>
          ) : (
            perClub.map((c) => {
              const enabled = affiliateClubs?.has(c.slug) ?? false;
              return (
                <div key={c.slug} className="px-3 py-2 grid grid-cols-2 md:grid-cols-5 gap-2 items-center text-xs">
                  <div className="font-bold text-foreground truncate" title={c.name}>{c.name}</div>
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      enabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {enabled ? "affiliate on" : "no affiliate"}
                    </span>
                  </div>
                  <Cell label="Clicks" value={c.clicks} />
                  <Cell label="Providers" value={c.providers.size} />
                  <Cell label="Last click" value={new Date(c.last).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })} />
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Conversion, revenue, EPC and approval rate are recorded but not yet populated — Phase 2 instrumentation only.
      </p>
    </section>
  );
};

const Cell = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-xs font-extrabold text-foreground">
      {value}
      {hint && <span className="ml-1 text-[10px] font-medium text-muted-foreground">{hint}</span>}
    </span>
  </div>
);

export default AffiliateAnalyticsPanel;
