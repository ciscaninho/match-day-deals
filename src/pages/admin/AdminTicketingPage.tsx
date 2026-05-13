import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ShieldCheck, RefreshCcw } from "lucide-react";

export const AdminTicketingPage = () => {
  const { t } = useLanguage();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-ticketing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,official_ticketing_url,resale_exchange_available,resale_exchange_url,membership_required,membership_required_for_big_games,country,last_verified_at")
        .is("archived_at", null)
        .order("club_name");
      return data || [];
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.ticketing")}</h1>
        <p className="text-xs text-muted-foreground">{data.length}</p>
      </header>
      {isLoading ? <p className="text-sm text-muted-foreground">{t("admin.loading")}</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((c) => (
            <Card key={c.slug}>
              <CardContent className="p-4 space-y-2">
                <p className="font-bold text-[#2C3E50]">{c.club_name}</p>
                <p className="text-[11px] text-muted-foreground">{c.country}</p>
                {c.official_ticketing_url && <a href={c.official_ticketing_url} target="_blank" rel="noreferrer" className="text-xs text-[#2ECC71] font-bold inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Official</a>}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.resale_exchange_available && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><RefreshCcw className="w-3 h-3 inline mr-0.5" />Resale</span>}
                  {c.membership_required && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><ShieldCheck className="w-3 h-3 inline mr-0.5" />Member</span>}
                  {c.membership_required_for_big_games && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Big games only</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTicketingPage;
