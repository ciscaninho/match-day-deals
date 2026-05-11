import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, PlayCircle, RefreshCw, AlertTriangle, CheckCircle2, HelpCircle, FileWarning, Copy as CopyIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ImportRun = {
  id: string;
  created_at: string;
  finished_at: string | null;
  dry_run: boolean;
  folder_id: string | null;
  status: string;
  total_files: number;
  matched_count: number;
  ambiguous_count: number;
  unmatched_count: number;
  would_overwrite_count: number;
  duplicate_count: number;
  imported_count: number;
  error_message: string | null;
};

type HistoryRow = {
  id: string;
  drive_file_name: string;
  drive_mime_type: string | null;
  drive_size_bytes: number | null;
  matched_stadium_slug: string | null;
  matched_stadium_name: string | null;
  match_confidence: string;
  match_type: string;
  candidates: Array<{ slug: string; stadium_name: string; score: number }>;
  action: string;
  would_overwrite: boolean;
  previous_image_url: string | null;
  destination_path: string | null;
  notes: string | null;
};

const FOLDER_ID = "1sqgnhnyUYp9MsPqUAnMmI7lbytQsUv_q";

const StatCard = ({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "good" | "warn" | "bad" }) => (
  <div className={`rounded-xl p-3 border ${
    tone === "good" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" :
    tone === "warn" ? "bg-amber-500/10 border-amber-500/30 text-amber-200" :
    tone === "bad" ? "bg-red-500/10 border-red-500/30 text-red-200" :
    "bg-card border-border text-foreground"
  }`}>
    <div className="text-[10px] uppercase tracking-wider opacity-75 font-bold">{label}</div>
    <div className="text-2xl font-extrabold mt-0.5">{value}</div>
  </div>
);

