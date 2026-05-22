import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type Row = {
  row: {
    slug: string; kickoffUtc: string; kickoffLocal?: string;
    homeTeam: string; awayTeam: string; phase: string; matchday: number; groupCode?: string | null;
    venue: string; city: string; country: string;
  };
  stadium_id: string | null;
  stadium_name: string | null;
  strategy: string;
  status: "ready" | "duplicate" | "needs_stadium";
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialBatch?: { batch_id: string; proposed: Row[]; summary: any } | null;
}

export const WorldCupImportDialog = ({ open, onClose, initialBatch }: Props) => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [batch, setBatch] = useState<{ batch_id: string; proposed: Row[]; summary: any } | null>(initialBatch ?? null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set(initialBatch?.proposed.filter((p) => p.status === "ready").map((p) => p.row.slug) || []));

  const runPreview = async (source: "fifa_seed" | "csv", payload?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-import-schedule", {
        body: source === "csv" ? { source, rows: payload } : { source },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setBatch(data);
      setAccepted(new Set((data.proposed as Row[]).filter((p) => p.status === "ready").map((p) => p.row.slug)));
    } catch (err) {
      toast({ title: t("admin.wcimport.error") || "Import failed", description: String(err), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...body] = lines;
    const cols = header.split(",").map((c) => c.trim());
    const rows = body.map((l) => {
      const v = l.split(",").map((c) => c.trim());
      const row: any = {};
      cols.forEach((c, i) => (row[c] = v[i]));
      row.matchday = Number(row.matchday);
      return row;
    });
    await runPreview("csv", rows);
  };

  const apply = async () => {
    if (!batch) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-import-apply", {
        body: { batch_id: batch.batch_id, accepted_slugs: Array.from(accepted) },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast({ title: t("admin.wcimport.applied") || "Import applied", description: `${data.inserted} / ${data.attempted}` });
      qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    } catch (err) {
      toast({ title: t("admin.wcimport.apply_error") || "Apply failed", description: String(err), variant: "destructive" });
    } finally { setApplying(false); }
  };

  const toggle = (slug: string) => setAccepted((s) => {
    const next = new Set(s); next.has(slug) ? next.delete(slug) : next.add(slug); return next;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("admin.wcimport.title") || "Import World Cup 2026 schedule"}</DialogTitle>
          <DialogDescription>
            {t("admin.wcimport.subtitle") || "Matches are generated from the official schedule and auto-linked to host stadiums. Review before applying."}
          </DialogDescription>
        </DialogHeader>

        {!batch ? (
          <div className="space-y-3">
            <Button onClick={() => runPreview("fifa_seed")} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              {t("admin.wcimport.source.fifa") || "Load FIFA schedule"}
            </Button>
            <label className="block">
              <input type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && onCsv(e.target.files[0])} />
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm cursor-pointer hover:border-emerald-500">
                <Upload className="w-4 h-4" />
                {t("admin.wcimport.source.csv") || "Upload CSV fallback"}
              </span>
            </label>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />{batch.summary.ready} {t("admin.wcimport.ready") || "ready"}</Badge>
              <Badge className="bg-slate-100 text-slate-700">{batch.summary.duplicate} {t("admin.wcimport.duplicate") || "already imported"}</Badge>
              <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3 mr-1" />{batch.summary.needs_stadium} {t("admin.wcimport.needs_stadium") || "need host stadium"}</Badge>
            </div>
            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left">
                    <th className="p-2 w-8"></th>
                    <th className="p-2">{t("admin.wcimport.col.fixture") || "Fixture"}</th>
                    <th className="p-2">{t("admin.wcimport.col.venue") || "Venue"}</th>
                    <th className="p-2">{t("admin.wcimport.col.date") || "Kickoff"}</th>
                    <th className="p-2">{t("admin.wcimport.col.status") || "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.proposed.map((p) => (
                    <tr key={p.row.slug} className="border-t border-slate-100">
                      <td className="p-2">
                        <Checkbox
                          checked={accepted.has(p.row.slug)}
                          disabled={p.status !== "ready"}
                          onCheckedChange={() => toggle(p.row.slug)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-bold text-[#2C3E50]">{p.row.homeTeam} vs {p.row.awayTeam}</div>
                        <div className="text-[10px] text-slate-500">{p.row.phase.toUpperCase()} · MD{p.row.matchday}{p.row.groupCode ? ` · Group ${p.row.groupCode}` : ""}</div>
                      </td>
                      <td className="p-2">
                        <div>{p.stadium_name || p.row.venue}</div>
                        <div className="text-[10px] text-slate-500">{p.row.city}, {p.row.country}{p.stadium_name ? ` · ${p.strategy}` : ""}</div>
                      </td>
                      <td className="p-2 whitespace-nowrap">{new Date(p.row.kickoffUtc).toLocaleString()}</td>
                      <td className="p-2">
                        {p.status === "ready" && <Badge className="bg-emerald-100 text-emerald-700">{t("admin.wcimport.ready") || "Ready"}</Badge>}
                        {p.status === "duplicate" && <Badge className="bg-slate-100 text-slate-600">{t("admin.wcimport.duplicate") || "Skipped"}</Badge>}
                        {p.status === "needs_stadium" && (
                          <Badge className="bg-amber-100 text-amber-700" title={t("admin.wcimport.needs_stadium.hint") || "Promote a host stadium first"}>
                            <XCircle className="w-3 h-3 mr-1" />{t("admin.wcimport.needs_stadium") || "Needs host"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <DialogFooter>
          {batch && (
            <Button onClick={apply} disabled={applying || accepted.size === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.wcimport.apply") || "Apply"} ({accepted.size})
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>{t("admin.close") || "Close"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorldCupImportDialog;
