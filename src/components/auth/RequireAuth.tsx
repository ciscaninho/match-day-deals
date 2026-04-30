import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  /** When true, also redirect to /onboarding if not completed. */
  enforceOnboarding?: boolean;
}

export const RequireAuth = ({ children, enforceOnboarding = false }: Props) => {
  const { user, authLoading } = useUser();
  const { data: prefs, isLoading: prefsLoading } = useUserPreferences();
  const location = useLocation();

  if (authLoading || (user && prefsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (enforceOnboarding && prefs && !prefs.onboarding_completed && !prefs.onboarding_skipped_at) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
