import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Heart,
  TrendingDown,
  Smartphone,
  ArrowRight,
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

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const AppLandingPage = () => {
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useSEO({
    title: "Get ticket price alerts in real time | Foot Ticket Finder app",
    description:
      "Be the first to know when football ticket prices drop. Install the free Foot Ticket Finder app — price alerts, favorites, and notifications.",
    canonical: "https://footticketfinder.com/app",
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvt) {
      toast.info("To install:", {
        description: "On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app.",
      });
      return;
    }
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvt(null);
  };

  return (
    <WebsiteLayout>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2ECC71]/30 bg-[#2ECC71]/10 px-3 py-1 text-xs font-bold text-[#2ECC71] mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Free companion app
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight">
              Get ticket price alerts <span className="text-[#2ECC71]">in real time</span>.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl">
              Be the first to know when prices drop. Track your favorite matches and never miss a deal again.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleInstall}
                disabled={installed}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-60 text-white px-6 py-3.5 font-bold transition-colors shadow-lg shadow-[#2ECC71]/30"
              >
                <Download className="w-4 h-4" /> {installed ? "Installed" : "Install app"}
              </button>
              <Link
                to="/app/notifications"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-bold transition-colors border border-white/15"
              >
                <Bell className="w-4 h-4" /> Enable notifications
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Free to use</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ECC71]" /> No spam</span>
              <span className="flex items-center gap-1.5"><Apple className="w-4 h-4 text-[#2ECC71]" /> iPhone & Android</span>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">Price alerts</p>
                  <h3 className="text-[#2C3E50] font-extrabold text-xl leading-tight mt-0.5">Your watchlist</h3>
                </div>
                <div className="px-5 mt-4 space-y-2.5">
                  {[
                    { t: "Liverpool – Man Utd", p: "€89", d: "▼ €12", ok: true },
                    { t: "Real Madrid – Barça", p: "€220", d: "▼ €30", ok: true },
                    { t: "PSG – Marseille", p: "€110", d: "▲ €5", ok: false },
                    { t: "Bayern – Dortmund", p: "€75", d: "▼ €8", ok: true },
                  ].map((row) => (
                    <div key={row.t} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#2C3E50] truncate">{row.t}</span>
                        <span className="text-[12px] font-extrabold text-[#27ae60]">{row.p}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[#2C3E50]/50">12 providers</span>
                        <span className={`text-[10px] font-bold ${row.ok ? "text-emerald-600" : "text-rose-500"}`}>{row.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 mt-4">
                  <div className="rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/20 p-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#2ECC71] shrink-0" />
                    <span className="text-[11px] font-bold text-[#2C3E50]">Price drop · Liverpool – Man Utd · €89</span>
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">What you get</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-[#2C3E50]">Built for ticket hunters</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: BellRing, title: "Price alerts", desc: "Get push notifications the second prices drop on a match you're tracking." },
              { icon: Heart, title: "Favorite matches", desc: "Build your watchlist and follow your team — synced across all your devices." },
              { icon: TrendingDown, title: "Price history", desc: "See how prices have moved over time and decide the best moment to buy." },
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
            { icon: CheckCircle2, label: "Free to use", desc: "No card, no fees" },
            { icon: ShieldCheck, label: "No spam", desc: "Only the alerts you choose" },
            { icon: Star, label: "Loved by fans", desc: "Across Europe" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1.5">
              <t.icon className="w-6 h-6 text-[#2ECC71]" />
              <p className="font-extrabold text-[#2C3E50] text-sm">{t.label}</p>
              <p className="text-xs text-[#2C3E50]/55">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW TO INSTALL */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2C3E50] text-center">Install in seconds</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 p-6">
              <Apple className="w-6 h-6 text-[#2C3E50]" />
              <h3 className="mt-3 font-extrabold text-[#2C3E50]">iPhone (Safari)</h3>
              <ol className="mt-3 text-sm text-[#2C3E50]/70 space-y-1.5 list-decimal list-inside">
                <li>Open this page in Safari</li>
                <li>Tap the Share icon</li>
                <li>Choose "Add to Home Screen"</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <Smartphone className="w-6 h-6 text-[#2C3E50]" />
              <h3 className="mt-3 font-extrabold text-[#2C3E50]">Android (Chrome)</h3>
              <ol className="mt-3 text-sm text-[#2C3E50]/70 space-y-1.5 list-decimal list-inside">
                <li>Open this page in Chrome</li>
                <li>Tap the menu (⋮)</li>
                <li>Choose "Install app" or "Add to Home Screen"</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-20 bg-[#2C3E50] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#2ECC71]/20 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to catch the next price drop?</h2>
          <p className="mt-3 text-white/70">Install the app now — it's free and takes 5 seconds.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleInstall}
              disabled={installed}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-60 text-white px-6 py-3.5 font-bold transition-colors shadow-lg shadow-[#2ECC71]/30"
            >
              <Download className="w-4 h-4" /> {installed ? "Installed" : "Install app"}
            </button>
            <Link to="/app/matches" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3.5 font-bold transition">
              Open the app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default AppLandingPage;
