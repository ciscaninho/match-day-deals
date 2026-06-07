import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  source?: string;
  defaultTeams?: string[];
  className?: string;
}

/**
 * Lightweight lead-gen newsletter capture.
 * Stores into public.newsletter_signups (anon insert) and fires analytics_events.
 */
export const NewsletterCTA = ({ source = "world_cup_2026", defaultTeams = [], className = "" }: Props) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email.");
      return;
    }
    setStatus("submitting");
    setError(null);

    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const row = {
      email: trimmed,
      favourite_team: team.trim() || null,
      source,
      utm_source: sp?.get("utm_source") ?? null,
      utm_medium: sp?.get("utm_medium") ?? null,
      utm_campaign: sp?.get("utm_campaign") ?? null,
      utm_content: sp?.get("utm_content") ?? null,
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
      language: typeof navigator !== "undefined" ? navigator.language?.slice(0, 5) : null,
    };

    const { error: insertError } = await supabase
      .from("newsletter_signups" as never)
      .insert(row as never);

    if (insertError) {
      // 23505 unique violation = already subscribed; treat as success.
      if (insertError.code === "23505") {
        setStatus("done");
        return;
      }
      setStatus("error");
      setError(insertError.message);
      return;
    }

    trackEvent("newsletter_signup", { source, favourite_team: row.favourite_team });
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center ${className}`}>
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <h3 className="text-base font-extrabold text-slate-900">{t("newsletter.success_title") || "You're in!"}</h3>
        <p className="text-sm text-slate-600 mt-1">{t("newsletter.success_body") || "We'll send World Cup 2026 ticket alerts straight to your inbox."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-violet-600" />
        <h3 className="text-base font-extrabold text-slate-900">
          {t("newsletter.title") || "Receive World Cup 2026 ticket alerts"}
        </h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {t("newsletter.subtitle") || "Be first to know when new fixtures and ticket releases go live."}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          type="email"
          required
          placeholder={t("newsletter.email_placeholder") || "you@email.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <input
          list="newsletter-teams"
          placeholder={t("newsletter.team_placeholder") || "Favourite team (optional)"}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <datalist id="newsletter-teams">
          {defaultTeams.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm px-4 py-2 w-full transition disabled:opacity-60"
      >
        {status === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("newsletter.submit") || "Get ticket alerts"}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </form>
  );
};

export default NewsletterCTA;
