import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PremiumPage = () => {
  const { isPremium, togglePremium } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    t("premium.feature_1"),
    t("premium.feature_2"),
    t("premium.feature_3"),
    t("premium.feature_4"),
    t("premium.feature_5"),
  ];

  const handleSubscribe = (plan: string) => {
    togglePremium();
    toast.success(`${plan} plan activated! (simulated)`);
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-5 pt-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </button>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("premium.you_premium")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("premium.enjoy")}</p>
            <Button variant="outline" className="mt-6 border-border/50" onClick={() => { togglePremium(); toast("Premium deactivated (simulated)"); }}>
              {t("premium.cancel")}
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center mx-auto mb-3">
            <Crown className="w-7 h-7 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("premium.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("premium.subtitle")}</p>
        </div>

        <Card className="mb-4 border-border/50">
          <CardContent className="p-4 space-y-2.5">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border-primary/30 glow-pitch">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{t("premium.monthly")}</p>
                <p className="text-xs text-muted-foreground">{t("premium.billed_monthly")}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">€2.99</p>
                <Button size="sm" className="mt-1 text-xs" onClick={() => handleSubscribe("Monthly")}>
                  {t("premium.subscribe")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 gradient-gold px-2 py-0.5 text-[10px] font-bold text-accent-foreground rounded-bl-lg">
              {t("premium.best_value")}
            </div>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{t("premium.yearly")}</p>
                <p className="text-xs text-muted-foreground">{t("premium.save")}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">€29</p>
                <p className="text-[10px] text-muted-foreground">€2.42/mo</p>
                <Button size="sm" className="mt-1 text-xs" onClick={() => handleSubscribe("Yearly")}>
                  {t("premium.subscribe")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PremiumPage;
