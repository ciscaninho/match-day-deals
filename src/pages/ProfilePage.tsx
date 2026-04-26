import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Star, Heart, Bell, ArrowRight, Globe } from "lucide-react";
import type { Locale } from "@/i18n/translations";

const ProfilePage = () => {
  const { isPremium, points, followedMatches, unreadCount } = useUser();
  const { t, locale, setLocale } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12">
        <h1 className="text-xl font-bold text-foreground mb-6">{t("profile.title")}</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{points}</p>
              <p className="text-[10px] text-muted-foreground">{t("profile.points")}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <Heart className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{followedMatches.length}</p>
              <p className="text-[10px] text-muted-foreground">{t("profile.following")}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <Bell className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{unreadCount}</p>
              <p className="text-[10px] text-muted-foreground">{t("profile.unread")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Status */}
        <Card className={`border-border/50 ${isPremium ? "border-accent/40 bg-accent/5" : ""}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${isPremium ? "text-accent" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isPremium ? t("profile.premium_member") : t("profile.free_plan")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? t("profile.all_unlocked") : t("profile.upgrade_access")}
                </p>
              </div>
            </div>
            <Button size="sm" variant={isPremium ? "outline" : "default"} className="text-xs" onClick={() => navigate("/app/premium")}>
              {isPremium ? t("profile.manage") : t("profile.upgrade")} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="mt-4 border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t("language")}</span>
            </div>
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger className="w-24 h-8 text-xs bg-secondary border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="nl">Nederlands</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="mt-4 space-y-2">
          {[
            { label: t("notifications.title"), path: "/notifications", icon: Bell },
            { label: t("polls.title"), path: "/polls", icon: Star },
          ].map((item) => (
            <Card key={item.path} className="cursor-pointer border-border/50" onClick={() => navigate(item.path)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
