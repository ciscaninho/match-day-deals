import {
  Bell,
  Heart,
  TrendingDown,
  Smartphone,
  Apple,
  CheckCircle2,
  Download,
  ShieldCheck,
  Sparkles,
  BellRing,
  Star,
} from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";
import { useAuthGate } from "@/components/auth/AuthGate";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const AppLandingPage = () => {
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const handleEnableAlerts = () => {
    requireAuth(
      () => navigate("/app/notifications"),
      { reason: "to enable price alerts", next: "/app/notifications" }
    );
  };

  useSEO({
    title: "Get ticket price alerts in real time | Foot Ticket Finder app",
    description:
      "Be the first to know when football ticket prices drop. Install the free Foot Ticket Finder app — price alerts, favorites, and notifications.",
    canonical: "https://footticketfinder.com/app",
  });



  const handleInstall = () => {
    toast.info(t("app.coming_soon"), {
      description: t("app.coming_soon_desc"),
    });
  };

  const installLabel = t("app.coming_soon_short");

  return (
    <WebsiteLayout>
      <div dir={dir}>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #2ECC71 1px, transparent 1px), linear-gradient(#2ECC71 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#2ECC71]/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#2ECC71]/10 blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2ECC71]/30 bg-[#2ECC71]/10 px-3 py-1 text-xs font-bold text-[#2ECC71] mb-3">
                <Sparkles className="w-3.5 h-3.5" /> {t("applanding.hero.badge")}
              </span>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/90">
                  {t("app.coming_soon")}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight">
                {t("applanding.hero.title_1")} <span className="text-[#2ECC71]">{t("applanding.hero.title_highlight")}</span>.
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl">
                {t("applanding.hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-bold transition-colors shadow-lg shadow-[#2ECC71]/30"
                >
                  <Download className="w-4 h-4" /> {installLabel}
                </button>
                <button
                  type="button"
                  onClick={handleEnableAlerts}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-bold transition-colors border border-white/15"
                >
                  <Bell className="w-4 h-4" /> {t("applanding.hero.cta_alerts")}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> {t("applanding.hero.point_free")}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ECC71]" /> {t("applanding.hero.point_nospam")}</span>
                <span className="flex items-center gap-1.5"><Apple className="w-4 h-4 text-[#2ECC71]" /> {t("applanding.hero.point_devices")}</span>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-[#2ECC71]/10 blur-3xl rounded-full" />
              <div className="relative w-[280px] h-[560px] rounded-[2.8rem] bg-black border-[12px] border-black shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
                <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
                  <div className="px-5 pt-9 pb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#2C3E50]">9:41</span>
                    <span className="text-[11px] font-bold text-[#2C3E50]">●●● 5G</span>
                  </div>
                  <div className="px-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">{t("applanding.phone.eyebrow")}</p>
                    <h3 className="text-[#2C3E50] font-extrabold text-xl leading-tight mt-0.5">{t("applanding.phone.title")}</h3>
                  </div>
                  <div className="px-5 mt-4 space-y-2.5">
                    {[
                      { team: "Liverpool – Man Utd", p: "€89", d: "▼ €12", ok: true },
                      { team: "Real Madrid – Barça", p: "€220", d: "▼ €30", ok: true },
                      { team: "PSG – Marseille", p: "€110", d: "▲ €5", ok: false },
                      { team: "Bayern – Dortmund", p: "€75", d: "▼ €8", ok: true },
                    ].map((row) => (
                      <div key={row.team} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-[#2C3E50] truncate">{row.team}</span>
                          <span className="text-[12px] font-extrabold text-[#27ae60]">{row.p}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-[#2C3E50]/50">{t("applanding.phone.providers")}</span>
                          <span className={`text-[10px] font-bold ${row.ok ? "text-emerald-600" : "text-rose-500"}`}>{row.d}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 mt-4">
                    <div className="rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/20 p-3 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#2ECC71] shrink-0" />
                      <span className="text-[11px] font-bold text-[#2C3E50]">{t("applanding.phone.alert")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">{t("applanding.features.eyebrow")}</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-[#2C3E50]">{t("applanding.features.title")}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { icon: BellRing, title: t("applanding.features.alerts.title"), desc: t("applanding.features.alerts.desc") },
                { icon: Heart, title: t("applanding.features.favorites.title"), desc: t("applanding.features.favorites.desc") },
                { icon: TrendingDown, title: t("applanding.features.history.title"), desc: t("applanding.features.history.desc") },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 p-7 hover:border-[#2ECC71]/40 hover:shadow-lg transition">
                  <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5">
                    <f.icon className="w-6 h-6 text-[#2ECC71]" />
                  </div>
                  <h3 className="font-extrabold text-lg text-[#2C3E50]">{f.title}</h3>
                  <p className="mt-2 text-sm text-[#2C3E50]/65 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="py-10 bg-slate-50 border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-5 grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: CheckCircle2, label: t("applanding.trust.free.label"), desc: t("applanding.trust.free.desc") },
              { icon: ShieldCheck, label: t("applanding.trust.nospam.label"), desc: t("applanding.trust.nospam.desc") },
              { icon: Star, label: t("applanding.trust.loved.label"), desc: t("applanding.trust.loved.desc") },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <item.icon className="w-6 h-6 text-[#2ECC71]" />
                <p className="font-extrabold text-[#2C3E50] text-sm">{item.label}</p>
                <p className="text-xs text-[#2C3E50]/55">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW TO INSTALL */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2C3E50] text-center">{t("applanding.install.title")}</h2>
            <div className="mt-8 grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-200 p-6">
                <Apple className="w-6 h-6 text-[#2C3E50]" />
                <h3 className="mt-3 font-extrabold text-[#2C3E50]">{t("applanding.install.iphone")}</h3>
                <ol className="mt-3 text-sm text-[#2C3E50]/70 space-y-1.5 list-decimal list-inside">
                  <li>{t("applanding.install.iphone.s1")}</li>
                  <li>{t("applanding.install.iphone.s2")}</li>
                  <li>{t("applanding.install.iphone.s3")}</li>
                </ol>
              </div>
              <div className="rounded-2xl border border-slate-200 p-6">
                <Smartphone className="w-6 h-6 text-[#2C3E50]" />
                <h3 className="mt-3 font-extrabold text-[#2C3E50]">{t("applanding.install.android")}</h3>
                <ol className="mt-3 text-sm text-[#2C3E50]/70 space-y-1.5 list-decimal list-inside">
                  <li>{t("applanding.install.android.s1")}</li>
                  <li>{t("applanding.install.android.s2")}</li>
                  <li>{t("applanding.install.android.s3")}</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 md:py-20 bg-[#2C3E50] text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#2ECC71]/20 blur-3xl" />
          <div className="relative max-w-3xl mx-auto px-5 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">{t("applanding.cta.title")}</h2>
            <p className="mt-3 text-white/70">{t("applanding.cta.subtitle")}</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleInstall}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-bold transition-colors shadow-lg shadow-[#2ECC71]/30"
              >
                <Download className="w-4 h-4" /> {installLabel}
              </button>
            </div>
            <p className="mt-4 text-xs text-white/50">{t("app.coming_soon_desc")}</p>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default AppLandingPage;
