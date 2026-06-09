import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { BottomNav } from "@/components/BottomNav";
import { NewsletterCTA } from "@/components/marketing/NewsletterCTA";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Crown,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Ticket,
  Trophy,
  Sparkles,
  MapPin,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PremiumPage = () => {
  const { isPremium, user, refreshSubscription } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const [portalLoading] = useState(false);

  const benefits = [
    { icon: Ticket, label: t("premium.benefits.officialAccess") },
    { icon: Trophy, label: t("premium.benefits.dreamMatches") },
    { icon: ShieldCheck, label: t("premium.benefits.trustedBuying") },
    { icon: MapPin, label: t("premium.benefits.atmosphere") },
    { icon: BookOpen, label: t("premium.benefits.passport") },
    { icon: Sparkles, label: t("premium.benefits.adFree") },
  ];

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const handleSubscribe = async (priceId: "premium_monthly_199" | "premium_yearly") => {
    if (!user) {
      toast.error(t("premium.signin_required") || "Please sign in to subscribe");
      navigate("/auth");
      return;
    }
    try {
      await openCheckout({
        priceId,
        userId: user.id,
        customerEmail: user.email || undefined,
        successUrl: `${window.location.origin}/app/premium?checkout=success`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not open checkout. Please try again.");
    }
  };

  const handleManage = async () => {
    toast.info("Paiements bientôt disponibles");
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PaymentTestModeBanner />
        <div className="px-5 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </button>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("premium.you_premium")}</h1>
            <p className="text-sm text-muted-foreground mt-2 px-6">{t("premium.hero.subtitle")}</p>
            <Button
              variant="outline"
              className="mt-6 border-border/50"
              onClick={handleManage}
              disabled={portalLoading}
            >
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Manage subscription
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PaymentTestModeBanner />

      {/* Hero */}
      <div className="gradient-pitch pitch-pattern px-5 pt-12 pb-10 relative overflow-hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary-foreground/70 mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 px-3 py-1 mb-4">
            <Crown className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/80">
              {t("premium.title")}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-primary-foreground leading-tight px-4">
            {t("premium.hero.title")}
          </h1>
          <p className="text-sm text-primary-foreground/75 mt-3 px-4 leading-relaxed">
            {t("premium.hero.subtitle")}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-5">
        {/* Benefits */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-5 space-y-3.5">
            {benefits.map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground leading-snug pt-1.5 flex-1">{b.label}</p>
                <Check className="w-4 h-4 text-primary shrink-0 mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trust strip */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/40 rounded-xl px-4 py-3">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="leading-snug">
            {t("premium.benefits.trustedBuying")}
          </span>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          <Card className="border-primary/30 glow-pitch">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{t("premium.monthly")}</p>
                <p className="text-xs text-muted-foreground">{t("premium.billed_monthly")}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">€1.99</p>
                <Button
                  size="sm"
                  className="mt-1 text-xs"
                  disabled={checkoutLoading}
                  onClick={() => handleSubscribe("premium_monthly_199")}
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    t("premium.subscribe")
                  )}
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
                <Button
                  size="sm"
                  className="mt-1 text-xs"
                  disabled={checkoutLoading}
                  onClick={() => handleSubscribe("premium_yearly")}
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    t("premium.subscribe")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-[11px] text-muted-foreground/80 text-center px-6 pt-2">
          {t("premium.benefits.adFree")} · {t("premium.benefits.officialAccess")}
        </p>

        <div className="max-w-md mx-auto px-4 pt-6 pb-4">
          <NewsletterCTA source="premium" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PremiumPage;
