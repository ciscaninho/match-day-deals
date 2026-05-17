import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ExternalLink, ShieldCheck, RefreshCcw, BadgeCheck, Sparkles, AlertTriangle,
  Search, TicketX, Users, Ticket as TicketIcon, Wallet, HandCoins, ConciergeBell,
} from "lucide-react";
import { matchesQuery } from "@/lib/normalize";

type Row = {
  slug: string;
  club_name: string;
  short_name: string | null;
  country: string | null;
  city: string | null;
  league: string | null;
  official_ticketing_url: string | null;
  hospitality_url: string | null;
  resale_exchange_available: boolean;
  resale_exchange_url: string | null;
  membership_required: boolean;
  membership_required_for_big_games: boolean;
  verification_status: string;
  source_confidence: string;
  tickets_last_checked_at: string | null;
  publication_status: string;
};

const STALE_DAYS = 90;
type FilterKey = "all" | "missing_official" | "unverified" | "stale";

const isStale = (iso: string | null) => {
  if (!iso) return true;
  const ms = Date.now() - new Date(iso).getTime();
  return ms > STALE_DAYS * 24 * 60 * 60 * 1000;
};

const pct = (num: number, denom: number) => (denom === 0 ? 0 : Math.round((num / denom) * 100));

export const AdminTicketingPage = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-ticketing-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_ticketing_profiles")
        .select(
          "slug,club_name,short_name,country,city,league,official_ticketing_url,hospitality_url,resale_exchange_available,resale_exchange_url,membership_required,membership_required_for_big_games,verification_status,source_confidence,tickets_last_checked_at,publication_status"
        )
        .is("archived_at", null)
        .order("club_name");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  // Source counts via second query (small payload, count only by kind)
  const { data: affiliateClubs = new Set<string>() } = useQuery({
    queryKey: ["admin-ticketing-affiliate-slugs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_sources" as never)
        .select("club_slug,kind,monetization_enabled")
        .eq("monetization_enabled", true);
      const set = new Set<string>();
      ((data ?? []) as Array<{ club_slug: string }>).forEach((r) => set.add(r.club_slug));
      return set;
    },
  });

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const total = rows.length;
    const withOfficial = rows.filter((r) => !!r.official_ticketing_url).length;
    const verified = rows.filter((r) => r.verification_status === "verified").length;
    const hospitality = rows.filter((r) => !!r.hospitality_url).length;
    const resale = rows.filter((r) => r.resale_exchange_available).length;
    const affiliate = rows.filter((r) => affiliateClubs.has(r.slug)).length;
    const missing = rows.filter((r) => !r.official_ticketing_url && !r.resale_exchange_available).length;
    return { total, withOfficial, verified, hospitality, resale, affiliate, missing };
  }, [rows, affiliateClubs]);

  // ---- Breakdown by league + country ----
  const breakdown = useMemo(() => {
    const group = (key: "league" | "country") => {
      const map = new Map<string, { name: string; clubs: number; official: number; verified: number }>();
      rows.forEach((r) => {
        const name = (r[key] || "—").trim() || "—";
        const entry = map.get(name) || { name, clubs: 0, official: 0, verified: 0 };
        entry.clubs += 1;
        if (r.official_ticketing_url) entry.official += 1;
        if (r.verification_status === "verified") entry.verified += 1;
        map.set(name, entry);
      });
      return [...map.values()].sort((a, b) => b.clubs - a.clubs);
    };
    return { byLeague: group("league"), byCountry: group("country") };
  }, [rows]);

  // ---- Filtered list ----
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "missing_official" && r.official_ticketing_url) return false;
      if (filter === "unverified" && r.verification_status === "verified") return false;
      if (filter === "stale" && !isStale(r.tickets_last_checked_at)) return false;
      if (search.trim() && !matchesQuery([r.club_name, r.short_name, r.league, r.country, r.city], search)) return false;
      return true;
    });
  }, [rows, filter, search]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-extrabold text-foreground">{t("admin.ticketing.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("admin.ticketing.subtitle")}</p>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        <KpiCard icon={<Users className="w-4 h-4" />} label={t("admin.ticketing.kpi.total")} value={kpis.total} />
        <KpiCard icon={<TicketIcon className="w-4 h-4" />} label={t("admin.ticketing.kpi.with_official")} value={`${kpis.withOfficial}`} hint={`${pct(kpis.withOfficial, kpis.total)}%`} accent="emerald" />
        <KpiCard icon={<TicketX className="w-4 h-4" />} label={t("admin.ticketing.kpi.missing")} value={kpis.missing} accent="rose" />
        <KpiCard icon={<BadgeCheck className="w-4 h-4" />} label={t("admin.ticketing.kpi.verified")} value={`${kpis.verified}`} hint={`${pct(kpis.verified, kpis.total)}%`} accent="sky" />
        <KpiCard icon={<HandCoins className="w-4 h-4" />} label={t("admin.ticketing.kpi.affiliate")} value={`${kpis.affiliate}`} hint={`${pct(kpis.affiliate, kpis.total)}%`} accent="violet" />
        <KpiCard icon={<ConciergeBell className="w-4 h-4" />} label={t("admin.ticketing.kpi.hospitality")} value={kpis.hospitality} accent="amber" />
        <KpiCard icon={<RefreshCcw className="w-4 h-4" />} label={t("admin.ticketing.kpi.resale")} value={kpis.resale} accent="slate" />
      </div>

      {/* Breakdown tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        <CoverageTable
          title={t("admin.ticketing.coverage.by_league")}
          rows={breakdown.byLeague}
          t={t}
        />
        <CoverageTable
          title={t("admin.ticketing.coverage.by_country")}
          rows={breakdown.byCountry}
          t={t}
        />
      </div>

      {/* Filters + list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-extrabold text-foreground">{t("admin.ticketing.list.title")} <span className="text-xs font-medium text-muted-foreground ml-1">{filtered.length}</span></h2>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0 sm:min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("admin.ticketing.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs pl-7"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["all", "missing_official", "unverified", "stale"] as FilterKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition ${
                filter === k
                  ? "bg-foreground text-white border-foreground"
                  : "bg-white text-foreground border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t(`admin.ticketing.filter.${k}` as never)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("admin.ticketing.empty")}</CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filtered.map((c) => (
              <ClubTicketingRow key={c.slug} row={c} hasAffiliate={affiliateClubs.has(c.slug)} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminTicketingPage;

// ---------------- Sub-components ----------------

const accentMap: Record<string, string> = {
  emerald: "text-emerald-700 bg-emerald-50",
  rose: "text-rose-700 bg-rose-50",
  sky: "text-sky-700 bg-sky-50",
  violet: "text-violet-700 bg-violet-50",
  amber: "text-amber-700 bg-amber-50",
  slate: "text-slate-700 bg-slate-50",
  default: "text-foreground bg-slate-50",
};

function KpiCard({
  icon, label, value, hint, accent = "default",
}: { icon: React.ReactNode; label: string; value: number | string; hint?: string; accent?: keyof typeof accentMap | string }) {
  const cls = accentMap[accent] || accentMap.default;
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${cls}`}>
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
          {hint && <p className="text-[10px] text-muted-foreground font-bold">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CoverageTable({
  title, rows, t,
}: { title: string; rows: Array<{ name: string; clubs: number; official: number; verified: number }>; t: (k: string) => string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-slate-200">
                <th className="py-1.5 pr-2 font-bold">{t("admin.ticketing.coverage.col.name")}</th>
                <th className="py-1.5 px-2 font-bold text-right">{t("admin.ticketing.coverage.col.clubs")}</th>
                <th className="py-1.5 px-2 font-bold w-[28%]">{t("admin.ticketing.coverage.col.official")}</th>
                <th className="py-1.5 pl-2 font-bold w-[28%]">{t("admin.ticketing.coverage.col.verified")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((r) => {
                const op = pct(r.official, r.clubs);
                const vp = pct(r.verified, r.clubs);
                return (
                  <tr key={r.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-2 font-bold text-foreground truncate max-w-[160px]">{r.name}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{r.clubs}</td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <Progress value={op} className="h-1.5 flex-1" />
                        <span className="tabular-nums text-[10px] font-bold w-8 text-right">{op}%</span>
                      </div>
                    </td>
                    <td className="py-1.5 pl-2">
                      <div className="flex items-center gap-1.5">
                        <Progress value={vp} className="h-1.5 flex-1" />
                        <span className="tabular-nums text-[10px] font-bold w-8 text-right">{vp}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ClubTicketingRow({ row, hasAffiliate, t }: { row: Row; hasAffiliate: boolean; t: (k: string) => string }) {
  const stale = isStale(row.tickets_last_checked_at);
  const missing = !row.official_ticketing_url && !row.resale_exchange_available;
  const lastChecked = row.tickets_last_checked_at
    ? new Date(row.tickets_last_checked_at).toLocaleDateString()
    : t("admin.ticketing.never_checked");

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{row.club_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {[row.league, row.country].filter(Boolean).join(" · ")}
            </p>
          </div>
          {row.official_ticketing_url && (
            <a
              href={row.official_ticketing_url}
              target="_blank"
              rel="noreferrer"
              title={t("admin.ticketing.open_source")}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {row.official_ticketing_url && <Chip tone="emerald" icon={<TicketIcon className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.official")}</Chip>}
          {row.resale_exchange_available && <Chip tone="slate" icon={<RefreshCcw className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.resale")}</Chip>}
          {hasAffiliate && <Chip tone="violet" icon={<HandCoins className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.affiliate")}</Chip>}
          {row.hospitality_url && <Chip tone="amber" icon={<ConciergeBell className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.hospitality")}</Chip>}
          {row.membership_required && <Chip tone="amber" icon={<ShieldCheck className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.membership")}</Chip>}
          {row.verification_status === "verified"
            ? <Chip tone="sky" icon={<BadgeCheck className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.verified")}</Chip>
            : <Chip tone="slate" icon={<Sparkles className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.unverified")}</Chip>}
          {row.verification_status === "broken" && <Chip tone="rose" icon={<AlertTriangle className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.broken")}</Chip>}
          {stale && row.verification_status !== "broken" && <Chip tone="rose" icon={<AlertTriangle className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.stale")}</Chip>}
          {missing && <Chip tone="rose" icon={<TicketX className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.missing")}</Chip>}
        </div>

        <p className="text-[10px] text-muted-foreground">
          {t("admin.ticketing.last_checked")}: <span className="font-bold">{lastChecked}</span>
        </p>
      </CardContent>
    </Card>
  );
}

const toneMap: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
};

function Chip({ tone, icon, children }: { tone: keyof typeof toneMap; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${toneMap[tone]}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
