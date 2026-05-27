import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle2, Link2, ExternalLink } from "lucide-react";

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
}

function useCoverage() {
  return useQuery({
    queryKey: ["wc2026-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wc_ticket_coverage" as never)
        .select("id,provider,event_name,event_slug,event_date,stadium_name,stadium_slug,home_label,away_label,starting_price,currency,image_url,match_id,provider_event_id,active,url")
        .order("event_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Coverage[];
    },
  });
}

type Blocker = "unlinked" | "no_price" | "no_image" | "inactive";

function blockers(c: Coverage): Blocker[] {
  const b: Blocker[] = [];
  if (!c.match_id) b.push("unlinked");
  if (c.starting_price == null) b.push("no_price");
  if (!c.image_url) b.push("no_image");
  if (!c.active) b.push("inactive");
  return b;
}

const BLOCKER_LABEL: Record<Blocker, string> = {
  unlinked: "Unlinked",
  no_price: "No price",
  no_image: "No image",
  inactive: "Inactive",
};

export default function CoverageTab() {
  const { data, isLoading } = useCoverage();
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked" | Blocker>("all");

  const counts = useMemo(() => {
    const c = { all: 0, linked: 0, unlinked: 0, no_price: 0, no_image: 0, inactive: 0 };
    for (const r of data ?? []) {
      c.all++;
      if (r.match_id) c.linked++; else c.unlinked++;
      if (r.starting_price == null) c.no_price++;
      if (!r.image_url) c.no_image++;
      if (!r.active) c.inactive++;
    }
    return c;
  }, [data]);

  const filtered = useMemo(() => (data ?? []).filter(r => {
    if (filter === "all") return true;
    if (filter === "linked") return !!r.match_id;
    if (filter === "unlinked") return !r.match_id;
    return blockers(r).includes(filter);
  }), [data, filter]);

  if (isLoading) return <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading coverage…</div>;

  const chip = (key: typeof filter, label: string, count: number, cls: string) => (
    <button onClick={() => setFilter(key)} className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition ${cls} ${filter === key ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}>
      {label} <span className="font-mono opacity-80">{count}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <strong>Safety:</strong> Coverage rows never create fixtures. They can only link, enrich, or publish against existing matches.
      </div>

      <div className="flex flex-wrap gap-2">
        {chip("all", "All", counts.all, "bg-slate-100 text-slate-700 border-slate-200")}
        {chip("linked", "Linked", counts.linked, "bg-emerald-100 text-emerald-800 border-emerald-200")}
        {chip("unlinked", "Unlinked", counts.unlinked, "bg-orange-100 text-orange-800 border-orange-200")}
        {chip("no_price", "No price", counts.no_price, "bg-amber-100 text-amber-800 border-amber-200")}
        {chip("no_image", "No image", counts.no_image, "bg-blue-100 text-blue-800 border-blue-200")}
        {chip("inactive", "Inactive", counts.inactive, "bg-red-100 text-red-800 border-red-200")}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">Provider</th>
                <th className="text-left px-3 py-2">Event</th>
                <th className="text-left px-3 py-2">Venue / Date</th>
                <th className="text-left px-3 py-2">Link</th>
                <th className="text-left px-3 py-2">Blockers</th>
                <th className="text-right px-3 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const date = r.event_date ? new Date(r.event_date) : null;
                const valid = date && !isNaN(date.getTime());
                const bl = blockers(r);
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700">{r.provider}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-semibold text-slate-900">{r.event_name ?? `${r.home_label ?? "?"} vs ${r.away_label ?? "?"}`}</div>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-slate-700 inline-flex items-center gap-0.5">{r.event_slug} <ExternalLink className="w-2.5 h-2.5" /></a>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {r.stadium_name}
                      <div className="text-[10px] text-slate-400">{valid ? date!.toISOString().slice(0,16).replace("T"," ") : "no date"}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.match_id
                        ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> linked</span>
                        : <span className="inline-flex items-center gap-1 text-orange-700"><Link2 className="w-3 h-3" /> unmatched</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {bl.length === 0
                          ? <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> healthy</span>
                          : bl.map(b => (
                            <span key={b} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase border border-amber-200">
                              <AlertCircle className="w-2.5 h-2.5" /> {BLOCKER_LABEL[b]}
                            </span>
                          ))}
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
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">No coverage rows match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
