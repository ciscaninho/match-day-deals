import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface RequireAdminProps {
  children: React.ReactNode;
}

/**
 * Route guard: only allow authenticated admins.
 * - Loading → spinner
 * - Not logged in → redirect to /auth
 * - Logged in but not admin → redirect to /maintenance
 */
export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/maintenance" replace />;
  }

  return <>{children}</>;
};
