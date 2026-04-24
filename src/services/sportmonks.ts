import { supabase } from "@/integrations/supabase/client";

export interface SportmonksSyncResult {
  success: boolean;
  synced?: number;
  pages?: number;
  message?: string;
  error?: string;
}

/**
 * Triggers the Sportmonks → Supabase sync edge function.
 * The actual API call to Sportmonks happens server-side using the
 * SPORTMONKS_API_TOKEN secret (kept off the client for security).
 */
export const syncSportmonksFixtures = async (): Promise<SportmonksSyncResult> => {
  const { data, error } = await supabase.functions.invoke("sync-sportmonks", {
    body: {},
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as SportmonksSyncResult;
};
