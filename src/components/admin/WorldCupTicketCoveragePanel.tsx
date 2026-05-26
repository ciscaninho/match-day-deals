import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Sparkles, Trash2, Trophy, Ticket, CalendarPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useWorldCupTicketCoverage, type WCTicketCoverage, type WCCoverageKind, groupCoverageByEvent } from "@/hooks/useWorldCupTicketCoverage";

type Host = { slug: string; stadium_name: string; city: string; country: string };

const KIND_OPTIONS: WCCoverageKind[] = ["official", "hospitality", "resale", "affiliate"];
const STATUS_OPTIONS = ["opening_match", "group_stage", "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"];

export function WorldCupTicketCoveragePanel() {
  const qc = useQueryClient();
  const { data: coverage = [], isLoading } = useWorldCupTicketCoverage({ adminAll: true });
  const [creating, setCreating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [lastSync, setLastSync] = useState<any>(null);
  const [newEventHost, setNewEventHost] = useState<string>("");

  const { data: hosts = [] } = useQuery<Host[]>({
    queryKey: ["wc-hosts-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country")
        .is("archived_at", null)
        .eq("is_world_cup_host", true)
        .order("stadium_name");
      return (data as Host[]) ?? [];
    },
  });

  const { data: clicks } = useQuery({
    queryKey: ["wc-affiliate-clicks-30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { count } = await supabase
        .from("affiliate_clicks" as never)
        .select("id", { count: "exact", head: true })
        .eq("league", "FIFA World Cup 2026")
        .gte("created_at", since);
      return count || 0;
    },
  });

  const events = useMemo(() => groupCoverageByEvent(coverage), [coverage]);
  const eventRows = useMemo(() => events.filter((e) => e.event_slug != null), [events]);

  const { data: topClicks } = useQuery({
    queryKey: ["wc-affiliate-top-clicked-30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("affiliate_clicks" as never)
        .select("destination")
        .eq("league", "FIFA World Cup 2026")
        .gte("created_at", since)
        .limit(2000);
      const counts = new Map<string, number>();
      for (const r of (data ?? []) as any[]) {
        if (!r.destination) continue;
        counts.set(r.destination, (counts.get(r.destination) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    },
  });

  const SLOT_RE = /^(tbd|tba|winner|runner[- ]?up|loser|group\s+[a-h].*|[a-h][1-4]|w\d+|r\d+|l\d+)$/i;
  const isSlot = (s: string | null) => !s || SLOT_RE.test(s.trim());

  const publicReport = useMemo(() => {
    return coverage.map((c) => {
      const reasons: string[] = [];
      if (c.status !== "active") reasons.push("inactive");
      if (!c.event_slug) reasons.push("no event_slug");
      if (!c.url) reasons.push("no url");
      if (c.is_available === false) reasons.push("unavailable");
      return { row: c, public: reasons.length === 0, reason: reasons.join(", ") || "—" };
    });
  }, [coverage]);

  const metrics = useMemo(() => {
    const active = coverage.filter((c) => c.status === "active");
    const events = new Set(active.filter((c) => c.event_slug).map((c) => c.event_slug as string));
    const urlCounts = new Map<string, number>();
    for (const c of active) urlCounts.set(c.url, (urlCounts.get(c.url) ?? 0) + 1);
    const duplicateUrls = [...urlCounts.values()].filter((n) => n > 1).length;
    const withPrice = active.filter((c) => c.event_slug && c.starting_price != null);
    const stale = withPrice.filter((c) => {
      if (!c.last_price_check) return true;
      return Date.now() - new Date(c.last_price_check).getTime() > 7 * 24 * 3600 * 1000;
    }).length;
    const eventRowsActive = active.filter((c) => c.event_slug);
    const detected = events.size;
    const published = new Set(eventRowsActive.filter((c) => c.is_available !== false && !isSlot(c.home_label) && !isSlot(c.away_label)).map((c) => c.event_slug as string)).size;
    const unmatched = new Set(eventRowsActive.filter((c) => !c.match_id).map((c) => c.event_slug as string)).size;
    const publicCards = publicReport.filter((r) => r.public).length;
    const hidden = publicReport.filter((r) => !r.public).length;
    return {
      ticketRows: coverage.length,
      eventRows: detected,
      publicCards,
      hidden,
      detected,
      published,
      unmatched,
      providers: eventRowsActive.length,
      affiliate: active.filter((c) => c.event_slug && c.kind === "affiliate").length,
      official: active.filter((c) => c.event_slug && c.kind === "official").length,
      duplicateUrls,
      staleP: stale,
      clicks: clicks ?? 0,
      stadiumOnly: active.filter((c) => !c.event_slug).length,
    };
  }, [coverage, clicks, publicReport]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["wc-ticket-coverage"] });

  const addEventDraft = async () => {
    const host = hosts.find((h) => h.slug === newEventHost);
    if (!host) return toast.error("Pick a host stadium first");
    setCreating(true);
    try {
      const ts = Date.now();
      const row = {
        stadium_slug: host.slug,
        stadium_name: host.stadium_name,
        city: host.city,
        country: host.country,
        kind: "affiliate",
        provider: "Ticombo",
        url: `https://www.ticombo.com/en/search?query=${encodeURIComponent(`${host.stadium_name} World Cup 2026`)}`,
        currency: "EUR",
        status: "active",
        event_slug: `wc2026-${host.slug}-${ts}`,
        event_name: `World Cup match at ${host.stadium_name}`,
        event_status: "group_stage",
        home_label: "TBD",
        away_label: "TBD",
        ticket_source_type: "affiliate",
      };
      const { error } = await supabase.from("wc_ticket_coverage" as never).insert(row as never);
      if (error) throw error;
      toast.success("Event draft added");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Insert failed");
    } finally {
      setCreating(false);
    }
  };

  const update = async (id: string, patch: Partial<WCTicketCoverage>) => {
    const { error } = await supabase.from("wc_ticket_coverage" as never).update(patch as never).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coverage entry?")) return;
    const { error } = await supabase.from("wc_ticket_coverage" as never).delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const suggest = async () => {
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-copilot-ticket-coverage", { body: {} });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(`Suggested coverage for ${data?.created ?? 0} host(s)`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Copilot failed");
    } finally {
      setSuggesting(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-ticket-sync", { body: { provider: "Ticombo", limit: 50 } });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success(`Synced ${data?.enriched ?? 0} event(s) · linked ${data?.linked ?? 0}`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-extrabold text-slate-900">World Cup event coverage</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={sync} disabled={syncing} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
              {syncing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Sync Ticombo events
            </Button>
            <Button size="sm" onClick={suggest} disabled={suggesting} className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs">
              {suggesting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
              Suggest host coverage
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ticket rows", value: metrics.ticketRows },
            { label: "Event rows", value: metrics.eventRows },
            { label: "Public cards", value: metrics.publicCards },
            { label: "Rows hidden", value: metrics.hidden },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-2xl font-extrabold text-emerald-900 leading-none">{m.value}</p>
              <p className="text-[10px] font-semibold text-emerald-700 mt-1.5 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Publicibility debug ({publicReport.length} rows)</p>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-3 py-1.5">Provider</th>
                  <th className="text-left px-3 py-1.5">Event slug</th>
                  <th className="text-left px-3 py-1.5">Event name</th>
                  <th className="text-right px-3 py-1.5">Price</th>
                  <th className="text-center px-3 py-1.5">Public</th>
                  <th className="text-left px-3 py-1.5">Hidden reason</th>
                </tr>
              </thead>
              <tbody>
                {publicReport.map(({ row, public: isPub, reason }) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 text-slate-700">{row.provider}</td>
                    <td className="px-3 py-1.5 text-slate-500 font-mono text-[10px] truncate max-w-[180px]">{row.event_slug ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700 truncate max-w-[220px]">{row.event_name ?? (row.home_label && row.away_label ? `${row.home_label} vs ${row.away_label}` : "—")}</td>
                    <td className="px-3 py-1.5 text-right text-slate-700">{row.starting_price != null ? `${row.starting_price} ${row.currency}` : "—"}</td>
                    <td className="px-3 py-1.5 text-center">{isPub ? <span className="text-emerald-700 font-bold">yes</span> : <span className="text-slate-400">no</span>}</td>
                    <td className="px-3 py-1.5 text-amber-700 text-[11px]">{isPub ? "—" : reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {[
            { label: "Events detected", value: metrics.detected },
            { label: "Events published", value: metrics.published },
            { label: "Events unmatched", value: metrics.unmatched },
            { label: "Official rows", value: metrics.official },
            { label: "Duplicate URLs", value: metrics.duplicateUrls },
            { label: "Stale prices", value: metrics.staleP },
            { label: "Clicks (30d)", value: metrics.clicks },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{m.value}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-1.5 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>

        {topClicks && topClicks.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Top clicked URLs (30d)</p>
            <ul className="space-y-1">
              {topClicks.map(([url, n]) => (
                <li key={url} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-slate-700">{url}</span>
                  <span className="font-bold text-emerald-700 shrink-0">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {metrics.stadiumOnly > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>{metrics.stadiumOnly}</strong> legacy stadium-only rows have no event attached. Convert them by filling event fields below — only event rows appear publicly.
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-[10px] uppercase font-bold text-slate-600">Add event draft at host</Label>
            <select value={newEventHost} onChange={(e) => setNewEventHost(e.target.value)} className="h-9 w-full text-xs border border-slate-200 rounded px-2 bg-white">
              <option value="">Select host stadium…</option>
              {hosts.map((h) => <option key={h.slug} value={h.slug}>{h.stadium_name} · {h.city}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={addEventDraft} disabled={creating || !newEventHost} className="h-9">
            <CalendarPlus className="w-3 h-3 mr-1" /> New event
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-extrabold text-slate-900">Coverage entries ({coverage.length}) — {eventRows.length} unique events</h3>
          </div>
          {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : coverage.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No coverage entries yet.</p>
          ) : (
            <div className="space-y-2">
              {coverage.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {c.home_label && c.away_label ? `${c.home_label} vs ${c.away_label}` : c.event_name ?? `(no event) ${c.stadium_name}`}
                      </p>
                      <p className="text-[11px] text-slate-500">{c.stadium_name} · {[c.city, c.country].filter(Boolean).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!c.event_slug && <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">stadium-only</Badge>}
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600" onClick={() => remove(c.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Home</Label>
                      <Input defaultValue={c.home_label ?? ""} onBlur={(e) => e.target.value !== (c.home_label ?? "") && update(c.id, { home_label: e.target.value || null })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Away</Label>
                      <Input defaultValue={c.away_label ?? ""} onBlur={(e) => e.target.value !== (c.away_label ?? "") && update(c.id, { away_label: e.target.value || null })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Event date</Label>
                      <Input type="date" defaultValue={c.event_date ?? ""} onBlur={(e) => e.target.value !== (c.event_date ?? "") && update(c.id, { event_date: e.target.value || null })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Phase</Label>
                      <select value={c.event_status ?? ""} onChange={(e) => update(c.id, { event_status: e.target.value || null })} className="h-8 w-full text-xs border border-slate-200 rounded px-2">
                        <option value="">—</option>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Event slug</Label>
                      <Input defaultValue={c.event_slug ?? ""} onBlur={(e) => e.target.value !== (c.event_slug ?? "") && update(c.id, { event_slug: e.target.value || null })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Kind</Label>
                      <select value={c.kind} onChange={(e) => update(c.id, { kind: e.target.value as WCCoverageKind })} className="h-8 w-full text-xs border border-slate-200 rounded px-2">
                        {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Provider</Label>
                      <Input defaultValue={c.provider} onBlur={(e) => e.target.value !== c.provider && update(c.id, { provider: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">URL</Label>
                      <Input defaultValue={c.url} onBlur={(e) => e.target.value !== c.url && update(c.id, { url: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">From price</Label>
                      <Input type="number" defaultValue={c.starting_price ?? ""} onBlur={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        if (v !== c.starting_price) update(c.id, { starting_price: v, last_price_check: new Date().toISOString() });
                      }} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Image URL</Label>
                      <Input defaultValue={c.image_url ?? ""} onBlur={(e) => e.target.value !== (c.image_url ?? "") && update(c.id, { image_url: e.target.value || null })} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WorldCupTicketCoveragePanel;
