import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Link2, X, ExternalLink, ArrowRight } from "lucide-react";

interface Coverage {
  id: string;
  provider: string;
  event_name: string | null;
  event_date: string | null;
  stadium_name: string;
  stadium_slug: string;
  home_label: string | null;
  away_label: string | null;
  starting_price: number | null;
  image_url: string | null;
  url: string;
}

interface MatchRow {
  id: string;
  home_team: string;
  away_team: string;
  date: string;
  stadium: string;
}

function useUnmatched() {
  return useQuery({
    queryKey: ["wc-resolver-unmatched"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wc_ticket_coverage" as never)
        .select("id,provider,event_name,event_date,stadium_name,stadium_slug,home_label,away_label,starting_price,image_url,url")
        .is("match_id", null)
        .order("event_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Coverage[];
    },
  });
}

function useCandidates(row: Coverage | null) {
  return useQuery({
    queryKey: ["wc-resolver-candidates", row?.id],
    enabled: !!row,
    queryFn: async () => {
      if (!row) return [];
      // Stadium-first match; widen to ±3 days
      const date = row.event_date ? new Date(row.event_date) : null;
      let q = supabase
        .from("matches")
        .select("id,home_team,away_team,date,stadium")
        .eq("competition", "FIFA World Cup 2026");
      if (row.stadium_name) q = q.eq("stadium", row.stadium_name);
      if (date && !isNaN(date.getTime())) {
        const lo = new Date(date.getTime() - 3 * 86400000).toISOString();
        const hi = new Date(date.getTime() + 3 * 86400000).toISOString();
        q = q.gte("date", lo).lte("date", hi);
      }
      const { data, error } = await q.order("date").limit(15);
      if (error) throw error;
      return (data ?? []) as unknown as MatchRow[];
    },
  });
}

export default function ResolverTab() {
  const qc = useQueryClient();
  const { data: rows, isLoading } = useUnmatched();
  const [selected, setSelected] = useState<Coverage | null>(null);
  const { data: candidates, isLoading: candLoading } = useCandidates(selected);
  const [linking, setLinking] = useState(false);
  const [lastResult, setLastResult] = useState<{ before: any; after: any } | null>(null);

  const link = async (matchId: string) => {
    if (!selected) return;
    setLinking(true);
    try {
      const before = {
        coverage_id: selected.id,
        match_id: null,
        provider: selected.provider,
        event_name: selected.event_name,
      };
      const { error } = await supabase
        .from("wc_ticket_coverage" as never)
        .update({ match_id: matchId, last_sync_at: new Date().toISOString(), last_sync_status: "manual_link" } as never)
        .eq("id", selected.id);
      if (error) throw error;
      const after = { ...before, match_id: matchId };
      setLastResult({ before, after });
      toast({ title: "Linked", description: `${selected.provider} → match ${matchId}` });
      qc.invalidateQueries({ queryKey: ["wc-resolver-unmatched"] });
      qc.invalidateQueries({ queryKey: ["wc2026-matches"] });
      qc.invalidateQueries({ queryKey: ["wc2026-coverage"] });
      qc.invalidateQueries({ queryKey: ["wc-overview-kpis"] });
      setSelected(null);
    } catch (e: any) {
      toast({ title: "Link failed", description: e.message, variant: "destructive" });
    } finally { setLinking(false); }
  };

  if (isLoading) return <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading unmatched rows…</div>;

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">
        {rows?.length ?? 0} unmatched provider rows. Click <strong>Resolve</strong> to link to a WC fixture. Linking is the only way coverage rows reach the public site.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-3 py-2">Provider</th>
              <th className="text-left px-3 py-2">Event</th>
              <th className="text-left px-3 py-2">Stadium / Date</th>
              <th className="text-right px-3 py-2">Price</th>
              <th className="text-right px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map(r => {
              const date = r.event_date ? new Date(r.event_date) : null;
              const valid = date && !isNaN(date.getTime());
              return (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs font-semibold">{r.provider}</td>
                  <td className="px-3 py-2 text-sm">{r.event_name ?? `${r.home_label ?? "?"} vs ${r.away_label ?? "?"}`}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{r.stadium_name}<div className="text-[10px] text-slate-400">{valid ? date!.toISOString().slice(0,16).replace("T"," ") : "no date"}</div></td>
                  <td className="px-3 py-2 text-right text-xs">{r.starting_price != null ? `€${Number(r.starting_price).toFixed(0)}` : <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setSelected(r); setLastResult(null); }} className="px-2.5 py-1 text-xs font-bold uppercase rounded bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1"><Link2 className="w-3 h-3"/> Resolve</button>
                  </td>
                </tr>
              );
            })}
            {rows?.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-emerald-700 font-semibold">All provider rows are linked. </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {lastResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900 mb-2">Link result</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="font-bold text-emerald-900 mb-1">Before</p><pre className="text-[11px] leading-relaxed font-mono bg-slate-900 text-emerald-100 border border-slate-700 p-3 rounded overflow-auto max-h-60">{JSON.stringify(lastResult.before, null, 2)}</pre></div>
            <div><p className="font-bold text-emerald-900 mb-1">After</p><pre className="text-[11px] leading-relaxed font-mono bg-slate-900 text-emerald-100 border border-slate-700 p-3 rounded overflow-auto max-h-60">{JSON.stringify(lastResult.after, null, 2)}</pre></div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Resolve to fixture</p>
                <p className="font-display text-lg text-slate-900">{selected.event_name ?? `${selected.home_label} vs ${selected.away_label}`}</p>
                <p className="text-xs text-slate-500">{selected.provider} · {selected.stadium_name} · {selected.event_date ? new Date(selected.event_date).toISOString().slice(0,16).replace("T"," ") : "no date"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-slate-100"><X className="w-4 h-4"/></button>
            </div>
            <div className="overflow-auto p-4">
              {candLoading && <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Finding candidates…</div>}
              {!candLoading && (candidates?.length ?? 0) === 0 && (
                <div className="text-sm text-slate-500">No candidate matches at this stadium within ±3 days. Edit the coverage row's stadium or date.</div>
              )}
              <ul className="space-y-2">
                {(candidates ?? []).map(c => (
                  <li key={c.id} className="flex items-center justify-between gap-3 p-3 rounded border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{c.home_team} <span className="text-slate-400">vs</span> {c.away_team}</p>
                      <p className="text-[11px] text-slate-500">{c.stadium} · {new Date(c.date).toISOString().slice(0,16).replace("T"," ")}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.id}</p>
                    </div>
                    <button disabled={linking} onClick={() => link(c.id)} className="shrink-0 px-3 py-1.5 text-xs font-bold uppercase rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-1">
                      Link <ArrowRight className="w-3 h-3"/>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Provider URL: <a href={selected.url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-900 underline">{selected.url.slice(0, 60)}…</a></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
