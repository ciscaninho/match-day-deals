import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type State = "loading" | "confirmed" | "already" | "invalid";

const NewsletterConfirmPage = () => {
  const [params] = useSearchParams();
  const { tf } = useLanguage();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      const { data, error } = await supabase.functions.invoke("newsletter-confirm", { body: { token } });
      if (error || !data) { setState("invalid"); return; }
      const d = data as { ok?: boolean; status?: string; error?: string };
      if (d.error) { setState("invalid"); return; }
      if (d.status === "already_confirmed") setState("already");
      else setState("confirmed");
    })();
  }, [token]);

  return (
    <WebsiteLayout>
      <section className="max-w-xl mx-auto px-5 py-20 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-slate-400" />
            <p className="mt-4 text-sm text-slate-500">{tf("newsletter.confirm.loading", "Confirming your subscription…")}</p>
          </>
        )}
        {state === "confirmed" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
              {tf("newsletter.confirm.success_title", "You're confirmed!")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {tf("newsletter.confirm.success_body", "You'll now receive Foot Ticket Finder alerts when fixtures and ticket sales go live.")}
            </p>
          </>
        )}
        {state === "already" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
              {tf("newsletter.confirm.already_title", "Already confirmed")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {tf("newsletter.confirm.already_body", "Your subscription is already active. Welcome aboard!")}
            </p>
          </>
        )}
        {state === "invalid" && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
              {tf("newsletter.confirm.invalid_title", "Invalid or expired link")}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {tf("newsletter.confirm.invalid_body", "This confirmation link is no longer valid. Please subscribe again to receive a fresh email.")}
            </p>
          </>
        )}
        <Link to="/" className="inline-block mt-6 text-sm font-bold text-[#2ECC71] hover:underline">
          {tf("newsletter.confirm.back_home", "← Back to home")}
        </Link>
      </section>
    </WebsiteLayout>
  );
};

export default NewsletterConfirmPage;
