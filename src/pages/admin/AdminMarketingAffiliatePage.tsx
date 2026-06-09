import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Download, ExternalLink, Eye, Plus, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { transformAffiliateUrl } from "@/lib/affiliate";

// ---------------- Types ----------------

interface MatchRow {
  id: string;
  home_team: string;
  away_team: string;
  date: string;
  stadium: string | null;
  city: string | null;
  country: string | null;
  competition: string;
  group_code: string | null;
  phase: string | null;
  publication_status: string | null;
  fixture_confidence: string | null;
}

interface CoverageRow {
  id: string;
  match_id: string | null;
  event_name: string | null;
  event_date: string | null;
  stadium_name: string | null;
  city: string | null;
  home_label: string | null;
  away_label: string | null;
  ticket_url: string | null;
  url: string | null;
  active: boolean;
  is_available: boolean | null;
  last_sync_at: string | null;
}

interface AnalyticsRow {
  match_id: string | null;
  event_type: string;
}

type FixtureStatus = "active" | "missing" | "reconcile";

type CoverageValidation = {
  ok: boolean;
  reasons: string[]; // human-readable rejection reasons
  checks: { date: boolean; stadium: boolean; teams: boolean; nonGeneric: boolean; activeUrl: boolean };
};

type FixtureRow = {
  matchId: string;
  home: string;
  away: string;
  matchLabel: string;
  date: string;
  stadium: string;
  city: string;
  country: string;
  group: string | null;
  competition: string;
  status: FixtureStatus;
  affiliateUrl: string;
  matchPagePath: string;
  coverageCount: number;
  reconcileCount: number;
  validations: Array<{ coverageId: string; validation: CoverageValidation }>;
};


// ---------------- Helpers ----------------

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
  try { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); }
  catch { toast.error("Copy failed"); }
};

// ---------------- Coverage validation ----------------

const fold = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Strip common stadium suffix noise so "MetLife Stadium" ≈ "metlife"
const normStadium = (s: string | null | undefined) => {
  const f = fold(s).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  return f
    .replace(/\b(stadium|stadion|arena|field|park|estadio|coliseum)\b/g, "")
    .replace(/\s+/g, " ").trim();
};

const sameDay = (a: string | null | undefined, b: string | null | undefined) => {
  if (!a || !b) return false;
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
};

const GENERIC_TITLE_RE = /^\s*(match\s+\d+\s+group\s+[a-l]|group\s+stage\s+match|world\s+cup\s+match)\s*$/i;

// Normalize team aliases that appear differently across data sources
const TEAM_ALIASES: Record<string, string[]> = {
  "united states": ["usa", "us", "united states", "u s a"],
  "south korea": ["south korea", "korea republic", "korea rep", "republic of korea", "korea"],
  "north korea": ["north korea", "korea dpr", "dpr korea"],
  "bosnia and herzegovina": ["bosnia and herzegovina", "bosnia", "bih"],
  "dr congo": ["dr congo", "democratic republic of the congo", "drc", "congo dr"],
  "ivory coast": ["ivory coast", "cote d ivoire", "cote d'ivoire", "cote divoire"],
  "czech republic": ["czech republic", "czechia"],
  "cape verde": ["cape verde", "cabo verde"],
  "curacao": ["curacao", "curacau"],
};

const expandTeam = (name: string): string[] => {
  const base = fold(name);
  for (const canon of Object.keys(TEAM_ALIASES)) {
    if (canon === base || TEAM_ALIASES[canon].includes(base)) return [canon, ...TEAM_ALIASES[canon]];
  }
  return [base];
};

const teamMentioned = (haystack: string, team: string): boolean => {
  const hay = fold(haystack);
  return expandTeam(team).some((alias) => alias && hay.includes(alias));
};

