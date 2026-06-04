import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ExternalLink, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type Confidence = "high" | "medium" | "low";

type Proposal = {
  match_id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  stadium: string | null;
  city: string | null;
  current_url: string | null;
  suggested_url: string;
  provider_event_id: string;
  confidence: Confidence;
  score: number;
  reasons: string[];
  event_date: string | null;
};

type Stats = {
  fixtures_total: number;
  events_discovered: number;
  proposals: number;
  already_set: number;
  high: number;
  medium: number;
  low: number;
  new_urls: number;
};

const confidenceStyles: Record<Confidence, string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-rose-100 text-rose-800 border-rose-200",
};

const ConfidenceIcon = ({ c }: { c: Confidence }) => {
  if (c === "high") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (c === "medium") return <AlertTriangle className="w-3.5 h-3.5" />;
  return <XCircle className="w-3.5 h-3.5" />;
};

export default function TicomboUrlsTab() {
  const qc = useQueryClient();
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "new" | "high" | "changed">("new");

  const suggestMut = useMutation({
    mutationFn: async (apply: boolean) => {
      const { data, error } = await supabase.functions.invoke("wc-ticombo-url-suggest", { body: { apply } });
      if (error) throw error;
      return data as { stats: Stats & { apply_mode?: boolean; applied?: number; cleared_stale?: number; coverage_pct_of_confirmed?: number; confirmed_fixtures?: number; both_teams_verified?: number }; proposals: Proposal[] };
    },
    onSuccess: (data) => {
      setProposals(data.proposals);
      setStats(data.stats);
      const next = new Set<string>();
      for (const p of data.proposals) {
        if (p.confidence === "high" && p.suggested_url !== p.current_url) next.add(p.match_id);
      }
      setSelected(next);
      const s = data.stats as Stats & { apply_mode?: boolean; applied?: number; cleared_stale?: number; coverage_pct_of_confirmed?: number };
      toast({
        title: s.apply_mode ? "Verified & applied" : "Suggestions generated",
        description: s.apply_mode
          ? `${s.applied ?? 0} written · ${s.cleared_stale ?? 0} stale cleared · ${s.coverage_pct_of_confirmed ?? 0}% coverage`
          : `${data.stats.proposals} verified · ${s.coverage_pct_of_confirmed ?? 0}% coverage of confirmed fixtures`,
      });
      if (s.apply_mode) {
        qc.invalidateQueries({ queryKey: ["wc2026-matches"] });
        qc.invalidateQueries({ queryKey: ["wc-overview-kpis"] });
      }
    },
    onError: (e: Error) => toast({ title: "Suggestion failed", description: e.message, variant: "destructive" }),
  });

  const applyMut = useMutation({
    mutationFn: async (mappings: { match_id: string; ticombo_url: string | null }[]) => {
      const { data, error } = await supabase.functions.invoke("wc-ticombo-url-apply", { body: { mappings } });
      if (error) throw error;
      return data as { updated: number; cleared: number; skipped: number };
    },
    onSuccess: (data) => {
      toast({ title: "Applied", description: `${data.updated} updated · ${data.skipped} skipped` });
      qc.invalidateQueries({ queryKey: ["wc2026-matches"] });
      qc.invalidateQueries({ queryKey: ["wc-overview-kpis"] });
      // refresh suggestions to reflect new current_url values
      suggestMut.mutate();
    },
    onError: (e: Error) => toast({ title: "Apply failed", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (!proposals) return [];
    return proposals.filter((p) => {
      if (filter === "high") return p.confidence === "high";
      if (filter === "new") return !p.current_url;
      if (filter === "changed") return p.current_url && p.current_url !== p.suggested_url;
      return true;
    });
  }, [proposals, filter]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.match_id)));
  };

  const applySelected = () => {
    if (!proposals || selected.size === 0) return;
    const mappings = proposals
      .filter((p) => selected.has(p.match_id))
      .map((p) => ({ match_id: p.match_id, ticombo_url: p.suggested_url }));
    applyMut.mutate(mappings);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-slate-900">Ticombo URL auto-mapping</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Crawls the public Ticombo World Cup 2026 index, matches each single-fixture event to a DB
              fixture using team names + kickoff date, and proposes <code>ticombo_url</code> values for review.
              Nothing is written until you Apply.
            </p>
          </div>
          <button
            onClick={() => suggestMut.mutate()}
            disabled={suggestMut.isPending}
            className="px-3 py-1.5 text-xs font-bold uppercase rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {suggestMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {suggestMut.isPending ? "Crawling…" : "Generate suggestions"}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Fixtures" value={`${stats.already_set}/${stats.fixtures_total}`} sub="already linked" />
          <Kpi label="Events discovered" value={stats.events_discovered} sub="on Ticombo" />
          <Kpi label="Proposals" value={stats.proposals} sub={`${stats.new_urls} would change`} />
          <Kpi label="Confidence" value={`${stats.high} / ${stats.medium} / ${stats.low}`} sub="high / med / low" />
        </div>
      )}

      {proposals && proposals.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-slate-200 bg-white p-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(["new", "changed", "high", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {f === "new" ? "Unlinked only" : f === "changed" ? "Would change" : f === "high" ? "High confidence" : "All"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{selected.size} selected</span>
              <button
                onClick={toggleAll}
                className="px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-300 hover:bg-slate-50"
              >
                {selected.size === filtered.length ? "Clear" : "Select all visible"}
              </button>
              <button
                onClick={applySelected}
                disabled={applyMut.isPending || selected.size === 0}
                className="px-3 py-1.5 text-xs font-bold uppercase rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {applyMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Apply {selected.size > 0 ? `(${selected.size})` : ""}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left w-8"></th>
                    <th className="px-3 py-2 text-left">Match</th>
                    <th className="px-3 py-2 text-left">Kickoff</th>
                    <th className="px-3 py-2 text-left">Stadium</th>
                    <th className="px-3 py-2 text-left">Confidence</th>
                    <th className="px-3 py-2 text-left">Current</th>
                    <th className="px-3 py-2 text-left">Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const same = p.current_url === p.suggested_url;
                    return (
                      <tr key={p.match_id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 align-top">
                          <input
                            type="checkbox"
                            checked={selected.has(p.match_id)}
                            onChange={() => toggle(p.match_id)}
                            disabled={same}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="font-semibold text-slate-900">{p.home_team} <span className="text-slate-400">vs</span> {p.away_team}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.provider_event_id}</div>
                        </td>
                        <td className="px-3 py-2 align-top whitespace-nowrap text-slate-700">
                          {new Date(p.kickoff).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 align-top text-slate-700">
                          <div>{p.stadium ?? "—"}</div>
                          {p.city && <div className="text-[10px] text-slate-400">{p.city}</div>}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${confidenceStyles[p.confidence]}`}>
                            <ConfidenceIcon c={p.confidence} />
                            {p.confidence} · {p.score}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.reasons.join(", ")}</div>
                        </td>
                        <td className="px-3 py-2 align-top max-w-[200px]">
                          {p.current_url ? (
                            <a href={p.current_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-emerald-600 inline-flex items-center gap-0.5 break-all">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              {p.current_url.replace("https://www.ticombo.com", "")}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">none</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top max-w-[260px]">
                          <a href={p.suggested_url} target="_blank" rel="noopener noreferrer" className={`text-[10px] inline-flex items-center gap-0.5 break-all ${same ? "text-slate-400" : "text-emerald-700 font-semibold hover:text-emerald-800"}`}>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {p.suggested_url.replace("https://www.ticombo.com", "")}
                          </a>
                          {same && <div className="text-[10px] text-slate-400 italic mt-0.5">unchanged</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">No proposals match this filter.</div>
            )}
          </div>
        </>
      )}

      {!proposals && !suggestMut.isPending && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-sm text-slate-500">Click <strong>Generate suggestions</strong> to crawl Ticombo and propose mappings.</p>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display text-xl text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
