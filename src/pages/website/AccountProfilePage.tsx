import { Link, useNavigate } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { StadiumPassportCard } from "@/components/StadiumPassportCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Bell, Sparkles, Settings as SettingsIcon, Crown, ArrowRight, Trophy } from "lucide-react";

const AccountProfilePage = () => {
  const { user } = useAuth();
  const { isPremium, points, followedMatches, unreadCount } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const email = user?.email || "";
  const initial = (email[0] || "U").toUpperCase();

  return (
    <WebsiteLayout>
      <section className="relative bg-gradient-to-br from-[#1B2A3A] via-[#2C3E50] to-[#1B2A3A] text-white">
        <div className="max-w-6xl mx-auto px-5 py-12 sm:py-16">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2ECC71] flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-[#2ECC71]/30">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{t("page.profile.title")}</h1>
              <p className="text-white/70 text-sm">{email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card><CardContent className="p-5"><Trophy className="w-5 h-5 text-[#2ECC71] mb-2" /><p className="text-2xl font-extrabold">{points}</p><p className="text-xs text-muted-foreground">{t("profile.points")}</p></CardContent></Card>
          <Card><CardContent className="p-5"><Heart className="w-5 h-5 text-rose-500 mb-2" /><p className="text-2xl font-extrabold">{followedMatches.length}</p><p className="text-xs text-muted-foreground">{t("profile.following")}</p></CardContent></Card>
          <Card><CardContent className="p-5"><Bell className="w-5 h-5 text-[#2C3E50] mb-2" /><p className="text-2xl font-extrabold">{unreadCount}</p><p className="text-xs text-muted-foreground">{t("profile.unread") || "Unread"}</p></CardContent></Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <QuickLink to="/favorites" icon={Heart} label={t("account.menu.favorites")} />
          <QuickLink to="/alerts" icon={Bell} label={t("account.menu.alerts")} />
          <QuickLink to="/passport" icon={Trophy} label={t("account.menu.passport")} />
          <QuickLink to="/onboarding" icon={Sparkles} label={t("account.menu.personalize")} />
          <QuickLink to="/settings" icon={SettingsIcon} label={t("account.menu.settings")} />
          {!isPremium && (
            <button onClick={() => navigate("/pricing")} className="text-left rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 hover:shadow-md transition">
              <Crown className="w-5 h-5 text-amber-500 mb-2" />
              <p className="font-bold text-[#2C3E50]">{t("home.premium_cta")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("home.premium_desc")}</p>
            </button>
          )}
        </div>

        <div className="mt-10">
          <StadiumPassportCard />
        </div>
      </section>
    </WebsiteLayout>
  );
};

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link to={to} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2ECC71] hover:shadow-md transition group">
    <span className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center text-[#2ECC71] group-hover:bg-[#2ECC71] group-hover:text-white transition"><Icon className="w-5 h-5" /></span>
      <span className="font-bold text-[#2C3E50]">{label}</span>
    </span>
    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2ECC71] transition" />
  </Link>
);

export default AccountProfilePage;