const validateCoverage = (
  fixture: MatchRow,
  cov: CoverageRow,
): CoverageValidation => {
  const reasons: string[] = [];
  const link = (cov.ticket_url || cov.url || "").trim();
  const activeUrl = !!(cov.active && cov.is_available !== false && link);
  if (!activeUrl) reasons.push("inactive_or_no_url");

  const nonGeneric = !(cov.event_name && GENERIC_TITLE_RE.test(cov.event_name.trim()));
  if (!nonGeneric) reasons.push("generic_title");

  const date = sameDay(cov.event_date, fixture.date);
  if (!date) reasons.push("date_mismatch");

  const fixStad = normStadium(fixture.stadium);
  const covStad = normStadium(cov.stadium_name);
  const stadium = !!fixStad && !!covStad && (fixStad === covStad || fixStad.includes(covStad) || covStad.includes(fixStad));
  if (!stadium) reasons.push("stadium_mismatch");

  // Team check: try home_label/away_label first, fall back to event_name string match.
  const labelHay = `${cov.home_label ?? ""} ${cov.away_label ?? ""} ${cov.event_name ?? ""}`;
  const homeHit = teamMentioned(labelHay, fixture.home_team);
  const awayHit = teamMentioned(labelHay, fixture.away_team);
  const teams = homeHit && awayHit;
  if (!teams) reasons.push(homeHit || awayHit ? "team_partial" : "team_mismatch");

  const ok = activeUrl && nonGeneric && date && stadium && teams;
  return { ok, reasons, checks: { date, stadium, teams, nonGeneric, activeUrl } };
};

const REASON_LABEL: Record<string, string> = {
  inactive_or_no_url: "Inactive or missing URL",
  generic_title: "Generic placeholder title",
  date_mismatch: "Event date ≠ fixture date",
  stadium_mismatch: "Stadium ≠ fixture stadium",
  team_mismatch: "Neither team appears in event",
  team_partial: "Only one of the two teams appears",
};


// ---------------- Page ----------------

