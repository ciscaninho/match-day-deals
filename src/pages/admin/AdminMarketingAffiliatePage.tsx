import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Download, ExternalLink, Plus, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { transformAffiliateUrl } from "@/lib/affiliate";

interface CoverageRow {
  id: string;
  match_id: string | null;
  stadium_slug: string | null;
  stadium_name: string | null;
  city: string | null;
  country: string | null;
  event_name: string | null;
  event_date: string | null;
  home_label: string | null;
  away_label: string | null;
  ticket_url: string | null;
  url: string | null;
  starting_price: number | null;
  currency: string | null;
  active: boolean;
  is_available: boolean | null;
  provider: string | null;
  quality_score: string | null;
}

interface MatchRow {
  id: string;
  home_team: string;
  away_team: string;
  date: string;
  stadium: string;
  city: string;
  country: string;
  competition: string;
  group_code: string | null;
  phase: string | null;
}

interface AnalyticsRow {
  match_id: string | null;
  event_type: string;
}

type CombinedRow = {
  key: string;
  matchId: string | null;
  home: string;
  away: string;
  matchLabel: string;
  date: string | null;
  stadium: string;
  city: string;
  country: string;
  competition: string;
  group: string | null;
  startingPrice: number | null;
  currency: string | null;
  status: "active" | "inactive";
  affiliateUrl: string;
  rawUrl: string;
  matchPagePath: string | null;
};

const slugify = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);

const randomShortId = (len = 7) => {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  } catch { return "—"; }
};

const copyText = async (text: string, label = "Link") => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Copy failed");
  }
};

