import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Upload, Link2, Star, Trash2, CheckCircle2, XCircle,
  Archive, Image as ImageIcon, ShieldCheck,
} from "lucide-react";

type MediaRow = {
  id: string;
  stadium_slug: string;
  category: string;
  url: string;
  storage_path: string | null;
  source: string;
  status: string;
  is_hero: boolean;
  notes: string | null;
  created_at: string;
};

const CATEGORIES = ["hero", "exterior", "interior", "atmosphere", "aerial", "historical"] as const;
const STATUSES = ["pending", "approved", "rejected", "archived"] as const;

const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  rejected: "bg-rose-100 text-rose-700 border-rose-300",
  archived: "bg-slate-200 text-slate-600 border-slate-300",
};

export function StadiumMediaTab({ stadiumSlug }: { stadiumSlug: string }) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalCategory, setExternalCategory] = useState<string>("exterior");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["stadium-media", stadiumSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadium_media" as any)
        .select("*")
        .eq("stadium_slug", stadiumSlug)
        .order("is_hero", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MediaRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["stadium-media", stadiumSlug] });
    qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] });
  };

  const insertRow = async (row: Partial<MediaRow>) => {
    const { error } = await (supabase.from("stadium_media" as any) as any).insert({
      stadium_slug: stadiumSlug,
      status: "pending",
      ...row,
    });
    if (error) throw error;
  };

  const handleUpload = async (file: File, category: string) => {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `library/${stadiumSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("stadium-media")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("stadium-media").getPublicUrl(path);
      await insertRow({
        url: data.publicUrl,
        storage_path: path,
        source: "upload",
        category,
      });
      toast.success(t("admin.media.uploaded") || "Image uploaded");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message || t("admin.media.upload_error") || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddExternal = async () => {
    const url = externalUrl.trim();
    if (!url) return;
    try {
      await insertRow({ url, source: "external", category: externalCategory });
      setExternalUrl("");
      toast.success(t("admin.media.added") || "Image added");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
  };

  const updateRow = async (id: string, patch: Partial<MediaRow>) => {
    setBusyId(id);
    try {
      const { error } = await (supabase.from("stadium_media" as any) as any)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteRow = async (row: MediaRow) => {
    if (!confirm(t("admin.media.confirm_delete") || "Delete this image?")) return;
    setBusyId(row.id);
    try {
      if (row.storage_path) {
        await supabase.storage.from("stadium-media").remove([row.storage_path]);
      }
      const { error } = await (supabase.from("stadium_media" as any) as any).delete().eq("id", row.id);
      if (error) throw error;
      toast.success(t("admin.media.deleted") || "Deleted");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const setHero = async (row: MediaRow) => {
    if (row.status !== "approved") {
      // Approving + heroing in one go; trigger will handle demotion + sync
      await updateRow(row.id, { is_hero: true, status: "approved" });
      toast.success(t("admin.media.hero_set") || "Hero updated");
      return;
    }
    await updateRow(row.id, { is_hero: true });
    toast.success(t("admin.media.hero_set") || "Hero updated");
  };

  return (
    <div className="space-y-5 mt-0">
      {/* Add controls */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            {t("admin.media.add") || "Add media"}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={externalCategory} onValueChange={setExternalCategory}>
            <SelectTrigger className="h-9 w-32 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {t(`admin.media.cat.${c}`) || c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer hover:text-emerald-600 px-3 py-2 rounded-md bg-white border border-slate-200">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {t("admin.media.upload_file") || "Upload file"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], externalCategory)}
            />
          </label>

          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://…"
              className="h-9 text-xs bg-white"
            />
            <Button size="sm" onClick={handleAddExternal} disabled={!externalUrl.trim()} className="h-9">
              {t("admin.media.add_url") || "Add"}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-slate-500">
          {t("admin.media.add_hint") ||
            "New media is added as Pending. Approve to make it usable; mark as Hero to feature it on cards & immersive experiences."}
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
          <ImageIcon className="w-8 h-8" />
          <p className="text-xs">{t("admin.media.empty") || "No media yet — upload or add a URL above."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((m) => {
            const busy = busyId === m.id;
            return (
              <div
                key={m.id}
                className={`group relative rounded-xl overflow-hidden border bg-white ${
                  m.is_hero ? "border-amber-400 ring-2 ring-amber-300" : "border-slate-200"
                }`}
              >
                <div className="aspect-[4/3] bg-slate-100 relative">
                  <img
                    src={m.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
                  />
                  {m.is_hero && (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {t("admin.media.hero") || "HERO"}
                    </span>
                  )}
                  <span
                    className={`absolute top-1.5 right-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      STATUS_CLS[m.status] || STATUS_CLS.pending
                    }`}
                  >
                    {t(`admin.media.status.${m.status}`) || m.status}
                  </span>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                    {!m.is_hero && (
                      <button
                        title={t("admin.media.make_hero") || "Set as hero"}
                        onClick={() => setHero(m)}
                        disabled={busy}
                        className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {m.status !== "approved" && (
                      <button
                        title={t("admin.media.approve") || "Approve"}
                        onClick={() => updateRow(m.id, { status: "approved" })}
                        disabled={busy}
                        className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {m.status !== "rejected" && (
                      <button
                        title={t("admin.media.reject") || "Reject"}
                        onClick={() => updateRow(m.id, { status: "rejected", is_hero: false })}
                        disabled={busy}
                        className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {m.status !== "archived" && (
                      <button
                        title={t("admin.media.archive") || "Archive"}
                        onClick={() => updateRow(m.id, { status: "archived", is_hero: false })}
                        disabled={busy}
                        className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-800 text-white flex items-center justify-center disabled:opacity-50"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      title={t("admin.media.delete") || "Delete"}
                      onClick={() => deleteRow(m)}
                      disabled={busy}
                      className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="p-2 flex items-center justify-between gap-1">
                  <Select
                    value={m.category}
                    onValueChange={(v) => updateRow(m.id, { category: v })}
                  >
                    <SelectTrigger className="h-7 text-[10px] w-full bg-white border-slate-200 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {t(`admin.media.cat.${c}`) || c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span
                    className="text-[9px] font-bold text-slate-400 uppercase shrink-0"
                    title={m.source}
                  >
                    {m.source === "upload" ? <ShieldCheck className="w-3 h-3 inline" /> : m.source[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publication clarity footer */}
      <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
        <p className="font-bold text-slate-700 mb-1">
          {t("admin.media.workflow_title") || "How publication works"}
        </p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>
            <b>Pending</b> — newly added, never public.
          </li>
          <li>
            <b>Approved</b> — usable internally and eligible to become Hero.
          </li>
          <li>
            <b>Hero</b> — the single image shown publicly on cards and immersive pages (auto-syncs to the stadium).
          </li>
          <li>
            <b>Rejected / Archived</b> — never public, kept for audit.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default StadiumMediaTab;
