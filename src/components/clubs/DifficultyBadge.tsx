import { useLanguage } from "@/i18n/LanguageContext";
import type { ClubDifficulty } from "@/hooks/useClubTicketing";

const styles: Record<ClubDifficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-orange-100 text-orange-800",
  extreme: "bg-red-100 text-red-700",
};

export const DifficultyBadge = ({
  level,
  showLabel = true,
}: {
  level: ClubDifficulty;
  showLabel?: boolean;
}) => {
  const { t } = useLanguage();
  const safe = (["easy", "medium", "hard", "extreme"] as ClubDifficulty[]).includes(level)
    ? level
    : "medium";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${styles[safe]}`}
    >
      {showLabel && <span className="opacity-80">{t("clubs.difficulty.label")}:</span>}
      <span>{t(`clubs.difficulty.${safe}`)}</span>
    </span>
  );
};
