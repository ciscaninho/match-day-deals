import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * useAuth — provides the current Supabase session, user, and admin status.
 *
 * IMPORTANT: We register the onAuthStateChange listener BEFORE calling
 * getSession to avoid race conditions where the initial event would be
 * missed.
 */
export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listener first — fires synchronously on every auth change
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if the current user has the admin role
  const { data: isAdmin = false, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) {
        console.error("Erreur vérification rôle:", error);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    user,
    isAdmin,
    loading: loading || roleLoading,
    signOut,
  };
};
