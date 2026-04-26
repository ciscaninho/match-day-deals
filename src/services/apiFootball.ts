import { supabase } from "@/integrations/supabase/client";

export interface ApiFootballSyncResult {
  success: boolean;
  synced?: number;
  message?: string;
  error?: string;
  errorType?: "key" | "network" | "table" | "unknown";
  errors?: string[];
}

/**
 * Appelle l'edge function `sync-football-data` qui récupère les matchs
 * via Football-Data.org (clé sécurisée côté serveur) et les upsert dans Supabase.
 * Couvre Top 5 européens + Champions League sur 60 jours.
 */
export const syncApiFootballFixtures = async (): Promise<ApiFootballSyncResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("sync-football-data", {
      body: {},
    });

    if (error) {
      return {
        success: false,
        error: `[EDGE] ${error.message}`,
        errorType: "network",
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error ?? "Erreur inconnue",
        errors: data?.errors,
        errorType: "unknown",
      };
    }

    return {
      success: true,
      synced: data.synced ?? 0,
      message: `Synchronisation Football-Data réussie (${data.synced ?? 0} matchs)`,
      errors: data.errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `[NETWORK] ${message}`,
      errorType: "network",
    };
  }
};
