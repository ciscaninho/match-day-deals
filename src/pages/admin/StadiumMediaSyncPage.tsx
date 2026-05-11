import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  PlayCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileWarning,
  Copy as CopyIcon,
  XCircle,
  Search,
  Wand2,
  SkipForward,
  ImageOff,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

type Candidate = { slug: string; stadium_name: string; score: number; stadium_id?: string };

type HistoryRow = {
  id: string;
  drive_file_id: string | null;
  drive_file_name: string;
  drive_mime_type: string | null;
  drive_size_bytes: number | null;
  drive_thumbnail_link: string | null;
  drive_image_width: number | null;
  drive_image_height: number | null;
  matched_stadium_id: string | null;
  matched_stadium_slug: string | null;
  matched_stadium_name: string | null;
  match_confidence: string;
  match_type: string;
  candidates: Candidate[];
  action: string;
  would_overwrite: boolean;
  previous_image_url: string | null;
  destination_path: string | null;
  notes: string | null;
  review_status: string;
  reviewed_at: string | null;
};

type StadiumLite = {
  id: string;
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  league: string | null;
  clubs: string[] | null;
  hero_image_url: string | null;
  background_image_url: string | null;
  image_url: string | null;
};

const FOLDER_ID = "1sqgnhnyUYp9MsPqUAnMmI7lbytQsUv_q";

// Priority weighting: ambiguous + overwrite + duplicate + low confidence go to top.
const PRIORITY: Record<string, number> = {
  ambiguous: 100,
  pending: 50,
  rematched: 30,
  approved: 10,
  skipped: 5,
  rejected: 5,
};

function rowPriority(h: HistoryRow): number {
  let p = PRIORITY[h.review_status] ?? 0;
  if (h.action === "needs_review") p += 60;
  if (h.would_overwrite) p += 25;
  if (h.notes?.includes("duplicate")) p += 20;
  if (h.match_confidence === "low") p += 15;
  if (h.match_confidence === "medium") p += 5;
  if (!h.matched_stadium_slug) p += 30;
  return p;
}

const StatCard = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "warn" | "bad";
}) => (
  <div
    className={`rounded-xl p-3 border ${
      tone === "good"
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
        : tone === "warn"
        ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
        : tone === "bad"
        ? "bg-red-500/10 border-red-500/30 text-red-200"
        : "bg-card border-border text-foreground"
    }`}
  >
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
    manual: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        map[confidence] ?? map.none
      }`}
    >
      {confidence}
    </span>
  );
};

const ReviewBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground border-border",
    approved: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-200 border-red-500/30",
    ambiguous: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    skipped: "bg-zinc-500/20 text-zinc-200 border-zinc-500/30",
    rematched: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        map[status] ?? map.pending
      }`}
    >
      {status}
    </span>
  );
};

