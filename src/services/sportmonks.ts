import { supabase } from "@/integrations/supabase/client";

export interface SportmonksSyncResult {
  success: boolean;
  synced?: number;
  pages?: number;
  message?: string;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Triggers the Sportmonks → Supabase sync edge function.
 * Uses a direct fetch with the publishable key only because this function
 * is public and does not require a user session.
 */
export const syncSportmonksFixtures = async (): Promise<SportmonksSyncResult> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-sportmonks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({}),
  });

  const text = await response.text();
  let payload: SportmonksSyncResult | { error?: string } = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    return {
      success: false,
      error: (payload as { error?: string }).error ?? `Edge function returned ${response.status}`,
    };
  }

  return payload as SportmonksSyncResult;
};
