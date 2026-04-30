import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "./AuthModal";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthOptions {
  reason?: string;
  /** Where to redirect after successful auth — defaults to onboarding if not completed. */
  next?: string;
}

interface AuthGateContextValue {
  /**
   * Run an action only if logged in. If not, opens the auth modal and runs the action after sign-in.
   */
  requireAuth: (action: () => void, options?: RequireAuthOptions) => void;
  /** Open the auth modal directly. */
  openAuth: (options?: RequireAuthOptions) => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export const AuthGateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [redirectAfter, setRedirectAfter] = useState<string | undefined>();

  const requireAuth = useCallback(
    (action: () => void, options?: RequireAuthOptions) => {
      if (user) {
        action();
        return;
      }
      setReason(options?.reason);
      setPendingAction(() => action);
      setRedirectAfter(options?.next);
      setOpen(true);
    },
    [user]
  );

  const openAuth = useCallback((options?: RequireAuthOptions) => {
    setReason(options?.reason);
    setPendingAction(null);
    setRedirectAfter(options?.next);
    setOpen(true);
  }, []);

  const handleAuthenticated = useCallback(async () => {
    // Decide where to go: onboarding if not completed, else explicit next.
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (uid) {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("onboarding_completed")
        .eq("user_id", uid)
        .maybeSingle();
      if (!prefs?.onboarding_completed) {
        navigate("/onboarding");
        pendingAction?.();
        setPendingAction(null);
        return;
      }
    }
    if (redirectAfter) navigate(redirectAfter);
    pendingAction?.();
    setPendingAction(null);
  }, [navigate, pendingAction, redirectAfter]);

  return (
    <AuthGateContext.Provider value={{ requireAuth, openAuth }}>
      {children}
      <AuthModal open={open} onOpenChange={setOpen} reason={reason} onAuthenticated={handleAuthenticated} />
    </AuthGateContext.Provider>
  );
};

export const useAuthGate = () => {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used inside AuthGateProvider");
  return ctx;
};
