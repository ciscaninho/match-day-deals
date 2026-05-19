import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, ChevronDown, ChevronRight, ExternalLink, Trophy, Search,
  BadgeCheck, HandCoins, ConciergeBell, TicketX, ArrowLeft,
} from "lucide-react";
import { TicketingBulkAiReviewDialog, type BulkClub } from "@/components/admin/TicketingBulkAiReviewDialog";
import { matchesQuery } from "@/lib/normalize";

type Row = {
  slug: string;
  club_name: string;
  country: string | null;
  league: string | null;
  official_ticketing_url: string | null;
  hospitality_url: string | null;
  resale_exchange_available: boolean;
  verification_status: string;
  source_confidence: string;
  publication_status: string;
};

// Priority ranking (top-5). Lower = higher priority.
const LEAGUE_PRIORITY: Record<string, number> = {
  "premier league": 1,
  "la liga": 2,
  "laliga": 2,
  "primera división": 2,
  "primera division": 2,
  "serie a": 3,
  "bundesliga": 4,
  "ligue 1": 5,
};

const CONFIDENCE_SCORE: Record<string, number> = { high: 1, medium: 0.6, low: 0.3 };

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

const priorityOf = (league: string | null) =>
  LEAGUE_PRIORITY[(league || "").trim().toLowerCase()] ?? 999;

export const AdminTicketingLeaguesPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bulkClubs, setBulkClubs] = useState<BulkClub[] | null>(null);
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-ticketing-leagues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_ticketing_profiles")
        .select(
          "slug,club_name,country,league,official_ticketing_url,hospitality_url,resale_exchange_available,verification_status,source_confidence,publication_status"
        )
        .is("archived_at", null)
        .order("club_name");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: affiliateClubs = new Set<string>() } = useQuery({
    queryKey: ["admin-ticketing-affiliate-slugs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_sources" as never)
        .select("club_slug,monetization_enabled")
        .eq("monetization_enabled", true);
      const set = new Set<string>();
      ((data ?? []) as Array<{ club_slug: string }>).forEach((r) => set.add(r.club_slug));
      return set;
    },
  });

  const leagues = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        league: string;
        country: string;
        clubs: Row[];
      }
    >();
    rows.forEach((r) => {
      const league = (r.league || "—").trim() || "—";
      const country = (r.country || "—").trim() || "—";
      const key = `${league}|${country}`;
      if (!map.has(key)) map.set(key, { key, league, country, clubs: [] });
      map.get(key)!.clubs.push(r);
    });

    const enriched = [...map.values()].map((g) => {
      const total = g.clubs.length;
      const official = g.clubs.filter((c) => !!c.official_ticketing_url).length;
      const hospitality = g.clubs.filter((c) => !!c.hospitality_url).length;
      const affiliate = g.clubs.filter((c) => affiliateClubs.has(c.slug)).length;
      const verified = g.clubs.filter((c) => c.verification_status === "verified").length;
      const published = g.clubs.filter((c) => c.publication_status === "published").length;
      const remaining = g.clubs.filter(
        (c) => !c.official_ticketing_url || c.verification_status !== "verified"
      ).length;
      const confidenceSum = g.clubs.reduce(
        (acc, c) => acc + (CONFIDENCE_SCORE[c.source_confidence] ?? 0.3),
        0
      );
      const confidence = total === 0 ? 0 : Math.round((confidenceSum / total) * 100);
      // Coverage: weighted blend of official + verified.
      const coverage = total === 0 ? 0 : Math.round(((official + verified) / (total * 2)) * 100);
      const priority = priorityOf(g.league);
      return {
        ...g,
        total,
        official,
        hospitality,
        affiliate,
        verified,
        published,
        remaining,
        confidence,
        coverage,
        priority,
      };
    });

    enriched.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (b.total !== a.total) return b.total - a.total;
      return a.league.localeCompare(b.league);
    });

    return enriched;
  }, [rows, affiliateClubs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leagues;
    return leagues.filter((g) => matchesQuery([g.league, g.country], search));
  }, [leagues, search]);

  const kpis = useMemo(() => {
    const total = leagues.length;
    const ready = leagues.filter((g) => g.coverage >= 80).length;
    const partial = leagues.filter((g) => g.coverage >= 30 && g.coverage < 80).length;
    const untouched = leagues.filter((g) => g.coverage < 30).length;
    const totalClubs = leagues.reduce((a, g) => a + g.total, 0);
    const remainingClubs = leagues.reduce((a, g) => a + g.remaining, 0);
    return { total, ready, partial, untouched, totalClubs, remainingClubs };
  }, [leagues]);

  const enrichLeague = (groupKey: string) => {
    const g = leagues.find((x) => x.key === groupKey);
    if (!g) return;
    const targets = g.clubs
      .filter((c) => !c.official_ticketing_url || !c.hospitality_url)
      .slice(0, 24)
      .map<BulkClub>((c) => ({
        slug: c.slug,
        club_name: c.club_name,
        official_ticketing_url: c.official_ticketing_url,
        hospitality_url: c.hospitality_url,
        membership_required: false,
        membership_required_for_big_games: false,
      }));
    if (targets.length === 0) {
      // fall back to all clubs
      const all = g.clubs.slice(0, 24).map<BulkClub>((c) => ({
        slug: c.slug,
        club_name: c.club_name,
        official_ticketing_url: c.official_ticketing_url,
        hospitality_url: c.hospitality_url,
        membership_required: false,
        membership_required_for_big_games: false,
      }));
      setBulkClubs(all);
    } else {
      setBulkClubs(targets);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/admin/ticketing" className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground mb-1">
            <ArrowLeft className="w-3 h-3" />
            {t("admin.ticketing.leagues.back")}
          </Link>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            {t("admin.ticketing.leagues.title")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("admin.ticketing.leagues.subtitle")}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin.ticketing.leagues.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs pl-7"
          />
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <Kpi label={t("admin.ticketing.leagues.kpi.leagues")} value={kpis.total} />
        <Kpi label={t("admin.ticketing.leagues.kpi.ready")} value={kpis.ready} accent="emerald" />
        <Kpi label={t("admin.ticketing.leagues.kpi.partial")} value={kpis.partial} accent="amber" />
        <Kpi label={t("admin.ticketing.leagues.kpi.untouched")} value={kpis.untouched} accent="rose" />
        <Kpi label={t("admin.ticketing.leagues.kpi.total_clubs")} value={kpis.totalClubs} />
        <Kpi label={t("admin.ticketing.leagues.kpi.remaining_clubs")} value={kpis.remainingClubs} accent="violet" />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[20px_1fr_70px_140px_80px_80px_80px_90px_110px] gap-2 items-center px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              <span />
              <span>{t("admin.ticketing.leagues.col.league")}</span>
              <span className="text-right">{t("admin.ticketing.leagues.col.clubs")}</span>
              <span>{t("admin.ticketing.leagues.col.coverage")}</span>
              <span className="text-right">{t("admin.ticketing.leagues.col.official")}</span>
              <span className="text-right">{t("admin.ticketing.leagues.col.hospitality")}</span>
              <span className="text-right">{t("admin.ticketing.leagues.col.affiliate")}</span>
              <span className="text-right">{t("admin.ticketing.leagues.col.confidence")}</span>
              <span className="text-right">{t("admin.ticketing.leagues.col.action")}</span>
            </div>
            <ul>
              {filtered.map((g) => {
                const isOpen = expanded === g.key;
                const isPriority = g.priority <= 5;
                return (
                  <li key={g.key} className="border-b border-border/60 last:border-0">
                    <div className="grid grid-cols-[20px_1fr_70px_140px_80px_80px_80px_90px_110px] gap-2 items-center px-3 py-2 hover:bg-muted/40">
                      <button
                        onClick={() => setExpanded(isOpen ? null : g.key)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="expand"
                      >
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setExpanded(isOpen ? null : g.key)}
                        className="text-left min-w-0"
                      >
                        <div className="flex items-center gap-1.5">
                          {isPriority && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold">
                              {g.priority}
                            </span>
                          )}
                          <p className="text-sm font-bold text-foreground truncate">{g.league}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{g.country}</p>
                      </button>
                      <span className="text-right tabular-nums text-xs font-bold text-foreground">{g.total}</span>
                      <div className="flex items-center gap-1.5">
                        <Progress value={g.coverage} className="h-1.5 flex-1" />
                        <span className="tabular-nums text-[10px] font-bold w-8 text-right">{g.coverage}%</span>
                      </div>
                      <CovCell n={g.official} d={g.total} />
                      <CovCell n={g.hospitality} d={g.total} />
                      <CovCell n={g.affiliate} d={g.total} />
                      <span className="text-right tabular-nums text-xs font-bold text-foreground">{g.confidence}%</span>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="h-7 text-[11px] bg-violet-600 hover:bg-violet-700 text-white"
                          onClick={() => enrichLeague(g.key)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("admin.ticketing.leagues.enrich")}
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="bg-muted/30 px-3 py-2 border-t border-border/50">
                        <div className="hidden md:grid grid-cols-[1fr_120px_120px_90px_90px] gap-2 px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          <span>{t("admin.ticketing.leagues.col.club")}</span>
                          <span>{t("admin.ticketing.leagues.col.official")}</span>
                          <span>{t("admin.ticketing.leagues.col.hospitality")}</span>
                          <span className="text-right">{t("admin.ticketing.leagues.col.affiliate")}</span>
                          <span className="text-right">{t("admin.ticketing.leagues.col.confidence")}</span>
                        </div>
                        <ul>
                          {g.clubs.map((c) => (
                            <li
                              key={c.slug}
                              className="grid grid-cols-[1fr_120px_120px_90px_90px] gap-2 items-center px-2 py-1.5 text-xs border-t border-border/40 first:border-t-0"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{c.club_name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {c.verification_status === "verified" && (
                                    <BadgeCheck className="w-3 h-3 text-sky-600" />
                                  )}
                                  {c.publication_status === "published" && (
                                    <span className="text-[9px] font-bold text-emerald-700">●</span>
                                  )}
                                </div>
                              </div>
                              <UrlCell url={c.official_ticketing_url} />
                              <UrlCell url={c.hospitality_url} />
                              <span className="text-right">
                                {affiliateClubs.has(c.slug) ? (
                                  <HandCoins className="w-3.5 h-3.5 text-violet-600 inline" />
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </span>
                              <span className="text-right text-[10px] font-bold text-foreground">
                                {Math.round((CONFIDENCE_SCORE[c.source_confidence] ?? 0.3) * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <TicketingBulkAiReviewDialog
        open={!!bulkClubs}
        onOpenChange={(v) => { if (!v) setBulkClubs(null); }}
        clubs={bulkClubs ?? []}
        onAnyApplied={() => {
          qc.invalidateQueries({ queryKey: ["admin-ticketing-leagues"] });
          qc.invalidateQueries({ queryKey: ["admin-ticketing-v2"] });
        }}
      />
    </div>
  );
};

export default AdminTicketingLeaguesPage;

// ---------- sub ----------
const accent: Record<string, string> = {
  emerald: "text-emerald-700 bg-emerald-50",
  amber: "text-amber-700 bg-amber-50",
  rose: "text-rose-700 bg-rose-50",
  violet: "text-violet-700 bg-violet-50",
  default: "text-foreground bg-muted",
};

function Kpi({ label, value, accent: a = "default" }: { label: string; value: number; accent?: string }) {
  const cls = accent[a] || accent.default;
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${cls}`}>{label}</div>
        <p className="text-xl font-extrabold text-foreground leading-none mt-1.5">{value}</p>
      </CardContent>
    </Card>
  );
}

function CovCell({ n, d }: { n: number; d: number }) {
  const p = pct(n, d);
  const tone = p >= 80 ? "text-emerald-700" : p >= 30 ? "text-amber-700" : "text-rose-700";
  return (
    <span className={`text-right tabular-nums text-[11px] font-bold ${tone}`}>
      {n}/{d}
    </span>
  );
}

function UrlCell({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground/60 inline-flex items-center gap-1"><TicketX className="w-3 h-3" /></span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-emerald-700 hover:underline truncate"
      title={url}
    >
      <ExternalLink className="w-3 h-3 shrink-0" />
      <span className="truncate text-[10px]">{url.replace(/^https?:\/\/(www\.)?/, "")}</span>
    </a>
  );
}
