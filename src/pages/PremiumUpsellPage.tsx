import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Zap, TrendingDown, Loader2, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getPendingTrack, clearPendingTrack } from "@/components/track/TrackPriceSheet";
import { useSEO } from "@/lib/seo";
import { toast } from "sonner";

const PremiumUpsellPage = () => {
  useSEO({ title: "Enable price alerts — Foot Ticket Finder", description: "Activate real-time price alerts for €1.99/month." });
  const navigate = useNavigate();
  const { user, authLoading, isPremium } = useUser();
  const { openCheckout, loading } = usePaddleCheckout();
  const [pending, setPending] = useState<{ matchId: string; matchLabel?: string } | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Save the pending match (best-effort) on first mount.
  useEffect(() => {
    const p = getPendingTrack();
    setPending(p ? { matchId: p.matchId, matchLabel: p.matchLabel } : null);
    if (!user || !p || savedOnce) return;
    setSavedOnce(true);
    (async () => {
      const { error } = await supabase
        .from("saved_matches")
        .insert({ user_id: user.id, match_id: p.matchId, alerts_enabled: true });
      if (error && !error.message.includes("duplicate")) {
        console.warn("save match failed", error.message);
      }
    })();
  }, [user, savedOnce]);

  // Already premium → skip straight to alerts page
  useEffect(() => {
    if (isPremium) {
      clearPendingTrack();
      navigate("/app/alerts", { replace: true });
    }
  }, [isPremium, navigate]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      await openCheckout({
        priceId: "premium_monthly_199",
        userId: user.id,
        customerEmail: user.email || undefined,
        successUrl: `${window.location.origin}/app/alerts?checkout=success`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not open checkout. Please try again.");
    }
  };

  const handleSkip = () => {
    clearPendingTrack();
    navigate("/app/home", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-md mx-auto px-5 py-10">
        <button
          onClick={handleSkip}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Maybe later
        </button>

        {/* Confirmation card */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#F0FFF6] via-white to-white border border-[#2ECC71]/25 p-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center">
            <Check className="w-6 h-6 text-[#27ae60]" strokeWidth={3} />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-[#2C3E50] leading-tight">
            🔔 You're now tracking this match
          </h1>
          <p className="mt-1.5 text-sm text-[#2C3E50]/65">
            Get notified instantly when prices drop.
          </p>
        </div>

        {/* Urgency */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-[11px] font-bold text-orange-700 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Prices change every hour
        </div>

        <h2 className="mt-3 text-3xl font-extrabold text-[#2C3E50] tracking-tight leading-tight">
          Enable price alerts
        </h2>
        <p className="mt-2 text-[#2C3E50]/70">
          Save money by buying at the right time. Real-time alerts the moment prices drop.
        </p>

        {/* Benefits */}
        <ul className="mt-5 space-y-2.5">
          {[
            "Real-time price drop alerts",
            "Unlimited saved matches",
            "Track price history & trends",
            "Cancel anytime — no commitment",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-[#2C3E50]">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[#2ECC71]/15 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-[#27ae60]" strokeWidth={3} />
              </span>
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>

        {/* Price card */}
        <div className="mt-6 rounded-2xl border-2 border-[#2ECC71]/30 bg-white p-5 flex items-baseline justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-[#2ECC71] uppercase tracking-wider">Premium</p>
            <p className="text-xs text-[#2C3E50]/60 mt-0.5">Cancel anytime</p>
          </div>
          <p className="text-3xl font-extrabold text-[#2C3E50]">
            €1.99<span className="text-sm font-medium text-[#2C3E50]/55">/mo</span>
          </p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] disabled:opacity-60 text-white px-5 py-4 font-extrabold text-base transition shadow-lg shadow-[#2ECC71]/25"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          Enable price alerts
        </button>

        <button
          onClick={handleSkip}
          className="mt-3 w-full text-sm font-semibold text-[#2C3E50]/55 hover:text-[#2C3E50]"
        >
          Continue with limited alerts
        </button>

        <p className="mt-4 text-center text-[11px] text-[#2C3E50]/45">
          Secure payment via Paddle. Your match is already saved.
        </p>
      </div>
    </div>
  );
};

export default PremiumUpsellPage;
