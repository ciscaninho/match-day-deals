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
        supabase.from("club_ticketing_profiles").select("id", { count: "exact", head: true }).is("archived_at", null),
        supabase.from("stadiums").select("id", { count: "exact", head: true }).is("archived_at", null),
        supabase.from("matches").select("id", { count: "exact", head: true }),
      ]);
      const leaguesRes = await supabase.from("stadiums").select("league").is("archived_at", null).not("league", "is", null);
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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("admin.title")}</h1>
        <p className="text-sm text-slate-600 mt-1.5">{t("admin.subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group">
            <Card className="border-slate-200 hover:border-emerald-500 hover:shadow-lg transition bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <c.icon className="w-5 h-5 text-emerald-600" />
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 leading-none">{c.value ?? "—"}</p>
                <p className="text-xs font-semibold text-slate-600 mt-2 uppercase tracking-wider">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-base">{t("admin.assistant.title")}</h2>
            <p className="text-sm text-white/80 mt-1">{t("admin.assistant.subtitle")}</p>
          </div>
          <Link to="/admin/assistant" className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400 hover:text-emerald-300 shrink-0">
            {t("admin.open")} <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewPage;
