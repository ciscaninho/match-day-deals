import { supabase } from "@/integrations/supabase/client";

export interface SportmonksSyncResult {
  success: boolean;
  synced?: number;
  pages?: number;
  message?: string;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Triggers the Sportmonks → Supabase sync edge function.
 *
 * Uses a direct `fetch` (instead of `supabase.functions.invoke`) so we can:
 *  - control the timeout (sync can take 10–30s due to Sportmonks pagination)
 *  - get clearer error messages instead of the generic
 *    "Failed to send a request to the Edge Function".
 */
export const syncSportmonksFixtures = async (): Promise<SportmonksSyncResult> => {
  const url = `${SUPABASE_URL}/functions/v1/sync-sportmonks`;
  console.log("[sportmonks] Calling:", url);

  // Pull the user's access token (if logged in) — falls back to anon key.
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;
  console.log("[sportmonks] Auth: using", sessionData.session ? "user session" : "anon key");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    const text = await resp.text();
    console.log("[sportmonks] Response status:", resp.status, "body:", text.slice(0, 200));
    let parsed: SportmonksSyncResult | { error?: string } = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { error: text || `HTTP ${resp.status}` };
    }

    if (!resp.ok) {
      return {
        success: false,
        error:
          (parsed as { error?: string }).error ??
          `Edge function returned ${resp.status}`,
      };
    }
    return parsed as SportmonksSyncResult;
  } catch (e) {
    console.error("[sportmonks] Fetch failed:", e);
    if ((e as Error).name === "AbortError") {
      return {
        success: false,
        error:
          "La synchronisation a dépassé 60 s. Réessayez ou vérifiez les logs de la fonction.",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
