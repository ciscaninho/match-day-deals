import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Users, MousePointerClick, ArrowRightCircle, Mail,
  FileText, Trophy, MapPin, Shield as ShieldIcon, Globe2,
} from "lucide-react";

// ---------------- Range picker ----------------

const ranges = [
  { id: "7d", label: "Last 7d", days: 7 },
  { id: "30d", label: "Last 30d", days: 30 },
  { id: "90d", label: "Last 90d", days: 90 },
] as const;
type RangeId = (typeof ranges)[number]["id"];

const rangeBounds = (id: RangeId) => {
  const to = new Date();
  const from = new Date();
  const days = ranges.find((r) => r.id === id)?.days ?? 7;
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to };
};

// ---------------- Data hooks ----------------

interface AnalyticsRow {
  event_type: string;
  session_id: string | null;
  visitor_id: string | null;
  page_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  language: string | null;
  match_id: string | null;
  competition: string | null;
  home_team: string | null;
  away_team: string | null;
  host_country: string | null;
  created_at: string;
}

interface AffiliateRow {
  event_type: string;
  club_slug: string | null;
  club_name: string | null;
  stadium_name: string | null;
  league: string | null;
  match_id: string | null;
  provider: string | null;
  merchant: string | null;
  network: string | null;
  is_tracked: boolean | null;
  page_path: string | null;
  created_at: string;
}

interface NewsletterRow {
  status: string | null;
  source: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
}