const AdminMarketingAffiliatePage = () => {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState(true);

  const { data: coverage = [], isLoading } = useQuery({
    queryKey: ["affiliate_coverage_all"],
    staleTime: 60_000,
    queryFn: async (): Promise<CoverageRow[]> => {
      const { data, error } = await supabase
        .from("wc_ticket_coverage" as never)
        .select("id,match_id,stadium_slug,stadium_name,city,country,event_name,event_date,home_label,away_label,ticket_url,url,starting_price,currency,active,is_available,provider,quality_score")
        .is("archived_at", null)
        .order("event_date", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as CoverageRow[];
    },
  });

  const matchIds = useMemo(
    () => [...new Set(coverage.map(c => c.match_id).filter(Boolean) as string[])],
    [coverage]
  );

  const { data: matches = [] } = useQuery({
    queryKey: ["affiliate_matches", matchIds.length],
    enabled: matchIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<MatchRow[]> => {
      const { data, error } = await supabase
        .from("matches" as never)
        .select("id,home_team,away_team,date,stadium,city,country,competition,group_code,phase")
        .in("id", matchIds);
      if (error) throw error;
      return (data ?? []) as unknown as MatchRow[];
    },
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["affiliate_top_analytics"],
    staleTime: 60_000,
    queryFn: async (): Promise<AnalyticsRow[]> => {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("analytics_events" as never)
        .select("match_id,event_type")
        .gte("created_at", from)
        .in("event_type", ["match_card_click", "ticket_button_click", "affiliate_redirect", "chatbot_match_search"])
        .not("match_id", "is", null)
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as unknown as AnalyticsRow[];
    },
  });

  const matchMap = useMemo(() => {
    const m = new Map<string, MatchRow>();
    matches.forEach(x => m.set(x.id, x));
    return m;
  }, [matches]);

  const rows: CombinedRow[] = useMemo(() => {
    return coverage.map(c => {
      const m = c.match_id ? matchMap.get(c.match_id) : undefined;
      const rawUrl = (c.ticket_url || c.url || "").trim();
      const home = m?.home_team || c.home_label || "—";
      const away = m?.away_team || c.away_label || (c.event_name || "Stadium link");
      const matchLabel = m
        ? `${m.home_team} vs ${m.away_team}`
        : c.event_name || `${c.stadium_name || "Stadium"}`;
      return {
        key: c.id,
        matchId: c.match_id,
        home,
        away,
        matchLabel,
        date: m?.date || c.event_date || null,
        stadium: m?.stadium || c.stadium_name || "—",
        city: m?.city || c.city || "—",
        country: m?.country || c.country || "—",
        competition: m?.competition || "FIFA World Cup 2026",
        group: m?.group_code || null,
        startingPrice: c.starting_price,
        currency: c.currency,
        status: (c.active && c.is_available !== false) ? "active" : "inactive",
        affiliateUrl: rawUrl ? transformAffiliateUrl(rawUrl) : "",
        rawUrl,
        matchPagePath: c.match_id ? `/matches/${c.match_id}` : null,
      };
    });
  }, [coverage, matchMap]);

  const groups = useMemo(
    () => [...new Set(rows.map(r => r.group).filter(Boolean) as string[])].sort(),
    [rows]
  );
  const cities = useMemo(
    () => [...new Set(rows.map(r => r.city).filter(c => c && c !== "—"))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (activeOnly && (r.status !== "active" || !r.affiliateUrl)) return false;
      if (groupFilter && r.group !== groupFilter) return false;
      if (cityFilter && r.city !== cityFilter) return false;
      if (!q) return true;
      return [r.home, r.away, r.stadium, r.city, r.country, r.competition, r.group, r.matchLabel]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [rows, query, groupFilter, cityFilter, activeOnly]);

  const topOpportunities = useMemo(() => {
    const counts = new Map<string, number>();
    analytics.forEach(a => {
      if (!a.match_id) return;
      counts.set(a.match_id, (counts.get(a.match_id) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([matchId, score]) => {
        const m = matchMap.get(matchId);
        const row = rows.find(r => r.matchId === matchId);
        return {
          matchId,
          score,
          label: m ? `${m.home_team} vs ${m.away_team}` : (row?.matchLabel || matchId),
          row,
        };
      })
      .filter(x => !!x.row)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [analytics, matchMap, rows]);

  const createCampaign = async (r: CombinedRow) => {
    const matchSlug = slugify(`${r.home}_${r.away}`);
    const utm_campaign = `wc2026_${matchSlug}`.slice(0, 60);
    const short_id = randomShortId();
    const targetPath = r.matchPagePath || "/world-cup-2026";
    const payload = {
      name: `${r.matchLabel} – quick`,
      platform: "tiktok",
      creator_name: null,
      competition: r.competition,
      match_id: r.matchId,
      utm_source: "tiktok",
      utm_medium: "organic",
      utm_campaign,
      utm_content: "auto",
      target_path: targetPath,
      short_id,
    };
    const { error } = await supabase.from("marketing_campaigns" as never).insert(payload as never);
    if (error) { toast.error(error.message); return; }
    const shortUrl = `${window.location.origin}/go/${short_id}`;
    await copyText(shortUrl, "Short link");
    toast.success(`Campaign created → ${shortUrl}`);
  };

  const exportCSV = () => {
    const header = ["Match", "Date", "Stadium", "City", "Country", "Group", "Competition", "Affiliate URL"];
    const lines = [header.join(",")];
    filtered.forEach(r => {
      const cells = [
        r.matchLabel,
        r.date ? new Date(r.date).toISOString() : "",
        r.stadium, r.city, r.country, r.group || "", r.competition,
        r.affiliateUrl,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate-links-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeWithLink = rows.filter(r => r.status === "active" && r.affiliateUrl).length;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Total links" value={rows.length} />
        <Stat label="Active w/ link" value={activeWithLink} />
        <Stat label="Linked to fixtures" value={rows.filter(r => r.matchId).length} />
        <Stat label="Stadium-only links" value={rows.filter(r => !r.matchId).length} />
      </div>

      {/* Top opportunities */}
      {topOpportunities.length > 0 && (
        <section className="rounded-xl border border-violet-200 bg-violet-50/60 overflow-hidden">
          <div className="px-3 py-2 border-b border-violet-200 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-violet-800">
            <TrendingUp className="w-3.5 h-3.5" /> Top opportunities (30d) — content priorities
          </div>
          <div className="divide-y divide-violet-100">
            {topOpportunities.map(o => (
              <div key={o.matchId} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">{o.label}</div>
                  <div className="text-[10px] text-slate-600">
                    {o.row?.stadium} · {o.row?.city} · {fmtDate(o.row?.date ?? null)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-violet-800">{o.score} signals</span>
                  {o.row?.affiliateUrl && (
                    <button onClick={() => copyText(o.row!.affiliateUrl)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-2 py-1 text-[10px] font-bold hover:bg-slate-800">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  )}
                  {o.row && (
                    <button onClick={() => createCampaign(o.row!)}
                      className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-white text-violet-800 px-2 py-1 text-[10px] font-bold hover:bg-violet-100">
                      <Plus className="w-3 h-3" /> Campaign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search team, stadium, city, group…"
              className="w-full rounded-md border border-slate-300 bg-white pl-7 pr-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900">
            <option value="">All groups</option>
            {groups.map(g => <option key={g} value={g}>Group {g}</option>)}
          </select>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900">
            <option value="">All cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
            <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
            Active link only
          </label>
          <span className="ml-auto text-[11px] text-slate-500">
            {isLoading ? "Loading…" : `${filtered.length} / ${rows.length} rows`}
          </span>
        </div>
      </div>

      {/* Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-2 py-2">Match</th>
                <th className="text-left px-2 py-2">Date</th>
                <th className="text-left px-2 py-2">Stadium</th>
                <th className="text-left px-2 py-2">City</th>
                <th className="text-left px-2 py-2">Group</th>
                <th className="text-left px-2 py-2">From</th>
                <th className="text-left px-2 py-2">Status</th>
                <th className="text-right px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-slate-500">No links match these filters.</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.key} className="hover:bg-slate-50">
                  <td className="px-2 py-2 font-bold text-slate-900">
                    <div className="truncate max-w-[260px]">{r.matchLabel}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[260px]">{r.competition}</div>
                  </td>
                  <td className="px-2 py-2 text-slate-700">{fmtDate(r.date)}</td>
                  <td className="px-2 py-2 text-slate-700 truncate max-w-[180px]">{r.stadium}</td>
                  <td className="px-2 py-2 text-slate-700">{r.city}</td>
                  <td className="px-2 py-2 text-slate-700">{r.group || "—"}</td>
                  <td className="px-2 py-2 text-slate-700">
                    {r.startingPrice ? `${r.startingPrice} ${r.currency || ""}` : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        disabled={!r.affiliateUrl}
                        onClick={() => copyText(r.affiliateUrl)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-2 py-1 text-[10px] font-bold hover:bg-slate-800 disabled:opacity-40">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      {r.affiliateUrl && (
                        <a href={r.affiliateUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 hover:bg-slate-50">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button onClick={() => createCampaign(r)}
                        className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-violet-50 text-violet-800 px-2 py-1 text-[10px] font-bold hover:bg-violet-100">
                        <Plus className="w-3 h-3" /> Campaign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-xl font-extrabold text-slate-900 mt-0.5">{value}</div>
  </div>
);

export default AdminMarketingAffiliatePage;
