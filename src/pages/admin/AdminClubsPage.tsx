import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Sparkles, Loader2, CheckCircle2, AlertTriangle, Database } from "lucide-react";
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
      // Pre-select all auto_safe
      const safe = (data as ScanResult).candidates.filter((c) => c.bucket === "auto_safe").map((c) => c.slug);
      setSelected(new Set(safe));
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const runImport = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one club");
      return;
    }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-clubs-from-matches", {
        body: { mode: "commit", slugs: [...selected] },
      });
      if (error) throw error;
      const res = data as { inserted: number; attempted: number; errors: string[] };
      if (res.errors?.length) {
        toast.warning(`Imported ${res.inserted}/${res.attempted} — ${res.errors[0]}`, { duration: 8000 });
      } else {
        toast.success(`Imported ${res.inserted} clubs`);
      }
      onImported();
      await runScan(); // refresh
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

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
          <SheetTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" /> Club enrichment pipeline
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-foreground/90">
            Scans every team referenced in your <strong>matches</strong> dataset and proposes new club entities.
            Only clubs that already exist in real matches are surfaced — nothing is fabricated.
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
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`rounded-xl border p-3 text-left transition ${cls} ${filter === key ? "ring-2 ring-emerald-500" : ""}`}
                  >
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
                    <p className="text-2xl font-extrabold text-foreground">{val}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 sticky top-0 bg-background py-2 z-10 border-b">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <strong className="text-foreground">{selected.size}</strong> selected
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(new Set(importable.map((c) => c.slug)))}
                  >
                    Select all visible
                  </Button>
                  <Button
                    size="sm"
                    onClick={runImport}
                    disabled={importing || selected.size === 0}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Import {selected.size}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {filtered.map((c) => {
                  const isExisting = c.bucket === "existing";
                  const isSelected = selected.has(c.slug);
                  return (
                    <div
                      key={c.slug + c.raw_name}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                        isSelected ? "border-emerald-500 bg-emerald-50/50" : "bg-card"
                      } ${isExisting ? "opacity-60" : ""}`}
                    >
                      {!isExisting && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(c.slug)}
                          className="mt-1 w-4 h-4 accent-emerald-600"
                        />
                      )}
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {c.logos[0] ? (
                          <img src={c.logos[0]} alt={c.raw_name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">{c.short_name}</span>
                        )}
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
                        {c.reason && (
                          <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {c.reason}
                          </p>
                        )}
                        {isExisting && c.matched_existing_slug && (
                          <p className="text-[11px] text-sky-700 mt-1">→ {c.matched_existing_slug}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No teams in this bucket.</p>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const AdminClubsPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,league,country,city,stadium_name,stadium_slug,logo_url,official_ticketing_url,membership_required,notes")
        .order("club_name");
      return data || [];
    },
  });

  const filtered = data.filter((c) => {
    const s = q.toLowerCase();
    return !s || (c.club_name?.toLowerCase().includes(s) || c.slug?.toLowerCase().includes(s) || c.country?.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{t("admin.nav.clubs")}</h1>
          <p className="text-xs text-muted-foreground">{data.length} {t("admin.nav.clubs").toLowerCase()}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
          </div>
          <ImportSheet onImported={() => qc.invalidateQueries({ queryKey: ["admin-clubs"] })} />
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const isAuto = c.notes?.startsWith("Auto-imported");
            return (
              <Card key={c.slug} className="hover:border-emerald-500 transition">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt={c.club_name} className="w-full h-full object-contain" /> : <span className="text-xs font-bold text-muted-foreground">{c.short_name || "?"}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground truncate">{c.club_name}</p>
                      {isAuto && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">Auto</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{c.league} · {c.country}</p>
                    {c.stadium_name && <p className="text-[11px] text-muted-foreground truncate mt-0.5">🏟 {c.stadium_name}</p>}
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
    </div>
  );
};

export default AdminClubsPage;
