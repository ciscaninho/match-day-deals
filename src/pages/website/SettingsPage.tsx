import { useNavigate } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Globe, LogOut } from "lucide-react";
import type { Locale } from "@/i18n/translations";

const LANGS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" }, { value: "fr", label: "Français" }, { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" }, { value: "it", label: "Italiano" }, { value: "pt", label: "Português" },
  { value: "nl", label: "Nederlands" }, { value: "ar", label: "العربية" }, { value: "ru", label: "Русский" },
];

const SettingsPage = () => {
  const { t, locale, setLocale } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-br from-[#1B2A3A] to-[#2C3E50] text-white">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3"><SettingsIcon className="w-7 h-7" /> {t("page.settings.title")}</h1>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-5 py-10 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-[#2ECC71]" /><h2 className="font-bold text-[#2C3E50]">{t("page.settings.language")}</h2></div>
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-[#2C3E50] mb-3">{t("page.settings.account")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
            <Button variant="outline" onClick={async () => { await signOut(); navigate("/", { replace: true }); }} className="gap-2">
              <LogOut className="w-4 h-4" /> {t("account.menu.signout")}
            </Button>
          </CardContent>
        </Card>
      </section>
    </WebsiteLayout>
  );
};

export default SettingsPage;
