import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BellRing, TrendingDown, Crown, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { usePremiumGate } from "@/components/premium/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedRow {
  id: string;
  match_id: string;
  alerts_enabled: boolean;
  created_at: string;
}

const AlertsPage = () => {
  const { user, isPremium } = useUser();
  const { openPaywall } = usePremiumGate();
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("saved_matches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as SavedRow[]) || []);
        setLoading(false);
      });
  }, [user]);

  const toggleAlert = async (row: SavedRow) => {
    if (!isPremium) {
      openPaywall({ intent: "alerts" });
      return;
    }
    const next = !row.alerts_enabled;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, alerts_enabled: next } : r)));
    const { error } = await supabase
      .from("saved_matches")
      .update({ alerts_enabled: next })
      .eq("id", row.id);
    if (error) toast.error("Could not update alert.");
  };

  const remove = async (row: SavedRow) => {
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    await supabase.from("saved_matches").delete().eq("id", row.id);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12">
        <h1 className="text-2xl font-extrabold text-foreground">Price alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Never miss a price drop on the matches you care about.
        </p>

        {!isPremium && (
          <Card className="mt-5 border-[#2ECC71]/30 bg-gradient-to-br from-[#2ECC71]/5 to-transparent">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Unlock real-time alerts</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified the moment prices drop. €1.99/month.
                </p>
                <Button
                  onClick={() => openPaywall({ intent: "alerts" })}
                  className="mt-3 bg-[#2ECC71] hover:bg-[#27ae60] text-white"
                  size="sm"
                >
                  <BellRing className="w-4 h-4 mr-1.5" /> Enable alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Loading your alerts…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-2xl">
              <BellRing className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="mt-3 text-sm font-semibold text-foreground">No saved matches yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save a match to start tracking its price.
              </p>
              <Link
                to="/matches"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#2ECC71]"
              >
                Browse matches <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rows.map((r) => (
                <Card key={r.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-[#2ECC71]" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/app/matches/${r.match_id}`}
                        className="font-bold text-sm text-foreground hover:text-[#2ECC71] truncate block"
                      >
                        Match #{r.match_id}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        Saved {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant={r.alerts_enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlert(r)}
                      className={r.alerts_enabled ? "bg-[#2ECC71] hover:bg-[#27ae60]" : ""}
                    >
                      <BellRing className="w-3.5 h-3.5 mr-1" />
                      {r.alerts_enabled ? "On" : "Off"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(r)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AlertsPage;
