import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, CalendarDays, Trophy, Sparkles, ArrowRight } from "lucide-react";

export const AdminOverviewPage = () => {
  const { t } = useLanguage();

  const { data: kpis } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const [clubs, stadiums, matches] = await Promise.all([
        supabase.from("club_ticketing_profiles").select("id", { count: "exact", head: true }),
        supabase.from("stadiums").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
      ]);
      const leaguesRes = await supabase.from("stadiums").select("league").not("league", "is", null);
      const leagues = new Set((leaguesRes.data || []).map((r) => r.league)).size;
      return { clubs: clubs.count || 0, stadiums: stadiums.count || 0, matches: matches.count || 0, leagues };
    },
  });

  const cards = [
    { to: "/admin/clubs", icon: Users, label: t("admin.section.kpi.clubs"), value: kpis?.clubs },
    { to: "/admin/stadiums", icon: MapPin, label: t("admin.section.kpi.stadiums"), value: kpis?.stadiums },
    { to: "/admin/matches", icon: CalendarDays, label: t("admin.section.kpi.matches"), value: kpis?.matches },
    { to: "/admin/leagues", icon: Trophy, label: t("admin.section.kpi.leagues"), value: kpis?.leagues },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-[#2C3E50]">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group">
            <Card className="hover:border-[#2ECC71] hover:shadow-md transition">
              <CardContent className="p-4">
                <c.icon className="w-5 h-5 text-[#2ECC71] mb-2" />
                <p className="text-2xl font-extrabold text-[#2C3E50]">{c.value ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-[#2C3E50] to-[#1B2A3A] text-white border-none">
        <CardContent className="p-6 flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-[#2ECC71]" />
          <div className="flex-1">
            <h2 className="font-bold">{t("admin.assistant.title")}</h2>
            <p className="text-sm text-white/70 mt-1">{t("admin.assistant.subtitle")}</p>
          </div>
          <Link to="/admin/assistant" className="inline-flex items-center gap-1 text-sm font-bold text-[#2ECC71]">
            {t("admin.open")} <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewPage;
