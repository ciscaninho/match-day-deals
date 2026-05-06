import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Crown, BellRing, TrendingDown, Heart, Zap } from "lucide-react";
import { usePremiumGate } from "@/components/premium/PremiumGate";
import { useSEO } from "@/lib/seo";
import { useLanguage } from "@/i18n/LanguageContext";

const PricingPage = () => {
  const { openPaywall } = usePremiumGate();
  const { t, dir } = useLanguage();

  useSEO({
    title: "Pricing — Free forever, Premium €1.99/month | Foot Ticket Finder",
    description:
      "Compare football ticket prices for free. Upgrade to Premium for real-time price alerts, tracking and unlimited favourites — €1.99/month.",
    canonical: "https://footticketfinder.com/pricing",
  });

  const freeFeatures = [
    t("pricing.free.feat1"),
    t("pricing.free.feat2"),
    t("pricing.free.feat3"),
    t("pricing.free.feat4"),
  ];

  const premiumFeatures = [
    t("pricing.premium.feat1"),
    t("pricing.premium.feat2"),
    t("pricing.premium.feat3"),
    t("pricing.premium.feat4"),
    t("pricing.premium.feat5"),
  ];

  const values = [
    { icon: BellRing, title: t("pricing.values.alerts.title"), body: t("pricing.values.alerts.body") },
    { icon: TrendingDown, title: t("pricing.values.tracking.title"), body: t("pricing.values.tracking.body") },
    { icon: Heart, title: t("pricing.values.favs.title"), body: t("pricing.values.favs.body") },
  ];

  return (
    <MarketingLayout>
      <div dir={dir}>
        <section className="bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
          <div className="max-w-4xl mx-auto px-5 py-20 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-full px-3 py-1">
              <Zap className="w-3 h-3" /> {t("pricing.badge")}
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight">
              {t("pricing.hero.title")}
            </h1>
            <p className="mt-5 text-white/70 text-lg max-w-2xl mx-auto">
              {t("pricing.hero.subtitle")}
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-8 flex flex-col">
              <h3 className="text-xl font-extrabold">{t("pricing.free.title")}</h3>
              <p className="text-sm text-[#2C3E50]/65 mt-1">{t("pricing.free.subtitle")}</p>
              <p className="mt-6 text-4xl font-extrabold">
                €0<span className="text-base font-medium text-[#2C3E50]/60">{t("pricing.per_month")}</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#2ECC71] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/matches"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2C3E50] text-white px-5 py-3 font-semibold hover:bg-[#1f2d3a]"
              >
                {t("pricing.free.cta")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-[#2ECC71] p-8 flex flex-col relative bg-gradient-to-br from-white to-[#2ECC71]/5">
              <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[#2ECC71] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                <Crown className="w-3 h-3" /> {t("pricing.premium.badge")}
              </span>
              <h3 className="text-xl font-extrabold">{t("pricing.premium.title")}</h3>
              <p className="text-sm text-[#2C3E50]/65 mt-1">{t("pricing.premium.subtitle")}</p>
              <p className="mt-6 text-4xl font-extrabold">
                €1.99<span className="text-base font-medium text-[#2C3E50]/60">{t("pricing.per_month")}</span>
              </p>
              <p className="text-xs text-[#2C3E50]/55 mt-1">{t("pricing.premium.cancel_note")}</p>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#2ECC71] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openPaywall({ intent: "generic" })}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-3 font-semibold shadow-lg shadow-[#2ECC71]/30"
              >
                {t("pricing.premium.cta")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-5 mt-16 grid md:grid-cols-3 gap-5">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <v.icon className="w-6 h-6 text-[#2ECC71]" />
                <h4 className="mt-3 font-extrabold text-[#2C3E50]">{v.title}</h4>
                <p className="mt-1 text-sm text-[#2C3E50]/65">{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default PricingPage;