const ConfidenceBadge = ({ confidence }: { confidence: string }) => {
  const map: Record<string, string> = {
    high: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    low: "bg-orange-500/20 text-orange-200 border-orange-500/30",
    none: "bg-red-500/20 text-red-200 border-red-500/30",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[confidence] ?? map.none}`}>{confidence}</span>;
};

export default function StadiumMediaSyncPage() {
  const qc = useQueryClient();
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ambiguous" | "unmatched" | "overwrite" | "duplicate">("all");

  const importsQ = useQuery({
    queryKey: ["stadium-media-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadium_media_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ImportRun[];
    },
  });

  const activeImportId = selectedImportId ?? importsQ.data?.[0]?.id ?? null;
  const activeImport = importsQ.data?.find((i) => i.id === activeImportId) ?? null;

  const historyQ = useQuery({
    queryKey: ["stadium-media-history", activeImportId, filter],
    enabled: !!activeImportId,
    queryFn: async () => {
      let q = supabase
        .from("stadium_media_history")
        .select("*")
        .eq("import_id", activeImportId!)
        .order("match_confidence", { ascending: true })
        .order("drive_file_name", { ascending: true })
        .limit(1000);
      if (filter === "ambiguous") q = q.eq("action", "needs_review");
      if (filter === "unmatched") q = q.is("matched_stadium_slug", null);
      if (filter === "overwrite") q = q.eq("would_overwrite", true);
      if (filter === "duplicate") q = q.like("notes", "%duplicate%");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  const runDryRun = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "sync-drive-stadium-media",
        { body: { folder_id: FOLDER_ID, dry_run: true } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success("Dry-run completed", {
        description: `Scanned ${data?.totals?.images ?? 0} images · matched ${data?.totals?.matched ?? 0}`,
      });
      setSelectedImportId(data?.import_id ?? null);
      qc.invalidateQueries({ queryKey: ["stadium-media-imports"] });
    },
    onError: (e: any) => {
      toast.error("Dry-run failed", { description: e?.message ?? String(e) });
    },
  });

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-5 py-6 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Link to="/app/admin" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to admin
              </Link>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Stadium Media Sync</h1>
              <p className="text-sm text-muted-foreground">
                Curated Google Drive → <code className="text-[11px]">stadium-media</code> bucket. Dry-run never touches production.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => importsQ.refetch()}
                disabled={importsQ.isFetching}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${importsQ.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => runDryRun.mutate()}
                disabled={runDryRun.isPending}
              >
                {runDryRun.isPending
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Running…</>
                  : <><PlayCircle className="w-4 h-4 mr-1.5" /> Run Drive dry-run</>}
              </Button>
            </div>
          </div>

          {/* Run picker */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Recent runs</div>
            <div className="flex flex-wrap gap-2">
              {(importsQ.data ?? []).map((r) => {
                const active = r.id === activeImportId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedImportId(r.id)}
                    className={`text-left rounded-lg border px-3 py-2 text-xs ${
                      active ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="font-bold">
                      {new Date(r.created_at).toLocaleString()}{" "}
                      {r.dry_run
                        ? <Badge variant="secondary" className="ml-1">dry-run</Badge>
                        : <Badge className="ml-1">live</Badge>}
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {r.status} · {r.matched_count}✓ · {r.ambiguous_count}? · {r.unmatched_count}✗
                    </div>
                  </button>
                );
              })}
              {(importsQ.data?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground">No runs yet. Click "Run Drive dry-run" to start.</div>
              )}
            </div>
          </div>

          {/* Summary */}
          {activeImport && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <StatCard label="Total files" value={activeImport.total_files} />
                <StatCard label="Matched" value={activeImport.matched_count} tone="good" />
                <StatCard label="Ambiguous" value={activeImport.ambiguous_count} tone="warn" />
                <StatCard label="Unmatched" value={activeImport.unmatched_count} tone="bad" />
                <StatCard label="Would overwrite" value={activeImport.would_overwrite_count} tone="warn" />
                <StatCard label="Duplicates" value={activeImport.duplicate_count} tone="warn" />
              </div>

              {activeImport.error_message && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                  {activeImport.error_message}
                </div>
              )}

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                {([
                  { k: "all", label: "All" },
                  { k: "ambiguous", label: "Ambiguous" },
                  { k: "unmatched", label: "Unmatched" },
                  { k: "overwrite", label: "Would overwrite" },
                  { k: "duplicate", label: "Duplicates" },
                ] as const).map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setFilter(f.k)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      filter === f.k ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* History rows */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border">
                  <div className="col-span-4">Drive file</div>
                  <div className="col-span-3">Matched stadium</div>
                  <div className="col-span-2">Confidence</div>
                  <div className="col-span-1">Action</div>
                  <div className="col-span-2">Flags</div>
                </div>
                <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                  {historyQ.isLoading && (
                    <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                  )}
                  {(historyQ.data ?? []).map((h) => (
                    <div key={h.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs items-start">
                      <div className="col-span-4 min-w-0">
                        <div className="font-bold truncate">{h.drive_file_name}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {h.drive_mime_type} · {h.drive_size_bytes ? `${(h.drive_size_bytes / 1024).toFixed(0)} KB` : "—"}
                        </div>
                      </div>
                      <div className="col-span-3 min-w-0">
                        {h.matched_stadium_slug ? (
                          <div>
                            <div className="font-bold truncate">{h.matched_stadium_name}</div>
                            <code className="text-[10px] text-muted-foreground">{h.matched_stadium_slug}</code>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {h.candidates && h.candidates.length > 1 && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {h.candidates.slice(0, 3).map((c) => (
                              <div key={c.slug} className="truncate">
                                · {c.slug} ({c.score.toFixed(2)})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <ConfidenceBadge confidence={h.match_confidence} />
                        <div className="text-[10px] text-muted-foreground mt-1">{h.match_type}</div>
                      </div>
                      <div className="col-span-1 text-[11px]">
                        {h.action === "would_import" && <span className="text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />import</span>}
                        {h.action === "needs_review" && <span className="text-amber-300 inline-flex items-center gap-1"><HelpCircle className="w-3 h-3" />review</span>}
                        {h.action === "skip" && <span className="text-red-300 inline-flex items-center gap-1"><FileWarning className="w-3 h-3" />skip</span>}
                      </div>
                      <div className="col-span-2 text-[10px] space-y-0.5">
                        {h.would_overwrite && (
                          <div className="inline-flex items-center gap-1 text-amber-300">
                            <AlertTriangle className="w-3 h-3" /> overwrite
                          </div>
                        )}
                        {h.notes?.includes("duplicate") && (
                          <div className="inline-flex items-center gap-1 text-orange-300">
                            <CopyIcon className="w-3 h-3" /> duplicate
                          </div>
                        )}
                        {h.notes && !h.notes.includes("duplicate") && (
                          <div className="text-muted-foreground truncate" title={h.notes}>{h.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!historyQ.isLoading && (historyQ.data ?? []).length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No rows for this filter.</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Next step:</strong> once the matches above look correct,
                we can run the same function with <code>dry_run: false</code> to actually upload to the
                <code className="mx-1">stadium-media</code> bucket and update the matched stadium rows.
                Nothing has been written to production stadium images yet.
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}
