import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink, ShieldCheck, RefreshCcw, BadgeCheck, Sparkles, AlertTriangle,
  Search, TicketX, Users, Ticket as TicketIcon, HandCoins, ConciergeBell, Pencil, Download, X,
} from "lucide-react";
import { matchesQuery } from "@/lib/normalize";
import { toast } from "@/hooks/use-toast";
import { TicketingAiSuggestionDialog } from "@/components/admin/TicketingAiSuggestionDialog";

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
type FilterKey = "all" | "missing_official" | "unverified" | "stale" | "no_affiliate";

const isStale = (iso: string | null) => {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;
};
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
const isValidUrl = (s: string) => {
  if (!s) return true;
  try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
};

export const AdminTicketingPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [country, setCountry] = useState<string>("all");
  const [league, setLeague] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aiClub, setAiClub] = useState<Row | null>(null);

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

  const { data: affiliateClubs = new Set<string>() } = useQuery({
    queryKey: ["admin-ticketing-affiliate-slugs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_sources" as never)
        .select("club_slug,monetization_enabled")
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

  // ---- Breakdown ----
  const breakdown = useMemo(() => {
    const group = (key: "league" | "country") => {
      const map = new Map<string, { name: string; clubs: number; official: number; verified: number }>();
      rows.forEach((r) => {
        const name = (r[key] || "—").trim() || "—";
        const e = map.get(name) || { name, clubs: 0, official: 0, verified: 0 };
        e.clubs += 1;
        if (r.official_ticketing_url) e.official += 1;
        if (r.verification_status === "verified") e.verified += 1;
        map.set(name, e);
      });
      return [...map.values()].sort((a, b) => b.clubs - a.clubs);
    };
    return { byLeague: group("league"), byCountry: group("country") };
  }, [rows]);

  // ---- Distinct lists for filter dropdowns ----
  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country).filter(Boolean))].sort() as string[],
    [rows]
  );
  const leagues = useMemo(
    () => [...new Set(rows.map((r) => r.league).filter(Boolean))].sort() as string[],
    [rows]
  );

  // Duplicate URL set for inline validation
  const urlCount = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.official_ticketing_url) return;
      const k = r.official_ticketing_url.trim().toLowerCase();
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return m;
  }, [rows]);

  // ---- Filtered list ----
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "missing_official" && r.official_ticketing_url) return false;
      if (filter === "unverified" && r.verification_status === "verified") return false;
      if (filter === "stale" && !isStale(r.tickets_last_checked_at)) return false;
      if (filter === "no_affiliate" && affiliateClubs.has(r.slug)) return false;
      if (country !== "all" && r.country !== country) return false;
      if (league !== "all" && r.league !== league) return false;
      if (search.trim() && !matchesQuery([r.club_name, r.short_name, r.league, r.country, r.city], search)) return false;
      return true;
    });
  }, [rows, filter, search, country, league, affiliateClubs]);

  // ---- Mutations ----
  const updateClub = useMutation({
    mutationFn: async (vars: { slug: string; patch: Partial<Row> & { tickets_last_checked_at?: string | null } }) => {
      const { error } = await supabase
        .from("club_ticketing_profiles")
        .update(vars.patch as never)
        .eq("slug", vars.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticketing-v2"] });
      toast({ title: t("admin.ticketing.quick_edit.saved") });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (patch: Partial<Row> & { tickets_last_checked_at?: string | null }) => {
      const slugs = [...selected];
      if (slugs.length === 0) return;
      const { error } = await supabase
        .from("club_ticketing_profiles")
        .update(patch as never)
        .in("slug", slugs);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticketing-v2"] });
      toast({ title: t("admin.ticketing.quick_edit.saved"), description: `${selected.size}` });
      setSelected(new Set());
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAll = (checked: boolean) => {
    if (!checked) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.slug)));
  };
  const toggleOne = (slug: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(slug); else next.delete(slug);
      return next;
    });
  };

  const exportCsv = () => {
    const slugs = selected.size > 0 ? selected : new Set(filtered.map((r) => r.slug));
    const subset = rows.filter((r) => slugs.has(r.slug));
    const headers = ["slug","club_name","country","league","official_ticketing_url","verification_status","hospitality_url","resale_exchange_url","tickets_last_checked_at"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...subset.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ticketing-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.slug));

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

      {/* Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        <CoverageTable title={t("admin.ticketing.coverage.by_league")} rows={breakdown.byLeague} t={t} />
        <CoverageTable title={t("admin.ticketing.coverage.by_country")} rows={breakdown.byCountry} t={t} />
      </div>

      {/* Filters + list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-extrabold text-foreground">
            {t("admin.ticketing.list.title")}{" "}
            <span className="text-xs font-medium text-muted-foreground ml-1">{filtered.length}</span>
          </h2>
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

        {/* Filter chips + selects */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "missing_official", "unverified", "stale", "no_affiliate"] as FilterKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition ${
                filter === k
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {t(`admin.ticketing.filter.${k}` as never)}
            </button>
          ))}
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.ticketing.filter.all_countries")}</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={league} onValueChange={setLeague}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.ticketing.filter.all_leagues")}</SelectItem>
              {leagues.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk toolbar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md border border-border">
            <span className="text-xs font-bold text-foreground">
              {selected.size} {t("admin.ticketing.bulk.selected")}
            </span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkUpdate.mutate({ verification_status: "verified", tickets_last_checked_at: new Date().toISOString() })}>
                <BadgeCheck className="w-3 h-3 mr-1" />{t("admin.ticketing.bulk.mark_verified")}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkUpdate.mutate({ verification_status: "stale" })}>
                <AlertTriangle className="w-3 h-3 mr-1" />{t("admin.ticketing.bulk.mark_stale")}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={exportCsv}>
                <Download className="w-3 h-3 mr-1" />{t("admin.ticketing.bulk.export_csv")}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                <X className="w-3 h-3 mr-1" />{t("admin.ticketing.bulk.clear")}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("admin.ticketing.empty")}</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(!!c)} />
                <span className="flex-1">Club</span>
                <span className="hidden md:inline w-[180px]">Status</span>
                <span className="hidden lg:inline w-[110px]">Last checked</span>
                <span className="w-[120px] text-right">Actions</span>
              </div>
              <ul>
                {filtered.map((r) => (
                  <ClubTicketingCompactRow
                    key={r.slug}
                    row={r}
                    hasAffiliate={affiliateClubs.has(r.slug)}
                    isSelected={selected.has(r.slug)}
                    onSelect={(c) => toggleOne(r.slug, c)}
                    urlDuplicateCount={r.official_ticketing_url ? (urlCount.get(r.official_ticketing_url.trim().toLowerCase()) ?? 0) : 0}
                    onSave={(patch) => updateClub.mutate({ slug: r.slug, patch })}
                    onAiEnrich={() => setAiClub(r)}
                    saving={updateClub.isPending}
                    t={t}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <TicketingAiSuggestionDialog
        open={!!aiClub}
        onOpenChange={(v) => { if (!v) setAiClub(null); }}
        club={aiClub}
        onApplied={() => qc.invalidateQueries({ queryKey: ["admin-ticketing-v2"] })}
      />
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
  default: "text-foreground bg-muted",
};

function KpiCard({
  icon, label, value, hint, accent = "default",
}: { icon: React.ReactNode; label: string; value: number | string; hint?: string; accent?: string }) {
  const cls = accentMap[accent] || accentMap.default;
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${cls}`}>
          {icon}<span className="truncate">{label}</span>
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
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
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
                  <tr key={r.name} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-2 font-bold text-foreground truncate max-w-[160px]">{r.name}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.clubs}</td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <Progress value={op} className="h-1.5 flex-1" />
                        <span className="tabular-nums text-[10px] font-bold w-8 text-right text-foreground">{op}%</span>
                      </div>
                    </td>
                    <td className="py-1.5 pl-2">
                      <div className="flex items-center gap-1.5">
                        <Progress value={vp} className="h-1.5 flex-1" />
                        <span className="tabular-nums text-[10px] font-bold w-8 text-right text-foreground">{vp}%</span>
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

function ClubTicketingCompactRow({
  row, hasAffiliate, isSelected, onSelect, urlDuplicateCount, onSave, onAiEnrich, saving, t,
}: {
  row: Row;
  hasAffiliate: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  urlDuplicateCount: number;
  onSave: (patch: Partial<Row> & { tickets_last_checked_at?: string | null }) => void;
  onAiEnrich: () => void;
  saving: boolean;
  t: (k: string) => string;
}) {
  const stale = isStale(row.tickets_last_checked_at);
  const missing = !row.official_ticketing_url && !row.resale_exchange_available;
  const lastChecked = row.tickets_last_checked_at
    ? new Date(row.tickets_last_checked_at).toLocaleDateString()
    : t("admin.ticketing.never_checked");

  return (
    <li className="flex items-center gap-2 px-3 py-2 border-b border-border/60 last:border-0 hover:bg-muted/40">
      <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(!!c)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{row.club_name}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {[row.league, row.country].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="hidden md:flex flex-wrap gap-1 w-[180px]">
        {row.official_ticketing_url && <Chip tone="emerald" icon={<TicketIcon className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.official")}</Chip>}
        {hasAffiliate && <Chip tone="violet" icon={<HandCoins className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.affiliate")}</Chip>}
        {row.hospitality_url && <Chip tone="amber" icon={<ConciergeBell className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.hospitality")}</Chip>}
        {row.membership_required && <Chip tone="amber" icon={<ShieldCheck className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.membership")}</Chip>}
        {row.verification_status === "verified"
          ? <Chip tone="sky" icon={<BadgeCheck className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.verified")}</Chip>
          : <Chip tone="slate" icon={<Sparkles className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.unverified")}</Chip>}
        {stale && row.verification_status !== "broken" && row.verification_status !== "verified" && <Chip tone="rose" icon={<AlertTriangle className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.stale")}</Chip>}
        {row.verification_status === "broken" && <Chip tone="rose" icon={<AlertTriangle className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.broken")}</Chip>}
        {missing && <Chip tone="rose" icon={<TicketX className="w-2.5 h-2.5" />}>{t("admin.ticketing.badge.missing")}</Chip>}
      </div>
      <div className="hidden lg:block w-[110px] text-[10px] text-muted-foreground">
        {lastChecked}
      </div>
      <div className="w-[120px] flex items-center justify-end gap-1">
        {row.official_ticketing_url && (
          <a
            href={row.official_ticketing_url}
            target="_blank"
            rel="noreferrer"
            title={t("admin.ticketing.open_source")}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button
          onClick={onAiEnrich}
          title={t("admin.ticketing.ai.enrich")}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        <QuickEditPopover row={row} duplicateCount={urlDuplicateCount} onSave={onSave} saving={saving} t={t} />
      </div>
    </li>
  );
}

function QuickEditPopover({
  row, duplicateCount, onSave, saving, t,
}: {
  row: Row;
  duplicateCount: number;
  onSave: (patch: Partial<Row> & { tickets_last_checked_at?: string | null }) => void;
  saving: boolean;
  t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(row.official_ticketing_url ?? "");
  const [status, setStatus] = useState(row.verification_status ?? "unverified");

  const urlChanged = (url || "") !== (row.official_ticketing_url || "");
  const invalid = !!url && !isValidUrl(url);
  const duplicate = urlChanged && url && duplicateCount > 0;

  const save = () => {
    if (invalid) return;
    onSave({
      official_ticketing_url: url.trim() || null,
      verification_status: status,
      tickets_last_checked_at: status === "verified" ? new Date().toISOString() : row.tickets_last_checked_at,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={t("admin.ticketing.quick_edit")}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-3" align="end">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {t("admin.ticketing.quick_edit.official_url")}
          </label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-8 text-xs" />
          {invalid && <p className="text-[10px] text-destructive font-bold">{t("admin.ticketing.quick_edit.invalid_url")}</p>}
          {duplicate && <p className="text-[10px] text-amber-600 font-bold">{t("admin.ticketing.quick_edit.duplicate_url")}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {t("admin.ticketing.quick_edit.verification")}
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unverified">{t("admin.ticketing.verification.unverified")}</SelectItem>
              <SelectItem value="verified">{t("admin.ticketing.verification.verified")}</SelectItem>
              <SelectItem value="stale">{t("admin.ticketing.verification.stale")}</SelectItem>
              <SelectItem value="broken">{t("admin.ticketing.verification.broken")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className="h-7 text-xs" onClick={save} disabled={invalid || saving}>
            {t("admin.ticketing.quick_edit.save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
      {icon}<span>{children}</span>
    </span>
  );
}
