import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Crown } from "lucide-react";

const freeFeatures = [
  "Track upcoming matches",
  "See ticket release dates",
  "Compare official platforms",
  "Daily quiz & streaks",
  "Basic notifications",
];

const premiumFeatures = [
  "Everything in Free",
  "Priority ticket alerts (early access)",
  "No ads",
  "Unlimited favorites",
  "Premium-only matches",
  "Advanced filters",
];

const PricingPage = () => (
  <MarketingLayout>
    <section className="bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
      <div className="max-w-4xl mx-auto px-5 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Simple, fair pricing</h1>
        <p className="mt-5 text-white/70 text-lg max-w-2xl mx-auto">
          Start free. Upgrade only if you want priority alerts and an ad-free experience.
        </p>
      </div>
    </section>

    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-5 grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="rounded-2xl border border-slate-200 p-8 flex flex-col">
          <h3 className="text-xl font-extrabold">Free</h3>
          <p className="text-sm text-[#2C3E50]/65 mt-1">For all football fans</p>
          <p className="mt-6 text-4xl font-extrabold">€0<span className="text-base font-medium text-[#2C3E50]/60">/month</span></p>
          <ul className="mt-6 space-y-3 text-sm flex-1">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#2ECC71] mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2C3E50] text-white px-5 py-3 font-semibold hover:bg-[#1f2d3a]"
          >
            Open the app <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Premium */}
        <div className="rounded-2xl border-2 border-[#2ECC71] p-8 flex flex-col relative bg-gradient-to-br from-white to-[#2ECC71]/5">
          <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[#2ECC71] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">
            <Crown className="w-3 h-3" /> Recommended
          </span>
          <h3 className="text-xl font-extrabold">Premium</h3>
          <p className="text-sm text-[#2C3E50]/65 mt-1">For serious fans who want every seat</p>
          <p className="mt-6 text-4xl font-extrabold">€4.99<span className="text-base font-medium text-[#2C3E50]/60">/month</span></p>
          <ul className="mt-6 space-y-3 text-sm flex-1">
            {premiumFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#2ECC71] mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/app/premium"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-3 font-semibold shadow-lg shadow-[#2ECC71]/30"
          >
            Go Premium <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  </MarketingLayout>
);

export default PricingPage;
