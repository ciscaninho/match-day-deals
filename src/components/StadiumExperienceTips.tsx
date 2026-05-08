import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useAuthGate } from "@/components/auth/AuthGate";
import { useLanguage } from "@/i18n/LanguageContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Tip {
  id: string;
  user_id: string;
  category: string;
  tip: string;
  created_at: string;
}

const CATEGORIES = ["general", "transport", "food", "pre_match", "best_section", "atmosphere"] as const;

export const StadiumExperienceTips = ({ stadiumSlug }: { stadiumSlug: string }) => {
  const { user } = useUser();
  const { openAuth } = useAuthGate();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("general");
  const [tip, setTip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [composing, setComposing] = useState(false);

  const { data: tips = [] } = useQuery({
    queryKey: ["experience-tips", stadiumSlug],
    queryFn: async (): Promise<Tip[]> => {
      const { data } = await supabase
        .from("stadium_experience_tips")
        .select("*")
        .eq("stadium_slug", stadiumSlug)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Tip[];
    },
  });

  const handleSubmit = async () => {
    if (!user) {
      openAuth({ reason: t("experience.signin_to_share") });
      return;
    }
    if (tip.trim().length < 5) return;
    setSubmitting(true);
    const { error } = await supabase.from("stadium_experience_tips").insert({
      user_id: user.id,
      stadium_slug: stadiumSlug,
      category,
      tip: tip.trim(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(t("experience.posted"));
    setTip("");
    qc.invalidateQueries({ queryKey: ["experience-tips", stadiumSlug] });
  };

  return (
    <section className="max-w-5xl mx-auto px-5 py-8">
      <div className="text-xs uppercase tracking-wider text-white/55 font-bold mb-1 flex items-center gap-1.5">
        <Lightbulb className="w-3.5 h-3.5" /> {t("experience.title")}
      </div>
      <p className="text-sm text-white/65 mb-4">{t("experience.subtitle")}</p>

      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                category === c
                  ? "bg-[#2ECC71] text-[#0b1220] border-[#2ECC71]"
                  : "bg-white/5 text-white/70 border-white/15 hover:bg-white/10"
              }`}
            >
              {t(`experience.cat_${c}`)}
            </button>
          ))}
        </div>
        <Textarea
          value={tip}
          onChange={(e) => setTip(e.target.value)}
          placeholder={t("experience.tip_placeholder")}
          maxLength={500}
          className="min-h-[70px] bg-white/5 border-white/15 text-white placeholder:text-white/40"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={handleSubmit} disabled={submitting || tip.trim().length < 5} className="gap-1.5">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {t("experience.add_tip")}
          </Button>
        </div>
      </div>

      {tips.length === 0 ? (
        <p className="text-sm text-white/55 text-center py-6">{t("experience.empty")}</p>
      ) : (
        <div className="space-y-2">
          {tips.map((tp) => (
            <div key={tp.id} className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#2ECC71] mb-1">
                {t(`experience.cat_${tp.category}`)}
              </div>
              <p className="text-sm text-white/85 leading-relaxed">{tp.tip}</p>
              <div className="text-[10px] text-white/40 mt-1.5">{new Date(tp.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
