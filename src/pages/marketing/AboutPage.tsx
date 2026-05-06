import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Link } from "react-router-dom";
import { ArrowRight, Search, BellRing, Trophy, Crown, Calendar, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

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
        <section className="bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
          <div className="max-w-4xl mx-auto px-5 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t("about.hero.title")}</h1>
            <p className="mt-5 text-white/70 text-lg max-w-2xl mx-auto">{t("about.hero.subtitle")}</p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 p-6 hover:border-[#2ECC71]/40 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-[#2ECC71]" />
                </div>
                <h3 className="font-extrabold text-base">{s.title}</h3>
                <p className="mt-1.5 text-sm text-[#2C3E50]/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-3xl mx-auto px-5 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">{t("about.cta.title")}</h2>
            <Link
              to="/app"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold shadow-lg shadow-[#2ECC71]/30"
            >
              {t("about.cta.button")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default AboutPage;
