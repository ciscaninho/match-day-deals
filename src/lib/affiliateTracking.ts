/**
 * Affiliate click tracking — Phase 1 instrumentation.
 *
 * Fire-and-forget inserts into public.affiliate_clicks. Never throws,
 * never blocks navigation. Use inside onClick handlers of outbound CTAs.
 */
import { supabase } from "@/integrations/supabase/client";
import { inspectAffiliateUrl } from "@/lib/affiliate";
import { trackEvent } from "@/lib/analytics";

export type AffiliateEventType =
  | "ticket_click"
  | "hospitality_click"
  | "affiliate_redirect";

export interface TrackAffiliateClickInput {
  event: AffiliateEventType;
  destination: string | null | undefined;
  provider?: string | null;
  clubSlug?: string | null;
  clubName?: string | null;
  stadiumName?: string | null;
  league?: string | null;
  matchId?: string | null;
}

export const trackAffiliateClick = (input: TrackAffiliateClickInput): void => {
  try {
    const dest = (input.destination ?? "").trim();
    if (!dest) return;
    const info = inspectAffiliateUrl(dest);
    const row = {
      event_type: input.event,
      club_slug: input.clubSlug ?? null,
      club_name: input.clubName ?? null,
      stadium_name: input.stadiumName ?? null,
      league: input.league ?? null,
      match_id: input.matchId ?? null,
      provider: input.provider ?? null,
      network: info.network,
      merchant: info.merchant,
      destination: info.destination,
      transformed: info.transformed,
      is_tracked: info.isTracked,
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
    };
    void supabase.from("affiliate_clicks" as never).insert(row as never).then(
      () => undefined,
      () => undefined,
    );
    // Mirror into analytics_events for unified funnel / campaign attribution.
    try {
      trackEvent(input.event === "ticket_click" ? "ticket_button_click" : "affiliate_redirect", {
        match_id: input.matchId ?? null,
        stadium: input.stadiumName ?? null,
        provider: input.provider ?? null,
        merchant: info.merchant ?? null,
        network: info.network ?? null,
        destination: info.destination ?? null,
        league: input.league ?? null,
        club_slug: input.clubSlug ?? null,
      });
    } catch {
      /* noop */
    }
  } catch {
    /* swallow — tracking must never break UX */
  }
};
