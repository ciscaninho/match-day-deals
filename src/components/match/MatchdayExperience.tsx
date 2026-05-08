import { Flame, Users, Star, Compass, Clock, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Stadium } from "@/hooks/useStadium";

type Props = {
  stadium?: Stadium | null;
  fallbackBest?: string[];
  variant?: "dark" | "light";
};

/**
 * Immersive matchday-experience block: best sections, atmosphere zones,
 * first-time advice and arrival recommendations.
 * Replaces the dry "stat box" feel with editorial fan guidance.
 */
export const MatchdayExperience = ({ stadium, fallbackBest, variant = "dark" }: Props) => {
  const { t } = useLanguage();
  const dark = variant === "dark";
  const card = dark
    ? "rounded-2xl bg-white/[0.04] border border-white/10 p-4"
    : "rounded-2xl bg-white border border-slate-200 p-4 shadow-sm";
  const heading = dark ? "text-white" : "text-[#2C3E50]";
  const body = dark ? "text-white/70" : "text-[#2C3E50]/70";
  const eyebrow = dark ? "text-white/55" : "text-[#2C3E50]/55";

  const ultras = stadium?.ultras_section || fallbackBest?.[0] || null;
  const family = stadium?.family_section || null;
  const best = stadium?.best_sections?.[0] || fallbackBest?.[0] || null;

  const blocks: Array<{ icon: typeof Flame; title: string; body: string; tone: string } | null> = [
    ultras
      ? { icon: Flame,  title: t("matchday.ultras.title"),    body: t("matchday.ultras.body", { section: ultras }),  tone: dark ? "text-red-300" : "text-red-700" }
      : null,
    family
      ? { icon: Users,  title: t("matchday.family.title"),    body: t("matchday.family.body", { section: family }),  tone: dark ? "text-emerald-300" : "text-emerald-700" }
      : null,
    best
      ? { icon: Star,   title: t("matchday.best.title"),      body: t("matchday.best.body",   { section: best }),    tone: dark ? "text-amber-300" : "text-amber-700" }
      : null,
    {   icon: Compass,  title: t("matchday.firstTime.title"), body: t("matchday.firstTime.body"),                    tone: dark ? "text-sky-300"   : "text-sky-700" },
    {   icon: Clock,    title: t("matchday.arrival.title"),   body: t("matchday.arrival.body"),                      tone: dark ? "text-violet-300": "text-violet-700" },
    {   icon: ShieldCheck, title: t("matchday.official.title"), body: t("matchday.official.body"),                   tone: dark ? "text-[#2ECC71]" : "text-[#2ECC71]" },
  ];

  const items = blocks.filter(Boolean) as Array<{ icon: typeof Flame; title: string; body: string; tone: string }>;
  if (!items.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-5 py-6">
      <div className={`text-[10px] uppercase tracking-wider ${eyebrow} font-bold mb-3 flex items-center gap-1.5`}>
        <Flame className="w-3.5 h-3.5" /> {t("matchday.eyebrow")}
      </div>
      <h2 className={`text-xl md:text-2xl font-extrabold ${heading} mb-4`}>
        {t("matchday.title")}
      </h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <div key={b.title} className={card}>
            <div className="flex items-start gap-3">
              <b.icon className={`w-5 h-5 mt-0.5 shrink-0 ${b.tone}`} />
              <div className="min-w-0">
                <div className={`font-extrabold text-sm ${heading}`}>{b.title}</div>
                <div className={`text-xs ${body} leading-relaxed mt-1`}>{b.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MatchdayExperience;
