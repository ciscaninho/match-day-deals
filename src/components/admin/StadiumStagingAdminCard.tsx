import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, GitMerge, Loader2, Image as ImageIcon, Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

interface StagingRow {
  id: string;
  stadium_name: string;
  slug: string | null;
  club: string | null;
  city: string | null;
  country: string | null;
  league: string | null;
  hero_image_url: string | null;
  status: string;
  confidence: string;
  match_type: string;
  suggested_stadium_id: string | null;
}

interface ProdStadium {
  id: string;
  stadium_name: string;
  city: string;
  country: string;
  slug: string;
  hero_image_url: string | null;
}

const confidenceColor = (c: string) =>
  c === "high" ? "bg-green-500/15 text-green-700 dark:text-green-400"
  : c === "medium" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  : "bg-muted text-muted-foreground";

export const StadiumStagingAdminCard = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-stadium-staging", confidence],
    queryFn: async (): Promise<StagingRow[]> => {
      let q = supabase
        .from("stadium_image_staging")
        .select("id,stadium_name,slug,club,city,country,league,hero_image_url,status,confidence,match_type,suggested_stadium_id")
        .eq("status", "pending")
        .order("confidence", { ascending: true })
        .order("stadium_name", { ascending: true })
        .limit(200);
      if (confidence !== "all") q = q.eq("confidence", confidence);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as StagingRow[];
    },
  });

  const suggestedIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.suggested_stadium_id).filter(Boolean) as string[])),
    [rows]
  );

  const { data: suggestedMap = {} } = useQuery({
    queryKey: ["admin-staging-suggested-stadiums", suggestedIds],
    enabled: suggestedIds.length > 0,
    queryFn: async (): Promise<Record<string, ProdStadium>> => {
      const { data } = await supabase
        .from("stadiums")
        .select("id,stadium_name,city,country,slug,hero_image_url")
        .in("id", suggestedIds);
      const map: Record<string, ProdStadium> = {};
      (data ?? []).forEach((s: any) => { map[s.id] = s; });
      return map;
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.stadium_name?.toLowerCase().includes(s) ||
        r.city?.toLowerCase().includes(s) ||
        r.club?.toLowerCase().includes(s) ||
        r.country?.toLowerCase().includes(s)
    );
  }, [rows, search]);

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    rows.forEach((r) => { c[r.confidence as keyof typeof c] = (c[r.confidence as keyof typeof c] || 0) + 1; });
    return c;
  }, [rows]);

  const updateRow = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("stadium_image_staging")
      .update({ ...patch, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  };

  const handleReject = async (row: StagingRow) => {
    setBusy(row.id);
    try {
      await updateRow(row.id, { status: "rejected" });
      toast.success("Rejected");
      qc.invalidateQueries({ queryKey: ["admin-stadium-staging"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  const handleMerge = async (row: StagingRow) => {
    if (!row.suggested_stadium_id) return toast.error("No suggested match to merge into");
    setBusy(row.id);
    try {
      // Only fill NULLs on the production stadium — never overwrite
      const target = suggestedMap[row.suggested_stadium_id];
      if (!target) throw new Error("Suggested stadium not loaded");
      if (!target.hero_image_url && row.hero_image_url) {
        const { error: e1 } = await supabase
          .from("stadiums")
          .update({
            hero_image_url: row.hero_image_url,
            thumbnail_image_url: row.hero_image_url,
            background_image_url: row.hero_image_url,
          })
          .eq("id", target.id);
        if (e1) throw e1;
      }
      await updateRow(row.id, { status: "merged", published_stadium_id: target.id });
      toast.success(`Merged into ${target.stadium_name}`);
      qc.invalidateQueries({ queryKey: ["admin-stadium-staging"] });
    } catch (e: any) {
      toast.error(e.message ?? "Merge failed");
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = async (row: StagingRow) => {
    // Approve = mark approved (does NOT auto-publish to production)
    setBusy(row.id);
    try {
      await updateRow(row.id, { status: "approved" });
      toast.success("Approved (queued for publish)");
      qc.invalidateQueries({ queryKey: ["admin-stadium-staging"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4" /> Stadium image staging
          </h3>
          <div className="flex items-center gap-1.5 text-xs">
            <Badge variant="outline" className={confidenceColor("high")}>High {counts.high}</Badge>
            <Badge variant="outline" className={confidenceColor("medium")}>Medium {counts.medium}</Badge>
            <Badge variant="outline" className={confidenceColor("low")}>Low {counts.low}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={confidence} onValueChange={setConfidence}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All confidence</SelectItem>
              <SelectItem value="high">High only</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, club…"
            className="h-8 text-xs flex-1"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading staging…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">No pending staging rows.</p>
        ) : (
          <ul className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.map((row) => {
              const sug = row.suggested_stadium_id ? suggestedMap[row.suggested_stadium_id] : undefined;
              return (
                <li key={row.id} className="border border-border rounded-md p-2 bg-card">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {row.hero_image_url ? (
                        <img src={row.hero_image_url} alt={row.stadium_name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm truncate">{row.stadium_name}</p>
                        <Badge variant="outline" className={`${confidenceColor(row.confidence)} text-[10px] px-1.5 py-0`}>
                          {row.confidence}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{row.match_type}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[row.club, row.city, row.country, row.league].filter(Boolean).join(" • ") || "—"}
                      </p>
                      {sug && (
                        <p className="text-[11px] mt-1 text-muted-foreground truncate">
                          → match: <span className="text-foreground font-medium">{sug.stadium_name}</span> ({sug.city}, {sug.country})
                          {!sug.hero_image_url && <span className="ml-1 text-amber-600">no hero</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <Button size="sm" variant="ghost" disabled={busy === row.id} onClick={() => handleReject(row)} className="h-7 text-xs">
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>
                    {sug && (
                      <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => handleMerge(row)} className="h-7 text-xs">
                        <GitMerge className="w-3 h-3 mr-1" /> Merge
                      </Button>
                    )}
                    <Button size="sm" disabled={busy === row.id || row.confidence === "low"} onClick={() => handleApprove(row)} className="h-7 text-xs">
                      {busy === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Approve
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[10px] text-muted-foreground">
          Merge only fills <span className="font-medium">NULL</span> image fields on production — never overwrites existing metadata. Low-confidence rows cannot be approved.
        </p>
      </CardContent>
    </Card>
  );
};