const useAnalyticsRange = (rangeId: RangeId) => {
  const { from, to } = useMemo(() => rangeBounds(rangeId), [rangeId]);
  return useQuery({
    queryKey: ["insights_analytics", rangeId],
    staleTime: 60_000,
    queryFn: async (): Promise<AnalyticsRow[]> => {
      const { data, error } = await supabase
        .from("analytics_events" as never)
        .select("event_type,session_id,visitor_id,page_path,referrer,utm_source,utm_medium,utm_campaign,browser,device,os,language,match_id,competition,home_team,away_team,host_country,created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(20000);
      if (error) throw error;
      return (data ?? []) as unknown as AnalyticsRow[];
    },
  });
};

const useAffiliateRange = (rangeId: RangeId) => {
  const { from, to } = useMemo(() => rangeBounds(rangeId), [rangeId]);
  return useQuery({
    queryKey: ["insights_affiliate", rangeId],
    staleTime: 60_000,
    queryFn: async (): Promise<AffiliateRow[]> => {
      const { data, error } = await supabase
        .from("affiliate_clicks" as never)
        .select("event_type,club_slug,club_name,stadium_name,league,match_id,provider,merchant,network,is_tracked,page_path,created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(20000);
      if (error) throw error;
      return (data ?? []) as unknown as AffiliateRow[];
    },
  });
};

const useNewsletterRange = (rangeId: RangeId) => {
  const { from, to } = useMemo(() => rangeBounds(rangeId), [rangeId]);
  return useQuery({
    queryKey: ["insights_newsletter", rangeId],
    staleTime: 60_000,
    queryFn: async (): Promise<NewsletterRow[]> => {
      const { data, error } = await supabase
        .from("newsletter_signups" as never)
        .select("status,source,utm_source,utm_campaign,created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .limit(20000);
      if (error) throw error;
      return (data ?? []) as unknown as NewsletterRow[];
    },
  });
};

// ---------------- UI atoms ----------------

const RangePicker = ({ value, onChange }: { value: RangeId; onChange: (v: RangeId) => void }) => (
  <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
    {ranges.map((r) => (
      <button key={r.id} onClick={() => onChange(r.id)}
        className={`px-3 py-1.5 text-xs font-bold transition ${
          value === r.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}>{r.label}</button>
    ))}
  </div>
);

const Kpi = ({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
      <Icon className="w-3.5 h-3.5" />{label}
    </div>
    <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{title}</div>
    {children}
  </section>
);

const RankList = ({
  rows, emptyLabel = "No data yet.", rightLabel,
}: { rows: { key: string; label: string; value: number; sub?: string }[]; emptyLabel?: string; rightLabel?: string }) => {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
  if (rows.length === 0) return <div className="p-3 text-xs text-slate-500">{emptyLabel}</div>;
  return (
    <div className="divide-y divide-slate-100">
      {rightLabel && (
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex justify-between">
          <span>Item</span><span>{rightLabel}</span>
        </div>
      )}
      {rows.map((r) => (
        <div key={r.key} className="px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 truncate mr-3">{r.label}</span>
            <span className="text-slate-700 shrink-0">
              <span className="font-extrabold text-slate-900">{r.value.toLocaleString()}</span>
              {r.sub && <span className="ml-2 text-slate-500">{r.sub}</span>}
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-violet-600" style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------- Helpers ----------------

const distinct = <T,>(rows: T[], pick: (r: T) => string | null | undefined): number =>
  new Set(rows.map(pick).filter((x): x is string => !!x)).size;

const topMap = (entries: Map<string, number>, limit = 10) =>
  [...entries.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

const inc = (m: Map<string, number>, k: string | null | undefined, n = 1) => {
  if (!k) return;
  m.set(k, (m.get(k) ?? 0) + n);
};

const incObj = <V,>(m: Map<string, V>, k: string | null | undefined, mk: () => V, mut: (v: V) => void) => {
  if (!k) return;
  const cur = m.get(k) ?? mk();
  mut(cur);
  m.set(k, cur);
};

const classifyPath = (path: string | null | undefined): { kind: string; key: string } | null => {
  if (!path) return null;
  const clean = path.split("?")[0].replace(/\/$/, "") || "/";
  if (clean === "/" || clean === "") return { kind: "page", key: "/" };
  const seg = clean.split("/").filter(Boolean);
  if (seg[0] === "guides" && seg[1]) return { kind: "guide", key: clean };
  if ((seg[0] === "stadiums" || seg[0] === "destinations") && seg[1] && seg[1] !== "suggest") return { kind: "stadium", key: clean };
  if (seg[0] === "world-cup-2026" && seg[1] === "stadiums" && seg[2]) return { kind: "stadium", key: clean };
  if (seg[0] === "clubs" && seg[1]) return { kind: "club", key: clean };
  if (seg[0] === "leagues" && seg[1]) return { kind: "competition", key: clean };
  if (seg[0] === "matches" && seg[1]) return { kind: "match", key: clean };
  return { kind: "page", key: clean };
};

// ---------------- Page ----------------

const AdminInsightsPage = () => {
  const [range, setRange] = useState<RangeId>("30d");
  const { data: events = [], isLoading: eLoading } = useAnalyticsRange(range);
  const { data: affiliate = [], isLoading: aLoading } = useAffiliateRange(range);
  const { data: newsletter = [], isLoading: nLoading } = useNewsletterRange(range);

  const loading = eLoading || aLoading || nLoading;

  // --- Audience & funnel ---
  const audience = useMemo(() => {
    const pv = events.filter((e) => e.event_type === "page_view");
    const mc = events.filter((e) => e.event_type === "match_card_click");
    const tc = events.filter((e) => e.event_type === "ticket_button_click");
    const ar = events.filter((e) => e.event_type === "affiliate_redirect");
    const visitors = distinct(events, (e) => e.visitor_id);
    const sessions = distinct(events, (e) => e.session_id);
    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
    const u1 = distinct(pv, (e) => e.visitor_id);
    const u2 = distinct(mc, (e) => e.visitor_id);
    const u3 = distinct(tc, (e) => e.visitor_id);
    const u4 = distinct(ar, (e) => e.visitor_id);
    return {
      visitors, sessions,
      pageViews: pv.length,
      ticketClicks: tc.length,
      affiliateRedirects: ar.length,
      steps: [
        { label: "Page view", users: u1, conv: 100, drop: 0 },
        { label: "Match card click", users: u2, conv: pct(u2, u1), drop: pct(u1 - u2, u1) },
        { label: "Ticket button click", users: u3, conv: pct(u3, u1), drop: pct(u2 - u3, Math.max(u2, 1)) },
        { label: "Affiliate redirect", users: u4, conv: pct(u4, u1), drop: pct(u3 - u4, Math.max(u3, 1)) },
      ],
    };
  }, [events]);

  // --- Traffic breakdowns ---
  const trafficLists = useMemo(() => {
    const dev = new Map<string, number>(), br = new Map<string, number>(),
      os = new Map<string, number>(), lang = new Map<string, number>(),
      utmS = new Map<string, number>(), utmC = new Map<string, number>(),
      ref = new Map<string, number>();
    events.forEach((e) => {
      if (e.event_type !== "page_view") return;
      inc(dev, e.device || "unknown");
      inc(br, e.browser || "unknown");
      inc(os, e.os || "unknown");
      inc(lang, e.language || "unknown");
      inc(utmS, e.utm_source || "(direct)");
      inc(utmC, e.utm_campaign || "(none)");
      if (e.referrer) {
        try { inc(ref, new URL(e.referrer).hostname); } catch { /* noop */ }
      }
    });
    const fmt = (m: Map<string, number>, n = 8) =>
      topMap(m, n).map(([k, v]) => ({ key: k, label: k, value: v }));
    return { dev: fmt(dev), br: fmt(br), os: fmt(os), lang: fmt(lang), utmS: fmt(utmS), utmC: fmt(utmC), ref: fmt(ref, 10) };
  }, [events]);

  // --- Content intelligence ---
  const content = useMemo(() => {
    // Per page: views + unique visitors + scroll_100 visitors + engagement (avg events per session on path)
    type Agg = { views: number; visitors: Set<string>; scrolled: Set<string>; sessions: Set<string>; events: number; kind: string };
    const pages = new Map<string, Agg>();
    events.forEach((e) => {
      const c = classifyPath(e.page_path);
      if (!c) return;
      const cur = pages.get(c.key) ?? { views: 0, visitors: new Set(), scrolled: new Set(), sessions: new Set(), events: 0, kind: c.kind };
      cur.kind = c.kind;
      if (e.event_type === "page_view") cur.views++;
      if (e.visitor_id) cur.visitors.add(e.visitor_id);
      if (e.session_id) cur.sessions.add(e.session_id);
      if (e.event_type === "scroll_100" && e.visitor_id) cur.scrolled.add(e.visitor_id);
      cur.events++;
      pages.set(c.key, cur);
    });

    const flat = [...pages.entries()].map(([key, v]) => {
      const scrollPct = v.visitors.size ? Math.round((v.scrolled.size / v.visitors.size) * 1000) / 10 : 0;
      const engagement = v.sessions.size ? Math.round((v.events / v.sessions.size) * 10) / 10 : 0;
      return { key, kind: v.kind, views: v.views, visitors: v.visitors.size, scrollPct, engagement };
    });

    const sortByViews = (kind: string, n = 10) => flat.filter((r) => r.kind === kind).sort((a, b) => b.views - a.views).slice(0, n);

    return {
      topPages: flat.slice().sort((a, b) => b.views - a.views).slice(0, 12),
      topGuides: sortByViews("guide"),
      topStadiums: sortByViews("stadium"),
      topCompetitions: sortByViews("competition"),
      topClubs: sortByViews("club"),
      // Site-wide scroll completion + engagement
      avgScroll: (() => {
        const visitorsWithPV = distinct(events.filter((e) => e.event_type === "page_view"), (e) => e.visitor_id);
        const visitorsScrolled = distinct(events.filter((e) => e.event_type === "scroll_100"), (e) => e.visitor_id);
        return visitorsWithPV ? Math.round((visitorsScrolled / visitorsWithPV) * 1000) / 10 : 0;
      })(),
      avgEngagement: (() => {
        const sessions = distinct(events, (e) => e.session_id);
        return sessions ? Math.round((events.length / sessions) * 10) / 10 : 0;
      })(),
    };
  }, [events]);

  // --- Business intelligence (affiliate) ---
  const business = useMemo(() => {
    const totalClicks = affiliate.length;
    const trackedClicks = affiliate.filter((a) => a.is_tracked).length;
    const trackedPct = totalClicks ? Math.round((trackedClicks / totalClicks) * 1000) / 10 : 0;

    const matches = new Map<string, { label: string; n: number }>();
    const comps = new Map<string, number>();
    const clubs = new Map<string, { label: string; n: number }>();
    const stadiums = new Map<string, number>();
    const providers = new Map<string, { tracked: number; total: number }>();
    const merchants = new Map<string, number>();

    affiliate.forEach((a) => {
      if (a.match_id) {
        incObj(matches, a.match_id, () => ({ label: a.match_id!, n: 0 }), (v) => { v.n++; });
      }
      inc(comps, a.league);
      if (a.club_slug || a.club_name) {
        const k = a.club_slug || a.club_name!;
        incObj(clubs, k, () => ({ label: a.club_name || k, n: 0 }), (v) => { v.n++; });
      }
      inc(stadiums, a.stadium_name);
      const provKey = a.provider || a.merchant || "unknown";
      incObj(providers, provKey, () => ({ tracked: 0, total: 0 }), (v) => { v.total++; if (a.is_tracked) v.tracked++; });
      inc(merchants, a.merchant);
    });

    // Enrich match labels from analytics events
    const matchLabels = new Map<string, string>();
    events.forEach((e) => {
      if (e.match_id && e.home_team && e.away_team && !matchLabels.has(e.match_id)) {
        matchLabels.set(e.match_id, `${e.home_team} vs ${e.away_team}`);
      }
    });

    return {
      totalClicks, trackedClicks, trackedPct,
      topMatches: [...matches.entries()]
        .map(([id, v]) => ({ key: id, label: matchLabels.get(id) || id, value: v.n }))
        .sort((a, b) => b.value - a.value).slice(0, 10),
      topCompetitions: topMap(comps).map(([k, v]) => ({ key: k, label: k, value: v })),
      topClubs: [...clubs.entries()]
        .map(([k, v]) => ({ key: k, label: v.label, value: v.n }))
        .sort((a, b) => b.value - a.value).slice(0, 10),
      topStadiums: topMap(stadiums).map(([k, v]) => ({ key: k, label: k, value: v })),
      topProviders: [...providers.entries()]
        .map(([k, v]) => ({
          key: k, label: k, value: v.total,
          sub: `${v.tracked} tracked · ${v.total ? Math.round((v.tracked / v.total) * 100) : 0}%`,
        }))
        .sort((a, b) => b.value - a.value).slice(0, 10),
      topMerchants: topMap(merchants).map(([k, v]) => ({ key: k, label: k, value: v })),
    };
  }, [affiliate, events]);

  // --- Newsletter ---
  const news = useMemo(() => {
    const total = newsletter.length;
    const confirmed = newsletter.filter((n) => n.status === "confirmed").length;
    const pending = newsletter.filter((n) => n.status === "pending").length;
    const unsub = newsletter.filter((n) => n.status === "unsubscribed").length;
    return { total, confirmed, pending, unsub, rate: total ? Math.round((confirmed / total) * 1000) / 10 : 0 };
  }, [newsletter]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Sprint Insights 1</p>
        <h1 className="text-xl font-extrabold text-slate-900">Insights</h1>
        <p className="text-xs text-slate-500">Audience · conversion · content prioritization · affiliate growth.</p>
      </header>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <RangePicker value={range} onChange={setRange} />
        <div className="text-[11px] text-slate-500">
          {loading ? "Loading…" : `${events.length.toLocaleString()} events · ${affiliate.length.toLocaleString()} affiliate clicks · ${newsletter.length.toLocaleString()} signups`}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Kpi icon={Users} label="Visitors" value={audience.visitors.toLocaleString()} sub={`${audience.sessions.toLocaleString()} sessions`} />
        <Kpi icon={BarChart3} label="Page views" value={audience.pageViews.toLocaleString()} />
        <Kpi icon={MousePointerClick} label="Ticket clicks" value={audience.ticketClicks.toLocaleString()} />
        <Kpi icon={ArrowRightCircle} label="Affiliate redirects" value={audience.affiliateRedirects.toLocaleString()} sub={`${business.trackedPct}% tracked`} />
        <Kpi icon={ShieldIcon} label="Affiliate clicks" value={business.totalClicks.toLocaleString()} />
        <Kpi icon={Mail} label="Signups" value={news.total.toLocaleString()} sub={`${news.confirmed} confirmed · ${news.rate}%`} />
      </div>

      {/* Funnel */}
      <Section title="Conversion funnel (unique visitors)">
        <div className="divide-y divide-slate-100">
          {audience.steps.map((s, i) => {
            const widthPct = audience.steps[0].users > 0 ? Math.max(4, (s.users / audience.steps[0].users) * 100) : 4;
            return (
              <div key={s.label} className="px-3 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{i + 1}. {s.label}</span>
                  <span className="text-slate-600">
                    <span className="font-extrabold text-slate-900">{s.users.toLocaleString()}</span> users
                    <span className="ml-2">· {s.conv}% of step 1</span>
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
      </Section>

      {/* Audience & Traffic */}
      <div className="grid md:grid-cols-3 gap-3">
        <Section title="Top traffic sources (UTM)"><RankList rows={trafficLists.utmS} /></Section>
        <Section title="Top campaigns"><RankList rows={trafficLists.utmC} /></Section>
        <Section title="Top referrers"><RankList rows={trafficLists.ref} /></Section>
        <Section title="Device"><RankList rows={trafficLists.dev} /></Section>
        <Section title="Browser"><RankList rows={trafficLists.br} /></Section>
        <Section title="OS"><RankList rows={trafficLists.os} /></Section>
      </div>

      {/* Content Intelligence */}
      <header className="pt-2">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4" />Content Intelligence
        </h2>
        <p className="text-[11px] text-slate-500">Editorial signals — what to double down on.</p>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi icon={BarChart3} label="Scroll completion" value={`${content.avgScroll}%`} sub="visitors reaching 100%" />
        <Kpi icon={Users} label="Engagement / session" value={content.avgEngagement} sub="events per session" />
        <Kpi icon={FileText} label="Tracked pages" value={content.topPages.length} />
        <Kpi icon={Globe2} label="Languages" value={trafficLists.lang.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Section title="Top pages (all)">
          <RankList rightLabel="Views"
            rows={content.topPages.map((p) => ({
              key: p.key, label: p.key, value: p.views,
              sub: `${p.visitors} unique · ${p.scrollPct}% scroll · ${p.engagement} ev/sess`,
            }))} />
        </Section>
        <Section title="Top guides">
          <RankList rightLabel="Views"
            emptyLabel="No guide views yet."
            rows={content.topGuides.map((p) => ({ key: p.key, label: p.key, value: p.views, sub: `${p.visitors} unique · ${p.scrollPct}% scroll` }))} />
        </Section>
        <Section title="Top stadium pages">
          <RankList rightLabel="Views"
            emptyLabel="No stadium page views yet."
            rows={content.topStadiums.map((p) => ({ key: p.key, label: p.key, value: p.views, sub: `${p.visitors} unique · ${p.scrollPct}% scroll` }))} />
        </Section>
        <Section title="Top competition pages">
          <RankList rightLabel="Views"
            emptyLabel="No competition page views yet."
            rows={content.topCompetitions.map((p) => ({ key: p.key, label: p.key, value: p.views, sub: `${p.visitors} unique` }))} />
        </Section>
        <Section title="Top club pages">
          <RankList rightLabel="Views"
            emptyLabel="No club page views yet."
            rows={content.topClubs.map((p) => ({ key: p.key, label: p.key, value: p.views, sub: `${p.visitors} unique` }))} />
        </Section>
        <Section title="Languages">
          <RankList rows={trafficLists.lang} />
        </Section>
      </div>

      {/* Business Intelligence */}
      <header className="pt-2">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Trophy className="w-4 h-4" />Business Intelligence
        </h2>
        <p className="text-[11px] text-slate-500">Affiliate-driven growth — what to push hardest.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi icon={MousePointerClick} label="Affiliate clicks" value={business.totalClicks.toLocaleString()} />
        <Kpi icon={ShieldIcon} label="Tracked" value={`${business.trackedClicks.toLocaleString()} (${business.trackedPct}%)`} />
        <Kpi icon={Trophy} label="Competitions seen" value={business.topCompetitions.length} />
        <Kpi icon={MapPin} label="Stadiums seen" value={business.topStadiums.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Section title="Top matches by affiliate clicks">
          <RankList rightLabel="Clicks" rows={business.topMatches} emptyLabel="No match-attributed clicks yet." />
        </Section>
        <Section title="Top competitions by affiliate clicks">
          <RankList rightLabel="Clicks" rows={business.topCompetitions} emptyLabel="No competition-attributed clicks yet." />
        </Section>
        <Section title="Top clubs by affiliate clicks">
          <RankList rightLabel="Clicks" rows={business.topClubs} emptyLabel="No club-attributed clicks yet." />
        </Section>
        <Section title="Top stadiums by affiliate clicks">
          <RankList rightLabel="Clicks" rows={business.topStadiums} emptyLabel="No stadium-attributed clicks yet." />
        </Section>
        <Section title="Top providers by affiliate clicks">
          <RankList rightLabel="Clicks" rows={business.topProviders} emptyLabel="No provider data yet." />
        </Section>
        <Section title="Top merchants (resolved network)">
          <RankList rightLabel="Clicks" rows={business.topMerchants} emptyLabel="No merchant matches yet." />
        </Section>
      </div>
    </div>
  );
};

export default AdminInsightsPage;
