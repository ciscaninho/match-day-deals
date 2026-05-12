import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const AdminAssistantPage = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-5 max-w-3xl">
      <header>
        <h1 className="text-xl font-extrabold text-[#2C3E50] flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#2ECC71]" /> {t("admin.assistant.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.assistant.subtitle")}</p>
      </header>
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-[#2ECC71] mb-3" />
          <p className="font-bold text-[#2C3E50]">{t("admin.assistant.title")}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("admin.assistant.coming_soon")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAssistantPage;
