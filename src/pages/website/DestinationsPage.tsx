import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";
import { getDestinationsCopy } from "@/i18n/destinationsPage";
import { DestinationsHero } from "@/components/destinations/DestinationsHero";
import { DestinationsBento } from "@/components/destinations/DestinationsBento";

/**
 * Destinations Foot — cinematic public entry point.
 * PR 1: hero + featured bento. PR 2 adds seating chooser + local secrets on
 * detail pages. PR 3 adds World Cup 2026 host destinations block.
 */
const DestinationsPage = () => {
  const { locale, dir } = useLanguage();
  const copy = getDestinationsCopy(locale);

  useSEO({
    title: copy.meta_title,
    description: copy.meta_description,
  });

  return (
    <WebsiteLayout>
      <div dir={dir} className="bg-[#0F1A2E]">
        <DestinationsHero />
        <DestinationsBento />
      </div>
    </WebsiteLayout>
  );
};

export default DestinationsPage;
