import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Sparkles, Trash2, Trophy, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useWorldCupTicketCoverage, type WCTicketCoverage, type WCCoverageKind } from "@/hooks/useWorldCupTicketCoverage";

type Host = { slug: string; stadium_name: string; city: string; country: string };

const KIND_OPTIONS: WCCoverageKind[] = ["official", "hospitality", "resale", "affiliate"];

export function WorldCupTicketCoveragePanel() {
  const qc = useQueryClient();
  const { data: coverage = [], isLoading } = useWorldCupTicketCoverage({ adminAll: true });
  const [creating, setCreating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

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

  const metrics = useMemo(() => {
    const hostSlugs = new Set(hosts.map((h) => h.slug));
    const covered = new Set(coverage.filter((c) => c.status === "active").map((c) => c.stadium_slug));
    const byKind = (k: WCCoverageKind) => coverage.filter((c) => c.status === "active" && c.kind === k).length;
    return {
      hosts: hosts.length,
      ticketReady: [...hostSlugs].filter((s) => covered.has(s)).length,
      affiliateReady: byKind("affiliate"),
      officialOnly: byKind("official"),
      hospitality: byKind("hospitality"),
      clicks: clicks ?? 0,
    };
  }, [hosts, coverage, clicks]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["wc-ticket-coverage"] });

  const addRow = async (host: Host, init?: Partial<WCTicketCoverage>) => {
    setCreating(true);
    try {
      const row = {
        stadium_slug: host.slug,
        stadium_name: host.stadium_name,
        city: host.city,
        country: host.country,
        kind: init?.kind ?? "affiliate",
        provider: init?.provider ?? "Ticombo",
        url: init?.url ?? `https://www.ticombo.com/en/search?query=${encodeURIComponent(host.stadium_name)}`,
        currency: init?.currency ?? "EUR",
        status: "active",
      };
      const { error } = await supabase.from("wc_ticket_coverage" as never).insert(row as never);
      if (error) throw error;
      toast.success(`Added ${host.stadium_name}`);
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

  const missing = hosts.filter((h) => !coverage.some((c) => c.stadium_slug === h.slug));

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-extrabold text-slate-900">World Cup ticket coverage</h2>
          </div>
          <Button size="sm" onClick={suggest} disabled={suggesting || missing.length === 0} className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs">
            {suggesting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Suggest coverage ({missing.length} missing)
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Host stadiums", value: metrics.hosts },
            { label: "Ticket ready", value: metrics.ticketReady },
            { label: "Affiliate ready", value: metrics.affiliateReady },
            { label: "Official only", value: metrics.officialOnly },
            { label: "Hospitality", value: metrics.hospitality },
            { label: "Revenue clicks (30d)", value: metrics.clicks },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{m.value}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-1.5 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>

        {missing.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Hosts missing coverage ({missing.length})</p>
            <div className="flex flex-wrap gap-2">
              {missing.map((h) => (
                <Button key={h.slug} size="sm" variant="outline" disabled={creating} className="h-7 text-xs"
                  onClick={() => addRow(h)}>
                  <Plus className="w-3 h-3 mr-1" /> {h.stadium_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-extrabold text-slate-900">Coverage entries ({coverage.length})</h3>
          </div>
          {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : coverage.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No coverage entries yet.</p>
          ) : (
            <div className="space-y-2">
              {coverage.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.stadium_name}</p>
                      <p className="text-[11px] text-slate-500">{[c.city, c.country].filter(Boolean).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600" onClick={() => remove(c.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Kind</Label>
                      <select value={c.kind} onChange={(e) => update(c.id, { kind: e.target.value as WCCoverageKind })}
                        className="h-8 w-full text-xs border border-slate-200 rounded px-2">
                        {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">Provider</Label>
                      <Input defaultValue={c.provider} onBlur={(e) => e.target.value !== c.provider && update(c.id, { provider: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-600">URL</Label>
                      <Input defaultValue={c.url} onBlur={(e) => e.target.value !== c.url && update(c.id, { url: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-600">From price</Label>
                      <Input type="number" defaultValue={c.starting_price ?? ""} onBlur={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        if (v !== c.starting_price) update(c.id, { starting_price: v });
                      }} className="h-8 text-xs" />
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
