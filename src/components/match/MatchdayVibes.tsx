import { useLanguage } from "@/i18n/LanguageContext";
import { Vibe, vibeToneClasses } from "@/lib/matchdayVibes";
import { cn } from "@/lib/utils";

type Props = {
  vibes: Vibe[];
  variant?: "dark" | "light";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

/**
 * Compact, premium emotional-context chips.
 * Stays elegant — small emoji + tight label, no gamified noise.
 */
export const MatchdayVibes = ({
  vibes,
  variant = "dark",
  size = "sm",
  showLabel = true,
  className,
}: Props) => {
  const { t } = useLanguage();
  if (!vibes || vibes.length === 0) return null;
  const dark = variant === "dark";

  const chipBase =
    size === "md"
      ? "px-3 py-1.5 text-[11px]"
      : "px-2.5 py-1 text-[10px]";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {showLabel && (
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider font-bold mr-0.5",
            dark ? "text-white/55" : "text-[#2C3E50]/55",
          )}
        >
          {t("vibe.label")}
        </span>
      )}
      {vibes.map((v) => (
        <span
          key={v.id}
          title={t(v.i18nKey)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap",
            vibeToneClasses(v.tone, dark),
            chipBase,
          )}
        >
          <span className="text-[12px] leading-none" aria-hidden>
            {v.emoji}
          </span>
          <span className="leading-none">{t(v.i18nKey)}</span>
        </span>
      ))}
    </div>
  );
};

export default MatchdayVibes;
