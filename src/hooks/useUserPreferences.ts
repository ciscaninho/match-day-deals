import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

export interface UserPreferences {
  id: string;
  user_id: string;
  favorite_teams: string[];
  favorite_leagues: string[];
  user_intent: string[];
  onboarding_completed: boolean;
  onboarding_skipped_at: string | null;
}

export const useUserPreferences = () => {
  const { user } = useUser();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user_preferences", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserPreferences | null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Omit<UserPreferences, "id" | "user_id">>) => {
      if (!user) throw new Error("Not authenticated");
      // Upsert in case row is missing (defensive — trigger should create it)
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_preferences", user?.id] });
    },
  });

  return { ...query, update };
};
