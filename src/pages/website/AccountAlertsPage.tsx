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
import { BellRing, TrendingDown, Crown, ArrowRight, Trash2, Loader2, Calendar, MapPin } from "lucide-react";

interface SavedRow { id: string; match_id: string; alerts_enabled: boolean; created_at: string }
interface MatchRow { id: string; home_team: string; away_team: string; date: string; stadium: string | null; city: string | null; competition: string | null }

const AccountAlertsPage = () => {
  const { user, isPremium } = useUser();
  const { openPaywall } = usePremiumGate();
  const { t } = useLanguage();
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("saved_matches").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const savedRows = (data as SavedRow[]) || [];
      setRows(savedRows);
      const ids = savedRows.map((r) => r.match_id);
      if (ids.length > 0) {
        const { data: m } = await supabase
          .from("matches")
          .select("id,home_team,away_team,date,stadium,city,competition")
          .in("id", ids);
        if (!cancelled) {
          const map: Record<string, MatchRow> = {};
          ((m as MatchRow[]) || []).forEach((row) => { map[row.id] = row; });
          setMatches(map);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const toggleAlert = async (row: SavedRow) => {
    if (!isPremium) { openPaywall({ intent: "alerts" }); return; }
    const next = !row.alerts_enabled;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, alerts_enabled: next } : r)));
    const { error } = await supabase.from("saved_matches").update({ alerts_enabled: next }).eq("id", row.id);
    if (error) toast.error(t("alerts.update_error") || "Could not update alert.");
  };

  const remove = async (row: SavedRow) => {
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    await supabase.from("saved_matches").delete().eq("id", row.id);
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
            {rows.map((r) => {
              const m = matches[r.match_id];
              return (
                <Card key={r.id} className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-[#2ECC71] shrink-0" />
                    <div className="flex-1 min-w-0">
                      {m ? (
                        <>
                          <Link to={`/matches/${r.match_id}`} className="font-bold text-[#2C3E50] hover:text-[#2ECC71] truncate block">
                            {m.home_team} <span className="text-muted-foreground">vs</span> {m.away_team}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString()}</span>
                            {m.stadium && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{m.stadium}{m.city ? `, ${m.city}` : ""}</span>}
                            {m.competition && <span>{m.competition}</span>}
                          </div>
                        </>
                      ) : (
                        <p className="font-bold text-[#2C3E50] truncate">{t("favorites.unavailable") || "Match no longer available"}</p>
                      )}
                    </div>
                    <Button variant={r.alerts_enabled ? "default" : "outline"} size="sm" onClick={() => toggleAlert(r)} className={r.alerts_enabled ? "bg-[#2ECC71] hover:bg-[#27ae60]" : ""}>
                      <BellRing className="w-3.5 h-3.5 mr-1" />{r.alerts_enabled ? (t("alerts.on") || "On") : (t("alerts.off") || "Off")}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r)} className="text-muted-foreground shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        )}
      </section>
    </WebsiteLayout>
  );
};

export default AccountAlertsPage;
