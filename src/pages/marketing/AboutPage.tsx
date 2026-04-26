import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Link } from "react-router-dom";
import { ArrowRight, Search, BellRing, Trophy, Crown, Calendar, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Track upcoming matches",
    desc: "We monitor every major fixture across the top European leagues, Champions League and international competitions.",
  },
  {
    icon: Calendar,
    title: "2. See ticket release dates",
    desc: "Know exactly when each official ticket sale opens — clubs, federations, UEFA and FIFA.",
  },
  {
    icon: BellRing,
    title: "3. Get instant alerts",
    desc: "Receive a notification the moment tickets become available. Be ahead of the queue.",
  },
  {
    icon: ShieldCheck,
    title: "4. Buy from official sources",
    desc: "We link you directly to verified, official ticket platforms — no shady resellers.",
  },
  {
    icon: Trophy,
    title: "5. Play & earn",
    desc: "Play the daily football quiz, build streaks and earn rewards inside the app.",
  },
  {
    icon: Crown,
    title: "6. Upgrade to Premium",
    desc: "Unlock priority alerts, remove ads and get early access to ticket releases.",
  },
];

const AboutPage = () => (
  <MarketingLayout>
    <section className="bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
      <div className="max-w-4xl mx-auto px-5 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">How Foot Ticket Finder works</h1>
        <p className="mt-5 text-white/70 text-lg max-w-2xl mx-auto">
          We don't sell tickets. We guide you to the right official platform at the right moment, so you can secure your seat with confidence.
        </p>
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
        <h2 className="text-3xl font-extrabold tracking-tight">Ready to never miss a release?</h2>
        <Link
          to="/app"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold shadow-lg shadow-[#2ECC71]/30"
        >
          Open the app <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  </MarketingLayout>
);

export default AboutPage;
