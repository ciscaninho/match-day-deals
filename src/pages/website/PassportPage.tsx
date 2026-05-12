import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { StadiumPassportCard } from "@/components/StadiumPassportCard";
import { Trophy } from "lucide-react";

const PassportPage = () => {
  const { t } = useLanguage();
  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-br from-[#1B2A3A] to-[#2C3E50] text-white">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3"><Trophy className="w-7 h-7 text-amber-400" /> {t("page.passport.title")}</h1>
          <p className="text-white/70 text-sm mt-2">Every stadium you've stepped into — in one passport.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-5 py-10">
        <StadiumPassportCard />
      </section>
    </WebsiteLayout>
  );
};

export default PassportPage;
