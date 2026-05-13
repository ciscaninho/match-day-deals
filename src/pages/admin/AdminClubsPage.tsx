import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Database,
  GitMerge,
  Archive,
  ArchiveRestore,
  ImageOff,
  LinkIcon,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Bucket = "new" | "ambiguous" | "existing" | "auto_safe";
type Candidate = {
  bucket: Bucket;
  raw_name: string;
  slug: string;
  short_name: string;
  countries: string[];
  leagues: string[];
  logos: string[];
  stadiums: { name: string; slug: string | null }[];
  cities: string[];
  match_count: number;
  matched_existing_slug?: string;
  reason?: string;
};
type ScanResult = {
  summary: { total_teams: number; existing: number; auto_safe: number; ambiguous: number; new_incomplete: number };
  candidates: Candidate[];
};

type ClubRow = {
  slug: string;
  club_name: string;
  short_name: string | null;
  league: string | null;
  country: string | null;
  city: string | null;
  stadium_name: string | null;
  stadium_slug: string | null;
  logo_url: string | null;
  official_ticketing_url: string | null;
  membership_required: boolean | null;
  notes: string | null;
  aliases: string[] | null;
  archived_at: string | null;
  archived_into_slug: string | null;
};

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|cf|ac|sc|club|de|la|el|los|the)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const BucketBadge = ({ b }: { b: Bucket }) => {
  const cfg: Record<Bucket, { label: string; cls: string }> = {
    auto_safe: { label: "Safe to import", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    ambiguous: { label: "Needs review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    new: { label: "Incomplete", cls: "bg-slate-100 text-slate-700 border-slate-200" },
    existing: { label: "Already exists", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  };
  const c = cfg[b];
  return <Badge variant="outline" className={`text-[10px] font-bold ${c.cls}`}>{c.label}</Badge>;
};

const ImportSheet = ({ onImported }: { onImported: () => void }) => {
  const [open, setOpen] = useState(false);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Bucket | "all">("all");

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-clubs-from-matches", {
        body: { mode: "scan" },
      });
      if (error) throw error;
      setScan(data as ScanResult);
      const safe = (data as ScanResult).candidates.filter((c) => c.bucket === "auto_safe").map((c) => c.slug);
      setSelected(new Set(safe));
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const runImport = async () => {
    if (selected.size === 0) { toast.error("Select at least one club"); return; }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-clubs-from-matches", {
        body: { mode: "commit", slugs: [...selected] },
      });
      if (error) throw error;
      const res = data as { inserted: number; attempted: number; errors: string[] };
      if (res.errors?.length) toast.warning(`Imported ${res.inserted}/${res.attempted} — ${res.errors[0]}`, { duration: 8000 });
      else toast.success(`Imported ${res.inserted} clubs`);
      onImported();
      await runScan();
      setSelected(new Set());
    } catch (e: any) { toast.error(e.message || "Import failed"); }
    finally { setImporting(false); }
  };

  const toggle = (slug: string) =>
    setSelected((prev) => { const next = new Set(prev); next.has(slug) ? next.delete(slug) : next.add(slug); return next; });

  const filtered = scan?.candidates.filter((c) => filter === "all" || c.bucket === filter) ?? [];
  const importable = filtered.filter((c) => c.bucket !== "existing");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Sparkles className="w-4 h-4" /> Import from matches
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> Club enrichment pipeline</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-foreground/90">
            Scans every team referenced in your <strong>matches</strong> dataset and proposes new club entities.
          </div>
          {!scan ? (
            <Button onClick={runScan} disabled={scanning} className="w-full gap-2" size="lg">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {scanning ? "Scanning matches…" : "Scan matches"}
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ["all", "Total", scan.summary.total_teams, "bg-card"],
                  ["auto_safe", "Safe", scan.summary.auto_safe, "bg-emerald-50 border-emerald-200"],
                  ["ambiguous", "Review", scan.summary.ambiguous, "bg-amber-50 border-amber-200"],
                  ["existing", "Existing", scan.summary.existing, "bg-sky-50 border-sky-200"],
                ] as const).map(([key, label, val, cls]) => (
                  <button key={key} onClick={() => setFilter(key as any)}
                    className={`rounded-xl border p-3 text-left transition ${cls} ${filter === key ? "ring-2 ring-emerald-500" : ""}`}>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
                    <p className="text-2xl font-extrabold text-foreground">{val}</p>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 sticky top-0 bg-background py-2 z-10 border-b">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /><strong className="text-foreground">{selected.size}</strong> selected
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelected(new Set(importable.map((c) => c.slug)))}>Select all visible</Button>
                  <Button size="sm" onClick={runImport} disabled={importing || selected.size === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Import {selected.size}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {filtered.map((c) => {
                  const isExisting = c.bucket === "existing";
                  const isSelected = selected.has(c.slug);
                  return (
                    <div key={c.slug + c.raw_name}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${isSelected ? "border-emerald-500 bg-emerald-50/50" : "bg-card"} ${isExisting ? "opacity-60" : ""}`}>
                      {!isExisting && <input type="checkbox" checked={isSelected} onChange={() => toggle(c.slug)} className="mt-1 w-4 h-4 accent-emerald-600" />}
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {c.logos[0] ? <img src={c.logos[0]} alt={c.raw_name} className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-muted-foreground">{c.short_name}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground truncate">{c.raw_name}</p>
                          <BucketBadge b={c.bucket} />
                          <span className="text-[10px] text-muted-foreground">{c.match_count} matches</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {c.leagues.join(" / ") || "—"} · {c.countries.join(" / ") || "—"}
                          {c.stadiums[0] && ` · 🏟 ${c.stadiums[0].name}`}
                        </p>
                        {c.reason && <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {c.reason}</p>}
                        {isExisting && c.matched_existing_slug && <p className="text-[11px] text-sky-700 mt-1">→ {c.matched_existing_slug}</p>}
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No teams in this bucket.</p>}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const MergeDialog = ({
  duplicate, canonical, open, onClose, onMerged,
}: {
  duplicate: ClubRow | null;
  canonical: ClubRow | null;
  open: boolean;
  onClose: () => void;
  onMerged: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const run = async () => {
    if (!duplicate || !canonical) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("merge_club_records" as any, {
        p_canonical_slug: canonical.slug,
        p_duplicate_slug: duplicate.slug,
        p_reason: reason || null,
      });
      if (error) throw error;
      toast.success(`Merged "${duplicate.club_name}" → "${canonical.club_name}"`);
      onMerged();
      onClose();
    } catch (e: any) { toast.error(e.message || "Merge failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5" /> Merge clubs</DialogTitle>
        </DialogHeader>
        {duplicate && canonical && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] uppercase font-bold text-amber-700 mb-1">Duplicate (will be archived)</p>
                <p className="font-bold text-foreground">{duplicate.club_name}</p>
                <p className="text-[11px] text-muted-foreground">{duplicate.slug}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{duplicate.country} · {duplicate.league || "—"}</p>
                {duplicate.stadium_name && <p className="text-[11px] text-muted-foreground">🏟 {duplicate.stadium_name}</p>}
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Canonical (kept)</p>
                <p className="font-bold text-foreground">{canonical.club_name}</p>
                <p className="text-[11px] text-muted-foreground">{canonical.slug}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{canonical.country} · {canonical.league || "—"}</p>
                {canonical.stadium_name && <p className="text-[11px] text-muted-foreground">🏟 {canonical.stadium_name}</p>}
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground">Reason (optional)</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Same club, different naming convention" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Aliases, missing fields, and references in matches will be reassigned to the canonical row. The duplicate is archived (not deleted) and admins can restore it.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={run} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />} Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ManualMergeDialog = ({
  duplicate, allClubs, open, onClose, onMerged,
}: {
  duplicate: ClubRow | null;
  allClubs: ClubRow[];
  open: boolean;
  onClose: () => void;
  onMerged: () => void;
}) => {
  const [search, setSearch] = useState("");
  const [canonical, setCanonical] = useState<ClubRow | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(() => {
    if (!duplicate) return [];
    const s = search.toLowerCase().trim();
    return allClubs
      .filter((c) => !c.archived_at && c.slug !== duplicate.slug)
      .filter((c) => !s
        || c.club_name.toLowerCase().includes(s)
        || c.slug.toLowerCase().includes(s)
        || (c.aliases || []).some((a) => a.toLowerCase().includes(s)))
      .slice(0, 25);
  }, [allClubs, duplicate, search]);

  const matchCount = useMemo(() => 0, []); // placeholder; live count would require extra query

  const reset = () => { setSearch(""); setCanonical(null); setReason(""); };
  const close = () => { reset(); onClose(); };

  const run = async () => {
    if (!duplicate || !canonical) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("merge_club_records" as any, {
        p_canonical_slug: canonical.slug,
        p_duplicate_slug: duplicate.slug,
        p_reason: reason || "Manual merge",
      });
      if (error) throw error;
      toast.success(`Merged "${duplicate.club_name}" → "${canonical.club_name}"`);
      onMerged();
      close();
    } catch (e: any) { toast.error(e.message || "Merge failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5" /> Manual merge</DialogTitle>
        </DialogHeader>
        {duplicate && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] uppercase font-bold text-amber-700 mb-1">Duplicate (will be archived)</p>
              <p className="font-bold text-foreground">{duplicate.club_name}</p>
              <p className="text-[11px] text-muted-foreground">{duplicate.slug} · {duplicate.country || "—"}</p>
            </div>

            {!canonical ? (
              <>
                <div>
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Search canonical club</label>
                  <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a name, slug, or alias…" />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5 rounded-xl border bg-muted/30 p-2">
                  {candidates.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">No matches.</p>
                  ) : candidates.map((c) => (
                    <button key={c.slug} onClick={() => setCanonical(c)}
                      className="w-full text-left rounded-lg border bg-white p-2.5 hover:border-emerald-500 transition flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="text-[9px] font-bold text-muted-foreground">{c.short_name || "?"}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{c.club_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.slug} · {c.country || "—"} · {c.league || "—"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Canonical (kept)</p>
                      <p className="font-bold text-foreground">{canonical.club_name}</p>
                      <p className="text-[11px] text-muted-foreground">{canonical.slug} · {canonical.country || "—"} · {canonical.league || "—"}</p>
                      {canonical.stadium_name && <p className="text-[11px] text-muted-foreground">🏟 {canonical.stadium_name}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCanonical(null)}>Change</Button>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
                  <p className="text-[11px] uppercase font-bold text-muted-foreground">Alias preview</p>
                  <p className="text-xs text-foreground">
                    "<strong>{duplicate.club_name}</strong>" and "<strong>{duplicate.slug}</strong>"
                    {duplicate.short_name ? ` and "${duplicate.short_name}"` : ""} will become aliases of {canonical.club_name}.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    All matches referencing "{duplicate.club_name}" will be reassigned. Logo / ticketing / stadium are preserved from the canonical row (missing fields filled in from the duplicate).
                  </p>
                </div>
                <div>
                  <label className="text-[11px] uppercase font-bold text-muted-foreground">Reason (optional)</label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Naming variant — same club" />
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={run} disabled={busy || !canonical} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />} Confirm merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type Tab = "active" | "duplicates" | "archived";

export const AdminClubsPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [mergeState, setMergeState] = useState<{ duplicate: ClubRow | null; canonical: ClubRow | null }>({ duplicate: null, canonical: null });
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,league,country,city,stadium_name,stadium_slug,logo_url,official_ticketing_url,membership_required,notes,aliases,archived_at,archived_into_slug")
        .order("club_name");
      return (data || []) as ClubRow[];
    },
  });

  const active = useMemo(() => data.filter((c) => !c.archived_at), [data]);
  const archived = useMemo(() => data.filter((c) => !!c.archived_at), [data]);

  // Duplicate detection — IDENTITY-BASED scoring.
  // Shared stadium / city / league are NEVER enough on their own
  // (Milan/Inter share San Siro, Roma/Lazio share Olimpico, etc.).
  // Only escalate when the club's actual identity signals overlap.
  const duplicateGroups = useMemo(() => {
    const tokens = (s: string | null | undefined) => new Set(norm(s).split(" ").filter((t) => t.length >= 3));
    const jaccard = (a: Set<string>, b: Set<string>) => {
      if (!a.size || !b.size) return 0;
      let inter = 0;
      a.forEach((t) => { if (b.has(t)) inter++; });
      return inter / (a.size + b.size - inter);
    };
    const host = (u: string | null | undefined) => {
      if (!u) return "";
      try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
    };
    const aliasSet = (c: ClubRow) => new Set(
      [c.club_name, c.short_name, ...(c.aliases || [])]
        .filter(Boolean)
        .map((s) => norm(s as string))
        .filter(Boolean)
    );

    const score = (a: ClubRow, b: ClubRow) => {
      // Country gate — different countries = not duplicates.
      if (a.country && b.country && a.country.toLowerCase() !== b.country.toLowerCase()) return { s: 0, reasons: [] as string[] };
      const reasons: string[] = [];
      let s = 0;
      const nameSim = jaccard(tokens(a.club_name), tokens(b.club_name));
      if (nameSim >= 0.8) { s += 60; reasons.push(`name ${(nameSim * 100).toFixed(0)}%`); }
      else if (nameSim >= 0.5) { s += 35; reasons.push(`name ${(nameSim * 100).toFixed(0)}%`); }
      // Alias overlap (one club's name appearing in the other's aliases)
      const aliasA = aliasSet(a), aliasB = aliasSet(b);
      let aliasHit = false;
      aliasA.forEach((x) => { if (aliasB.has(x)) aliasHit = true; });
      if (aliasHit) { s += 40; reasons.push("alias match"); }
      // Same short name (non-empty)
      if (a.short_name && b.short_name && norm(a.short_name) === norm(b.short_name)) { s += 25; reasons.push("same short name"); }
      // Same logo URL
      if (a.logo_url && b.logo_url && a.logo_url === b.logo_url) { s += 30; reasons.push("identical logo"); }
      // Same official website / ticketing host
      const hA = host(a.official_ticketing_url), hB = host(b.official_ticketing_url);
      if (hA && hA === hB) { s += 20; reasons.push("same ticketing domain"); }
      return { s, reasons };
    };

    const THRESHOLD = 50;
    const seen = new Set<string>();
    const out: { rows: ClubRow[]; reasons: string[]; score: number }[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const r = score(active[i], active[j]);
        if (r.s < THRESHOLD) continue;
        const sig = [active[i].slug, active[j].slug].sort().join("|");
        if (seen.has(sig)) continue;
        seen.add(sig);
        out.push({ rows: [active[i], active[j]], reasons: r.reasons, score: r.s });
      }
    }
    return out.sort((a, b) => b.score - a.score);
  }, [active]);

  const filterRows = (rows: ClubRow[]) => {
    const s = q.toLowerCase();
    return rows.filter((c) => !s || (c.club_name?.toLowerCase().includes(s) || c.slug?.toLowerCase().includes(s) || c.country?.toLowerCase().includes(s) || (c.aliases || []).some((a) => a.toLowerCase().includes(s))));
  };

  const visible = tab === "active" ? filterRows(active) : tab === "archived" ? filterRows(archived) : [];

  const TabBtn = ({ id, label, count }: { id: Tab; label: string; count: number }) => (
    <button onClick={() => setTab(id)}
      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${tab === id ? "bg-[#2C3E50] text-white border-[#2C3E50]" : "bg-white text-[#2C3E50] border-slate-200 hover:border-emerald-500"}`}>
      {label} <span className="opacity-60">· {count}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{t("admin.nav.clubs")}</h1>
          <p className="text-xs text-muted-foreground">{active.length} active · {archived.length} archived · {duplicateGroups.length} duplicate suspects</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
          </div>
          <ImportSheet onImported={() => qc.invalidateQueries({ queryKey: ["admin-clubs"] })} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <TabBtn id="active" label="Active" count={active.length} />
        <TabBtn id="duplicates" label="Possible duplicates" count={duplicateGroups.length} />
        <TabBtn id="archived" label="Archived" count={archived.length} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : tab === "duplicates" ? (
        duplicateGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No duplicate suspects detected. 🎉</p>
        ) : (
          <div className="space-y-4">
            {duplicateGroups.map((g, idx) => (
              <Card key={idx} className="border-amber-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-700">Score {g.score}</p>
                    <p className="text-[11px] text-muted-foreground">{g.reasons.join(" · ")}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {g.rows.map((c) => (
                      <div key={c.slug} className="rounded-lg border bg-white p-3 flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {c.logo_url ? <img src={c.logo_url} alt={c.club_name} className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-muted-foreground">{c.short_name || "?"}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate text-sm">{c.club_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{c.slug}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{c.country} · {c.league || "—"}</p>
                          {c.stadium_name && <p className="text-[11px] text-muted-foreground truncate">🏟 {c.stadium_name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.rows.map((dup) => g.rows
                      .filter((other) => other.slug !== dup.slug)
                      .map((canon) => (
                        <Button key={`${dup.slug}->${canon.slug}`} size="sm" variant="outline"
                          onClick={() => setMergeState({ duplicate: dup, canonical: canon })}
                          className="gap-1.5 text-xs">
                          <GitMerge className="w-3 h-3" /> {dup.club_name} → {canon.club_name}
                        </Button>
                      )))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((c) => {
            const isAuto = c.notes?.startsWith("Auto-imported");
            const isArchived = !!c.archived_at;
            const missing: string[] = [];
            if (!c.logo_url) missing.push("logo");
            if (!c.stadium_slug) missing.push("stadium");
            if (!c.league) missing.push("league");
            if (!c.official_ticketing_url) missing.push("ticketing");
            return (
              <Card key={c.slug} className={`hover:border-emerald-500 transition ${isArchived ? "opacity-70 border-dashed" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt={c.club_name} className="w-full h-full object-contain" /> : <ImageOff className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground truncate">{c.club_name}</p>
                      {isAuto && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">Auto</Badge>}
                      {isArchived && <Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-700 border-slate-300">Archived</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{c.league || "—"} · {c.country || "—"}</p>
                    {c.stadium_name && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 shrink-0" />
                        {c.stadium_slug ? <Link to={`/stadiums/${c.stadium_slug}`} className="hover:text-emerald-600">{c.stadium_name}</Link> : c.stadium_name}
                      </p>
                    )}
                    {c.aliases && c.aliases.length > 0 && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">aka: {c.aliases.slice(0, 3).join(", ")}</p>
                    )}
                    {isArchived && c.archived_into_slug && (
                      <p className="text-[11px] text-emerald-700 mt-0.5">→ merged into {c.archived_into_slug}</p>
                    )}
                    {missing.length > 0 && !isArchived && (
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {missing.map((m) => (
                          <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">missing {m}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 text-[11px]">
                      <Link to={`/clubs/${c.slug}`} className="text-emerald-600 font-bold inline-flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {t("admin.view_public")}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MergeDialog
        duplicate={mergeState.duplicate}
        canonical={mergeState.canonical}
        open={!!(mergeState.duplicate && mergeState.canonical)}
        onClose={() => setMergeState({ duplicate: null, canonical: null })}
        onMerged={() => qc.invalidateQueries({ queryKey: ["admin-clubs"] })}
      />
    </div>
  );
};

export default AdminClubsPage;
