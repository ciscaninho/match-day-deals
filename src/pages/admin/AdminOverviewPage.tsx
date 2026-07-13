import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle, CheckCircle2, ArrowRight, Users, MapPin, CalendarDays, Trophy,
  Ticket, ShieldAlert, Activity, Sparkles, TrendingUp, HelpCircle,
} from "lucide-react";

type Severity = "critical" | "warning" | "healthy" | "unknown";

const sevPillCls: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  healthy: "bg-emerald-100 text-emerald-800 border-emerald-200",
  unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

const priorityCls: Record<"P1"|"P2"|"P3"|"P4", string> = {
  P1: "bg-red-600 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-amber-500 text-white",
  P4: "bg-slate-400 text-white",
};

// Diagnostic result: value | "unknown". Failures never silently become 0.
type Diag = { value: number | null; ok: boolean; error?: string };

const runDiag = async (name: string, fn: () => Promise<{ count: number | null; error: any }>): Promise<Diag> => {
  try {
    const { count, error } = await fn();
    if (error) {
      console.warn(`[admin-diag] ${name} failed`, error);
      return { value: null, ok: false, error: error.message };
    }
    return { value: count ?? 0, ok: true };
  } catch (e: any) {
    console.warn(`[admin-diag] ${name} threw`, e);
    return { value: null, ok: false, error: String(e?.message ?? e) };
  }
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

  const { data: diag, isLoading: diagLoading } = useQuery({
    queryKey: ["admin-diag-v2"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();

      const [
        upcomingNoProvider,
        recentFailedSyncs,
        clubsMissingStadium,
        clubsMissingLeague,
        clubsMissingCountry,
        ticketingMissingLeague,
        matchReview,
        pendingDuplicates,
        staleUpcomingCoverage,
        upcomingMatches,
      ] = await Promise.all([
        runDiag("upcoming_no_provider", async () => {
          // Upcoming, non-archived matches with no usable provider destination.
          const { count, error } = await supabase
            .from("matches")
            .select("id", { count: "exact", head: true })
            .gte("date", nowIso)
            .is("archived_at", null)
            .or("ticombo_url.is.null,ticombo_url.eq.")
            .or("official_link.is.null,official_link.eq.");
          return { count, error };
        }),
        runDiag("recent_failed_syncs", async () =>
          supabase
            .from("wc_ticombo_discovery_queue")
            .select("id", { count: "exact", head: true })
            .eq("status", "failed")
            .gte("discovered_at", weekAgoIso),
        ),
        runDiag("clubs_missing_stadium", async () =>
          supabase
            .from("clubs")
            .select("id", { count: "exact", head: true })
            .is("archived_at", null)
            .eq("publication_status", "published")
            .neq("club_type", "identity_only")
            .is("home_stadium_id", null),
        ),
        runDiag("clubs_missing_league", async () =>
          supabase
            .from("clubs")
            .select("id", { count: "exact", head: true })
            .is("archived_at", null)
            .eq("publication_status", "published")
            .neq("club_type", "identity_only")
            .is("primary_league_id", null),
        ),
        runDiag("clubs_missing_country", async () =>
          supabase
            .from("clubs")
            .select("id", { count: "exact", head: true })
            .is("archived_at", null)
            .eq("publication_status", "published")
            .neq("club_type", "identity_only")
            .is("country_id", null),
        ),
        runDiag("ticketing_missing_league", async () =>
          supabase
            .from("club_ticketing_profiles")
            .select("id", { count: "exact", head: true })
            .is("archived_at", null)
            .is("league", null),
        ),
        runDiag("match_review", async () =>
          supabase
            .from("matches")
            .select("id", { count: "exact", head: true })
            .gte("date", nowIso)
            .is("archived_at", null)
            .or("home_team_status.in.(tbd,projected),away_team_status.in.(tbd,projected)"),
        ),
        runDiag("pending_duplicates", async () =>
          supabase
            .from("club_merge_candidates" as never)
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
        ),
        runDiag("stale_upcoming_coverage", async () =>
          supabase
            .from("wc_ticket_coverage")
            .select("id", { count: "exact", head: true })
            .eq("status", "active")
            .is("archived_at", null)
            .gte("event_date", nowIso)
            .or(`last_sync_at.is.null,last_sync_at.lt.${weekAgoIso}`),
        ),
        runDiag("upcoming_matches", async () =>
          supabase
            .from("matches")
            .select("id", { count: "exact", head: true })
            .gte("date", nowIso)
            .is("archived_at", null),
        ),
      ]);

      return {
        upcomingNoProvider,
        recentFailedSyncs,
        clubsMissingStadium,
        clubsMissingLeague,
        clubsMissingCountry,
        ticketingMissingLeague,
        matchReview,
        pendingDuplicates,
        staleUpcomingCoverage,
        upcomingMatches,
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

  const hasActionable = (d?: Diag) => d?.ok && (d.value ?? 0) > 0;

  const issues: Issue[] = [
    hasActionable(diag?.upcomingNoProvider) && {
      priority: "P1", severity: "critical", count: diag!.upcomingNoProvider.value!,
      title: "Upcoming matches without a ticket provider",
      explain: "These matches are visible to visitors but have no usable ticket provider destination.",
      action: "Review matches", to: "/admin/matches?filter=no-tickets", icon: Ticket,
    },
    hasActionable(diag?.recentFailedSyncs) && {
      priority: "P2", severity: "warning", count: diag!.recentFailedSyncs.value!,
      title: "Recent ticket sync failures (last 7 days)",
      explain: "Recent synchronization jobs did not complete. Prices and availability may be outdated.",
      action: "Open diagnostics", to: "/admin/ticketing", icon: Activity,
    },
    hasActionable(diag?.matchReview) && {
      priority: "P3", severity: "warning", count: diag!.matchReview.value!,
      title: "Upcoming matches waiting for team confirmation",
      explain: "Upcoming fixtures with unresolved (TBD/projected) team names.",
      action: "Open review queue", to: "/admin/match-review", icon: ShieldAlert,
    },
    hasActionable(diag?.clubsMissingStadium) && {
      priority: "P3", severity: "warning", count: diag!.clubsMissingStadium.value!,
      title: "Published clubs missing a stadium",
      explain: "Public clubs without a home stadium assignment.",
      action: "Assign stadiums", to: "/admin/clubs", icon: MapPin,
    },
    hasActionable(diag?.clubsMissingLeague) && {
      priority: "P3", severity: "warning", count: diag!.clubsMissingLeague.value!,
      title: "Published clubs missing a league",
      explain: "Public clubs with no primary league assigned.",
      action: "Assign leagues", to: "/admin/clubs", icon: Trophy,
    },
    hasActionable(diag?.pendingDuplicates) && {
      priority: "P3", severity: "warning", count: diag!.pendingDuplicates.value!,
      title: "Duplicate club candidates awaiting review",
      explain: "Automated matching flagged possible duplicates awaiting a decision.",
      action: "Review duplicates", to: "/admin/clubs-master/review", icon: Users,
    },
    hasActionable(diag?.staleUpcomingCoverage) && {
      priority: "P4", severity: "warning", count: diag!.staleUpcomingCoverage.value!,
      title: "Stale coverage on upcoming matches",
      explain: "Active provider rows for upcoming events not refreshed in over a week.",
      action: "Refresh coverage", to: "/admin/ticketing", icon: TrendingUp,
    },
  ].filter(Boolean) as Issue[];

  const sortedIssues = [...issues].sort((x, y) => x.priority.localeCompare(y.priority));

  // ---- System health rules ---------------------------------------------
  type HealthCard = { label: string; status: Severity; note: string; to: string };

  const anyFailed = (...ds: (Diag | undefined)[]) => ds.some((d) => d && !d.ok);
  const sumIf = (...ds: (Diag | undefined)[]) => ds.reduce((s, d) => s + (d?.ok ? (d.value ?? 0) : 0), 0);

  const footballHealth = (): HealthCard => {
    const ds = [
      diag?.clubsMissingCountry, diag?.clubsMissingLeague, diag?.clubsMissingStadium,
      diag?.matchReview, diag?.pendingDuplicates,
    ];
    if (anyFailed(...ds)) return { label: "Football data", status: "unknown", note: "Diagnostic unavailable", to: "/admin/football-audit" };
    const parts: string[] = [];
    if ((diag?.clubsMissingStadium.value ?? 0) > 0) parts.push(`${diag!.clubsMissingStadium.value} clubs without stadium`);
    if ((diag?.clubsMissingLeague.value ?? 0) > 0) parts.push(`${diag!.clubsMissingLeague.value} clubs without league`);
    if ((diag?.clubsMissingCountry.value ?? 0) > 0) parts.push(`${diag!.clubsMissingCountry.value} clubs without country`);
    if ((diag?.matchReview.value ?? 0) > 0) parts.push(`${diag!.matchReview.value} matches awaiting review`);
    if ((diag?.pendingDuplicates.value ?? 0) > 0) parts.push(`${diag!.pendingDuplicates.value} duplicate candidates`);
    const status: Severity = parts.length === 0 ? "healthy" : (diag?.pendingDuplicates.value ?? 0) > 10 ? "critical" : "warning";
    return {
      label: "Football data",
      status,
      note: parts.length === 0 ? "No current football data issues" : parts.join(" · "),
      to: "/admin/football-audit",
    };
  };

  const ticketingHealth = (): HealthCard => {
    const ds = [diag?.recentFailedSyncs, diag?.upcomingNoProvider, diag?.staleUpcomingCoverage];
    if (anyFailed(...ds)) return { label: "Ticketing pipeline", status: "unknown", note: "Diagnostic unavailable", to: "/admin/ticketing" };
    const parts: string[] = [];
    if ((diag?.recentFailedSyncs.value ?? 0) > 0) parts.push(`${diag!.recentFailedSyncs.value} recent sync failures`);
    if ((diag?.upcomingNoProvider.value ?? 0) > 0) parts.push(`${diag!.upcomingNoProvider.value} upcoming matches without provider`);
    if ((diag?.staleUpcomingCoverage.value ?? 0) > 0) parts.push(`${diag!.staleUpcomingCoverage.value} stale active coverage rows`);
    const status: Severity =
      parts.length === 0 ? "healthy" : (diag?.upcomingNoProvider.value ?? 0) > 0 ? "critical" : "warning";
    return {
      label: "Ticketing pipeline",
      status,
      note: parts.length === 0 ? "No recent sync failures" : parts.join(" · "),
      to: "/admin/ticketing",
    };
  };

  const publicPagesHealth = (): HealthCard => {
    const ds = [diag?.upcomingNoProvider, diag?.upcomingMatches];
    if (anyFailed(...ds)) return { label: "Public pages", status: "unknown", note: "Diagnostic unavailable", to: "/admin/matches" };
    const missing = diag?.upcomingNoProvider.value ?? 0;
    const upcoming = diag?.upcomingMatches.value ?? 0;
    if (upcoming === 0) return { label: "Public pages", status: "healthy", note: "No current coverage gaps", to: "/admin/matches" };
    if (missing === 0) return { label: "Public pages", status: "healthy", note: `${upcoming} upcoming matches — all have provider coverage`, to: "/admin/matches" };
    return {
      label: "Public pages",
      status: missing > 5 ? "critical" : "warning",
      note: `${missing} of ${upcoming} upcoming matches missing provider coverage`,
      to: "/admin/matches",
    };
  };

  const dataIntegrityHealth = (): HealthCard => {
    const ds = [diag?.pendingDuplicates, diag?.clubsMissingCountry, diag?.clubsMissingLeague, diag?.clubsMissingStadium];
    if (anyFailed(...ds)) return { label: "Data integrity", status: "unknown", note: "Diagnostic unavailable", to: "/admin/data-quality" };
    const dups = diag?.pendingDuplicates.value ?? 0;
    const clubGaps = sumIf(diag?.clubsMissingCountry, diag?.clubsMissingLeague, diag?.clubsMissingStadium);
    if (dups === 0 && clubGaps === 0) return { label: "Data integrity", status: "healthy", note: "No integrity issues detected", to: "/admin/data-quality" };
    const parts: string[] = [];
    if (dups > 0) parts.push(`${dups} duplicate candidates`);
    if (clubGaps > 0) parts.push(`${clubGaps} club relationship gaps`);
    return {
      label: "Data integrity",
      status: dups > 10 ? "critical" : "warning",
      note: parts.join(" · "),
      to: "/admin/data-quality",
    };
  };

  const health: HealthCard[] = diag
    ? [footballHealth(), ticketingHealth(), publicPagesHealth(), dataIntegrityHealth()]
    : [];

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

        {diagLoading && (
          <div className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-6">Loading operational issues…</div>
        )}

        {!diagLoading && sortedIssues.length === 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-900 font-semibold">No urgent issues right now.</p>
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
                  {h.status === "healthy" ? <CheckCircle2 className="w-3 h-3" />
                    : h.status === "unknown" ? <HelpCircle className="w-3 h-3" />
                    : <AlertTriangle className="w-3 h-3" />}
                  {h.status}
                </div>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 min-h-[2.4em]">{h.note}</p>
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
