import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Link2, Megaphone, Sparkles, TrendingUp } from "lucide-react";

const ranges = [
  { id: "today", label: "Today", days: 0 },
  { id: "yesterday", label: "Yesterday", days: -1 },
  { id: "7d", label: "Last 7d", days: 7 },
  { id: "30d", label: "Last 30d", days: 30 },
] as const;
export type RangeId = (typeof ranges)[number]["id"];

export const rangeBounds = (id: RangeId): { from: Date; to: Date } => {
  const now = new Date();
  if (id === "today") {
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  if (id === "yesterday") {
    const from = new Date(now); from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  const days = id === "7d" ? 7 : 30;
  const from = new Date(now); from.setDate(from.getDate() - days); from.setHours(0, 0, 0, 0);
  return { from, to: now };
};

const AdminMarketingLayout = () => {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/admin/marketing", end: true, label: "Funnel", icon: BarChart3 },
    { to: "/admin/marketing/content", label: "Content", icon: TrendingUp },
    { to: "/admin/marketing/affiliate", label: "Affiliate Links", icon: Link2 },
    { to: "/admin/marketing/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/admin/marketing/knowledge", label: "Assistant KB", icon: Sparkles },
  ];
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Phase 2</p>
        <h1 className="text-xl font-extrabold text-slate-900">Marketing Hub</h1>
        <p className="text-xs text-slate-500">Attribution · funnel · creators · assistant knowledge.</p>
      </header>
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.end ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </NavLink>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
};

// ---------------- Funnel Tab ----------------

interface EventRow {
  event_type: string;
  session_id: string | null;
  visitor_id: string | null;
  utm_campaign: string | null;
  match_id: string | null;
  competition: string | null;
  home_team: string | null;
  away_team: string | null;
  host_country: string | null;
  created_at: string;
}

const useAnalyticsRange = (rangeId: RangeId) => {
  const { from, to } = useMemo(() => rangeBounds(rangeId), [rangeId]);
  return useQuery({
    queryKey: ["analytics_events_range", rangeId],
    staleTime: 30_000,
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("analytics_events" as never)
        .select("event_type,session_id,visitor_id,utm_campaign,match_id,competition,home_team,away_team,host_country,created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as unknown as EventRow[];
    },
  });
};

const RangePicker = ({ value, onChange }: { value: RangeId; onChange: (v: RangeId) => void }) => (
  <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
    {ranges.map((r) => (
      <button key={r.id}
        onClick={() => onChange(r.id)}
        className={`px-3 py-1.5 text-xs font-bold transition ${
          value === r.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}>{r.label}</button>
    ))}
  </div>
);

const StatBlock = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-xl font-extrabold text-slate-900 mt-0.5">{value}</div>
    {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

export const AdminMarketingFunnelPage = () => {
  const [range, setRange] = useState<RangeId>("7d");
  const { data: events = [], isLoading } = useAnalyticsRange(range);

  const stats = useMemo(() => {
    const pv = events.filter((e) => e.event_type === "page_view");
    const mc = events.filter((e) => e.event_type === "match_card_click");
    const tc = events.filter((e) => e.event_type === "ticket_button_click");
    const ar = events.filter((e) => e.event_type === "affiliate_redirect");
    const visitors = new Set(pv.map((e) => e.visitor_id).filter(Boolean)).size;
    const sessions = new Set(pv.map((e) => e.session_id).filter(Boolean)).size;
    const stepUsers = (rows: EventRow[]) => new Set(rows.map((e) => e.visitor_id).filter(Boolean)).size;
    const u1 = stepUsers(pv);
    const u2 = stepUsers(mc);
    const u3 = stepUsers(tc);
    const u4 = stepUsers(ar);
    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
    return {
      visitors, sessions,
      total: events.length,
      steps: [
        { label: "Page view", users: u1, conv: 100, drop: 0 },
        { label: "Match card click", users: u2, conv: pct(u2, u1), drop: pct(u1 - u2, u1) },
        { label: "Ticket button click", users: u3, conv: pct(u3, u1), drop: pct(u2 - u3, u2) },
        { label: "Affiliate redirect", users: u4, conv: pct(u4, u1), drop: pct(u3 - u4, u3) },
      ],
      pv: pv.length, mc: mc.length, tc: tc.length, ar: ar.length,
    };
  }, [events]);

  const topMatches = useMemo(() => {
    const counts = new Map<string, { label: string; clicks: number; redirects: number }>();
    events.forEach((e) => {
      if (!e.match_id) return;
      const label = e.home_team && e.away_team ? `${e.home_team} vs ${e.away_team}` : e.match_id;
      const r = counts.get(e.match_id) ?? { label, clicks: 0, redirects: 0 };
      if (e.event_type === "match_card_click" || e.event_type === "ticket_button_click") r.clicks++;
      if (e.event_type === "affiliate_redirect") r.redirects++;
      counts.set(e.match_id, r);
    });
    return [...counts.entries()].map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (b.clicks + b.redirects) - (a.clicks + a.redirects)).slice(0, 10);
  }, [events]);

  const topCompetitions = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      if (!e.competition || e.event_type !== "match_card_click") return;
      map.set(e.competition, (map.get(e.competition) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <RangePicker value={range} onChange={setRange} />
        <div className="text-[11px] text-slate-500">{isLoading ? "Loading…" : `${events.length} events`}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBlock label="Visitors" value={stats.visitors} />
        <StatBlock label="Sessions" value={stats.sessions} />
        <StatBlock label="Events" value={stats.total} />
        <StatBlock label="Affiliate redirects" value={stats.ar} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Conversion funnel</div>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.steps.map((s, i) => {
            const widthPct = stats.steps[0].users > 0 ? Math.max(4, (s.users / stats.steps[0].users) * 100) : 4;
            return (
              <div key={s.label} className="px-3 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{i + 1}. {s.label}</span>
                  <span className="text-slate-600">
                    <span className="font-extrabold text-slate-900">{s.users}</span> users
                    <span className="ml-2">· {s.conv}% conv.</span>
                    {i > 0 && <span className="ml-2 text-rose-600">· {s.drop}% drop</span>}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-violet-600" style={{ width: `${widthPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-3">
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Top matches</div>
          <div className="divide-y divide-slate-100">
            {topMatches.length === 0 && <div className="p-3 text-xs text-slate-500">No match interactions yet.</div>}
            {topMatches.map((m) => (
              <div key={m.id} className="px-3 py-2 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 truncate mr-3">{m.label}</span>
                <span className="text-slate-600 shrink-0">
                  <span className="font-extrabold text-slate-900">{m.clicks}</span> clicks
                  <span className="ml-2 text-violet-700 font-bold">{m.redirects}</span> redirects
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Top competitions</div>
          <div className="divide-y divide-slate-100">
            {topCompetitions.length === 0 && <div className="p-3 text-xs text-slate-500">No competition data yet.</div>}
            {topCompetitions.map(([name, n]) => (
              <div key={name} className="px-3 py-2 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 truncate mr-3">{name}</span>
                <span className="font-extrabold text-slate-900">{n}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// ---------------- Content Tab ----------------

export const AdminMarketingContentPage = () => {
  const [range, setRange] = useState<RangeId>("7d");
  const { data: events = [], isLoading } = useAnalyticsRange(range);

  const topTeams = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      if (e.event_type !== "match_card_click" && e.event_type !== "ticket_button_click") return;
      [e.home_team, e.away_team].forEach((t) => { if (t) map.set(t, (map.get(t) ?? 0) + 1); });
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [events]);

  const topCountries = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      if (e.event_type !== "match_card_click") return;
      if (e.host_country) map.set(e.host_country, (map.get(e.host_country) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [events]);

  const topCampaigns = useMemo(() => {
    const map = new Map<string, { visits: number; redirects: number }>();
    events.forEach((e) => {
      const k = e.utm_campaign || "(direct)";
      const r = map.get(k) ?? { visits: 0, redirects: 0 };
      if (e.event_type === "page_view") r.visits++;
      if (e.event_type === "affiliate_redirect") r.redirects++;
      map.set(k, r);
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v, ctr: v.visits ? Math.round((v.redirects / v.visits) * 1000) / 10 : 0 }))
      .sort((a, b) => b.redirects - a.redirects).slice(0, 10);
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <RangePicker value={range} onChange={setRange} />
        <div className="text-[11px] text-slate-500">{isLoading ? "Loading…" : `${events.length} events`}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <ListPanel title="Top teams (clicks)" items={topTeams} />
        <ListPanel title="Top host countries" items={topCountries} />
      </div>
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Top campaigns by affiliate redirects</div>
        <div className="divide-y divide-slate-100">
          {topCampaigns.length === 0 && <div className="p-3 text-xs text-slate-500">No campaign data yet.</div>}
          {topCampaigns.map((c) => (
            <div key={c.name} className="px-3 py-2 grid grid-cols-4 gap-2 text-xs items-center">
              <span className="font-bold text-slate-900 truncate col-span-2">{c.name}</span>
              <span className="text-slate-600">{c.visits} visits</span>
              <span className="text-right">
                <span className="font-extrabold text-violet-700">{c.redirects}</span>
                <span className="ml-2 text-slate-500">({c.ctr}% CR)</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ListPanel = ({ title, items }: { title: string; items: [string, number][] }) => (
  <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{title}</div>
    <div className="divide-y divide-slate-100">
      {items.length === 0 && <div className="p-3 text-xs text-slate-500">No data yet.</div>}
      {items.map(([k, n]) => (
        <div key={k} className="px-3 py-2 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 truncate mr-3">{k}</span>
          <span className="font-extrabold text-slate-900">{n}</span>
        </div>
      ))}
    </div>
  </section>
);

export default AdminMarketingLayout;
