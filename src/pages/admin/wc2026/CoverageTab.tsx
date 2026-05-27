import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle2, Link2, ExternalLink, ShieldCheck, Trash2, PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Coverage {
  id: string;
  provider: string;
  event_name: string | null;
  event_slug: string | null;
  event_date: string | null;
  stadium_name: string;
  stadium_slug: string;
  home_label: string | null;
  away_label: string | null;
  starting_price: number | null;
  currency: string;
  image_url: string | null;
  match_id: string | null;
  provider_event_id: string | null;
  active: boolean;
  url: string;
  quality_score: "high" | "medium" | "low" | null;
  quality_reasons: string[] | null;
  extraction_source: string | null;
  stadium_confidence: "verified" | "alias_match" | "low" | null;
  archived_at: string | null;
  archived_reason: string | null;
}

function useCoverage(includeArchived: boolean) {
  return useQuery({
    queryKey: ["wc2026-coverage", includeArchived],
    queryFn: async () => {
      let q = supabase
        .from("wc_ticket_coverage" as never)
        .select("id,provider,event_name,event_slug,event_date,stadium_name,stadium_slug,home_label,away_label,starting_price,currency,image_url,match_id,provider_event_id,active,url,quality_score,quality_reasons,extraction_source,stadium_confidence,archived_at,archived_reason")
        .order("event_date", { ascending: true, nullsFirst: false });
      if (!includeArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Coverage[];
    },
  });
}

type FilterKey = "all" | "high" | "medium" | "low" | "archived" | "unlinked" | "generic_title" | "no_event_id" | "stadium_fallback";

const QUALITY_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

export default function CoverageTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data, isLoading } = useCoverage(filter === "archived");
  const [busy, setBusy] = useState<string | null>(null);
  const [showIngest, setShowIngest] = useState(false);

  const counts = useMemo(() => {
    const c = { all: 0, high: 0, medium: 0, low: 0, archived: 0, unlinked: 0, generic_title: 0, no_event_id: 0, stadium_fallback: 0 };
    for (const r of data ?? []) {
      c.all++;
      if (r.archived_at) c.archived++;
      if (r.quality_score === "high") c.high++;
      else if (r.quality_score === "medium") c.medium++;
      else c.low++;
      if (!r.match_id) c.unlinked++;
      if (r.quality_reasons?.includes("generic_title")) c.generic_title++;
      if (r.quality_reasons?.includes("no_event_id")) c.no_event_id++;
      if (r.quality_reasons?.includes("stadium_fallback")) c.stadium_fallback++;
    }
    return c;
  }, [data]);

  const filtered = useMemo(() => (data ?? []).filter((r) => {
    if (filter === "all") return !r.archived_at;
    if (filter === "archived") return !!r.archived_at;
    if (filter === "high" || filter === "medium" || filter === "low") return r.quality_score === filter && !r.archived_at;
    if (filter === "unlinked") return !r.match_id && !r.archived_at;
    return (r.quality_reasons ?? []).includes(filter) && !r.archived_at;
  }), [data, filter]);

  const runFn = async (name: string, payload?: Record<string, unknown>) => {
    setBusy(name);
    try {
      const { data: res, error } = await supabase.functions.invoke(name, { body: payload ?? {} });
      if (error) throw error;
      toast({ title: name, description: JSON.stringify(res) });
      qc.invalidateQueries({ queryKey: ["wc2026-coverage"] });
    } catch (e) {
      toast({ title: `${name} failed`, description: String((e as Error).message ?? e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading coverage…</div>;

  const chip = (key: FilterKey, label: string, count: number, cls: string) => (
    <button onClick={() => setFilter(key)} className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition ${cls} ${filter === key ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}>
      {label} <span className="font-mono opacity-80">{count}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        <strong>Coverage rebuild mode:</strong> rows are now scored for quality and ingestion accepts only direct event pages. Schedule/search extractions are blocked.
      </div>

      {/* Quality KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"><div className="text-[10px] uppercase font-bold text-emerald-700">High</div><div className="text-xl font-mono text-emerald-900">{counts.high}</div></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"><div className="text-[10px] uppercase font-bold text-amber-700">Medium</div><div className="text-xl font-mono text-amber-900">{counts.medium}</div></div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2"><div className="text-[10px] uppercase font-bold text-red-700">Low</div><div className="text-xl font-mono text-red-900">{counts.low}</div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] uppercase font-bold text-slate-600">Archived</div><div className="text-xl font-mono text-slate-900">{counts.archived}</div></div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2"><div className="text-[10px] uppercase font-bold text-orange-700">Unlinked</div><div className="text-xl font-mono text-orange-900">{counts.unlinked}</div></div>
      </div>

      {/* Admin actions */}
      <div className="flex flex-wrap gap-2">
        <button disabled={!!busy} onClick={() => runFn("wc-coverage-quality-audit")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50">
          {busy === "wc-coverage-quality-audit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Run quality audit
        </button>
        <button disabled={!!busy} onClick={() => runFn("wc-coverage-purge-generic", { dry_run: true })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold hover:bg-amber-200 disabled:opacity-50">
          <ShieldCheck className="w-3.5 h-3.5" /> Purge (dry run)
        </button>
        <button disabled={!!busy} onClick={() => { if (confirm("Archive all generic / low-quality coverage rows? This is reversible.")) runFn("wc-coverage-purge-generic", { dry_run: false }); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50">
          <Trash2 className="w-3.5 h-3.5" /> Purge generic coverage
        </button>
        <button disabled={!!busy} onClick={() => setShowIngest(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
          <PlusCircle className="w-3.5 h-3.5" /> Ingest single event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {chip("all", "All", counts.all - counts.archived, "bg-slate-100 text-slate-700 border-slate-200")}
        {chip("high", "Quality: high", counts.high, "bg-emerald-100 text-emerald-800 border-emerald-200")}
        {chip("medium", "Quality: medium", counts.medium, "bg-amber-100 text-amber-800 border-amber-200")}
        {chip("low", "Quality: low", counts.low, "bg-red-100 text-red-800 border-red-200")}
        {chip("archived", "Archived", counts.archived, "bg-slate-200 text-slate-800 border-slate-300")}
        {chip("unlinked", "Unlinked", counts.unlinked, "bg-orange-100 text-orange-800 border-orange-200")}
        {chip("generic_title", "Generic title", counts.generic_title, "bg-red-50 text-red-700 border-red-200")}
        {chip("no_event_id", "No event id", counts.no_event_id, "bg-red-50 text-red-700 border-red-200")}
        {chip("stadium_fallback", "Stadium fallback", counts.stadium_fallback, "bg-red-50 text-red-700 border-red-200")}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Quality</th>
                <th className="text-left px-3 py-2">Provider</th>
                <th className="text-left px-3 py-2">Event</th>
                <th className="text-left px-3 py-2">Venue / Date</th>
                <th className="text-left px-3 py-2">Link</th>
                <th className="text-left px-3 py-2">Reasons</th>
                <th className="text-right px-3 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const date = r.event_date ? new Date(r.event_date) : null;
                const valid = date && !isNaN(date.getTime());
                const q = r.quality_score ?? "low";
                return (
                  <tr key={r.id} className={`border-t border-slate-100 ${r.archived_at ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${QUALITY_COLORS[q]}`}>{q}</span>
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700">{r.provider}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-semibold text-slate-900">{r.event_name ?? `${r.home_label ?? "?"} vs ${r.away_label ?? "?"}`}</div>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-slate-700 inline-flex items-center gap-0.5">{r.event_slug ?? r.provider_event_id ?? "(no id)"} <ExternalLink className="w-2.5 h-2.5" /></a>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {r.stadium_name}
                      <div className="text-[10px] text-slate-400">{valid ? date!.toISOString().slice(0, 16).replace("T", " ") : "no date"} · {r.stadium_confidence ?? "low"}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.match_id
                        ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> linked</span>
                        : <span className="inline-flex items-center gap-1 text-orange-700"><Link2 className="w-3 h-3" /> unmatched</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(r.quality_reasons ?? []).length === 0
                          ? <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> clean</span>
                          : (r.quality_reasons ?? []).map((b) => (
                            <span key={b} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase border border-amber-200">
                              <AlertCircle className="w-2.5 h-2.5" /> {b}
                            </span>
                          ))}
                        {r.archived_reason && <span className="text-[10px] text-slate-500">archived: {r.archived_reason}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {r.starting_price != null
                        ? <span className="font-semibold text-slate-900">From €{Number(r.starting_price).toFixed(0)}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">No coverage rows match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showIngest && <IngestDialog onClose={() => setShowIngest(false)} onDone={() => { setShowIngest(false); qc.invalidateQueries({ queryKey: ["wc2026-coverage"] }); }} />}
    </div>
  );
}

function IngestDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    url: "", provider_event_id: "", event_name: "", event_date: "",
    stadium_name: "", home_label: "", away_label: "", group_code: "", starting_price: "",
  });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-ticombo-ingest-event", {
        body: { ...form, starting_price: form.starting_price ? Number(form.starting_price) : null },
      });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error((data as { error?: string })?.error ?? "rejected");
      toast({ title: "Event ingested", description: JSON.stringify(data) });
      onDone();
    } catch (e) {
      toast({ title: "Ingest rejected", description: String((e as Error).message ?? e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const field = (k: keyof typeof form, label: string, placeholder?: string) => (
    <label className="block">
      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">{label}</div>
      <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={placeholder} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm" />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-5 space-y-3 max-h-[90vh] overflow-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-slate-900">Ingest direct event page</div>
            <div className="text-xs text-slate-500">Paste a real Ticombo event URL and its metadata. Schedule/search pages will be rejected.</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field("url", "Event URL *", "https://www.ticombo.com/.../event-...")}
          {field("provider_event_id", "Provider event id *", "e.g. 12345678")}
          {field("event_name", "Event name *", "Mexico vs Canada")}
          {field("event_date", "Kickoff ISO *", "2026-06-11T18:00:00Z")}
          {field("stadium_name", "Stadium name *", "Estadio Azteca")}
          {field("group_code", "Group", "A")}
          {field("home_label", "Home", "Mexico")}
          {field("away_label", "Away", "Canada")}
          {field("starting_price", "Starting price (EUR)", "199")}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs rounded border border-slate-300">Cancel</button>
          <button disabled={busy} onClick={submit} className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy && <Loader2 className="w-3 h-3 animate-spin" />} Ingest
          </button>
        </div>
      </div>
    </div>
  );
}
