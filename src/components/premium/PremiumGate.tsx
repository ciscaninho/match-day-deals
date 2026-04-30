import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing, TrendingDown, Heart, Check, Loader2, Crown, Zap } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAuthGate } from "@/components/auth/AuthGate";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { toast } from "sonner";

export type PremiumIntent = "alerts" | "track" | "save" | "generic";

interface OpenOptions {
  intent?: PremiumIntent;
}

interface PremiumGateContextValue {
  /** Run an action only if user is premium. Otherwise prompt sign-in then paywall. */
  requirePremium: (action: () => void, options?: OpenOptions) => void;
  /** Just open the paywall directly. */
  openPaywall: (options?: OpenOptions) => void;
}

const PremiumGateContext = createContext<PremiumGateContextValue | null>(null);

const COPY: Record<PremiumIntent, { title: string; description: string; icon: ReactNode }> = {
  alerts: {
    title: "Get notified when prices drop 🔔",
    description: "Never miss the best deal. We'll alert you the moment ticket prices drop or new tickets go on sale.",
    icon: <BellRing className="w-6 h-6 text-[#2ECC71]" />,
  },
  track: {
    title: "Track this match's price 📉",
    description: "Watch prices in real time and buy at the perfect moment. Tickets sell fast — don't pay more than you should.",
    icon: <TrendingDown className="w-6 h-6 text-[#2ECC71]" />,
  },
  save: {
    title: "Save your favourite matches ❤️",
    description: "Build your personal list and get instant updates whenever something changes.",
    icon: <Heart className="w-6 h-6 text-[#2ECC71]" />,
  },
  generic: {
    title: "Unlock Premium",
    description: "Get real-time price alerts, tracking and unlimited favourites.",
    icon: <Crown className="w-6 h-6 text-[#2ECC71]" />,
  },
};

export const PremiumGateProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, isPremium } = useUser();
  const { requireAuth } = useAuthGate();
  const { openCheckout, loading } = usePaddleCheckout();

  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<PremiumIntent>("generic");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const showPaywall = useCallback((options?: OpenOptions) => {
    setIntent(options?.intent ?? "generic");
    setOpen(true);
  }, []);

  const requirePremium = useCallback(
    (action: () => void, options?: OpenOptions) => {
      if (isPremium) {
        action();
        return;
      }
      // Need login first if not signed in.
      if (!user) {
        setPendingAction(() => action);
        requireAuth(
          () => {
            // After sign-in, show paywall (we re-check premium inside).
            showPaywall(options);
          },
          { reason: "to unlock premium features" }
        );
        return;
      }
      setPendingAction(() => action);
      showPaywall(options);
    },
    [isPremium, user, requireAuth, showPaywall]
  );

  const openPaywall = useCallback(
    (options?: OpenOptions) => {
      if (!user) {
        requireAuth(() => showPaywall(options), { reason: "to unlock premium" });
        return;
      }
      showPaywall(options);
    },
    [user, requireAuth, showPaywall]
  );

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    try {
      await openCheckout({
        priceId: "premium_monthly_199",
        userId: user.id,
        customerEmail: user.email || undefined,
        successUrl: `${window.location.origin}/app/home?checkout=success`,
      });
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not open checkout. Please try again.");
    }
  };

  const copy = COPY[intent];

  return (
    <PremiumGateContext.Provider value={{ requirePremium, openPaywall }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white p-6 relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#2ECC71]/20 blur-3xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/15 border border-[#2ECC71]/30 flex items-center justify-center">
                {copy.icon}
              </div>
              <DialogHeader className="mt-4 text-left">
                <DialogTitle className="text-white text-xl font-extrabold leading-tight">
                  {copy.title}
                </DialogTitle>
                <DialogDescription className="text-white/70 mt-1">
                  {copy.description}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Urgency banner */}
            <div className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-xs text-orange-800 font-medium">
                Prices change fast — fans tracking matches save up to 30%.
              </p>
            </div>

            <ul className="space-y-2.5 mb-5">
              {[
                "Real-time price alerts",
                "Track price history & trends",
                "Unlimited favourites",
                "Faster notifications",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#2C3E50]">
                  <Check className="w-4 h-4 text-[#2ECC71] mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-[#2ECC71]/30 bg-[#2ECC71]/5 p-4 flex items-baseline justify-between mb-4">
              <div>
                <p className="text-xs text-[#2C3E50]/65">Premium</p>
                <p className="text-xs text-[#2C3E50]/65">Cancel anytime</p>
              </div>
              <p className="text-2xl font-extrabold text-[#2C3E50]">
                €1.99<span className="text-sm font-medium text-[#2C3E50]/60">/month</span>
              </p>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-12 bg-[#2ECC71] hover:bg-[#27ae60] text-white font-bold text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Unlock Premium — €1.99/month
            </Button>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/pricing");
              }}
              className="mt-3 text-xs text-[#2C3E50]/60 hover:text-[#2C3E50] w-full text-center"
            >
              See full comparison
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PremiumGateContext.Provider>
  );
};

export const usePremiumGate = () => {
  const ctx = useContext(PremiumGateContext);
  if (!ctx) throw new Error("usePremiumGate must be used inside PremiumGateProvider");
  return ctx;
};
