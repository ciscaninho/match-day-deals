import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays, ExternalLink, ImageIcon, Loader2, MapPin, Plus, Save,
  Search, Trash2, Upload, Users, X, AlertTriangle, CheckCircle2, GitMerge, Archive,
} from "lucide-react";
import { toast } from "sonner";
import { StadiumMediaTab } from "./StadiumMediaTab";
import { WorldCupEnrichmentPanel } from "./WorldCupEnrichmentPanel";
import { matchesQuery } from "@/lib/normalize";

export type StadiumDrawerRow = {
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  league: string | null;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  hero_image_url: string | null;
  thumbnail_image_url?: string | null;
  description: string | null;
  clubs?: string[] | null;
  archived_at?: string | null;
  archived_into_slug?: string | null;
  is_world_cup_host?: boolean | null;
};

type Props = {
  stadium: StadiumDrawerRow | null;
  onClose: () => void;
  onSaved?: (next: StadiumDrawerRow) => void;
};

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
    {label}
  </span>
);

export function StadiumDrawer({ stadium, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState<StadiumDrawerRow | null>(stadium);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aliasInput, setAliasInput] = useState("");

  useEffect(() => {
    setForm(stadium);
    setTab("overview");
    setAliasInput("");
  }, [stadium?.slug]);

  const slug = stadium?.slug;

  const { data: relations, refetch: refetchRelations } = useQuery({
    queryKey: ["admin-stadium-relations", slug],
    enabled: !!slug,
    queryFn: async () => {
      const [{ data: clubs }, { data: matches }] = await Promise.all([
        supabase.from("club_ticketing_profiles").select("slug,club_name,short_name,logo_url,league").eq("stadium_slug", slug!),
        supabase
          .from("matches")
          .select("id,home_team,away_team,competition,date,ticket_status")
          .ilike("stadium", `%${stadium!.stadium_name}%`)
          .gte("date", new Date().toISOString())
          .order("date")
          .limit(8),
      ]);
      return { clubs: clubs || [], matches: matches || [] };
    },
  });

  const dirty = useMemo(() => {
    if (!form || !stadium) return false;
    return JSON.stringify(form) !== JSON.stringify(stadium);
  }, [form, stadium]);

  const update = <K extends keyof StadiumDrawerRow>(key: K, value: StadiumDrawerRow[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const handleSave = async () => {
    if (!form || !slug) return;
    setSaving(true);
    try {
      const { data: rows, error } = await supabase
        .from("stadiums")
        .update({
          stadium_name: form.stadium_name,
          city: form.city,
          country: form.country,
          league: form.league,
          capacity: form.capacity,
          latitude: form.latitude,
          longitude: form.longitude,
          hero_image_url: form.hero_image_url,
          description: form.description,
        })
        .eq("slug", slug)
        .select("slug");
      if (error) {
        console.error("[StadiumDrawer] save error", error);
        throw error;
      }
      if (!rows || rows.length === 0) {
        console.warn("[StadiumDrawer] save returned 0 rows — likely RLS denied", { slug });
        throw new Error(t("admin.drawer.no_rows_affected"));
      }
      toast.success(t("admin.drawer.saved"));
      onSaved?.(form);
      qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] });
      qc.invalidateQueries({ queryKey: ["admin-world-map"] });
    } catch (e: any) {
      const msg = e?.message || e?.error_description || t("admin.drawer.save_error");
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!slug) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `admin-uploads/${slug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("stadium-media").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("stadium-media").getPublicUrl(path);
      update("hero_image_url", data.publicUrl);
      toast.success(t("admin.drawer.image_uploaded"));
    } catch (e: any) {
      console.error("[StadiumDrawer] upload error", e);
      toast.error(e?.message || t("admin.drawer.upload_error"), { duration: 6000 });
    } finally {
      setUploading(false);
    }
  };

  const [pendingClub, setPendingClub] = useState<string | null>(null);

  const handleAttachClub = async (clubSlug: string) => {
    if (!slug) return;
    setPendingClub(clubSlug);
    try {
      const { data: rows, error } = await supabase
        .from("club_ticketing_profiles")
        .update({ stadium_slug: slug })
        .eq("slug", clubSlug)
        .select("slug,stadium_slug");
      if (error) {
        console.error("[StadiumDrawer] attach error", error);
        throw error;
      }
      if (!rows || rows.length === 0) {
        throw new Error(t("admin.drawer.no_rows_affected"));
      }
      toast.success(t("admin.drawer.club_attached"));
      await refetchRelations();
      qc.invalidateQueries({ queryKey: ["admin-club-search"] });
    } catch (e: any) {
      toast.error(e?.message || "Attach failed", { duration: 6000 });
    } finally {
      setPendingClub(null);
    }
  };

  const handleDetachClub = async (clubSlug: string) => {
    setPendingClub(clubSlug);
    try {
      const { data: rows, error } = await supabase
        .from("club_ticketing_profiles")
        .update({ stadium_slug: null })
        .eq("slug", clubSlug)
        .select("slug");
      if (error) {
        console.error("[StadiumDrawer] detach error", error);
        throw error;
      }
      if (!rows || rows.length === 0) throw new Error(t("admin.drawer.no_rows_affected"));
      toast.success(t("admin.drawer.club_detached"));
      await refetchRelations();
      qc.invalidateQueries({ queryKey: ["admin-club-search"] });
    } catch (e: any) {
      toast.error(e?.message || "Detach failed", { duration: 6000 });
    } finally {
      setPendingClub(null);
    }
  };

  const hasCoords = !!(form?.latitude && form?.longitude);

  return (
    <Sheet open={!!stadium} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-white">
        {form && (
          <div className="flex flex-col min-h-full">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-extrabold text-slate-900 text-left truncate">{form.stadium_name}</SheetTitle>
                  <p className="text-xs text-slate-500 font-mono text-left mt-0.5 truncate">{form.slug}</p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {!form.hero_image_url && <StatusPill ok={false} label={t("admin.badge.no_image")} />}
                  {!hasCoords && <StatusPill ok={false} label={t("admin.badge.no_coords")} />}
                  {!form.capacity && <StatusPill ok={false} label={t("admin.filter.no_capacity")} />}
                </div>
              </div>
            </SheetHeader>

            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
              <div className="px-5 pt-3 bg-white sticky top-[73px] z-10 border-b border-slate-100">
                <TabsList className="bg-slate-100 flex-wrap h-auto">
                  <TabsTrigger value="overview">{t("admin.drawer.tab.overview")}</TabsTrigger>
                  <TabsTrigger value="edit">{t("admin.drawer.tab.edit")}</TabsTrigger>
                  <TabsTrigger value="media">{t("admin.drawer.tab.media") || "Media"}</TabsTrigger>
                  <TabsTrigger value="worldcup">
                    🏆 World Cup{form.is_world_cup_host ? <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">on</Badge> : null}
                  </TabsTrigger>
                  <TabsTrigger value="clubs">{t("admin.drawer.tab.clubs")} {relations?.clubs.length ? <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{relations.clubs.length}</Badge> : null}</TabsTrigger>
                  <TabsTrigger value="matches">{t("admin.drawer.tab.matches")} {relations?.matches.length ? <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{relations.matches.length}</Badge> : null}</TabsTrigger>
                  <TabsTrigger value="actions">{t("admin.drawer.tab.actions") || "Actions"}</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 px-5 py-5 pb-28">
                <TabsContent value="overview" className="space-y-4 mt-0">
                  {form.hero_image_url ? (
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                      <img src={form.hero_image_url} alt={form.stadium_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] rounded-xl bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon className="w-10 h-10" /></div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Field label={t("admin.table.city")} value={form.city} />
                    <Field label={t("admin.table.country")} value={form.country} />
                    <Field label={t("admin.table.league")} value={form.league} />
                    <Field label={t("admin.table.capacity")} value={form.capacity ? form.capacity.toLocaleString() : null} />
                    <Field label={t("admin.table.coords")} value={hasCoords ? `${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : null} mono />
                  </div>
                  {form.description && <p className="text-sm text-slate-700 leading-relaxed">{form.description}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={`/stadiums/${form.slug}`} target="_blank"><ExternalLink className="w-3.5 h-3.5 mr-1.5" />{t("admin.view_public")}</Link>
                    </Button>
                    <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => setTab("edit")}>
                      {t("admin.edit")}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="space-y-4 mt-0">
                  <FormRow label={t("admin.table.name")}><Input value={form.stadium_name} onChange={(e) => update("stadium_name", e.target.value)} /></FormRow>
                  <div className="grid grid-cols-2 gap-3">
                    <FormRow label={t("admin.table.city")}><Input value={form.city || ""} onChange={(e) => update("city", e.target.value)} /></FormRow>
                    <FormRow label={t("admin.table.country")}><Input value={form.country || ""} onChange={(e) => update("country", e.target.value)} /></FormRow>
                    <FormRow label={t("admin.table.league")}><Input value={form.league || ""} onChange={(e) => update("league", e.target.value)} /></FormRow>
                    <FormRow label={t("admin.table.capacity")}><Input type="number" value={form.capacity || ""} onChange={(e) => update("capacity", e.target.value ? Number(e.target.value) : null)} /></FormRow>
                    <FormRow label={t("admin.drawer.latitude")}><Input type="number" step="any" value={form.latitude ?? ""} onChange={(e) => update("latitude", e.target.value ? Number(e.target.value) : null)} /></FormRow>
                    <FormRow label={t("admin.drawer.longitude")}><Input type="number" step="any" value={form.longitude ?? ""} onChange={(e) => update("longitude", e.target.value ? Number(e.target.value) : null)} /></FormRow>
                  </div>
                  <FormRow label={t("admin.drawer.hero_image")}>
                    <div className="space-y-2">
                      <Input value={form.hero_image_url || ""} onChange={(e) => update("hero_image_url", e.target.value)} placeholder="https://…" />
                      <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:text-emerald-600">
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {t("admin.drawer.upload_image")}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                      </label>
                      {form.hero_image_url && <img src={form.hero_image_url} alt="" className="w-full max-h-48 object-cover rounded-lg border border-slate-200" />}
                    </div>
                  </FormRow>
                  <FormRow label={t("admin.drawer.description")}>
                    <Textarea rows={4} value={form.description || ""} onChange={(e) => update("description", e.target.value)} />
                  </FormRow>
                </TabsContent>

                <TabsContent value="media" className="mt-0">
                  {slug && <StadiumMediaTab stadiumSlug={slug} />}
                </TabsContent>

                <TabsContent value="clubs" className="space-y-4 mt-0">
                  <div className="text-[11px] font-medium text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {t("admin.drawer.clubs_autosave_hint")}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" /> {t("admin.drawer.attached_clubs")} · {relations?.clubs.length || 0}
                    </h3>
                    <div className="space-y-1.5">
                      {relations?.clubs.length ? relations.clubs.map((c: any) => (
                        <div key={c.slug} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white">
                          <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                            {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="text-[10px] font-bold text-slate-400">{c.short_name}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{c.club_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{c.league}</p>
                          </div>
                          <Button variant="ghost" size="sm" disabled={pendingClub === c.slug} onClick={() => handleDetachClub(c.slug)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                            {pendingClub === c.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      )) : <p className="text-xs text-slate-400 italic py-2">{t("admin.drawer.no_clubs_attached")}</p>}
                    </div>
                  </div>
                  <Separator />
                  <ClubAttachPicker excludeSlugs={(relations?.clubs || []).map((c: any) => c.slug)} onAttach={handleAttachClub} pendingSlug={pendingClub} />
                </TabsContent>

                <TabsContent value="matches" className="space-y-2 mt-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600" /> {t("admin.relations.matches")} · {relations?.matches.length || 0}
                  </h3>
                  {relations?.matches.length ? relations.matches.map((m: any) => (
                    <Link key={m.id} to={`/matches/${m.id}`} target="_blank" className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400">
                      <div className="text-[10px] text-slate-500 font-mono w-16 shrink-0">{new Date(m.date).toLocaleDateString()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{m.home_team} vs {m.away_team}</p>
                        <p className="text-[11px] text-slate-500">{m.competition}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{m.ticket_status}</Badge>
                    </Link>
                  )) : <p className="text-xs text-slate-400 italic">{t("admin.empty")}</p>}
                </TabsContent>

                <TabsContent value="actions" className="mt-0">
                  <StadiumActionsTab
                    slug={form.slug}
                    stadiumName={form.stadium_name}
                    country={form.country}
                    archivedAt={form.archived_at ?? null}
                    archivedIntoSlug={form.archived_into_slug ?? null}
                    onDone={() => { qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] }); onClose(); }}
                  />
                </TabsContent>
              </div>
            </Tabs>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center gap-2 z-20">
              <Button variant="outline" onClick={onClose} className="flex-1">{dirty ? t("admin.drawer.cancel") : t("admin.drawer.close")}</Button>
              <Button onClick={handleSave} disabled={saving || !dirty} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:text-slate-500">
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                {saving ? t("admin.drawer.saving") : dirty ? t("admin.drawer.save") : t("admin.drawer.no_changes")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const Field = ({ label, value, mono }: { label: string; value: any; mono?: boolean }) => (
  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
    <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{label}</p>
    <p className={`text-sm font-bold text-slate-900 truncate ${mono ? "font-mono" : ""}`}>{value || <span className="text-amber-600">—</span>}</p>
  </div>
);

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] uppercase tracking-wider font-bold text-slate-700">{label}</Label>
    {children}
  </div>
);

function ClubAttachPicker({ excludeSlugs, onAttach, pendingSlug }: { excludeSlugs: string[]; onAttach: (slug: string) => void; pendingSlug?: string | null }) {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const { data = [], isFetching } = useQuery({
    queryKey: ["admin-club-search", q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,logo_url,league,stadium_slug")
        .or(`club_name.ilike.%${q}%,slug.ilike.%${q}%`)
        .limit(15);
      return data || [];
    },
  });

  const filtered = data.filter((c: any) => !excludeSlugs.includes(c.slug));

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
        <Plus className="w-3.5 h-3.5 text-emerald-600" /> {t("admin.drawer.attach_club")}
      </h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.drawer.search_club")} className="pl-9" />
      </div>
      {q.length >= 2 && (
        <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
          {isFetching ? <p className="text-xs text-slate-400 p-2">{t("admin.loading")}</p> :
            filtered.length === 0 ? <p className="text-xs text-slate-400 p-2">{t("admin.empty")}</p> :
            filtered.map((c: any) => {
              const busy = pendingSlug === c.slug;
              return (
                <button key={c.slug} disabled={busy} onClick={() => onAttach(c.slug)} className="w-full flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 transition text-left disabled:opacity-50">
                  <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="text-[9px] font-bold text-slate-400">{c.short_name}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.club_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {c.league} {c.stadium_slug && <span className="text-amber-600">· {t("admin.drawer.currently_at")} {c.stadium_slug}</span>}
                    </p>
                  </div>
                  {busy ? <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

// ---------- Actions tab: Merge + Archive ----------
function StadiumActionsTab({
  slug, stadiumName, country, archivedAt, archivedIntoSlug, onDone,
}: {
  slug: string;
  stadiumName: string;
  country: string | null;
  archivedAt: string | null;
  archivedIntoSlug: string | null;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const [mergeQuery, setMergeQuery] = useState("");
  const [mergeTarget, setMergeTarget] = useState<{ slug: string; stadium_name: string; city: string | null; country: string | null } | null>(null);
  const [mergeReason, setMergeReason] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [busy, setBusy] = useState<"merge" | "archive" | null>(null);
  const [confirm, setConfirm] = useState<"merge" | "archive" | null>(null);

  const { data: candidates = [] } = useQuery({
    queryKey: ["admin-stadium-merge-search", slug, country, mergeQuery],
    enabled: !archivedAt && mergeQuery.trim().length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,aliases")
        .is("archived_at", null)
        .neq("slug", slug)
        .limit(200);
      const rows = data || [];
      return rows.filter((r: any) =>
        matchesQuery([r.stadium_name, r.slug, r.city, ...(r.aliases || [])], mergeQuery),
      ).slice(0, 10);
    },
  });

  const doMerge = async () => {
    if (!mergeTarget) return;
    setBusy("merge");
    try {
      const { data, error } = await supabase.rpc("merge_stadium_records", {
        p_canonical_slug: mergeTarget.slug,
        p_duplicate_slug: slug,
        p_reason: mergeReason.trim() || null,
      });
      if (error) throw error;
      toast.success(t("admin.drawer.merge_ok") || "Stadium merged");
      console.log("[StadiumDrawer] merge result", data);
      onDone();
    } catch (e: any) {
      toast.error(e?.message || t("admin.drawer.merge_error") || "Merge failed", { duration: 6000 });
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const doArchive = async () => {
    setBusy("archive");
    try {
      const { data, error } = await supabase
        .from("stadiums")
        .update({
          archived_at: new Date().toISOString(),
          archived_reason: archiveReason.trim() || "Archived from admin drawer",
        })
        .eq("slug", slug)
        .select("slug");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(t("admin.drawer.no_rows_affected"));
      toast.success(t("admin.drawer.archive_ok") || "Stadium archived");
      onDone();
    } catch (e: any) {
      toast.error(e?.message || t("admin.drawer.archive_error") || "Archive failed", { duration: 6000 });
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  if (archivedAt) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Archive className="w-4 h-4" />
            <p className="text-sm font-bold">{t("admin.drawer.already_archived") || "This stadium is archived"}</p>
          </div>
          <p className="text-xs text-slate-600">{new Date(archivedAt).toLocaleString()}</p>
          {archivedIntoSlug && (
            <p className="text-xs text-emerald-700">→ {archivedIntoSlug}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MERGE */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-start gap-2">
          <GitMerge className="w-4 h-4 mt-0.5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{t("admin.drawer.merge.title") || "Merge into another stadium"}</h3>
            <p className="text-[11px] text-slate-500">{t("admin.drawer.merge.hint") || "All clubs, matches, media and reviews will be reassigned. This stadium will be archived."}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={mergeQuery}
            onChange={(e) => { setMergeQuery(e.target.value); setMergeTarget(null); }}
            placeholder={t("admin.drawer.merge.search") || "Search canonical stadium…"}
            className="pl-9"
          />
        </div>

        {mergeQuery.length >= 2 && !mergeTarget && (
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {candidates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">{t("admin.empty")}</p>
            ) : candidates.map((c: any) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setMergeTarget(c)}
                className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{c.stadium_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{c.city || "—"}, {c.country || "—"} · {c.slug}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {mergeTarget && (
          <div className="space-y-2">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">→ {mergeTarget.stadium_name}</p>
                <p className="text-[10px] text-slate-600 truncate">{mergeTarget.city || "—"}, {mergeTarget.country || "—"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMergeTarget(null)} className="text-slate-500 h-7 px-2"><X className="w-3 h-3" /></Button>
            </div>
            <Textarea
              rows={2}
              placeholder={t("admin.drawer.merge.reason") || "Reason (optional)"}
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
            />
            {confirm === "merge" ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>{t("admin.cancel") || "Cancel"}</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={busy === "merge"} onClick={doMerge}>
                  {busy === "merge" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <GitMerge className="w-4 h-4 mr-1.5" />}
                  {t("admin.drawer.merge.confirm") || `Confirm merge "${stadiumName}" → "${mergeTarget.stadium_name}"`}
                </Button>
              </div>
            ) : (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setConfirm("merge")}>
                <GitMerge className="w-4 h-4 mr-1.5" /> {t("admin.drawer.merge.cta") || "Merge stadium"}
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ARCHIVE */}
      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Archive className="w-4 h-4 mt-0.5 text-amber-700" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{t("admin.drawer.archive.title") || "Archive stadium"}</h3>
            <p className="text-[11px] text-slate-500">{t("admin.drawer.archive.hint") || "Hides from public surfaces. Relationships are preserved. Reversible by clearing archived_at."}</p>
          </div>
        </div>
        <Textarea
          rows={2}
          placeholder={t("admin.drawer.archive.reason") || "Reason (optional)"}
          value={archiveReason}
          onChange={(e) => setArchiveReason(e.target.value)}
        />
        {confirm === "archive" ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>{t("admin.cancel") || "Cancel"}</Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={busy === "archive"} onClick={doArchive}>
              {busy === "archive" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Archive className="w-4 h-4 mr-1.5" />}
              {t("admin.drawer.archive.confirm") || `Confirm archive "${stadiumName}"`}
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-100" onClick={() => setConfirm("archive")}>
            <Archive className="w-4 h-4 mr-1.5" /> {t("admin.drawer.archive.cta") || "Archive stadium"}
          </Button>
        )}
      </section>
    </div>
  );
}

export default StadiumDrawer;
