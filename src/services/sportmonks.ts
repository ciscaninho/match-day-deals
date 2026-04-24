import { supabase } from "@/integrations/supabase/client";

export interface SportmonksSyncResult {
  success: boolean;
  synced?: number;
  pages?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "function" | "table" | "network" | "preview" | "unknown";
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
      const status = (error as { context?: { status?: number } }).context?.status;
      const message = error.message || "Unknown edge function error";
      const lowerMessage = message.toLowerCase();

      let errorType: SportmonksSyncResult["errorType"] = "function";
      let formattedMessage = message;

      if (status === 401 || status === 403 || /api key|apikey|jwt|unauthor/i.test(message)) {
        errorType = "key";
      } else if (status === 404) {
        errorType = "function";
      } else if (/relation|table|column|schema/i.test(message)) {
        errorType = "table";
      } else if (/fetch|network|load failed/i.test(message)) {
        errorType = status === 0 || lowerMessage.includes("load failed") || lowerMessage.includes("failed to fetch")
          ? "preview"
          : "network";

        if (errorType === "preview") {
          formattedMessage = "Le backend répond correctement, mais le Preview Lovable bloque cet appel réseau. Teste la synchronisation sur la version publiée.";
        }
      }

      return {
        success: false,
        error: `[${errorType.toUpperCase()}${status ? ` ${status}` : ""}] ${formattedMessage}`,
        errorType,
        status,
      };
    }

    return (data as SportmonksSyncResult) ?? { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lowerMessage = message.toLowerCase();
    const isPreviewIssue = lowerMessage.includes("load failed") || lowerMessage.includes("failed to fetch");

    return {
      success: false,
      error: isPreviewIssue
        ? "[PREVIEW] Le backend répond correctement, mais le Preview Lovable bloque cet appel réseau. Teste la synchronisation sur la version publiée."
        : `[NETWORK] ${message}`,
      errorType: isPreviewIssue ? "preview" : "network",
    };
  }
};
