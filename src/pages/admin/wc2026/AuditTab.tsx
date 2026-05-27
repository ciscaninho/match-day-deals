import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, ShieldCheck, RefreshCw, Search } from "lucide-react";

type Issue = {
  match_id: string;
  slug: string | null;
  kind: string;
  severity: "high" | "med" | "low";
  expected: string | null;
  current: string | null;
  source: string;
  fix_hint: string;
};
type Report = {
  ok: boolean;
  generated_at: string;
  kpis: Record<string, number>;
  issues: Issue[];
};

const SEV_CLS: Record<Issue["severity"], string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  med:  "bg-amber-100 text-amber-800 border-amber-200",
  low:  "bg-slate-100 text-slate-700 border-slate-200",
};
const KIND_LABEL: Record<string, string> = {
  unresolved_alias: "Unresolved stadium alias",
  stadium_id_mismatch: "Stadium link mismatch",
  city_mismatch: "City mismatch",
  alias_unverified: "Alias not verified",
  unresolved_placeholder: "Unresolved placeholder",
  kickoff_out_of_window: "Kickoff out of FIFA window",
  missing_provider_mapping: "Missing provider mapping",
};

export default function AuditTab() {
  const [filter, setFilter] = useState<string>("");
  const [kindFilter, setKindFilter] = useState<string>("");
  const { data, isFetching, refetch, error } = useQuery<Report>({
    queryKey: ["wc-audit-fixtures"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("wc-audit-fixtures");
      if (error) throw error;
      return data as Report;
    },
    staleTime: 60_000,
  });

  const kinds = useMemo(() => Array.from(new Set((data?.issues ?? []).map(i => i.kind))).sort(), [data]);
  const filtered = useMemo(() => {
    const list = data?.issues ?? [];
    return list.filter(i => {
      if (kindFilter && i.kind !== kindFilter) return false;
      if (filter) {
        const q = filter.toLowerCase();
        const hay = `${i.slug ?? ""} ${i.current ?? ""} ${i.expected ?? ""} ${i.kind}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, filter, kindFilter]);

  const kpis = data?.kpis ?? {};
  const cards: { label: string; key: string; tone: "good" | "warn" | "bad" | "neutral"; suffix?: string }[] = [
    { label: "Total fixtures", key: "total_fixtures", tone: "neutral" },
    { label: "Official", key: "official", tone: "good" },
    { label: "Generated", key: "generated", tone: kpis.generated ? "bad" : "good" },
    { label: "Stadium mismatches", key: "stadium_mismatches", tone: kpis.stadium_mismatches ? "bad" : "good" },
    { label: "Unresolved aliases", key: "unresolved_aliases", tone: kpis.unresolved_aliases ? "bad" : "good" },
    { label: "Kickoff mismatches", key: "kickoff_mismatches", tone: kpis.kickoff_mismatches ? "bad" : "good" },
    { label: "Missing coverage", key: "missing_coverage", tone: kpis.missing_coverage ? "warn" : "good" },
    { label: "Unresolved placeholders", key: "unresolved_placeholders", tone: kpis.unresolved_placeholders ? "warn" : "good" },
    { label: "Verified stadium mappings", key: "verified_stadium_mappings_pct", tone: (kpis.verified_stadium_mappings_pct ?? 0) >= 80 ? "good" : "warn", suffix: "%" },
    { label: "Provider confidence", key: "provider_confidence_pct", tone: (kpis.provider_confidence_pct ?? 0) >= 80 ? "good" : "warn", suffix: "%" },
  ];
  const toneCls = (t: "good"|"warn"|"bad"|"neutral") =>
    t === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : t === "warn" ? "border-amber-200 bg-amber-50 text-amber-800"
    : t === "bad" ? "border-red-200 bg-red-50 text-red-800"
    : "border-slate-200 bg-white text-slate-800";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Official Fixture Audit
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Compares imported FIFA WC2026 fixtures against the canonical stadium resolution layer
            (host stadiums + stadium_aliases). Fixtures are immutable — resolve mismatches via aliases,
            not by editing the canonical fixture.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
        >
          {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Run audit
        </button>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{String((error as any)?.message ?? error)}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {cards.map(c => (
          <div key={c.key} className={`rounded-xl border p-3 ${toneCls(c.tone)}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{c.label}</div>
            <div className="text-xl font-extrabold mt-1">
              {kpis[c.key] ?? 0}{c.suffix ?? ""}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter issues by slug, value…"
            className="w-full pl-7 pr-2 py-1.5 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value)} className="px-2 py-1.5 text-sm rounded border border-slate-200">
          <option value="">All issue types</option>
          {kinds.map(k => <option key={k} value={k}>{KIND_LABEL[k] ?? k}</option>)}
        </select>
        <div className="text-xs text-slate-500 ml-auto">
          {filtered.length} / {data?.issues.length ?? 0} issues
          {data?.generated_at && <span className="text-slate-400 ml-2">· {new Date(data.generated_at).toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Sev</th>
                <th className="text-left px-3 py-2">Issue</th>
                <th className="text-left px-3 py-2">Fixture</th>
                <th className="text-left px-3 py-2">Expected</th>
                <th className="text-left px-3 py-2">Current</th>
                <th className="text-left px-3 py-2">Source</th>
                <th className="text-left px-3 py-2">Fix</th>
              </tr>
            </thead>
            <tbody>
              {isFetching && !data && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Running audit…
                </td></tr>
              )}
              {filtered.map((i, idx) => (
                <tr key={`${i.match_id}-${i.kind}-${idx}`} className="border-t border-slate-100 hover:bg-slate-50/60 align-top">
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${SEV_CLS[i.severity]}`}>
                      {i.severity === "high" ? <ShieldAlert className="w-3 h-3 inline mr-0.5" /> : null}
                      {i.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{KIND_LABEL[i.kind] ?? i.kind}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 font-mono">{i.slug ?? i.match_id.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-xs text-emerald-700">{i.expected ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-red-700">{i.current ?? "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-500">{i.source}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{i.fix_hint}</td>
                </tr>
              ))}
              {!isFetching && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-emerald-700 font-semibold">
                  No issues match current filters. 🎉
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
