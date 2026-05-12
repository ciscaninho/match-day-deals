import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  initials: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: "none" | "premium" | "admin" | "soft";
  className?: string;
}

const SIZES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

const RING: Record<NonNullable<UserAvatarProps["ring"]>, string> = {
  none: "",
  soft: "ring-2 ring-white/40",
  premium:
    "ring-2 ring-amber-300/70 shadow-[0_0_0_3px_rgba(251,191,36,0.15),0_8px_24px_-8px_rgba(251,191,36,0.55)]",
  admin:
    "ring-2 ring-emerald-400/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15),0_8px_24px_-8px_rgba(16,185,129,0.55)]",
};

export const UserAvatar = ({
  name,
  initials,
  src,
  size = "md",
  ring = "none",
  className,
}: UserAvatarProps) => {
  const base = cn(
    "relative inline-flex items-center justify-center rounded-full overflow-hidden font-extrabold text-white select-none",
    "bg-gradient-to-br from-[#2C3E50] via-[#34495E] to-[#1A2533]",
    SIZES[size],
    RING[ring],
    className
  );

  if (src) {
    return (
      <span className={base}>
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </span>
    );
  }

  return (
    <span className={base} aria-label={name}>
      <span className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-amber-300/10" />
      <span className="relative tracking-wide">{initials}</span>
    </span>
  );
};
