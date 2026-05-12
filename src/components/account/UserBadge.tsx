import { Crown, Shield, Sparkles, Star, Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeKey =
  | "Moderator"
  | "Founding Supporter"
  | "Stadium Expert"
  | "Ultra Fan"
  | "Verified Supporter"
  | "Top Contributor"
  | "Football Explorer"
  | "Expert";

const STYLES: Record<string, { icon: any; cls: string }> = {
  Moderator: {
    icon: Shield,
    cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  },
  "Founding Supporter": {
    icon: Crown,
    cls: "bg-amber-400/15 text-amber-700 border-amber-400/40",
  },
  "Stadium Expert": {
    icon: Trophy,
    cls: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  },
  "Ultra Fan": {
    icon: Star,
    cls: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  },
  "Verified Supporter": {
    icon: CheckCircle2,
    cls: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  },
  "Top Contributor": {
    icon: Sparkles,
    cls: "bg-violet-500/15 text-violet-700 border-violet-500/30",
  },
  "Football Explorer": {
    icon: Sparkles,
    cls: "bg-slate-500/10 text-slate-700 border-slate-300",
  },
  Expert: {
    icon: Trophy,
    cls: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  },
};

export const UserBadge = ({
  label,
  size = "sm",
  className,
}: {
  label: string | null;
  size?: "xs" | "sm";
  className?: string;
}) => {
  if (!label) return null;
  const style = STYLES[label] ?? STYLES["Football Explorer"];
  const Icon = style.icon;
  const sz =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : "text-[11px] px-2 py-0.5 gap-1";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold whitespace-nowrap",
        style.cls,
        sz,
        className
      )}
    >
      <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {label}
    </span>
  );
};
