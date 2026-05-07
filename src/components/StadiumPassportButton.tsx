import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPinned, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAuthGate } from "@/components/auth/AuthGate";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  stadiumSlug: string;
  stadiumName: string;
  city?: string | null;
  country?: string | null;
}

export const StadiumPassportButton = ({ stadiumSlug, stadiumName, city, country }: Props) => {
  const { user } = useUser();
  const { openAuth, requireAuth } = useAuthGate();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    visit_date: "",
    match_label: "",
    overall_rating: "",
    atmosphere_rating: "",
    favorite_section: "",
    notes: "",
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["my-visit", stadiumSlug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stadium_visits")
        .select("id")
        .eq("user_id", user!.id)
        .eq("stadium_slug", stadiumSlug)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      stadium_slug: stadiumSlug,
      stadium_name: stadiumName,
      city: city ?? null,
      country: country ?? null,
      visit_date: form.visit_date || null,
      match_label: form.match_label || null,
      overall_rating: form.overall_rating ? Number(form.overall_rating) : null,
      atmosphere_rating: form.atmosphere_rating ? Number(form.atmosphere_rating) : null,
      favorite_section: form.favorite_section || null,
      notes: form.notes || null,
    };
    const { error } = await supabase.from("stadium_visits").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("passport.saved"));
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["my-visit", stadiumSlug] });
    qc.invalidateQueries({ queryKey: ["my-passport"] });
  };

  const handleRemove = async () => {
    if (!user || !existing) return;
    const { error } = await supabase.from("stadium_visits").delete().eq("id", existing.id);
    if (error) return toast.error(error.message);
    toast.success(t("passport.removed"));
    qc.invalidateQueries({ queryKey: ["my-visit", stadiumSlug] });
    qc.invalidateQueries({ queryKey: ["my-passport"] });
  };

  if (!user) {
    return (
      <button
        onClick={() => openAuth({ reason: t("passport.signin_required") })}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-bold text-white transition"
      >
        <MapPinned className="w-4 h-4" /> {t("passport.mark_visited")}
      </button>
    );
  }

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs text-white/60">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </span>
    );
  }

  if (existing) {
    return (
      <button
        onClick={handleRemove}
        className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/15 hover:bg-[#2ECC71]/25 border border-[#2ECC71]/40 px-4 py-2 text-xs font-bold text-[#2ECC71] transition"
        title={t("passport.unmark")}
      >
        <CheckCircle2 className="w-4 h-4" /> {t("passport.visited")}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => requireAuth(() => setOpen(true), { reason: t("passport.signin_required") })}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2 text-xs font-bold text-white transition"
      >
        <MapPinned className="w-4 h-4" /> {t("passport.mark_visited")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("passport.log_visit")} — {stadiumName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{t("passport.visit_date")}</Label>
              <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">{t("passport.match_label")}</Label>
              <Input value={form.match_label} onChange={(e) => setForm({ ...form, match_label: e.target.value })} placeholder="PSG vs OM" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("passport.overall_rating")}</Label>
                <Input type="number" min={1} max={10} value={form.overall_rating} onChange={(e) => setForm({ ...form, overall_rating: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">{t("passport.atmosphere_rating")}</Label>
                <Input type="number" min={1} max={10} value={form.atmosphere_rating} onChange={(e) => setForm({ ...form, atmosphere_rating: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("passport.favorite_section")}</Label>
              <Input value={form.favorite_section} onChange={(e) => setForm({ ...form, favorite_section: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">{t("passport.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[60px]" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("passport.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
