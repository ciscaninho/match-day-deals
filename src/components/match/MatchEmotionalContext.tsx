import { Flame, Sparkles, Building2, Crown, Moon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { isDerbyMatch, isEuropeanNight, isHistoricStadium } from "@/lib/matchdayVibes";

type Props = {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  stadiumName?: string | null;
  atmosphereScore?: number | null;
  variant?: "dark" | "light";
};

type Card = {
  icon: typeof Flame;
  title: string;
  body: string;
  tone: string;
};

/**
 * Emotional storytelling cards — concise, premium, fact-derived.
 * Never generic prose, only short cultural framing based on data signals.
 */
export const MatchEmotionalContext = ({
  homeTeam,
  awayTeam,
  competition,
  stadiumName,
  atmosphereScore,
  variant = "dark",
}: Props) => {
  const { t } = useLanguage();
  const derby = isDerbyMatch(homeTeam, awayTeam);
  const european = isEuropeanNight(competition);
  const historic = isHistoricStadium(stadiumName);
  const final = /final/i.test(competition || "");
  const hotAtmosphere = (atmosphereScore ?? 0) >= 8.0;

  const cards: Card[] = [];

  if (derby) {
    cards.push({
      icon: Crown,
      title: t("emotion.derby.title"),
      body: t("emotion.derby.body", { home: homeTeam, away: awayTeam }),
      tone: "amber",
    });
  }
  if (european) {
    cards.push({
      icon: Moon,
      title: t("emotion.european.title"),
      body: t("emotion.european.body"),
      tone: "indigo",
    });
  }
  if (final) {
    cards.push({
      icon: Sparkles,
      title: t("emotion.final.title"),
      body: t("emotion.final.body"),
      tone: "pink",
    });
  }
  if (historic) {
    cards.push({
      icon: Building2,
      title: t("emotion.historic.title"),
      body: t("emotion.historic.body", { stadium: stadiumName ?? "" }),
      tone: "amber",
    });
  }
  if (hotAtmosphere) {
    cards.push({
      icon: Flame,
      title: t("emotion.atmosphere.title"),
      body: t("emotion.atmosphere.body", { score: (atmosphereScore as number).toFixed(1) }),
      tone: "red",
    });
  }

  if (cards.length === 0) return null;

  const dark = variant === "dark";
  const cardCls = dark
    ? "rounded-2xl bg-white/[0.04] border border-white/10 p-4"
    : "rounded-2xl bg-white border border-slate-200 p-4 shadow-sm";
  const heading = dark ? "text-white" : "text-[#2C3E50]";
  const body = dark ? "text-white/70" : "text-[#2C3E50]/70";
  const eyebrow = dark ? "text-white/55" : "text-[#2C3E50]/55";

  const tone = (t: string, dark: boolean) => {
    const map: Record<string, [string, string]> = {
      red:    ["text-red-300",    "text-red-700"],
      amber:  ["text-amber-300",  "text-amber-700"],
      pink:   ["text-pink-300",   "text-pink-700"],
      indigo: ["text-indigo-300", "text-indigo-700"],
    };
    return dark ? map[t]?.[0] ?? "text-[#2ECC71]" : map[t]?.[1] ?? "text-[#2ECC71]";
  };

  return (
    <section className="max-w-5xl mx-auto px-5 py-6">
      <div className={`text-[10px] uppercase tracking-wider ${eyebrow} font-bold mb-3 flex items-center gap-1.5`}>
        <Sparkles className="w-3.5 h-3.5" /> {t("emotion.eyebrow")}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.slice(0, 4).map((c) => (
          <div key={c.title} className={cardCls}>
            <div className="flex items-start gap-3">
              <c.icon className={`w-5 h-5 mt-0.5 shrink-0 ${tone(c.tone, dark)}`} />
              <div className="min-w-0">
                <div className={`font-extrabold text-sm ${heading}`}>{c.title}</div>
                <div className={`text-xs ${body} leading-relaxed mt-1`}>{c.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MatchEmotionalContext;
