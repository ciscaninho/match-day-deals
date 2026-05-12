import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { getTrustDoc, type TrustDocKey } from "@/i18n/trustPages";

interface Props {
  doc: TrustDocKey;
  /** Optional accent label shown above the title (e.g. "Trust & transparency") */
  eyebrow?: string;
}

const formatDate = (locale: string) => {
  try {
    return new Date().toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("en-GB");
  }
};

export const TrustDocPage = ({ doc, eyebrow }: Props) => {
  const { locale, dir, tf } = useLanguage();
  const document = getTrustDoc(locale, doc);
  const eyebrowText = eyebrow || tf("trust.eyebrow", "Trust & Transparency");

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
          <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
            <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[#2ECC71]">{tf("website.nav.home", "Home")}</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white/90 font-medium">{document.title}</span>
            </nav>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-full px-3 py-1 mb-5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {eyebrowText}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {document.title}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/75 leading-relaxed max-w-3xl">
              {document.intro}
            </p>
            <p className="mt-6 text-xs text-white/50">
              {document.lastUpdatedLabel}: {formatDate(locale)}
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="bg-white">
          <article className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-[#2ECC71] prose-a:font-semibold prose-strong:text-[#2C3E50]">
              {document.sections.map((section, i) => (
                <section key={i} className="mt-8 first:mt-0 scroll-mt-28">
                  <h2 id={`section-${i + 1}`}>{section.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: section.body }} />
                </section>
              ))}
            </div>

            {/* Footer trust bar */}
            <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-[#2ECC71] mt-0.5 shrink-0" />
              <p className="text-sm text-[#2C3E50]/80 leading-relaxed">
                {tf("trust.footer_blurb", "Foot Ticket Finder is an independent comparison service. We do not sell tickets — every purchase is made on the official partner's site. Some outbound links may earn us a commission, which never increases the price you pay.")}
              </p>
            </div>
          </article>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default TrustDocPage;
