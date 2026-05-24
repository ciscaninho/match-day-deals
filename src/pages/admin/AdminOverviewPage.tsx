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

  const { data: wc } = useQuery({
    queryKey: ["admin-wc-counters"],
    queryFn: async () => {
      const wcFilter = "competition.ilike.%world cup%,competition.ilike.%fifa%,competition.ilike.%coupe du monde%,competition.ilike.%mundial%";
      const [imported, confirmed, publicMatches, ticketReady, hosts] = await Promise.all([
        supabase.from("matches").select("id", { count: "exact", head: true }).or(wcFilter).is("archived_at", null),
        supabase.from("matches").select("id", { count: "exact", head: true }).or(wcFilter).is("archived_at", null)
          .not("home_team_status", "in", "(tbd,projected)")
          .not("away_team_status", "in", "(tbd,projected)"),
        supabase.from("matches").select("id", { count: "exact", head: true }).or(wcFilter).is("archived_at", null)
          .eq("fixture_confidence", "confirmed")
          .not("home_team_status", "in", "(tbd,projected)")
          .not("away_team_status", "in", "(tbd,projected)"),
        supabase.from("matches").select("id", { count: "exact", head: true }).or(wcFilter).is("archived_at", null)
          .in("ticket_status", ["on_sale", "presale"]),
        supabase.from("stadiums").select("id", { count: "exact", head: true })
          .is("archived_at", null).eq("is_world_cup_host", true),
      ]);
      return {
        imported: imported.count || 0,
        confirmed: confirmed.count || 0,
        publicMatches: publicMatches.count || 0,
        ticketReady: ticketReady.count || 0,
        hosts: hosts.count || 0,
      };
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
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">FIFA World Cup 2026</h2>
              <p className="text-xs text-white/70 mt-0.5">Projected fixtures stay admin-only until teams are confirmed.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Imported", value: wc?.imported },
              { label: "Teams confirmed", value: wc?.confirmed },
              { label: "Public matches", value: wc?.publicMatches },
              { label: "Ticket ready", value: wc?.ticketReady },
              { label: "Host stadiums", value: wc?.hosts },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-2xl font-extrabold leading-none">{c.value ?? "—"}</p>
                <p className="text-[10px] font-semibold text-white/65 mt-1.5 uppercase tracking-wider">{c.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
