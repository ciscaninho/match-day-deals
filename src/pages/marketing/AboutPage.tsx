import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Link } from "react-router-dom";
import { ArrowRight, Search, BellRing, Trophy, Crown, Calendar, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageHero, PageSection, SectionHeading } from "@/components/layout/Page";

const AboutPage = () => {
  const { t, dir } = useLanguage();

  const steps = [
    { icon: Search, title: t("about.step1.title"), desc: t("about.step1.desc") },
    { icon: Calendar, title: t("about.step2.title"), desc: t("about.step2.desc") },
    { icon: BellRing, title: t("about.step3.title"), desc: t("about.step3.desc") },
    { icon: ShieldCheck, title: t("about.step4.title"), desc: t("about.step4.desc") },
    { icon: Trophy, title: t("about.step5.title"), desc: t("about.step5.desc") },
    { icon: Crown, title: t("about.step6.title"), desc: t("about.step6.desc") },
  ];

  return (
    <MarketingLayout>
      <div dir={dir}>
        <PageHero title={t("about.hero.title")} subtitle={t("about.hero.subtitle")} />

        <PageSection tone="white">
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#2ECC71]/40 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.15)] transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-[#2ECC71]" />
                </div>
                <h3 className="font-extrabold text-base">{s.title}</h3>
                <p className="mt-1.5 text-sm text-[#2C3E50]/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </PageSection>

        <PageSection tone="slate" size="tight" width="narrow">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C3E50]">
              {t("about.cta.title")}
            </h2>
            <Link
              to="/app"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold shadow-lg shadow-[#2ECC71]/30 transition-colors"
            >
              {t("about.cta.button")} <ArrowRight className="w-4 h-4" />
              <span className="ms-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {t("app.coming_soon_short")}
              </span>
            </Link>
            <p className="mt-3 text-xs text-[#2C3E50]/55">{t("app.coming_soon_desc")}</p>
          </div>
        </PageSection>
      </div>
    </MarketingLayout>
  );
};

export default AboutPage;
