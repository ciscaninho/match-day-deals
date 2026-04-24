import { supabase } from "@/integrations/supabase/client";

export interface SportmonksSyncResult {
  success: boolean;
  synced?: number;
  pages?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "function" | "table" | "network" | "unknown";
  status?: number;
}

/**
 * Triggers the Sportmonks → Supabase sync edge function.
 * Uses the supabase SDK so the publishable key + headers are always correct,
 * avoiding "Invalid API key" issues from manual fetch calls.
 */
export const syncSportmonksFixtures = async (): Promise<SportmonksSyncResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("sync-sportmonks", {
      body: {},
    });

    if (error) {
      // FunctionsHttpError / FunctionsRelayError / FunctionsFetchError
      const status = (error as { context?: { status?: number } }).context?.status;
      const message = error.message || "Unknown edge function error";

      let errorType: SportmonksSyncResult["errorType"] = "function";
      if (status === 401 || status === 403 || /api key|apikey|jwt|unauthor/i.test(message)) {
        errorType = "key";
      } else if (status === 404) {
        errorType = "function";
      } else if (/relation|table|column|schema/i.test(message)) {
        errorType = "table";
      } else if (/fetch|network|load failed/i.test(message)) {
        errorType = "network";
      }

      return {
        success: false,
        error: `[${errorType.toUpperCase()}${status ? ` ${status}` : ""}] ${message}`,
        errorType,
        status,
      };
    }

    return (data as SportmonksSyncResult) ?? { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] ${message}`,
      errorType: "network",
    };
  }
};
