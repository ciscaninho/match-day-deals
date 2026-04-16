import { useUser } from "@/contexts/UserContext";

interface AdBannerProps {
  variant?: "banner" | "inline" | "detail";
}

export const AdBanner = ({ variant = "banner" }: AdBannerProps) => {
  const { isPremium } = useUser();
  if (isPremium) return null;

  const styles: Record<string, string> = {
    banner: "h-16 mx-5 mt-4",
    inline: "h-14 my-2",
    detail: "h-16 mx-5 mt-4 mb-2",
  };

  return (
    <div
      className={`${styles[variant]} rounded-lg bg-muted/60 border border-dashed border-border flex items-center justify-center`}
    >
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        Ad · Go Premium to remove
      </span>
    </div>
  );
};
