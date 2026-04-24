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
 * Uses the Supabase SDK so headers (apikey, auth) are handled correctly
 * across browsers (Safari is strict about CORS preflights).
 */
export const syncSportmonksFixtures = async (): Promise<SportmonksSyncResult> => {
  console.log("[sportmonks] invoke sync-sportmonks");

  const { data, error } = await supabase.functions.invoke("sync-sportmonks", {
    body: {},
  });

  console.log("[sportmonks] result:", { data, error });

  if (error) {
    // The SDK error often hides the real edge function response body.
    // Try to extract it.
    const ctx = (error as unknown as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        const txt = await ctx.text();
        console.error("[sportmonks] edge body:", txt);
        try {
          const parsed = JSON.parse(txt);
          return { success: false, error: parsed.error ?? txt };
        } catch {
          return { success: false, error: txt || error.message };
        }
      } catch {
        // ignore
      }
    }
    return { success: false, error: error.message };
  }

  return data as SportmonksSyncResult;
};
