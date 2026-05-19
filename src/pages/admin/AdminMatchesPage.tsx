import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Ticket, Archive, RotateCcw } from "lucide-react";
import { FootballFilterBar, useFootballFilters } from "@/components/admin/FootballFilterBar";
import { deriveLifecycle, type MatchLifecycleStatus } from "@/lib/matchLifecycle";
import { toast } from "@/hooks/use-toast";

const statusPill = (s: string | null) => {
  if (s === "on_sale") return "bg-emerald-100 text-emerald-700";
  if (s === "sold_out") return "bg-rose-100 text-rose-700";
  if (s === "presale") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const lifecyclePill = (s: MatchLifecycleStatus) => {
  switch (s) {
    case "upcoming": return "bg-sky-100 text-sky-700";
    case "live": return "bg-emerald-100 text-emerald-700 animate-pulse";
    case "completed": return "bg-slate-100 text-slate-600";
    case "archived": return "bg-zinc-200 text-zinc-600";
  }
};

export const AdminMatchesPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<MatchLifecycleStatus | "all">("all");
  const filters = useFootballFilters();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-matches-v3"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,home_team,away_team,competition,date,stadium,city,country,ticket_status,home_logo,away_logo,starting_price,featured,archived_at,lifecycle_status")
        .order("date", { ascending: false })
        .limit(800);
      return (data || []).map((m: any) => ({
        ...m,
        _lifecycle: deriveLifecycle(m.date, m.archived_at) as MatchLifecycleStatus,
      }));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from("matches")
        .update({ archived_at: archive ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-matches-v3"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: vars.archive ? t("admin.matches.archived") : t("admin.matches.restored") });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filterRows = useMemo(
    () => data.map((m: any) => ({ country: m.country, league: m.competition })),
    [data]
  );

  const hierarchyFiltered = useMemo(() => {
    const set = new Set<number>();
    filters.apply(filterRows.map((r, i) => ({ ...r, _i: i }))).forEach((r: any) => set.add(r._i));
    return data.filter((_, i) => set.has(i));
  }, [data, filterRows, filters]);

  const filtered = hierarchyFiltered.filter((m: any) => {
    const s = q.toLowerCase();
    if (s && !`${m.home_team} ${m.away_team} ${m.competition} ${m.stadium} ${m.city}`.toLowerCase().includes(s)) return false;
    if (statusFilter !== "all" && m.ticket_status !== statusFilter) return false;
    if (lifecycleFilter !== "all" && m._lifecycle !== lifecycleFilter) return false;
    if (filters.state.flags.includes("unpublished") && m.featured) return false;
    return true;
  });

  const lifecycleCounts = {
    all: hierarchyFiltered.length,
    upcoming: hierarchyFiltered.filter((m: any) => m._lifecycle === "upcoming").length,
    live: hierarchyFiltered.filter((m: any) => m._lifecycle === "live").length,
    completed: hierarchyFiltered.filter((m: any) => m._lifecycle === "completed").length,
    archived: hierarchyFiltered.filter((m: any) => m._lifecycle === "archived").length,
  };

  const counts = {
    all: hierarchyFiltered.length,
    on_sale: hierarchyFiltered.filter((m: any) => m.ticket_status === "on_sale").length,
    presale: hierarchyFiltered.filter((m: any) => m.ticket_status === "presale").length,
    sold_out: hierarchyFiltered.filter((m: any) => m.ticket_status === "sold_out").length,
    not_released: hierarchyFiltered.filter((m: any) => m.ticket_status === "not_released").length,
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.matches")}</h1>
            <p className="text-xs text-muted-foreground">{data.length} · {filtered.length} {t("admin.shown")}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
          </div>
        </div>

        <FootballFilterBar
          rows={filterRows}
          state={filters.state}
          onChange={filters.update}
          onReset={filters.reset}
          onToggleFlag={filters.toggleFlag}
          flags={[
            { key: "unpublished", labelKey: "admin.filter.flag.unpublished", fallback: "Only unpublished" },
          ]}
        />

        <div className="flex gap-2 flex-wrap">
          {(["all", "upcoming", "live", "completed", "archived"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setLifecycleFilter(k as any)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${lifecycleFilter === k ? "bg-[#2ECC71] text-white border-[#2ECC71]" : "bg-white text-[#2C3E50] border-slate-200 hover:border-[#2ECC71]"}`}
            >
              {t(`admin.matches.lifecycle.${k}`)} <span className="opacity-60">· {lifecycleCounts[k]}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "on_sale", "presale", "sold_out", "not_released"] as const).map((k) => (
            <button key={k} onClick={() => setStatusFilter(k)} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${statusFilter === k ? "bg-[#2C3E50] text-white border-[#2C3E50]" : "bg-white text-[#2C3E50] border-slate-200 hover:border-[#2ECC71]"}`}>
              {k.replace("_", " ")} <span className="opacity-60">· {counts[k]}</span>
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((m: any) => (
            <div key={m.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-[#2ECC71] hover:shadow-md transition p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{m.competition}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lifecyclePill(m._lifecycle)}`}>
                    {t(`admin.matches.lifecycle.${m._lifecycle}`)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusPill(m.ticket_status)}`}>{m.ticket_status?.replace("_", " ")}</span>
                </div>
              </div>
              <Link to={`/matches/${m.id}`} className="block">
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <div className="w-10 h-10 mx-auto mb-1">
                      {m.home_logo ? <img src={m.home_logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-full bg-slate-100" />}
                    </div>
                    <p className="text-xs font-bold text-[#2C3E50] truncate">{m.home_team}</p>
                  </div>
                  <span className="text-slate-300 text-sm font-bold">vs</span>
                  <div className="flex-1 text-center">
                    <div className="w-10 h-10 mx-auto mb-1">
                      {m.away_logo ? <img src={m.away_logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-full bg-slate-100" />}
                    </div>
                    <p className="text-xs font-bold text-[#2C3E50] truncate">{m.away_team}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 truncate"><Calendar className="w-3 h-3" /> {new Date(m.date).toLocaleDateString()} · {new Date(m.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  {m.starting_price && <span className="flex items-center gap-1 font-bold text-[#2ECC71]"><Ticket className="w-3 h-3" /> €{Number(m.starting_price).toFixed(0)}</span>}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {m.stadium} · {m.city}</p>
              </Link>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                {m.archived_at ? (
                  <button
                    onClick={() => archiveMutation.mutate({ id: m.id, archive: false })}
                    disabled={archiveMutation.isPending}
                    className="text-[11px] font-bold text-[#2C3E50] hover:text-[#2ECC71] inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> {t("admin.matches.restore")}
                  </button>
                ) : (
                  <button
                    onClick={() => archiveMutation.mutate({ id: m.id, archive: true })}
                    disabled={archiveMutation.isPending}
                    className="text-[11px] font-bold text-zinc-500 hover:text-rose-600 inline-flex items-center gap-1"
                  >
                    <Archive className="w-3 h-3" /> {t("admin.matches.archive")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMatchesPage;
