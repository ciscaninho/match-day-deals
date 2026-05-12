import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Send, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const SUPPORT_EMAIL = "support@footticketfinder.com";

const ContactPage = () => {
  const { dir, tf } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      subject: String(form.get("subject") || "").trim(),
      message: String(form.get("message") || "").trim(),
      website: String(form.get("website") || ""), // honeypot
    };

    if (!payload.name || !payload.email || !payload.subject || payload.message.length < 5) {
      toast.error(tf("contact.invalid", "Please fill in every field."));
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("contact-form", { body: payload });
      if (error || !(data as { ok?: boolean })?.ok) throw error || new Error("send_failed");
      setDone(true);
      toast.success(tf("contact.success", "Message sent — we'll reply within 24h."));
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error("[contact] send failed", err);
      // Mailto fallback so the user is never blocked.
      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(`${payload.message}\n\n— ${payload.name} <${payload.email}>`)}`;
      window.location.href = mailto;
      toast.message(tf("contact.fallback", "Opening your email app as a fallback…"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WebsiteLayout>
      <div dir={dir}>
        {/* Cinematic hero */}
        <section className="relative overflow-hidden bg-[#0F1A2E] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(46,204,113,0.45), transparent 60%), radial-gradient(ellipse at bottom right, rgba(52,152,219,0.35), transparent 55%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
            <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[#2ECC71]">{tf("website.nav.home", "Home")}</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white/90 font-medium">{tf("contact.title", "Contact")}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {tf("contact.title", "Get in touch")}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/75 leading-relaxed max-w-2xl">
              {tf(
                "contact.intro",
                "A real human reads every message. Spotted a mistake on a match page, need help with a ticket, or want to partner with us? Tell us below — we reply within 24 hours on business days.",
              )}
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            {done ? (
              <div className="rounded-2xl border border-[#2ECC71]/30 bg-[#2ECC71]/5 p-8 text-center">
                <ShieldCheck className="w-10 h-10 text-[#2ECC71] mx-auto" />
                <h2 className="mt-4 text-xl font-extrabold text-[#2C3E50]">
                  {tf("contact.thanks_title", "Message received")}
                </h2>
                <p className="mt-2 text-sm text-[#2C3E50]/70 max-w-md mx-auto leading-relaxed">
                  {tf("contact.thanks_body", "Thank you — we'll get back to you within 24 hours on business days, in English or French.")}
                </p>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2ECC71] hover:underline"
                >
                  {tf("contact.send_another", "Send another message")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* honeypot — hidden from real users */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label={tf("contact.name", "Name")} name="name" required />
                  <Field label={tf("contact.email", "Email")} name="email" type="email" required />
                </div>
                <Field label={tf("contact.subject", "Subject")} name="subject" required />
                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-widest text-[#2C3E50]/70 mb-2">
                    {tf("contact.message", "Message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={5}
                    maxLength={5000}
                    rows={7}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#2C3E50] placeholder:text-slate-400 focus:outline-none focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20 transition-colors resize-y"
                    placeholder={tf("contact.message_ph", "Tell us what's on your mind…")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3 text-sm shadow-lg shadow-[#2ECC71]/30 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {tf("contact.sending", "Sending…")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {tf("contact.send", "Send message")}
                    </>
                  )}
                </button>

                <p className="text-xs text-[#2C3E50]/55 leading-relaxed pt-2">
                  {tf("contact.legal", "By sending a message you agree to our privacy policy. We use your details only to reply to you.")}
                </p>
              </form>
            )}

            {/* Direct contact fallback */}
            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 flex items-start gap-4">
              <Mail className="w-5 h-5 text-[#2ECC71] mt-0.5 shrink-0" />
              <div className="text-sm text-[#2C3E50]/80 leading-relaxed">
                {tf("contact.direct", "Prefer email?")}{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#2ECC71] font-semibold hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

const Field = ({
  label, name, type = "text", required,
}: { label: string; name: string; type?: string; required?: boolean }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-bold uppercase tracking-widest text-[#2C3E50]/70 mb-2">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      required={required}
      maxLength={type === "email" ? 254 : 200}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#2C3E50] placeholder:text-slate-400 focus:outline-none focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20 transition-colors"
    />
  </div>
);

export default ContactPage;
