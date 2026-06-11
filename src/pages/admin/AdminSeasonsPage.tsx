import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  CalendarRange, Copy, Plus, Trash2, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, CheckCircle2, Trophy, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type League = { id: string; league_name: string; country: string | null; slug: string | null };
type Season = {
  id: string; league_id: string; season_name: string; season_slug: string;
  start_date: string | null; end_date: string | null;
  is_current: boolean; is_published: boolean;
};
type Membership = {
  id: string; season_id: string; club_id: string;
  status: "promoted" | "relegated" | "stayed" | "wildcard";
  previous_league_id: string | null;
};
type Club = { id: string; club_name: string; slug: string; country_id: string | null; primary_league_id: string | null };

const STATUS_COLORS: Record<Membership["status"], string> = {
  promoted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  relegated: "bg-rose-100 text-rose-800 border-rose-300",
  stayed: "bg-slate-100 text-slate-700 border-slate-300",
  wildcard: "bg-amber-100 text-amber-800 border-amber-300",
};

const AdminSeasonsPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [dupOpen, setDupOpen] = useState(false);
  const [addClubOpen, setAddClubOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-seasons-v1"],
    queryFn: async () => {
      const [lpRes, sRes, mRes, cRes, validation] = await Promise.all([
        supabase.from("league_publication")
          .select("id,league_name,country,slug")
          .is("archived_at", null)
          .eq("is_active", true)
          .order("league_name"),
        supabase.from("seasons" as never).select("*").order("season_slug", { ascending: false }),
        supabase.from("league_season_clubs" as never).select("*"),
        supabase.from("clubs").select("id,club_name,slug,country_id,primary_league_id").is("archived_at", null).order("club_name"),
        supabase.rpc("fn_season_validation_report" as never),
      ]);
      return {
        leagues: (lpRes.data ?? []) as unknown as League[],
        seasons: (sRes.data ?? []) as unknown as Season[],
        memberships: (mRes.data ?? []) as unknown as Membership[],
        clubs: (cRes.data ?? []) as unknown as Club[],
        validation: (validation.data ?? {}) as Record<string, unknown>,
      };
    },
  });

  const leagues = data?.leagues ?? [];
  const seasons = data?.seasons ?? [];
  const memberships = data?.memberships ?? [];
  const clubs = data?.clubs ?? [];
  const validation = data?.validation ?? {};

  const seasonsByLeague = useMemo(() => {
    const m = new Map<string, Season[]>();
    seasons.forEach((s) => {
      const arr = m.get(s.league_id) ?? [];
      arr.push(s);
      m.set(s.league_id, arr);
    });
    return m;
  }, [seasons]);

  const membershipsBySeason = useMemo(() => {
    const m = new Map<string, Membership[]>();
    memberships.forEach((mem) => {
      const arr = m.get(mem.season_id) ?? [];
      arr.push(mem);
      m.set(mem.season_id, arr);
    });
    return m;
  }, [memberships]);

  const clubById = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  const currentLeague = selectedLeagueId ? leagues.find((l) => l.id === selectedLeagueId) ?? null : null;
  const currentLeagueSeasons = currentLeague ? seasonsByLeague.get(currentLeague.id) ?? [] : [];
  const currentSeason = selectedSeasonId ? seasons.find((s) => s.id === selectedSeasonId) ?? null : null;
  const currentMembers = currentSeason ? membershipsBySeason.get(currentSeason.id) ?? [] : [];

  // KPIs
  const kpis = {
    totalLeagues: leagues.length,
    totalSeasons: seasons.length,
    totalMemberships: memberships.length,
    leaguesMissingCurrent: ((validation as Record<string, unknown>).leagues_without_current_season as unknown[] | undefined)?.length ?? 0,
    emptySeasons: ((validation as Record<string, unknown>).empty_seasons as unknown[] | undefined)?.length ?? 0,
    oversize: ((validation as Record<string, unknown>).oversize_seasons as unknown[] | undefined)?.length ?? 0,
  };

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-seasons-v1"] });
    refetch();
  };

  // ---- Mutations ----
  const setStatus = async (membershipId: string, status: Membership["status"]) => {
    const { error } = await supabase.from("league_season_clubs" as never)
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq("id", membershipId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.seasons.toast.statusUpdated"));
    refreshAll();
  };
  const removeMember = async (membershipId: string) => {
    if (!confirm(t("admin.seasons.confirmRemove"))) return;
    const { error } = await supabase.from("league_season_clubs" as never).delete().eq("id", membershipId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.seasons.toast.removed"));
    refreshAll();
  };
  const addMember = async (clubId: string, status: Membership["status"]) => {
    if (!currentSeason) return;
    const { error } = await supabase.from("league_season_clubs" as never).insert({
      season_id: currentSeason.id, club_id: clubId, status,
    } as never);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.seasons.toast.added"));
    setAddClubOpen(false);
    refreshAll();
  };
  const togglePublished = async () => {
    if (!currentSeason) return;
    const { error } = await supabase.from("seasons" as never)
      .update({ is_published: !currentSeason.is_published } as never)
      .eq("id", currentSeason.id);
    if (error) { toast.error(error.message); return; }
    refreshAll();
  };
  const deleteSeason = async () => {
    if (!currentSeason) return;
    if (!confirm(t("admin.seasons.confirmDeleteSeason"))) return;
    const { error } = await supabase.from("seasons" as never).delete().eq("id", currentSeason.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.seasons.toast.seasonDeleted"));
    setSelectedSeasonId(null);
    refreshAll();
  };

  // ---- Add club dialog state ----
  const eligibleClubs = useMemo(() => {
    if (!currentSeason) return [];
    const inSeason = new Set(currentMembers.map((m) => m.club_id));
    return clubs.filter((c) => !inSeason.has(c.id));
  }, [clubs, currentMembers, currentSeason]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{t("admin.seasons.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("admin.seasons.subtitle")}</p>
        </div>
      </header>

      {/* KPI dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <KpiCard icon={Trophy} label={t("admin.seasons.kpi.leagues")} value={kpis.totalLeagues} />
        <KpiCard icon={CalendarRange} label={t("admin.seasons.kpi.seasons")} value={kpis.totalSeasons} />
        <KpiCard icon={CheckCircle2} label={t("admin.seasons.kpi.memberships")} value={kpis.totalMemberships} />
        <KpiCard icon={AlertTriangle} label={t("admin.seasons.kpi.missingCurrent")} value={kpis.leaguesMissingCurrent}
          tone={kpis.leaguesMissingCurrent ? "warn" : "ok"} />
        <KpiCard icon={AlertTriangle} label={t("admin.seasons.kpi.empty")} value={kpis.emptySeasons}
          tone={kpis.emptySeasons ? "warn" : "ok"} />
        <KpiCard icon={AlertTriangle} label={t("admin.seasons.kpi.oversize")} value={kpis.oversize}
          tone={kpis.oversize ? "warn" : "ok"} />
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList>
          <TabsTrigger value="manage">{t("admin.seasons.tab.manage")}</TabsTrigger>
          <TabsTrigger value="validation">{t("admin.seasons.tab.validation")}</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("admin.seasons.loading")}</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Leagues list */}
              <Card className="lg:col-span-1">
                <CardContent className="p-0">
                  <div className="p-3 border-b">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t("admin.seasons.leagues")}</p>
                  </div>
                  <div className="max-h-[600px] overflow-auto divide-y">
                    {leagues.map((l) => {
                      const ssn = seasonsByLeague.get(l.id) ?? [];
                      const cur = ssn.find((s) => s.is_current);
                      const active = selectedLeagueId === l.id;
                      return (
                        <button key={l.id} onClick={() => { setSelectedLeagueId(l.id); setSelectedSeasonId(cur?.id ?? ssn[0]?.id ?? null); }}
                          className={`w-full text-left px-3 py-2 transition flex items-center justify-between gap-2 ${active ? "bg-emerald-50" : "hover:bg-muted/30"}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{l.league_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{l.country ?? "—"}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{ssn.length}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Seasons + detail */}
              <Card className="lg:col-span-2">
                <CardContent className="p-3 space-y-3">
                  {!currentLeague ? (
                    <p className="text-sm text-muted-foreground">{t("admin.seasons.selectLeague")}</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-foreground truncate">{currentLeague.league_name}</p>
                          <p className="text-[11px] text-muted-foreground">{currentLeague.country ?? "—"} · {currentLeagueSeasons.length} {t("admin.seasons.seasonsLabel")}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setDupOpen(true)} disabled={!currentSeason} className="gap-1">
                          <Copy className="w-3 h-3" /> {t("admin.seasons.createNext")}
                        </Button>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {currentLeagueSeasons.map((s) => (
                          <button key={s.id} onClick={() => setSelectedSeasonId(s.id)}
                            className={`px-3 py-1.5 rounded-md border text-xs font-bold transition ${selectedSeasonId === s.id ? "bg-emerald-600 text-white border-emerald-700" : "bg-white hover:bg-muted/40"}`}>
                            {s.season_slug}
                            {s.is_current && <span className="ml-1 text-[10px] opacity-80">★</span>}
                          </button>
                        ))}
                      </div>

                      {currentSeason && (
                        <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-sm font-extrabold">{currentSeason.season_name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {currentSeason.start_date ?? "—"} → {currentSeason.end_date ?? "—"} ·
                                {currentSeason.is_current && <span className="ml-1 text-emerald-700 font-bold">{t("admin.seasons.current")}</span>}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={togglePublished}>
                                {currentSeason.is_published ? t("admin.seasons.unpublish") : t("admin.seasons.publish")}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setAddClubOpen(true)} className="gap-1">
                                <Plus className="w-3 h-3" /> {t("admin.seasons.addClub")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={deleteSeason} className="text-rose-600 gap-1">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Status breakdown */}
                          <div className="flex gap-2 flex-wrap text-[11px]">
                            {(["stayed", "promoted", "relegated", "wildcard"] as const).map((st) => {
                              const n = currentMembers.filter((m) => m.status === st).length;
                              return (
                                <Badge key={st} className={STATUS_COLORS[st]}>{t(`admin.seasons.status.${st}`)} · {n}</Badge>
                              );
                            })}
                            <Badge variant="outline">{t("admin.seasons.total")} · {currentMembers.length}</Badge>
                          </div>

                          {/* Members */}
                          <div className="max-h-[400px] overflow-auto divide-y border rounded">
                            {currentMembers.length === 0 && (
                              <p className="p-3 text-xs text-muted-foreground">{t("admin.seasons.empty")}</p>
                            )}
                            {currentMembers
                              .map((m) => ({ m, c: clubById.get(m.club_id) }))
                              .sort((a, b) => (a.c?.club_name ?? "").localeCompare(b.c?.club_name ?? ""))
                              .map(({ m, c }) => (
                                <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                                  <div className="min-w-0 flex items-center gap-2">
                                    <Badge className={`${STATUS_COLORS[m.status]} text-[10px] shrink-0`}>{t(`admin.seasons.status.${m.status}`)}</Badge>
                                    <span className="font-bold truncate">{c?.club_name ?? m.club_id}</span>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-700"
                                      title={t("admin.seasons.markPromoted")}
                                      onClick={() => setStatus(m.id, "promoted")}>
                                      <ArrowUpCircle className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-700"
                                      title={t("admin.seasons.markRelegated")}
                                      onClick={() => setStatus(m.id, "relegated")}>
                                      <ArrowDownCircle className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7"
                                      title={t("admin.seasons.markStayed")}
                                      onClick={() => setStatus(m.id, "stayed")}>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600"
                                      title={t("admin.seasons.remove")}
                                      onClick={() => removeMember(m.id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-3">
          <ValidationPanel validation={validation as Record<string, unknown>} t={t} />
        </TabsContent>
      </Tabs>

      {/* Duplicate season dialog */}
      <DuplicateSeasonDialog
        open={dupOpen} onClose={() => setDupOpen(false)}
        season={currentSeason} onDone={refreshAll} t={t}
      />

      {/* Add club dialog */}
      <Dialog open={addClubOpen} onOpenChange={(o) => !o && setAddClubOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.seasons.addClubTo")} {currentSeason?.season_name}</DialogTitle>
          </DialogHeader>
          <AddClubForm clubs={eligibleClubs} onSubmit={addMember} t={t} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ===== Subcomponents =====
const KpiCard = ({ icon: Icon, label, value, tone = "neutral" }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number;
  tone?: "neutral" | "ok" | "warn";
}) => (
  <Card className={tone === "warn" ? "border-amber-300" : tone === "ok" ? "border-emerald-300" : ""}>
    <CardContent className="p-3 flex items-center gap-2">
      <Icon className={`w-4 h-4 shrink-0 ${tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">{label}</p>
        <p className="text-base font-extrabold leading-none">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ValidationPanel = ({ validation, t }: { validation: Record<string, unknown>; t: (k: string) => string }) => {
  const empty = (validation.empty_seasons ?? []) as Array<{ season_id: string; season_name: string; league_name: string }>;
  const missing = (validation.leagues_without_current_season ?? []) as Array<{ league_id: string; league_name: string }>;
  const oversize = (validation.oversize_seasons ?? []) as Array<{ season_id: string; season_name: string; league_name: string; club_count: number; expected_max: number }>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 mb-2">{t("admin.seasons.val.empty")} · {empty.length}</p>
          <div className="space-y-1 max-h-72 overflow-auto text-xs">
            {empty.length === 0 ? <p className="text-muted-foreground">{t("admin.seasons.val.allClean")}</p> :
              empty.map((e) => <div key={e.season_id} className="border-b pb-1"><span className="font-bold">{e.league_name}</span> · {e.season_name}</div>)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 mb-2">{t("admin.seasons.val.missing")} · {missing.length}</p>
          <div className="space-y-1 max-h-72 overflow-auto text-xs">
            {missing.length === 0 ? <p className="text-muted-foreground">{t("admin.seasons.val.allClean")}</p> :
              missing.map((m) => <div key={m.league_id} className="border-b pb-1 font-bold">{m.league_name}</div>)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 mb-2">{t("admin.seasons.val.oversize")} · {oversize.length}</p>
          <div className="space-y-1 max-h-72 overflow-auto text-xs">
            {oversize.length === 0 ? <p className="text-muted-foreground">{t("admin.seasons.val.allClean")}</p> :
              oversize.map((o) => (
                <div key={o.season_id} className="border-b pb-1">
                  <span className="font-bold">{o.league_name}</span> · {o.season_name} · {o.club_count}/{o.expected_max}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DuplicateSeasonDialog = ({ open, onClose, season, onDone, t }: {
  open: boolean; onClose: () => void; season: Season | null; onDone: () => void;
  t: (k: string) => string;
}) => {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto-suggest next season slug (e.g. 2025-26 → 2026-27)
  const suggested = useMemo(() => {
    if (!season) return { slug: "", name: "" };
    const match = /^(\d{4})-(\d{2})$/.exec(season.season_slug);
    if (!match) return { slug: season.season_slug + "-next", name: season.season_name + " (next)" };
    const start = parseInt(match[1], 10) + 1;
    const end = parseInt(match[2], 10) + 1;
    const s = `${start}-${end.toString().padStart(2, "0")}`;
    const n = season.season_name.replace(season.season_slug, s);
    return { slug: s, name: n };
  }, [season]);

  const submit = async () => {
    if (!season) return;
    const finalSlug = slug.trim() || suggested.slug;
    const finalName = name.trim() || suggested.name;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("fn_duplicate_season" as never, {
        p_source_season_id: season.id,
        p_new_season_name: finalName,
        p_new_season_slug: finalSlug,
      } as never);
      if (error) throw error;
      toast.success(t("admin.seasons.toast.duplicated"));
      onDone();
      onClose();
      setSlug(""); setName("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.seasons.duplicateTitle")}</DialogTitle>
        </DialogHeader>
        {season && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <p className="font-bold">{t("admin.seasons.source")}: {season.season_name}</p>
              <p className="text-muted-foreground">{t("admin.seasons.willCopyAll")}</p>
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground">{t("admin.seasons.newSlug")}</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={suggested.slug} />
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground">{t("admin.seasons.newName")}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={suggested.name} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t("admin.seasons.cancel")}</Button>
          <Button onClick={submit} disabled={busy} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} {t("admin.seasons.duplicate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddClubForm = ({ clubs, onSubmit, t }: {
  clubs: Club[]; onSubmit: (id: string, st: Membership["status"]) => void;
  t: (k: string) => string;
}) => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Membership["status"]>("promoted");
  const filtered = useMemo(
    () => clubs.filter((c) => c.club_name.toLowerCase().includes(q.toLowerCase())).slice(0, 30),
    [clubs, q],
  );
  return (
    <div className="space-y-3">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.seasons.searchClubs")} />
      <Select value={status} onValueChange={(v) => setStatus(v as Membership["status"])}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="promoted">{t("admin.seasons.status.promoted")}</SelectItem>
          <SelectItem value="stayed">{t("admin.seasons.status.stayed")}</SelectItem>
          <SelectItem value="wildcard">{t("admin.seasons.status.wildcard")}</SelectItem>
          <SelectItem value="relegated">{t("admin.seasons.status.relegated")}</SelectItem>
        </SelectContent>
      </Select>
      <div className="max-h-72 overflow-auto divide-y border rounded">
        {filtered.map((c) => (
          <button key={c.id} onClick={() => onSubmit(c.id, status)}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted/40">
            <span className="font-bold">{c.club_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminSeasonsPage;