/** Auth-fetched <img> for the Drive proxy. Falls back to “no preview”. */
function DriveImage({ fileId, alt }: { fileId: string | null; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let aborted = false;
    let objectUrl: string | null = null;
    setSrc(null);
    setErr(false);
    if (!fileId) {
      setErr(true);
      return;
    }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setErr(true);
          return;
        }
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stadium-media-thumbnail?file_id=${encodeURIComponent(
          fileId,
        )}&token=${encodeURIComponent(token)}`;
        const r = await fetch(url);
        if (!r.ok) {
          setErr(true);
          return;
        }
        const blob = await r.blob();
        if (aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!aborted) setErr(true);
      }
    })();
    return () => {
      aborted = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (err) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs bg-muted/30">
        <ImageOff className="w-6 h-6 opacity-60" />
        <span>No preview</span>
      </div>
    );
  }
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />;
}

/** Search-as-you-type stadium picker for manual reassignment. */
function StadiumPicker({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (s: StadiumLite) => void;
}) {
  const [q, setQ] = useState("");
  const search = useQuery({
    queryKey: ["admin-stadium-picker", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadiums")
        .select(
          "id, slug, stadium_name, city, country, league, clubs, hero_image_url, background_image_url, image_url",
        )
        .or(
          `stadium_name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%,club_name.ilike.%${q}%`,
        )
        .limit(15);
      if (error) throw error;
      return (data ?? []) as StadiumLite[];
    },
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a stadium by name, slug, city or club…"
          className="pl-7 h-8 text-xs"
        />
      </div>
      {q.trim().length >= 2 && (
        <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-background divide-y divide-border">
          {search.isLoading && (
            <div className="p-2 text-xs text-muted-foreground">Searching…</div>
          )}
          {(search.data ?? []).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left p-2 text-xs hover:bg-muted ${
                value === s.id ? "bg-primary/10" : ""
              }`}
            >
              <div className="font-bold truncate">{s.stadium_name}</div>
              <div className="text-muted-foreground truncate">
                <code className="text-[10px]">{s.slug}</code>
                {s.city ? ` · ${s.city}` : ""}
                {s.country ? `, ${s.country}` : ""}
                {s.clubs?.length ? ` · ${s.clubs.slice(0, 2).join(", ")}` : ""}
              </div>
            </button>
          ))}
          {!search.isLoading && (search.data ?? []).length === 0 && (
            <div className="p-2 text-xs text-muted-foreground">No matches.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  row,
  onAction,
  pendingAction,
}: {
  row: HistoryRow;
  onAction: (action: string, stadiumId?: string) => void;
  pendingAction: string | null;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const stadiumQ = useQuery({
    queryKey: ["stadium-by-id", row.matched_stadium_id],
    enabled: !!row.matched_stadium_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadiums")
        .select(
          "id, slug, stadium_name, city, country, league, clubs, hero_image_url, background_image_url, image_url",
        )
        .eq("id", row.matched_stadium_id!)
        .maybeSingle();
      if (error) throw error;
      return data as StadiumLite | null;
    },
  });

  const stadium = stadiumQ.data ?? null;
  const productionUrl =
    stadium?.hero_image_url ??
    stadium?.background_image_url ??
    stadium?.image_url ??
    row.previous_image_url ??
    null;

  const isDuplicate = row.notes?.includes("duplicate") ?? false;
  const flagged =
    row.action === "needs_review" ||
    row.would_overwrite ||
    isDuplicate ||
    row.match_confidence === "low" ||
    !row.matched_stadium_slug;

  return (
    <div
      className={`rounded-2xl border bg-card overflow-hidden ${
        flagged ? "border-amber-500/40" : "border-border"
      }`}
    >
      {/* Top meta bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap">
        <span className="text-xs font-bold truncate max-w-[40%]">{row.drive_file_name}</span>
        <ConfidenceBadge confidence={row.match_confidence} />
        <span className="text-[10px] text-muted-foreground">{row.match_type}</span>
        <ReviewBadge status={row.review_status} />
        {row.would_overwrite && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300">
            <AlertTriangle className="w-3 h-3" /> would overwrite
          </span>
        )}
        {isDuplicate && (
          <span className="inline-flex items-center gap-1 text-[10px] text-orange-300">
            <CopyIcon className="w-3 h-3" /> duplicate
          </span>
        )}
        <div className="ml-auto text-[10px] text-muted-foreground">
          {row.drive_image_width && row.drive_image_height
            ? `${row.drive_image_width}×${row.drive_image_height}`
            : ""}
          {row.drive_size_bytes
            ? ` · ${(row.drive_size_bytes / 1024).toFixed(0)} KB`
            : ""}
        </div>
      </div>

      {/* Side-by-side previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        <div className="bg-card">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-sky-300 bg-sky-500/5">
            Drive (proposed)
          </div>
          <div className="aspect-[16/10] bg-muted/30">
            <DriveImage fileId={row.drive_file_id} alt={row.drive_file_name} />
          </div>
        </div>
        <div className="bg-card">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-300 bg-emerald-500/5 flex items-center justify-between">
            <span>Production (current)</span>
            {stadium?.slug && (
              <a
                href={`/app/stadium/${stadium.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground normal-case tracking-normal"
              >
                view page <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="aspect-[16/10] bg-muted/30">
            {productionUrl ? (
              <img
                src={productionUrl}
                alt={stadium?.stadium_name ?? "Production"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs">
                <ImageOff className="w-6 h-6 opacity-60" />
                <span>No production image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stadium context */}
      <div className="px-3 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-border text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
            Matched stadium
          </div>
          {row.matched_stadium_slug ? (
            <div>
              <div className="font-bold">{row.matched_stadium_name}</div>
              <code className="text-[10px] text-muted-foreground">
                {row.matched_stadium_slug}
              </code>
              {stadium && (
                <div className="text-muted-foreground mt-1">
                  {[stadium.city, stadium.country].filter(Boolean).join(", ")}
                  {stadium.league ? ` · ${stadium.league}` : ""}
                </div>
              )}
              {stadium?.clubs && stadium.clubs.length > 0 && (
                <div className="text-muted-foreground mt-0.5 truncate">
                  Clubs: {stadium.clubs.join(", ")}
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">Unmatched</div>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
            Top candidates
          </div>
          <div className="space-y-0.5">
            {(row.candidates ?? []).slice(0, 5).map((c) => (
              <div
                key={c.slug}
                className={`flex items-center justify-between gap-2 ${
                  c.slug === row.matched_stadium_slug
                    ? "text-foreground font-bold"
                    : "text-muted-foreground"
                }`}
              >
                <span className="truncate">· {c.stadium_name}</span>
                <span className="text-[10px] tabular-nums">{c.score.toFixed(2)}</span>
              </div>
            ))}
            {(row.candidates ?? []).length === 0 && (
              <div className="text-muted-foreground">no candidates</div>
            )}
          </div>
        </div>
      </div>

      {row.notes && (
        <div className="px-3 py-2 text-[11px] text-amber-200 bg-amber-500/5 border-b border-border">
          {row.notes}
        </div>
      )}

      {/* Manual rematch */}
      {showPicker && (
        <div className="px-3 py-3 border-b border-border bg-muted/20">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Manual reassignment
          </div>
          <StadiumPicker
            value={row.matched_stadium_id}
            onSelect={(s) => {
              setShowPicker(false);
              onAction("rematch", s.id);
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2.5 flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white h-8"
          disabled={!row.matched_stadium_slug || pendingAction !== null}
          onClick={() => onAction("approve")}
        >
          {pendingAction === "approve" ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-red-500/40 text-red-300 hover:bg-red-500/10"
          disabled={pendingAction !== null}
          onClick={() => onAction("reject")}
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={pendingAction !== null}
          onClick={() => setShowPicker((v) => !v)}
        >
          <Wand2 className="w-3.5 h-3.5 mr-1.5" />
          {showPicker ? "Cancel" : "Rematch"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
          disabled={pendingAction !== null}
          onClick={() => onAction("ambiguous")}
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
          Ambiguous
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-muted-foreground"
          disabled={pendingAction !== null}
          onClick={() => onAction("skip")}
        >
          <SkipForward className="w-3.5 h-3.5 mr-1.5" />
          Skip
        </Button>
        {row.reviewed_at && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            reviewed {new Date(row.reviewed_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function StadiumMediaSyncPage() {
  const qc = useQueryClient();
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "queue" | "all" | "ambiguous" | "unmatched" | "overwrite" | "duplicate" | "approved" | "exact"
  >("queue");
  const [pendingRow, setPendingRow] = useState<{ id: string; action: string } | null>(null);

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
    queryKey: ["stadium-media-history", activeImportId],
    enabled: !!activeImportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadium_media_history")
        .select("*")
        .eq("import_id", activeImportId!)
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as HistoryRow[];
    },
  });

  const rows = useMemo(() => {
    const all = historyQ.data ?? [];
    let filtered = all;
    if (filter === "queue") {
      filtered = all.filter(
        (r) =>
          r.review_status === "pending" &&
          (r.action === "needs_review" ||
            r.would_overwrite ||
            r.notes?.includes("duplicate") ||
            r.match_confidence === "low" ||
            r.match_confidence === "medium" ||
            !r.matched_stadium_slug),
      );
    }
    if (filter === "ambiguous") filtered = all.filter((r) => r.action === "needs_review");
    if (filter === "unmatched") filtered = all.filter((r) => !r.matched_stadium_slug);
    if (filter === "overwrite") filtered = all.filter((r) => r.would_overwrite);
    if (filter === "duplicate")
      filtered = all.filter((r) => r.notes?.includes("duplicate") ?? false);
    if (filter === "approved")
      filtered = all.filter((r) => r.review_status === "approved");
    if (filter === "exact")
      filtered = all.filter(
        (r) => r.match_type === "exact" || r.match_type === "strong",
      );
    return [...filtered].sort((a, b) => rowPriority(b) - rowPriority(a));
  }, [historyQ.data, filter]);

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
        description: `Scanned ${data?.totals?.images ?? 0} images · matched ${
          data?.totals?.matched ?? 0
        }`,
      });
      setSelectedImportId(data?.import_id ?? null);
      qc.invalidateQueries({ queryKey: ["stadium-media-imports"] });
    },
    onError: (e: any) => {
      toast.error("Dry-run failed", { description: e?.message ?? String(e) });
    },
  });

  const review = useMutation({
    mutationFn: async ({
      historyId,
      action,
      stadiumId,
    }: {
      historyId: string;
      action: string;
      stadiumId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "review-stadium-media",
        {
          body: { history_id: historyId, action, stadium_id: stadiumId },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success(`Marked as ${vars.action}`);
      qc.invalidateQueries({
        queryKey: ["stadium-media-history", activeImportId],
      });
      setPendingRow(null);
    },
    onError: (e: any) => {
      toast.error("Review failed", { description: e?.message ?? String(e) });
      setPendingRow(null);
    },
  });

  const bulkApproveExact = useMutation({
    mutationFn: async () => {
      const targets = (historyQ.data ?? []).filter(
        (r) =>
          r.review_status === "pending" &&
          (r.match_type === "exact" || r.match_type === "strong") &&
          !r.would_overwrite &&
          !(r.notes?.includes("duplicate") ?? false) &&
          r.action !== "needs_review",
      );
      for (const r of targets) {
        await supabase.functions.invoke("review-stadium-media", {
          body: { history_id: r.id, action: "approve" },
        });
      }
      return targets.length;
    },
    onSuccess: (count) => {
      toast.success(`Bulk-approved ${count} exact matches`);
      qc.invalidateQueries({
        queryKey: ["stadium-media-history", activeImportId],
      });
    },
    onError: (e: any) =>
      toast.error("Bulk approve failed", { description: e?.message ?? String(e) }),
  });

  const totalByStatus = useMemo(() => {
    const all = historyQ.data ?? [];
    return {
      pending: all.filter((r) => r.review_status === "pending").length,
      approved: all.filter((r) => r.review_status === "approved").length,
      rejected: all.filter((r) => r.review_status === "rejected").length,
      ambiguous: all.filter((r) => r.review_status === "ambiguous").length,
      rematched: all.filter((r) => r.review_status === "rematched").length,
    };
  }, [historyQ.data]);

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-5 py-6 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Link
                to="/app/admin"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to admin
              </Link>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-1">
                Stadium Media Moderation
              </h1>
              <p className="text-sm text-muted-foreground">
                Visual review of Drive → production matches. Approvals are recorded;
                no upload to <code className="text-[11px]">stadium-media</code> happens
                until live import.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  importsQ.refetch();
                  historyQ.refetch();
                }}
                disabled={importsQ.isFetching || historyQ.isFetching}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1.5 ${
                    importsQ.isFetching || historyQ.isFetching ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => runDryRun.mutate()}
                disabled={runDryRun.isPending}
              >
                {runDryRun.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Running…
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-1.5" /> Run Drive dry-run
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Run picker */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">
              Recent runs
            </div>
            <div className="flex flex-wrap gap-2">
              {(importsQ.data ?? []).map((r) => {
                const active = r.id === activeImportId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedImportId(r.id)}
                    className={`text-left rounded-lg border px-3 py-2 text-xs ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="font-bold">
                      {new Date(r.created_at).toLocaleString()}{" "}
                      {r.dry_run ? (
                        <Badge variant="secondary" className="ml-1">
                          dry-run
                        </Badge>
                      ) : (
                        <Badge className="ml-1">live</Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {r.status} · {r.matched_count}✓ · {r.ambiguous_count}? ·{" "}
                      {r.unmatched_count}✗
                    </div>
                  </button>
                );
              })}
              {(importsQ.data?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground">
                  No runs yet. Click "Run Drive dry-run" to start.
                </div>
              )}
            </div>
          </div>

          {activeImport && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <StatCard label="Files" value={activeImport.total_files} />
                <StatCard label="Matched" value={activeImport.matched_count} tone="good" />
                <StatCard
                  label="Ambiguous"
                  value={activeImport.ambiguous_count}
                  tone="warn"
                />
                <StatCard label="Unmatched" value={activeImport.unmatched_count} tone="bad" />
                <StatCard
                  label="Overwrite"
                  value={activeImport.would_overwrite_count}
                  tone="warn"
                />
                <StatCard
                  label="Duplicates"
                  value={activeImport.duplicate_count}
                  tone="warn"
                />
              </div>

              {/* Review progress */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Pending review" value={totalByStatus.pending} />
                <StatCard label="Approved" value={totalByStatus.approved} tone="good" />
                <StatCard label="Rejected" value={totalByStatus.rejected} tone="bad" />
                <StatCard label="Ambiguous" value={totalByStatus.ambiguous} tone="warn" />
                <StatCard label="Rematched" value={totalByStatus.rematched} />
              </div>

              {activeImport.error_message && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                  {activeImport.error_message}
                </div>
              )}

              {/* Filter chips */}
              <div className="flex flex-wrap gap-2 items-center">
                {(
                  [
                    { k: "queue", label: "⚡ Priority queue" },
                    { k: "ambiguous", label: "Ambiguous" },
                    { k: "overwrite", label: "Overwrite risk" },
                    { k: "duplicate", label: "Duplicates" },
                    { k: "unmatched", label: "Unmatched" },
                    { k: "exact", label: "Exact / strong" },
                    { k: "approved", label: "Approved" },
                    { k: "all", label: "All" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setFilter(f.k)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                      filter === f.k
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto h-8"
                  onClick={() => bulkApproveExact.mutate()}
                  disabled={bulkApproveExact.isPending}
                >
                  {bulkApproveExact.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Bulk approve safe exact matches
                </Button>
              </div>

              {/* Review cards */}
              <div className="space-y-4">
                {historyQ.isLoading && (
                  <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                )}
                {!historyQ.isLoading && rows.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nothing in this view.{" "}
                    {filter === "queue"
                      ? "All risky items have been reviewed 🎉"
                      : "Try another filter."}
                  </div>
                )}
                {rows.map((r) => (
                  <ReviewCard
                    key={r.id}
                    row={r}
                    pendingAction={
                      pendingRow?.id === r.id ? pendingRow.action : null
                    }
                    onAction={(action, stadiumId) => {
                      setPendingRow({ id: r.id, action });
                      review.mutate({ historyId: r.id, action, stadiumId });
                    }}
                  />
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Next step:</strong> once
                ambiguous / overwrite / duplicate rows are resolved (approved,
                rejected or rematched), re-run with{" "}
                <code>dry_run: false</code> to upload only approved rows to the
                <code className="mx-1">stadium-media</code> bucket. No production
                row is written yet.
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}
