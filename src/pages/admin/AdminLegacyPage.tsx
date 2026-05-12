import { useLanguage } from "@/i18n/LanguageContext";
import AdminPage from "@/pages/AdminPage";

export const AdminLegacyPage = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {t("admin.legacy.intro")}
      </div>
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <AdminPage />
      </div>
    </div>
  );
};

export default AdminLegacyPage;
