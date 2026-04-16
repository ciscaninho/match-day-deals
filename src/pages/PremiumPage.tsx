import { useUser } from "@/contexts/UserContext";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const features = [
  "No ads — ever",
  "Unlimited followed matches",
  "Priority matches section",
  "Better notification experience",
  "Early access to new features",
];

const PremiumPage = () => {
  const { isPremium, togglePremium } = useUser();
  const navigate = useNavigate();

  const handleSubscribe = (plan: string) => {
    togglePremium();
    toast.success(`${plan} plan activated! (simulated)`);
  };

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-5 pt-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">You're Premium!</h1>
            <p className="text-sm text-muted-foreground mt-2">Enjoy all premium features.</p>
            <Button variant="outline" className="mt-6" onClick={() => { togglePremium(); toast("Premium deactivated (simulated)"); }}>
              Cancel Subscription (Mock)
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center mb-6">
          <Crown className="w-10 h-10 text-accent-foreground mx-auto mb-2" />
          <h1 className="text-xl font-bold text-foreground">Go Premium</h1>
          <p className="text-sm text-muted-foreground mt-1">Unlock the full experience</p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4 space-y-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border-primary/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Monthly</p>
                <p className="text-xs text-muted-foreground">Billed monthly</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">€4.99</p>
                <Button size="sm" className="mt-1 text-xs" onClick={() => handleSubscribe("Monthly")}>
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground rounded-bl-lg">
              BEST VALUE
            </div>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Yearly</p>
                <p className="text-xs text-muted-foreground">Save 35%</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">€39</p>
                <p className="text-[10px] text-muted-foreground">€3.25/mo</p>
                <Button size="sm" className="mt-1 text-xs" onClick={() => handleSubscribe("Yearly")}>
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PremiumPage;
