import { ShieldCheck } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { getTrustDoc, type TrustDocKey } from "@/i18n/trustPages";
import { PageHero, PageSection, narrowContainerCls } from "@/components/layout/Page";

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
        <PageHero
          breadcrumbs={[
            { label: tf("website.nav.home", "Home"), to: "/" },
            { label: document.title },
          ]}
          eyebrow={
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              {eyebrowText}
            </>
          }
          title={document.title}
          subtitle={document.intro}
          meta={`${document.lastUpdatedLabel}: ${formatDate(locale)}`}
          width="default"
          center={false}
        />

        <PageSection tone="white">
          <article className={narrowContainerCls + " !px-0"}>
            <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-[#2ECC71] prose-a:font-semibold prose-strong:text-[#2C3E50]">
              {document.sections.map((section, i) => (
                <section key={i} className="mt-8 first:mt-0 scroll-mt-28">
                  <h2 id={`section-${i + 1}`}>{section.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: section.body }} />
                </section>
              ))}
            </div>

            <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-[#2ECC71] mt-0.5 shrink-0" />
              <p className="text-sm text-[#2C3E50]/80 leading-relaxed">
                {tf(
                  "trust.footer_blurb",
                  "Foot Ticket Finder is an independent comparison service. We do not sell tickets — every purchase is made on the official partner's site. Some outbound links may earn us a commission, which never increases the price you pay."
                )}
              </p>
            </div>
          </article>
        </PageSection>
      </div>
    </WebsiteLayout>
  );
};

export default TrustDocPage;
