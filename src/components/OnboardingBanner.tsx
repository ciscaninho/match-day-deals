import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Soft banner shown on /app/home when the user skipped onboarding.
 * Disappears once onboarding_completed === true.
 */
export const OnboardingBanner = () => {
  const { data: prefs } = useUserPreferences();
  if (!prefs || prefs.onboarding_completed) return null;

  return (
    <Link
      to="/onboarding"
      className="flex items-center gap-3 rounded-2xl border border-[#2ECC71]/30 bg-[#2ECC71]/5 p-4 hover:bg-[#2ECC71]/10 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-[#2ECC71]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[#2C3E50]">Personalize your experience</p>
        <p className="text-xs text-[#2C3E50]/60 mt-0.5">
          Pick your favorite teams and leagues — takes 10 seconds.
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#2ECC71] shrink-0" />
    </Link>
  );
};
