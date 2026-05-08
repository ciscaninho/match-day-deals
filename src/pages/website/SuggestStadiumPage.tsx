import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPinned, Send, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useStadiums } from "@/hooks/useStadium";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SuggestStadiumPage = () => {
  const { t } = useLanguage();
  const { user } = useUser();
  const { data: stadiums = [] } = useStadiums();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    stadium_name: "",
    club: "",
    city: "",
    country: "",
    league: "",
    notes: "",
  });

  useSEO({ title: `${t("suggest.title")} | Foot Ticket Finder`, description: t("suggest.subtitle") });

  // Lightweight client-side duplicate detection
  const possibleDuplicates = useMemo(() => {
    const q = form.stadium_name.trim().toLowerCase();
    if (q.length < 3) return [];
    return stadiums
      .filter((s) =>
        s.stadium_name.toLowerCase().includes(q) ||
        (form.city && s.city.toLowerCase().includes(form.city.toLowerCase()))
      )
      .slice(0, 5);
  }, [form.stadium_name, form.city, stadiums]);

  const handleSubmit = async () => {
    if (form.stadium_name.trim().length < 3) {
      toast.error(t("suggest.name"));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("stadium_suggestions").insert({
      user_id: user?.id ?? null,
      stadium_name: form.stadium_name.trim(),
      club: form.club.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      league: form.league.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(t("suggest.submitted"));
    navigate("/");
  };

  return (
    <WebsiteLayout>
      <div className="bg-[#0b1220] text-white min-h-[80vh]">
        <section className="max-w-2xl mx-auto px-5 py-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("stadium.back_to_stadiums")}
          </button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold">
            <MapPinned className="w-3.5 h-3.5" /> {t("suggest.title")}
          </div>
          <h1 className="mt-1 text-2xl md:text-4xl font-black">{t("suggest.title")}</h1>
          <p className="mt-1.5 text-white/70 text-sm">{t("suggest.subtitle")}</p>

          <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-3">
            <div>
              <Label className="text-xs">{t("suggest.name")} *</Label>
              <Input
                value={form.stadium_name}
                onChange={(e) => setForm({ ...form, stadium_name: e.target.value })}
                className="bg-white/5 border-white/15 text-white"
              />
            </div>

            {possibleDuplicates.length > 0 && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
                <div className="flex items-center gap-1.5 text-amber-200 text-xs font-bold mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {t("suggest.duplicate_warn")}
                </div>
                <ul className="text-xs text-amber-100/90 space-y-0.5">
                  {possibleDuplicates.map((s) => (
                    <li key={s.id}>• {s.stadium_name} — {s.city}, {s.country}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("suggest.club")}</Label>
                <Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} className="bg-white/5 border-white/15 text-white" />
              </div>
              <div>
                <Label className="text-xs">{t("suggest.league")}</Label>
                <Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="bg-white/5 border-white/15 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("suggest.city")}</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-white/5 border-white/15 text-white" />
              </div>
              <div>
                <Label className="text-xs">{t("suggest.country")}</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="bg-white/5 border-white/15 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("suggest.notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-white/5 border-white/15 text-white min-h-[80px]"
                maxLength={500}
              />
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("suggest.submit")}
            </Button>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default SuggestStadiumPage;
