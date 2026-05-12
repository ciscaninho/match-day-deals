import { useLanguage } from "@/i18n/LanguageContext";
import { StadiumSuggestionsAdminCard } from "@/components/StadiumSuggestionsAdminCard";

export const AdminSuggestionsPage = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.suggestions")}</h1>
      </header>
      <StadiumSuggestionsAdminCard />
    </div>
  );
};

export default AdminSuggestionsPage;
