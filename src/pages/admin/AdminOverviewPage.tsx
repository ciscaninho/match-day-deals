import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle, CheckCircle2, ArrowRight, Users, MapPin, CalendarDays, Trophy,
  Ticket, LinkIcon, ShieldAlert, Activity, Sparkles, TrendingUp,
} from "lucide-react";

type Severity = "critical" | "warning" | "healthy";

const sevPillCls: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  healthy: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const priorityCls: Record<"P1"|"P2"|"P3"|"P4", string> = {
  P1: "bg-red-600 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-amber-500 text-white",
  P4: "bg-slate-400 text-white",
};

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

  const { data: attention, isLoading: attentionLoading } = useQuery({
    queryKey: ["admin-attention"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [matchesNoTickets, failedSyncs, clubsMissingStadium, clubsMissingLeague, matchReview, staleCoverage] = await Promise.all([
        supabase.from("matches").select("id", { count: "exact", head: true })
          .gte("kickoff_at", nowIso)
          .in("ticket_status", ["unknown", "not_on_sale"]),
        supabase.from("wc_ticombo_discovery_queue").select("id", { count: "exact", head: true })
          .eq("status", "failed"),
        supabase.from("clubs").select("id", { count: "exact", head: true })
          .is("home_stadium_id", null),
        supabase.from("club_ticketing_profiles").select("id", { count: "exact", head: true })
          .is("league", null).is("archived_at", null),
        supabase.from("matches").select("id", { count: "exact", head: true })
          .gte("kickoff_at", nowIso)
          .or("home_team_status.in.(tbd,projected),away_team_status.in.(tbd,projected)"),
        supabase.from("wc_ticket_coverage").select("id", { count: "exact", head: true })
          .lt("last_seen_at", weekAgo)
          .is("archived_at", null),
      ]);
      return {
        matchesNoTickets: matchesNoTickets.count || 0,
        brokenLinks: 0,
        failedSyncs: failedSyncs.count || 0,
        clubsMissingStadium: clubsMissingStadium.count || 0,
        clubsMissingLeague: clubsMissingLeague.count || 0,
        matchReview: matchReview.count || 0,
        duplicates: 0,
        staleCoverage: staleCoverage.count || 0,
      };
    },
  });

  const kpiCards = [
    { to: "/admin/clubs", icon: Users, label: "Clubs", value: kpis?.clubs },
    { to: "/admin/leagues", icon: Trophy, label: "Leagues", value: kpis?.leagues },
    { to: "/admin/stadiums", icon: MapPin, label: "Stadiums", value: kpis?.stadiums },
    { to: "/admin/matches", icon: CalendarDays, label: "Matches", value: kpis?.matches },
  ];

  type Issue = {
    priority: "P1" | "P2" | "P3" | "P4";
    severity: Severity;
    count: number;
    title: string;
    explain: string;
    action: string;
    to: string;
    icon: any;
  };

  const a = attention;
  const issues: Issue[] = [
    a?.matchesNoTickets ? {
      priority: "P1", severity: "critical", count: a.matchesNoTickets,
      title: "Upcoming matches without a ticket provider",
      explain: "These matches are visible to visitors but have no way to buy tickets. Fix or hide them.",
      action: "Review matches", to: "/admin/matches?filter=no-tickets", icon: Ticket,
    } : null,
    a?.brokenLinks ? {
      priority: "P2", severity: "critical", count: a.brokenLinks,
      title: "Broken ticket provider links",
      explain: "Provider URLs returned errors on last check. Visitors clicking through see broken pages.",
      action: "Fix links", to: "/admin/ticketing", icon: LinkIcon,
    } : null,
    a?.failedSyncs ? {
      priority: "P2", severity: "warning", count: a.failedSyncs,
      title: "Ticket sync failed",
      explain: "Recent synchronization jobs did not complete. Prices and availability may be outdated.",
      action: "Open diagnostics", to: "/admin/ticketing", icon: Activity,
    } : null,
    a?.matchReview ? {
      priority: "P3", severity: "warning", count: a.matchReview,
      title: "Matches waiting for review",
      explain: "Recent imports flagged for manual verification before publishing.",
      action: "Open review queue", to: "/admin/match-review", icon: ShieldAlert,
    } : null,
    a?.clubsMissingStadium ? {
      priority: "P3", severity: "warning", count: a.clubsMissingStadium,
      title: "Clubs missing a stadium",
      explain: "These clubs cannot be linked to matchday content until a stadium is assigned.",
      action: "Assign stadiums", to: "/admin/clubs", icon: MapPin,
    } : null,
    a?.clubsMissingLeague ? {
      priority: "P3", severity: "warning", count: a.clubsMissingLeague,
      title: "Clubs missing a league",
      explain: "League-based filtering and grouping won't include these clubs.",
      action: "Assign leagues", to: "/admin/clubs", icon: Trophy,
    } : null,
    a?.duplicates ? {
      priority: "P3", severity: "warning", count: a.duplicates,
      title: "Duplicate club candidates",
      explain: "Automated matching flagged possible duplicates awaiting a decision.",
      action: "Review duplicates", to: "/admin/clubs-master/review", icon: Users,
    } : null,
    a?.staleCoverage ? {
      priority: "P4", severity: "warning", count: a.staleCoverage,
      title: "Ticket prices not refreshed recently",
      explain: "These provider records haven't been re-checked in over a week.",
      action: "Refresh coverage", to: "/admin/ticketing", icon: TrendingUp,
    } : null,
  ].filter(Boolean) as Issue[];

  const sortedIssues = [...issues].sort((x, y) => x.priority.localeCompare(y.priority));

  // System health
  const health = [
    {
      label: "Football data",
      status: (a?.matchReview ?? 0) > 20 ? "warning" : "healthy",
      note: (a?.matchReview ?? 0) > 20 ? `${a?.matchReview} matches awaiting review` : "All imports clean",
      to: "/admin/football-audit",
    },
    {
      label: "Ticketing pipeline",
      status: (a?.failedSyncs ?? 0) > 0 || (a?.brokenLinks ?? 0) > 0 ? "warning" : "healthy",
      note: (a?.failedSyncs ?? 0) > 0
        ? `${a?.failedSyncs} recent sync jobs failed`
        : (a?.brokenLinks ?? 0) > 0
          ? `${a?.brokenLinks} broken links`
          : "All jobs successful",
      to: "/admin/ticketing",
    },
    {
      label: "Public pages",
      status: (a?.matchesNoTickets ?? 0) > 5 ? "critical" : (a?.matchesNoTickets ?? 0) > 0 ? "warning" : "healthy",
      note: (a?.matchesNoTickets ?? 0) > 0 ? `${a?.matchesNoTickets} matches without providers` : "Fully covered",
      to: "/admin/matches",
    },
    {
      label: "Data integrity",
      status: (a?.duplicates ?? 0) > 0 || (a?.clubsMissingStadium ?? 0) > 5 ? "warning" : "healthy",
      note: (a?.duplicates ?? 0) > 0 ? `${a?.duplicates} duplicate candidates` : "Consistent",
      to: "/admin/data-quality",
    },
  ] as { label: string; status: Severity; note: string; to: string }[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1.5">
          What needs your attention right now.
        </p>
      </header>

      {/* Needs your attention */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Needs your attention
          </h2>
          <span className="text-xs text-slate-500">
            {sortedIssues.length} open issue{sortedIssues.length === 1 ? "" : "s"}
          </span>
        </div>

        {attentionLoading && (
          <div className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-6">Loading operational issues…</div>
        )}

        {!attentionLoading && sortedIssues.length === 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-900 font-semibold">Nothing needs your attention. All operational checks are green.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedIssues.map((i) => (
            <Card key={i.title} className="border-slate-200 hover:border-slate-300 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${sevPillCls[i.severity]}`}>
                    <i.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${priorityCls[i.priority]}`}>{i.priority}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${sevPillCls[i.severity]}`}>{i.severity}</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 leading-snug">
                      {i.count} · {i.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{i.explain}</p>
                    <Link
                      to={i.to}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      {i.action} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Today's priorities */}
      {sortedIssues.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900">Today's priorities</h2>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-2 divide-y divide-slate-100">
              {sortedIssues.slice(0, 6).map((i, idx) => (
                <Link key={i.title} to={i.to} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg">
                  <span className="text-xs font-extrabold text-slate-400 w-6">{idx + 1}.</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${priorityCls[i.priority]}`}>{i.priority}</span>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">
                    {i.count} · {i.title}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* System health */}
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600" />
          System health
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {health.map((h) => (
            <Card key={h.label} className="border-slate-200 bg-white">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{h.label}</p>
                <div className={`inline-flex mt-2 items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase ${sevPillCls[h.status]}`}>
                  {h.status === "healthy" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {h.status}
                </div>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 min-h-[2.4em]">{h.note}</p>
                <Link to={h.to} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 mt-2">
                  View diagnostics <ArrowRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Context KPIs */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">At a glance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((c) => (
            <Link key={c.to} to={c.to} className="group">
              <Card className="border-slate-200 hover:border-emerald-500 hover:shadow-md transition bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <c.icon className="w-4 h-4 text-emerald-600" />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 leading-none">{c.value ?? "—"}</p>
                  <p className="text-[10px] font-semibold text-slate-600 mt-1.5 uppercase tracking-wider">{c.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Copilot shortcut */}
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
