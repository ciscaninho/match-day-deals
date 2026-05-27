import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

type HealthState = "healthy" | "missing_tickets" | "missing_price" | "unlinked" | "draft" | "published";

interface Row {
  id: string;
  home_team: string;
  away_team: string;
  home_team_status: string;
  away_team_status: string;
  date: string;
  stadium: string;
  city: string;
  group_code: string | null;
  phase: string | null;
  publication_status: string;
  ticket_status: string;
  starting_price: number | null;
  fixture_origin: string;
  fifa_match_number: number | null;
  coverage_count: number;
  linked_count: number;
  has_price: boolean;
}

const FILTER_KEY = "wc2026.matches.filters.v1";

interface Filters {
  q: string;
  group: string;
  health: "" | HealthState;
  phase: string;
}

const DEFAULT_FILTERS: Filters = { q: "", group: "", health: "", phase: "" };

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_FILTERS;
}

function computeHealth(r: Row): HealthState {
  if (r.publication_status !== "published") {
    if (r.linked_count === 0) return r.publication_status === "draft" ? "draft" : "unlinked";
    return "draft";
  }
  // published
  if (r.linked_count === 0) return "missing_tickets";
  if (!r.has_price) return "missing_price";
  return "healthy";
}

const HEALTH_META: Record<HealthState, { label: string; cls: string }> = {
  healthy:         { label: "Healthy",         cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  missing_tickets: { label: "Missing tickets", cls: "bg-red-100 text-red-800 border-red-200" },
  missing_price:   { label: "Missing price",   cls: "bg-amber-100 text-amber-800 border-amber-200" },
  unlinked:        { label: "Unlinked",        cls: "bg-orange-100 text-orange-800 border-orange-200" },
  draft:           { label: "Draft",           cls: "bg-slate-200 text-slate-700 border-slate-300" },
  published:       { label: "Published",       cls: "bg-blue-100 text-blue-800 border-blue-200" },
};

function useMatches() {
  return useQuery({
    queryKey: ["wc2026-matches"],
    queryFn: async () => {
      const { data: matches, error } = await supabase
        .from("matches")
        .select("id,home_team,away_team,home_team_status,away_team_status,date,stadium,city,group_code,phase,publication_status,ticket_status,starting_price,fixture_origin,fifa_match_number")
        .eq("competition", "FIFA World Cup 2026")
        .order("date");
      if (error) throw error;

      const { data: cov } = await supabase
        .from("wc_ticket_coverage" as never)
        .select("match_id,starting_price")
        .not("match_id", "is", null);

      const byMatch = new Map<string, { count: number; linked: number; has_price: boolean }>();
      for (const c of (cov ?? []) as any[]) {
        if (!c.match_id) continue;
        const cur = byMatch.get(c.match_id) ?? { count: 0, linked: 0, has_price: false };
        cur.count++;
        cur.linked++;
        if (c.starting_price != null) cur.has_price = true;
        byMatch.set(c.match_id, cur);
      }

      return (matches ?? []).map((m: any): Row => {
        const c = byMatch.get(m.id) ?? { count: 0, linked: 0, has_price: m.starting_price != null };
        return {
          ...m,
          coverage_count: c.count,
          linked_count: c.linked,
          has_price: c.has_price || m.starting_price != null,
        };
      });
    },
  });
}

export default function MatchesTab() {
  const { data, isLoading } = useMatches();
  const [filters, setFilters] = useState<Filters>(() => loadFilters());

  useEffect(() => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  const enriched = useMemo(() => (data ?? []).map(r => ({ ...r, health: computeHealth(r) })), [data]);
  const counts = useMemo(() => {
    const c: Record<HealthState, number> = { healthy: 0, missing_tickets: 0, missing_price: 0, unlinked: 0, draft: 0, published: 0 };
    for (const r of enriched) c[r.health]++;
    return c;
  }, [enriched]);

  const groups = useMemo(() => Array.from(new Set(enriched.map(r => r.group_code).filter(Boolean))).sort(), [enriched]);
  const phases = useMemo(() => Array.from(new Set(enriched.map(r => r.phase).filter(Boolean))).sort(), [enriched]);

  const filtered = useMemo(() => enriched.filter(r => {
    if (filters.group && r.group_code !== filters.group) return false;
    if (filters.health && r.health !== filters.health) return false;
    if (filters.phase && r.phase !== filters.phase) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${r.home_team} ${r.away_team} ${r.stadium} ${r.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [enriched, filters]);

  if (isLoading) return <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading matches…</div>;

  return (
    <div className="space-y-4">
      {/* Health summary */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(HEALTH_META) as HealthState[]).map(h => (
          <button
            key={h}
            onClick={() => setFilters(f => ({ ...f, health: f.health === h ? "" : h }))}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition ${HEALTH_META[h].cls} ${filters.health === h ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
          >
            {HEALTH_META[h].label}
            <span className="font-mono opacity-80">{counts[h]}</span>
          </button>
        ))}
        <div className="ml-auto text-xs text-slate-500 self-center">{filtered.length} / {enriched.length} matches</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.q}
            onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
            placeholder="Search team, stadium, city…"
            className="w-full pl-7 pr-2 py-1.5 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select value={filters.group} onChange={(e) => setFilters(f => ({ ...f, group: e.target.value }))} className="px-2 py-1.5 text-sm rounded border border-slate-200">
          <option value="">All groups</option>
          {groups.map(g => <option key={g} value={g!}>Group {g}</option>)}
        </select>
        <select value={filters.phase} onChange={(e) => setFilters(f => ({ ...f, phase: e.target.value }))} className="px-2 py-1.5 text-sm rounded border border-slate-200">
          <option value="">All phases</option>
          {phases.map(p => <option key={p} value={p!}>{p}</option>)}
        </select>
        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="px-2.5 py-1.5 text-xs font-semibold rounded border border-slate-200 text-slate-600 hover:bg-slate-50">Reset</button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Match</th>
                <th className="text-left px-3 py-2">Venue</th>
                <th className="text-left px-3 py-2">Group</th>
                <th className="text-left px-3 py-2">Origin</th>
                <th className="text-left px-3 py-2">Health</th>
                <th className="text-left px-3 py-2">Tickets</th>
                <th className="text-right px-3 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const date = r.date ? new Date(r.date) : null;
                const valid = date && !isNaN(date.getTime());
                const isOfficial = r.fixture_origin === "official_import";
                return (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-slate-700">
                      {valid ? date!.toISOString().slice(0,10) : <span className="text-slate-400">—</span>}
                      <div className="text-[10px] text-slate-400">{valid ? date!.toISOString().slice(11,16) : ""}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{r.home_team} <span className="text-slate-400">vs</span> {r.away_team}</div>
                      <div className="text-[11px] text-slate-500 flex gap-1.5">
                        {(r.home_team_status !== "confirmed" || r.away_team_status !== "confirmed") && <span className="text-amber-600">projected</span>}
                        <span>{r.phase ?? "group"}</span>
                        {r.fifa_match_number != null && <span className="text-slate-400">#{r.fifa_match_number}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{r.stadium}<div className="text-[10px] text-slate-400">{r.city}</div></td>
                    <td className="px-3 py-2 text-xs">{r.group_code ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-3 py-2">
                      {isOfficial
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border-emerald-200" title="Locked: date / stadium / city / phase">Official</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border-amber-200" title="Synthetic — will be removed by Purge generated">Generated</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${HEALTH_META[r.health].cls}`}>{HEALTH_META[r.health].label}</span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.linked_count > 0
                        ? <span className="text-emerald-700 font-semibold">{r.linked_count} linked</span>
                        : <span className="text-slate-400">none</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {r.starting_price != null
                        ? <span className="font-semibold text-slate-900">From €{Number(r.starting_price).toFixed(0)}</span>
                        : r.linked_count > 0
                          ? <span className="text-slate-500">Tickets available</span>
                          : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">No matches match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
