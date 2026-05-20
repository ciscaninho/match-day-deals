import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";
import { getDestinationsCopy } from "@/i18n/destinationsPage";
import { DestinationsHero } from "@/components/destinations/DestinationsHero";
import { DestinationsBento } from "@/components/destinations/DestinationsBento";
import { WorldCupHostsBlock } from "@/components/destinations/WorldCupHostsBlock";

/**
 * Destinations Foot — cinematic public entry point.
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
        <WorldCupHostsBlock />
      </div>
    </WebsiteLayout>
  );
};

export default DestinationsPage;
