import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePremiumGate } from "@/components/premium/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, TrendingDown, Crown, ArrowRight, Trash2, Loader2 } from "lucide-react";

interface SavedRow { id: string; match_id: string; alerts_enabled: boolean; created_at: string }

const AccountAlertsPage = () => {
  const { user, isPremium } = useUser();
  const { openPaywall } = usePremiumGate();
  const { t } = useLanguage();
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("saved_matches").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setRows((data as SavedRow[]) || []); setLoading(false); });
  }, [user]);

  const toggleAlert = async (row: SavedRow) => {
    if (!isPremium) { openPaywall({ intent: "alerts" }); return; }
    const next = !row.alerts_enabled;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, alerts_enabled: next } : r)));
    const { error } = await supabase.from("saved_matches").update({ alerts_enabled: next }).eq("id", row.id);
    if (error) toast.error("Could not update alert.");
  };

  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-br from-[#1B2A3A] to-[#2C3E50] text-white">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3"><BellRing className="w-7 h-7 text-[#2ECC71]" /> {t("page.alerts.title")}</h1>
          <p className="text-white/70 text-sm mt-2">Never miss a price drop on the matches you care about.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 py-10">
        {!isPremium && (
          <Card className="mb-6 border-[#2ECC71]/30 bg-gradient-to-br from-[#2ECC71]/5 to-transparent">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center shrink-0"><Crown className="w-5 h-5 text-[#2ECC71]" /></div>
              <div className="flex-1">
                <p className="font-bold text-[#2C3E50]">Unlock real-time alerts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get notified the moment prices drop. €1.99/month.</p>
                <Button onClick={() => openPaywall({ intent: "alerts" })} className="mt-3 bg-[#2ECC71] hover:bg-[#27ae60] text-white" size="sm">
                  <BellRing className="w-4 h-4 mr-1.5" /> Enable alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-16 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />{t("admin.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
            <BellRing className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-[#2C3E50]">No saved matches yet</p>
            <Link to="/matches" className="mt-4 inline-flex items-center gap-1 font-bold text-[#2ECC71]">
              {t("page.empty.cta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id} className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-[#2ECC71]" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/matches/${r.match_id}`} className="font-bold text-[#2C3E50] hover:text-[#2ECC71] truncate block">Match #{r.match_id}</Link>
                    <p className="text-[11px] text-muted-foreground">Saved {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant={r.alerts_enabled ? "default" : "outline"} size="sm" onClick={() => toggleAlert(r)} className={r.alerts_enabled ? "bg-[#2ECC71] hover:bg-[#27ae60]" : ""}>
                    <BellRing className="w-3.5 h-3.5 mr-1" />{r.alerts_enabled ? "On" : "Off"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </WebsiteLayout>
  );
};

export default AccountAlertsPage;