const AdminMarketingAffiliatePage = () => {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | FixtureStatus>("");
  const [reconcileOpen, setReconcileOpen] = useState<FixtureRow | null>(null);

  // 1) Driver: official confirmed published WC2026 fixtures
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["affiliate_official_fixtures"],
    staleTime: 60_000,
    queryFn: async (): Promise<MatchRow[]> => {
      const { data, error } = await supabase
        .from("matches" as never)
        .select("id,home_team,away_team,date,stadium,city,country,competition,group_code,phase,publication_status,fixture_confidence")
        .eq("competition", "FIFA World Cup 2026")
        .is("archived_at", null)
        .eq("publication_status", "published")
        .eq("fixture_confidence", "confirmed")
        .order("date", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as MatchRow[];
    },
  });

  // 2) Left-join coverage
  const { data: coverage = [] } = useQuery({
    queryKey: ["affiliate_coverage_full"],
    staleTime: 60_000,
    queryFn: async (): Promise<CoverageRow[]> => {
      const { data, error } = await supabase
        .from("wc_ticket_coverage" as never)
        .select("id,match_id,event_name,event_date,stadium_name,city,home_label,away_label,ticket_url,url,active,is_available,last_sync_at")
        .is("archived_at", null)
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as CoverageRow[];
    },
  });

  // 3) Analytics for top opportunities
  const { data: analytics = [] } = useQuery({
    queryKey: ["affiliate_top_analytics_v2"],
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

  // Group coverage rows by match_id (only valid links)
  const coverageByMatch = useMemo(() => {
    const m = new Map<string, CoverageRow[]>();
    coverage.forEach(c => {
      if (!c.match_id) return;
      const arr = m.get(c.match_id) ?? [];
      arr.push(c);
      m.set(c.match_id, arr);
    });
    return m;
  }, [coverage]);

  // Set of valid official fixture IDs for orphan detection
  const officialIds = useMemo(() => new Set(fixtures.map(f => f.id)), [fixtures]);

  // Orphan coverage rows: coverage with match_id that does NOT resolve to an official fixture,
  // OR coverage with no match_id at all (unmatched).
  const orphanCoverage = useMemo(
    () => coverage.filter(c => !c.match_id || !officialIds.has(c.match_id)),
    [coverage, officialIds]
  );

  // Build rows driven by fixtures (creator-first) with strict per-row validation
  const fixtureRows: FixtureRow[] = useMemo(() => {
    return fixtures.map(f => {
      const covs = coverageByMatch.get(f.id) ?? [];
      const validations = covs.map(c => ({ coverageId: c.id, validation: validateCoverage(f, c) }));
      const validRows = covs.filter((_, i) => validations[i].validation.ok);
      // Among VALID rows only, prefer latest sync.
      const sortedValid = validRows.slice().sort((a, b) => {
        const ad = a.last_sync_at ? new Date(a.last_sync_at).getTime() : 0;
        const bd = b.last_sync_at ? new Date(b.last_sync_at).getTime() : 0;
        return bd - ad;
      });
      const best = sortedValid[0];
      const rawUrl = best ? (best.ticket_url || best.url || "").trim() : "";
      const hasActive = !!(best && rawUrl);

      let status: FixtureStatus;
      if (hasActive) status = "active";
      else if (covs.length > 0) status = "reconcile";
      else status = "missing";

      return {
        matchId: f.id,
        home: f.home_team,
        away: f.away_team,
        matchLabel: `${f.home_team} vs ${f.away_team}`,
        date: f.date,
        stadium: f.stadium ?? "—",
        city: f.city ?? "—",
        country: f.country ?? "—",
        group: f.group_code,
        competition: f.competition,
        status,
        affiliateUrl: hasActive ? transformAffiliateUrl(rawUrl) : "",
        matchPagePath: `/matches/${f.id}`,
        coverageCount: covs.length,
        reconcileCount: covs.length - validRows.length,
        validations,
      };
    });
  }, [fixtures, coverageByMatch]);


  // Metrics
  const totalConfirmed = fixtureRows.length;
  const activeCount = fixtureRows.filter(r => r.status === "active").length;
  const missingCount = fixtureRows.filter(r => r.status === "missing").length;
  const reconcileCount = fixtureRows.filter(r => r.status === "reconcile").length;
  const orphanCount = orphanCoverage.length;
  const coveragePct = totalConfirmed > 0
    ? Math.min(100, Math.round((activeCount / totalConfirmed) * 100))
    : 0;

  // Filter dropdown sources
  const groups = useMemo(
    () => [...new Set(fixtureRows.map(r => r.group).filter(Boolean) as string[])].sort(),
    [fixtureRows]
  );
  const cities = useMemo(
    () => [...new Set(fixtureRows.map(r => r.city).filter(c => c && c !== "—"))].sort(),
    [fixtureRows]
  );

  // Search runs on the FULL official fixture universe
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fixtureRows.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (groupFilter && r.group !== groupFilter) return false;
      if (cityFilter && r.city !== cityFilter) return false;
      if (!q) return true;
      const hay = [
        r.home, r.away, r.matchLabel, r.stadium, r.city, r.country,
        r.group, r.group ? `group ${r.group}` : "",
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [fixtureRows, query, statusFilter, groupFilter, cityFilter]);

  // Top opportunities (only fixtures with active links)
  const topOpportunities = useMemo(() => {
    const counts = new Map<string, number>();
    analytics.forEach(a => { if (a.match_id) counts.set(a.match_id, (counts.get(a.match_id) ?? 0) + 1); });
    const byId = new Map(fixtureRows.map(r => [r.matchId, r]));
    return [...counts.entries()]
      .map(([matchId, score]) => ({ matchId, score, row: byId.get(matchId) }))
      .filter(x => !!x.row && x.row!.status === "active")
      .sort((a, b) => b.score - a.score)
      .slice(0, 6) as Array<{ matchId: string; score: number; row: FixtureRow }>;
  }, [analytics, fixtureRows]);

  const createCampaign = async (r: FixtureRow) => {
    const matchSlug = slugify(`${r.home}_${r.away}`);
    const utm_campaign = `wc2026_${matchSlug}`.slice(0, 60);
    const short_id = randomShortId();
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
      target_path: r.matchPagePath,
      short_id,
    };
    const { error } = await supabase.from("marketing_campaigns" as never).insert(payload as never);
    if (error) { toast.error(error.message); return; }
    const shortUrl = `${window.location.origin}/go/${short_id}`;
    await copyText(shortUrl, "Short link");
  };

  const exportCSV = () => {
    const header = ["Match", "Date", "Stadium", "City", "Country", "Group", "Status", "Affiliate URL"];
    const lines = [header.join(",")];
    filtered.forEach(r => {
      const cells = [
        r.matchLabel,
        r.date ? new Date(r.date).toISOString() : "",
        r.stadium, r.city, r.country, r.group || "", r.status, r.affiliateUrl,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate-fixtures-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reconcileRows = useMemo(() => {
    if (!reconcileOpen) return [];
    return (coverageByMatch.get(reconcileOpen.matchId) ?? []);
  }, [reconcileOpen, coverageByMatch]);

  return (
    <div className="space-y-4">
      {/* Quality panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Stat label="Confirmed fixtures" value={totalConfirmed} tone="slate" />
        <Stat label="Active affiliate" value={activeCount} tone="emerald" />
        <Stat label="Missing affiliate" value={missingCount} tone="amber" />
        <Stat label="Needs reconciliation" value={reconcileCount} tone="rose" />
        <Stat label="Coverage %" value={`${coveragePct}%`} tone="sky" />
      </div>
      <div className="text-[11px] text-slate-500">
        Unmatched / orphan coverage rows (Ticombo links not linked to an official fixture):{" "}
        <span className="font-bold text-slate-700">{orphanCount}</span>
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
                  <div className="font-extrabold text-slate-900 truncate">{o.row.matchLabel}</div>
                  <div className="text-[10px] text-slate-600">
                    {o.row.stadium} · {o.row.city} · {fmtDate(o.row.date)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-violet-800">{o.score} signals</span>
                  {o.row.affiliateUrl && (
                    <button onClick={() => copyText(o.row.affiliateUrl)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-2 py-1 text-[10px] font-bold hover:bg-slate-800">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  )}
                  <button onClick={() => createCampaign(o.row)}
                    className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-white text-violet-800 px-2 py-1 text-[10px] font-bold hover:bg-violet-100">
                    <Plus className="w-3 h-3" /> Campaign
                  </button>
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
              placeholder="Search team, stadium, city, country, group… (e.g. Belgium, MetLife, Seattle)"
              className="w-full rounded-md border border-slate-300 bg-white pl-7 pr-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "" | FixtureStatus)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900">
            <option value="">All statuses</option>
            <option value="active">🟢 Active affiliate link</option>
            <option value="missing">🟠 Missing affiliate link</option>
            <option value="reconcile">🔴 Needs reconciliation</option>
          </select>
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
          <span className="ml-auto text-[11px] text-slate-500">
            {isLoading ? "Loading…" : `${filtered.length} / ${totalConfirmed} fixtures`}
          </span>
        </div>
      </div>

      {/* Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-2 py-2">Fixture</th>
                <th className="text-left px-2 py-2">Date</th>
                <th className="text-left px-2 py-2">Stadium</th>
                <th className="text-left px-2 py-2">City</th>
                <th className="text-left px-2 py-2">Group</th>
                <th className="text-left px-2 py-2">Status</th>
                <th className="text-right px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-slate-500">
                  {isLoading ? "Loading official fixtures…" : "No fixtures match these filters."}
                </td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.matchId} className="hover:bg-slate-50">
                  <td className="px-2 py-2 font-bold text-slate-900">
                    <div className="truncate max-w-[260px]">{r.matchLabel}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[260px]">{r.competition}</div>
                  </td>
                  <td className="px-2 py-2 text-slate-700">{fmtDate(r.date)}</td>
                  <td className="px-2 py-2 text-slate-700 truncate max-w-[180px]">{r.stadium}</td>
                  <td className="px-2 py-2 text-slate-700">{r.city}</td>
                  <td className="px-2 py-2 text-slate-700">{r.group || "—"}</td>
                  <td className="px-2 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        disabled={r.status !== "active" || !r.affiliateUrl}
                        onClick={() => copyText(r.affiliateUrl)}
                        title={r.status !== "active" ? "Disabled — coverage failed validation" : "Copy tracked affiliate URL"}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-2 py-1 text-[10px] font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      {r.status === "active" && r.affiliateUrl && (
                        <a href={r.affiliateUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 hover:bg-slate-50">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        disabled={r.status !== "active"}
                        onClick={() => createCampaign(r)}
                        title={r.status !== "active" ? "Disabled — no validated affiliate link" : "Create quick TikTok campaign"}
                        className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-violet-50 text-violet-800 px-2 py-1 text-[10px] font-bold hover:bg-violet-100 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Plus className="w-3 h-3" /> Campaign
                      </button>
                      <button
                        disabled={r.coverageCount === 0}
                        onClick={() => setReconcileOpen(r)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                        title={r.coverageCount === 0 ? "No coverage rows" : "View coverage details & validation"}>
                        <Eye className="w-3 h-3" /> Coverage ({r.coverageCount})
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Coverage drawer */}
      {reconcileOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
          onClick={() => setReconcileOpen(null)}>
          <div className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-xl border border-slate-200 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Coverage details</div>
                <div className="text-sm font-extrabold text-slate-900 truncate">{reconcileOpen.matchLabel}</div>
                <div className="text-[11px] text-slate-500">{reconcileOpen.stadium} · {reconcileOpen.city} · {fmtDate(reconcileOpen.date)}</div>
              </div>
              <button onClick={() => setReconcileOpen(null)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50">Close</button>
            </div>
            <div className="overflow-y-auto p-3 space-y-2">
              {reconcileRows.length === 0 && (
                <div className="text-sm text-slate-500 p-4 text-center">No coverage rows linked to this fixture.</div>
              )}
              {reconcileRows.map(c => {
                const link = (c.ticket_url || c.url || "").trim();
                const ok = c.active && c.is_available !== false && link;
                return (
                  <div key={c.id} className="rounded-lg border border-slate-200 p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-slate-900 truncate">{c.event_name || "—"}</div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>{ok ? "active+url" : "needs fix"}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {c.home_label || "?"} vs {c.away_label || "?"} · {c.stadium_name || "?"} · {c.city || "?"} · {fmtDate(c.event_date)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">id: {c.id} · last_sync: {c.last_sync_at || "—"}</div>
                    {link && (
                      <a href={transformAffiliateUrl(link)} target="_blank" rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-violet-700 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Open partner link
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: FixtureStatus }) => {
  if (status === "active") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
      🟢 Active
    </span>
  );
  if (status === "missing") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
      🟠 Missing link
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">
      🔴 Reconcile
    </span>
  );
};

const toneMap: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50",
  violet: "border-violet-200 bg-violet-50",
  amber: "border-amber-200 bg-amber-50",
  rose: "border-rose-200 bg-rose-50",
  sky: "border-sky-200 bg-sky-50",
  slate: "border-slate-200 bg-white",
};

const Stat = ({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: string }) => (
  <div className={`rounded-lg border px-3 py-3 ${toneMap[tone] ?? toneMap.slate}`}>
    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-xl font-extrabold text-slate-900 mt-0.5">{value}</div>
  </div>
);

export default AdminMarketingAffiliatePage;
