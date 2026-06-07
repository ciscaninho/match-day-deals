import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

/**
 * Resolves /go/:shortId → target path with UTM params appended,
 * then performs a window.location replace.
 *
 * Tracks a page_view with campaign attribution before redirecting.
 */
const GoRedirectPage = () => {
  const { shortId } = useParams<{ shortId: string }>();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!shortId) {
        window.location.replace("/");
        return;
      }
      const { data } = await supabase
        .from("marketing_campaigns" as never)
        .select("id,target_path,utm_source,utm_medium,utm_campaign,utm_content,competition,match_id")
        .eq("short_id", shortId)
        .is("archived_at", null)
        .maybeSingle();

      if (cancelled) return;

      const target = (data as { target_path?: string } | null)?.target_path ?? "/";
      const params = new URLSearchParams();
      const row = data as Record<string, string | null> | null;
      if (row?.utm_source) params.set("utm_source", row.utm_source);
      if (row?.utm_medium) params.set("utm_medium", row.utm_medium);
      if (row?.utm_campaign) params.set("utm_campaign", row.utm_campaign);
      if (row?.utm_content) params.set("utm_content", row.utm_content);

      try {
        trackEvent("page_view", {
          campaign_id: (row?.id as string | undefined) ?? null,
          competition: row?.competition ?? null,
          match_id: row?.match_id ?? null,
          short_id: shortId,
          via: "short_link",
        });
      } catch {
        /* noop */
      }

      const join = target.includes("?") ? "&" : "?";
      const qs = params.toString();
      const dest = qs ? `${target}${join}${qs}` : target;
      // Use replace so back-button skips the /go page.
      window.location.replace(dest);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [shortId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
};

export default GoRedirectPage;
