import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type State = "idle" | "submitting" | "done" | "invalid";

const NewsletterUnsubscribePage = () => {
  const [params] = useSearchParams();
  const { tf } = useLanguage();
  const token = params.get("token");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<State>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setState("invalid"); return; }
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("newsletter-unsubscribe", { body: { token, reason } });
    if (error || (data as any)?.error) { setState("invalid"); return; }
    setState("done");
  };

  if (!token) {
    return (
      <WebsiteLayout>
        <section className="max-w-xl mx-auto px-5 py-20 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{tf("newsletter.unsub.invalid_title", "Missing token")}</h1>
          <p className="mt-2 text-sm text-slate-600">{tf("newsletter.unsub.invalid_body", "This unsubscribe link is missing its token.")}</p>
          <Link to="/" className="inline-block mt-6 text-sm font-bold text-[#2ECC71] hover:underline">{tf("newsletter.confirm.back_home", "← Back to home")}</Link>
        </section>
      </WebsiteLayout>
    );
  }

  if (state === "done") {
    return (
      <WebsiteLayout>
        <section className="max-w-xl mx-auto px-5 py-20 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{tf("newsletter.unsub.done_title", "You're unsubscribed")}</h1>
          <p className="mt-2 text-sm text-slate-600">{tf("newsletter.unsub.done_body", "You will no longer receive emails from Foot Ticket Finder. Sorry to see you go!")}</p>
          <Link to="/" className="inline-block mt-6 text-sm font-bold text-[#2ECC71] hover:underline">{tf("newsletter.confirm.back_home", "← Back to home")}</Link>
        </section>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <section className="max-w-xl mx-auto px-5 py-20">
        <h1 className="text-2xl font-extrabold text-slate-900 text-center">{tf("newsletter.unsub.title", "Unsubscribe from emails")}</h1>
        <p className="mt-2 text-sm text-slate-600 text-center">{tf("newsletter.unsub.subtitle", "We're sorry to see you go. You can tell us why below (optional) so we can improve.")}</p>
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={tf("newsletter.unsub.reason_placeholder", "Optional: tell us why you're leaving…")}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
          <button
            type="submit"
            disabled={state === "submitting"}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2 disabled:opacity-60"
          >
            {state === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {tf("newsletter.unsub.submit", "Confirm unsubscribe")}
          </button>
        </form>
      </section>
    </WebsiteLayout>
  );
};

export default NewsletterUnsubscribePage;
