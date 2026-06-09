import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";

interface Props {
  source?: string;
  defaultTeams?: string[];
  className?: string;
  /** Compact one-line variant for the footer. */
  variant?: "card" | "inline";
}

/**
 * Newsletter capture with GDPR consent + double opt-in via Brevo.
 * Calls the `newsletter-subscribe` edge function which stores the row,
 * upserts the contact in Brevo and sends a confirmation email.
 */
export const NewsletterCTA = ({
  source = "world_cup_2026",
  defaultTeams = [],
  className = "",
  variant = "card",
}: Props) => {
  const { t, tf } = useLanguage();
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError(tf("newsletter.invalid_email", "Please enter a valid email."));
      return;
    }
    if (!consent) {
      setError(tf("newsletter.consent_required", "Please accept our privacy terms to subscribe."));
      return;
    }
    setStatus("submitting");
    setError(null);

    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const body = {
      email: trimmed,
      favourite_team: team.trim() || null,
      source,
      consent: true,
      utm_source: sp?.get("utm_source") ?? null,
      utm_medium: sp?.get("utm_medium") ?? null,
      utm_campaign: sp?.get("utm_campaign") ?? null,
      utm_content: sp?.get("utm_content") ?? null,
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
      language: typeof navigator !== "undefined" ? navigator.language?.slice(0, 5) : null,
      website, // honeypot
    };

    const { data, error: fnError } = await supabase.functions.invoke("newsletter-subscribe", { body });
    if (fnError) {
      setStatus("error");
      setError(fnError.message || tf("newsletter.error_generic", "Subscription failed, please try again."));
      return;
    }
    if (data && (data as any).error) {
      setStatus("error");
      setError(tf(`newsletter.error_${(data as any).error}`, (data as any).error));
      return;
    }

    trackEvent("newsletter_signup", { source, favourite_team: body.favourite_team });
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center ${className}`}>
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <h3 className="text-base font-extrabold text-slate-900">
          {tf("newsletter.check_inbox_title", "Check your inbox")}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          {tf("newsletter.check_inbox_body", "We've sent you a confirmation email. Click the link inside to start receiving alerts.")}
        </p>
      </div>
    );
  }

  const consentLine = (
    <label className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
      <input
        type="checkbox"
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        required
      />
      <span>
        {tf("newsletter.consent_label", "I agree to receive emails from Foot Ticket Finder and accept the")} {" "}
        <Link to="/privacy" className="underline hover:text-slate-700">
          {tf("newsletter.privacy_link", "privacy policy")}
        </Link>.
      </span>
    </label>
  );

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`w-full ${className}`}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            placeholder={tf("newsletter.email_placeholder", "you@email.com")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/40"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2ECC71] hover:bg-[#27ae60] text-white font-bold text-sm px-4 py-2 transition disabled:opacity-60"
          >
            {status === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {tf("newsletter.submit", "Subscribe")}
          </button>
        </div>
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden="true" />
        <label className="mt-2 flex items-start gap-2 text-[10px] text-white/55 leading-snug">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-3 h-3" required />
          <span>
            {tf("newsletter.consent_label_short", "I accept the")} {" "}
            <Link to="/privacy" className="underline hover:text-white">{tf("newsletter.privacy_link", "privacy policy")}</Link>.
          </span>
        </label>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-violet-600" />
        <h3 className="text-base font-extrabold text-slate-900">
          {tf(`newsletter.${source}.title`, t("newsletter.title") || "Get ticket release alerts")}
        </h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {tf(`newsletter.${source}.subtitle`, t("newsletter.subtitle") || "Be first to know when new fixtures and ticket releases go live.")}
      </p>
      <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          type="email"
          required
          placeholder={tf("newsletter.email_placeholder", "you@email.com")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <input
          list="newsletter-teams"
          placeholder={tf("newsletter.team_placeholder", "Favourite team (optional)")}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <datalist id="newsletter-teams">
          {defaultTeams.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>
      {consentLine}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm px-4 py-2 w-full transition disabled:opacity-60"
      >
        {status === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
        {tf("newsletter.submit", "Get ticket alerts")}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </form>
  );
};

export default NewsletterCTA;
