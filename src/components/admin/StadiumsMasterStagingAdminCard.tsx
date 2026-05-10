import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Check, X, Loader2, Image as ImageIcon, Database, Pencil, Copy, AlertTriangle, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

interface MasterRow {
  id: string;
  canonical_name: string;
  normalized_name: string;
  slug: string;
  normalized_slug: string;
  city: string | null;
  country: string | null;
  league: string | null;
  club_names: string[];
  aliases: string[];
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  background_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  year_opened: number | null;
  official_website: string | null;
  production_stadium_id: string | null;
  duplicate_of: string | null;
  dedupe_cluster_id: string | null;
  conflict_flags: string[];
  has_missing_metadata: boolean;
  image_score: number;
  confidence: "high" | "medium" | "low";
  status: string;
  sources: string[];
  review_notes: string | null;
}

const confColor = (c: string) =>
  c === "high" ? "bg-green-500/15 text-green-700 dark:text-green-400"
  : c === "medium" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  : "bg-muted text-muted-foreground";

export const StadiumsMasterStagingAdminCard = () => {
  const { user } = useUser();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"all" | "high" | "medium" | "low">("high");
  const [conflictOnly, setConflictOnly] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [matchedOnly, setMatchedOnly] = useState<"all" | "matched" | "new">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MasterRow | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["master-staging", confidence, conflictOnly, missingOnly, matchedOnly],
    queryFn: async (): Promise<MasterRow[]> => {
      let q = supabase
        .from("stadiums_master_staging")
        .select("*")
        .eq("status", "pending")
        .order("confidence", { ascending: true })
        .order("image_score", { ascending: false })
        .order("canonical_name", { ascending: true })
        .limit(300);
      if (confidence !== "all") q = q.eq("confidence", confidence);
      if (missingOnly) q = q.eq("has_missing_metadata", true);
      if (matchedOnly === "matched") q = q.not("production_stadium_id", "is", null);
      if (matchedOnly === "new") q = q.is("production_stadium_id", null);
      const { data, error } = await q;
      if (error) throw error;
      const list = (data ?? []) as MasterRow[];
      return conflictOnly ? list.filter(r => (r.conflict_flags?.length ?? 0) > 0) : list;
    },
  });

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0, conflict: 0, missing: 0, matched: 0, total: rows.length };
    rows.forEach(r => {
      c[r.confidence] = (c[r.confidence] || 0) + 1;
      if (r.conflict_flags?.length) c.conflict++;
      if (r.has_missing_metadata) c.missing++;
      if (r.production_stadium_id) c.matched++;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.canonical_name?.toLowerCase().includes(s) ||
      r.city?.toLowerCase().includes(s) ||
      r.country?.toLowerCase().includes(s) ||
      r.slug?.toLowerCase().includes(s) ||
      r.club_names?.some(c => c.toLowerCase().includes(s))
    );
  }, [rows, search]);

  const patch = async (id: string, p: Record<string, unknown>) => {
    const { error } = await supabase
      .from("stadiums_master_staging")
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  };

  const setStatus = async (row: MasterRow, status: "approved" | "rejected" | "duplicate", notes?: string) => {
    setBusy(row.id);
    try {
      await patch(row.id, {
        status,
        review_notes: notes ?? row.review_notes,
      });
      toast.success(
        status === "approved" ? "Approved — queued for promotion"
        : status === "rejected" ? "Rejected"
        : "Marked as duplicate"
      );
      qc.invalidateQueries({ queryKey: ["master-staging"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4" /> Stadium master review
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Validate canonical stadium identities before production promotion. Production is untouched.
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className={`${confColor("high")} text-[10px]`}>H {counts.high}</Badge>
            <Badge variant="outline" className={`${confColor("medium")} text-[10px]`}>M {counts.medium}</Badge>
            <Badge variant="outline" className={`${confColor("low")} text-[10px]`}>L {counts.low}</Badge>
            <Badge variant="outline" className="text-[10px]">⚠ {counts.conflict}</Badge>
            <Badge variant="outline" className="text-[10px]">↺ {counts.matched}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={confidence} onValueChange={(v) => setConfidence(v as any)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={matchedOnly} onValueChange={(v) => setMatchedOnly(v as any)}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any match</SelectItem>
              <SelectItem value="matched">Matched only</SelectItem>
              <SelectItem value="new">New only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={conflictOnly ? "default" : "outline"}
            className="h-8 text-xs gap-1"
            onClick={() => setConflictOnly(v => !v)}
          >
            <AlertTriangle className="w-3 h-3" /> Conflicts
          </Button>
          <Button
            size="sm"
            variant={missingOnly ? "default" : "outline"}
            className="h-8 text-xs gap-1"
            onClick={() => setMissingOnly(v => !v)}
          >
            <Filter className="w-3 h-3" /> Missing
          </Button>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, club…"
            className="h-8 text-xs flex-1 min-w-[160px]"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">No pending canonicals match these filters.</p>
        ) : (
          <ul className="space-y-2 max-h-[700px] overflow-y-auto">
            {filtered.map((row) => (
              <li key={row.id} className="border border-border rounded-md p-2 bg-card">
                <div className="flex gap-2.5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center relative">
                    {row.hero_image_url ? (
                      <img
                        src={row.hero_image_url}
                        alt={row.canonical_name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                    {row.image_score > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/60 text-white rounded px-1">
                        {row.image_score}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm truncate">{row.canonical_name}</p>
                      <Badge variant="outline" className={`${confColor(row.confidence)} text-[10px] px-1.5 py-0`}>
                        {row.confidence}
                      </Badge>
                      {row.production_stadium_id && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/15 text-blue-700 dark:text-blue-400">
                          matched
                        </Badge>
                      )}
                      {row.has_missing_metadata && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                          missing
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[row.city, row.country, row.league].filter(Boolean).join(" • ") || "—"}
                    </p>
                    {row.club_names?.length > 0 && (
                      <p className="text-[11px] text-foreground/80 truncate">
                        {row.club_names.slice(0, 3).join(", ")}
                        {row.club_names.length > 3 ? ` +${row.club_names.length - 3}` : ""}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground truncate font-mono">/{row.slug}</p>
                    {row.conflict_flags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.conflict_flags.map((f) => (
                          <Badge key={f} variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-2 flex-wrap">
                  <Button
                    size="sm" variant="ghost" disabled={busy === row.id}
                    onClick={() => setStatus(row, "rejected")}
                    className="h-7 text-xs text-destructive"
                  >
                    <X className="w-3 h-3 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm" variant="ghost" disabled={busy === row.id}
                    onClick={() => setStatus(row, "duplicate")}
                    className="h-7 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Duplicate
                  </Button>
                  <Button
                    size="sm" variant="outline" disabled={busy === row.id}
                    onClick={() => setEditing(row)}
                    className="h-7 text-xs"
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm" disabled={busy === row.id || row.confidence === "low"}
                    onClick={() => setStatus(row, "approved")}
                    className="h-7 text-xs"
                  >
                    {busy === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[10px] text-muted-foreground">
          Approve marks a canonical as ready for promotion. Production stadiums table is never modified from here.
        </p>
      </CardContent>

      <EditStagingDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["master-staging"] });
        }}
      />
    </Card>
  );
};

// ---------- Edit dialog ----------
const EditStagingDialog = ({
  row, onClose, onSaved,
}: { row: MasterRow | null; onClose: () => void; onSaved: () => void }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    canonical_name: "", slug: "", city: "", country: "", league: "",
    hero_image_url: "", capacity: "", year_opened: "", official_website: "",
    review_notes: "",
  });

  // Sync form when row changes
  useMemo(() => {
    if (row) {
      setForm({
        canonical_name: row.canonical_name ?? "",
        slug: row.slug ?? "",
        city: row.city ?? "",
        country: row.country ?? "",
        league: row.league ?? "",
        hero_image_url: row.hero_image_url ?? "",
        capacity: row.capacity?.toString() ?? "",
        year_opened: row.year_opened?.toString() ?? "",
        official_website: row.official_website ?? "",
        review_notes: row.review_notes ?? "",
      });
    }
  }, [row?.id]);

  if (!row) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("stadiums_master_staging")
      .update({
        canonical_name: form.canonical_name.trim(),
        slug: form.slug.trim(),
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        league: form.league.trim() || null,
        hero_image_url: form.hero_image_url.trim() || null,
        thumbnail_image_url: form.hero_image_url.trim() || null,
        background_image_url: form.hero_image_url.trim() || null,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        year_opened: form.year_opened ? parseInt(form.year_opened, 10) : null,
        official_website: form.official_website.trim() || null,
        review_notes: form.review_notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit canonical stadium</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-xs">
          <div>
            <Label className="text-[11px]">Canonical name</Label>
            <Input value={form.canonical_name} onChange={(e) => setForm({ ...form, canonical_name: e.target.value })} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]">Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="h-8 text-xs font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[11px]">Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">League</Label>
            <Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]">Hero image URL</Label>
            <Input value={form.hero_image_url} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} className="h-8 text-xs" />
            {form.hero_image_url && (
              <img src={form.hero_image_url} alt="" className="mt-1 w-full h-32 object-cover rounded" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[11px]">Year opened</Label>
              <Input type="number" value={form.year_opened} onChange={(e) => setForm({ ...form, year_opened: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Official website</Label>
            <Input value={form.official_website} onChange={(e) => setForm({ ...form, official_website: e.target.value })} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]">Review notes</Label>
            <Input value={form.review_notes} onChange={(e) => setForm({ ...form, review_notes: e.target.value })} className="h-8 text-xs" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StadiumsMasterStagingAdminCard;
