import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, TrendingDown, Smartphone, ArrowRight, Apple, CheckCircle2, Download, ShieldCheck } from "lucide-react";
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
    title: "Get the Foot Ticket Finder app — Price alerts & favorites",
    description:
      "Install the Foot Ticket Finder companion app. Save favorite matches, set price alerts, and never miss a ticket drop. Free.",
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#2ECC71]/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
              <Smartphone className="w-3.5 h-3.5 text-[#2ECC71]" /> Companion app · Free
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight">
              Never miss a <span className="text-[#2ECC71]">ticket drop</span>.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl">
              Save your favorite matches, set price alerts, and get notified the moment tickets go on sale or drop in price.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleInstall}
                disabled={installed}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-60 text-white px-6 py-3.5 font-semibold transition-colors shadow-lg shadow-[#2ECC71]/30"
              >
                <Download className="w-4 h-4" /> {installed ? "Installed" : "Install the app"}
              </button>
              <Link
                to="/app/notifications"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-semibold transition-colors border border-white/15"
              >
                <Bell className="w-4 h-4" /> Enable price alerts
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Free to install</span>
              <span className="flex items-center gap-1.5"><Apple className="w-4 h-4 text-[#2ECC71]" /> iPhone & Android</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ECC71]" /> No ads</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur">
            <ul className="space-y-5">
              {[
                { icon: Heart, title: "Save favorite matches", desc: "Build your watchlist. We'll remember it across devices." },
                { icon: Bell, title: "Real-time price alerts", desc: "Push notifications when tickets release or prices drop." },
                { icon: TrendingDown, title: "Track ticket prices", desc: "See price history and detect the cheapest moment to buy." },
                { icon: ShieldCheck, title: "Premium priority", desc: "Unlock priority alerts before other users." },
              ].map((b) => (
                <li key={b.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <p className="font-extrabold">{b.title}</p>
                    <p className="text-sm text-white/65">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* HOW TO INSTALL */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2C3E50]">How to install on your phone</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 p-6">
              <Apple className="w-6 h-6 text-[#2C3E50]" />
              <h3 className="mt-3 font-extrabold">iPhone (Safari)</h3>
              <ol className="mt-3 text-sm text-[#2C3E50]/70 space-y-1.5 list-decimal list-inside">
                <li>Open this page in Safari</li>
                <li>Tap the Share icon</li>
                <li>Choose "Add to Home Screen"</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6">
              <Smartphone className="w-6 h-6 text-[#2C3E50]" />
              <h3 className="mt-3 font-extrabold">Android (Chrome)</h3>
              <ol className="mt-3 text-sm text-[#2C3E50]/70 space-y-1.5 list-decimal list-inside">
                <li>Open this page in Chrome</li>
                <li>Tap the menu (⋮)</li>
                <li>Choose "Install app" or "Add to Home Screen"</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2C3E50]">Already a user?</h2>
          <p className="mt-2 text-[#2C3E50]/65">Open the full app to manage your favorites, alerts and account.</p>
          <Link to="/app/matches" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2C3E50] hover:bg-[#1f2d3a] text-white px-6 py-3.5 font-semibold transition">
            Open the app <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default AppLandingPage;
