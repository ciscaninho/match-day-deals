import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { getLegalCopy, type LegalDocument } from "@/i18n/legal";

interface Props {
  doc: "privacy" | "terms" | "refund";
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

export const LegalPage = ({ doc }: Props) => {
  const { locale, dir } = useLanguage();
  const copy = getLegalCopy(locale);
  const document: LegalDocument = copy[doc];

  return (
    <MarketingLayout>
      <section className="py-16 bg-white" dir={dir}>
        <article className="max-w-3xl mx-auto px-5 prose prose-slate">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {document.title}
          </h1>
          <p className="text-sm text-[#2C3E50]/60">
            {document.lastUpdatedLabel}: {formatDate(locale)}
          </p>

          {document.sections.map((section, i) => (
            <section key={i} className="mt-6">
              <h2 className="text-xl font-bold">{section.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: section.body }} />
            </section>
          ))}
        </article>
      </section>
    </MarketingLayout>
  );
};

export default LegalPage;
