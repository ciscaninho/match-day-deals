import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronRight, Search, Users2, MapPin, Trophy, Globe2,
  CheckCircle2, AlertCircle, Loader2, ShieldAlert, GitMerge,
  Archive, Eye, FileWarning, Building2, FlagOff,
} from "lucide-react";
import { toast } from "sonner";

type Confederation = { id: string; name: string; slug: string };
type Country = { id: string; name: string; slug: string; confederation_id: string | null };
type League = { id: string; league_name: string; slug: string; country_id: string | null; tier_level: number | null };
type Club = {
  id: string; slug: string; club_name: string; short_name: string | null; aliases: string[];
  country_id: string | null; primary_league_id: string | null; home_stadium_id: string | null;
  founded_year: number | null; crest_url: string | null; hero_image_url: string | null;
  official_website: string | null; gender: string; club_type: string;
  seo_title: string | null; seo_description: string | null;
  publication_status: string; archived_at: string | null;
};
type Stadium = { id: string; stadium_name: string; slug: string };
type ClubStadium = { id: string; club_id: string; stadium_id: string; role: string; is_current: boolean };
type Ticketing = {
  club_id: string;
  membership_required: boolean | null;
  hospitality_available: boolean | null;
  resale_exchange_available: boolean | null;
};
type QuickFilter =
  | "all" | "ticketing" | "identity" | "published" | "draft"
  | "missing_seo" | "missing_stadium" | "missing_league" | "missing_country";

const AdminClubsMasterPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [openConfs, setOpenConfs] = useState<Set<string>>(new Set());
  const [openCountries, setOpenCountries] = useState<Set<string>>(new Set());
  const [openLeagues, setOpenLeagues] = useState<Set<string>>(new Set());
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clubs-master"],
    queryFn: async () => {
      const [confs, countries, leagues, clubs, stadiums, ticketing, clubStadiums, pendingDup] = await Promise.all([
        supabase.from("confederations" as never).select("id,name,slug").order("name"),
        supabase.from("countries" as never).select("id,name,slug,confederation_id").order("name"),
        supabase.from("league_publication").select("id,league_name,slug,country_id,tier_level").order("league_name"),
        supabase.from("clubs" as never).select("*").is("archived_at", null).order("club_name"),
        supabase.from("stadiums").select("id,stadium_name,slug"),
        supabase.from("club_ticketing_profiles").select("club_id,membership_required,hospitality_available,resale_exchange_available").not("club_id", "is", null).is("archived_at", null),
        supabase.from("club_stadiums" as never).select("id,club_id,stadium_id,role,is_current"),
        supabase.from("club_merge_candidates" as never).select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const ticketingRows = (ticketing.data ?? []) as Ticketing[];
      return {
        confederations: (confs.data ?? []) as Confederation[],
        countries: (countries.data ?? []) as Country[],
        leagues: (leagues.data ?? []) as League[],
        clubs: (clubs.data ?? []) as Club[],
        stadiums: (stadiums.data ?? []) as Stadium[],
        ticketingMap: new Map(ticketingRows.map(r => [r.club_id, r])),
        clubStadiums: (clubStadiums.data ?? []) as ClubStadium[],
        pendingDuplicates: (pendingDup as { count: number | null }).count ?? 0,
      };
    },
  });

  const idx = useMemo(() => {
    const stadiumById = new Map<string, Stadium>();
    (data?.stadiums ?? []).forEach(s => stadiumById.set(s.id, s));
    const leagueById = new Map<string, League>();
    (data?.leagues ?? []).forEach(l => leagueById.set(l.id, l));
    const countryById = new Map<string, Country>();
    (data?.countries ?? []).forEach(c => countryById.set(c.id, c));
    const confById = new Map<string, Confederation>();
    (data?.confederations ?? []).forEach(c => confById.set(c.id, c));
    return { stadiumById, leagueById, countryById, confById };
  }, [data]);

  const filteredClubs = useMemo(() => {
    if (!data) return [] as Club[];
    const q = search.trim().toLowerCase();
    return data.clubs.filter(c => {
      const stadiumName = c.home_stadium_id ? idx.stadiumById.get(c.home_stadium_id)?.stadium_name?.toLowerCase() ?? "" : "";
      const leagueName = c.primary_league_id ? idx.leagueById.get(c.primary_league_id)?.league_name?.toLowerCase() ?? "" : "";
      const countryName = c.country_id ? idx.countryById.get(c.country_id)?.name?.toLowerCase() ?? "" : "";
      const hay = [c.club_name, c.slug, c.short_name ?? "", ...(c.aliases ?? []), stadiumName, leagueName, countryName].join(" ").toLowerCase();
      if (q && !hay.includes(q)) return false;
      switch (filter) {
        case "ticketing": return data.ticketingMap.has(c.id);
        case "identity": return c.club_type === "identity_only";
        case "published": return c.publication_status === "published";
        case "draft": return c.publication_status === "draft";
        case "missing_seo": return !c.seo_title || !c.seo_description;
        case "missing_stadium": return !c.home_stadium_id;
        case "missing_league": return !c.primary_league_id;
        case "missing_country": return !c.country_id;
        default: return true;
      }
    });
  }, [data, search, filter, idx]);

  const tree = useMemo(() => {
    if (!data) return [] as Array<{ conf: Confederation; countries: Array<{ country: Country; leagues: Array<{ league: League | null; clubs: Club[] }> }> }>;
    const byCountry = new Map<string, Club[]>();
    const orphans: Club[] = [];
    filteredClubs.forEach(c => {
      if (!c.country_id) { orphans.push(c); return; }
      if (!byCountry.has(c.country_id)) byCountry.set(c.country_id, []);
      byCountry.get(c.country_id)!.push(c);
    });

    const result: Array<{ conf: Confederation; countries: Array<{ country: Country; leagues: Array<{ league: League | null; clubs: Club[] }> }> }> = [];
    data.confederations.forEach(conf => {
      const confCountries = data.countries.filter(c => c.confederation_id === conf.id);
      const countriesNode: Array<{ country: Country; leagues: Array<{ league: League | null; clubs: Club[] }> }> = [];
      confCountries.forEach(country => {
        const cClubs = byCountry.get(country.id) ?? [];
        if (!cClubs.length) return;
        const byLeague = new Map<string, Club[]>();
        const noLeague: Club[] = [];
        cClubs.forEach(c => {
          if (!c.primary_league_id) { noLeague.push(c); return; }
          if (!byLeague.has(c.primary_league_id)) byLeague.set(c.primary_league_id, []);
          byLeague.get(c.primary_league_id)!.push(c);
        });
        const leaguesNode: Array<{ league: League | null; clubs: Club[] }> = [];
        Array.from(byLeague.entries())
          .map(([lid, cl]) => ({ league: idx.leagueById.get(lid) ?? null, clubs: cl }))
          .sort((a, b) => (a.league?.tier_level ?? 99) - (b.league?.tier_level ?? 99))
          .forEach(n => leaguesNode.push(n));
        if (noLeague.length) leaguesNode.push({ league: null, clubs: noLeague });
        countriesNode.push({ country, leagues: leaguesNode });
      });
      if (countriesNode.length) result.push({ conf, countries: countriesNode });
    });
    if (orphans.length) {
      result.push({
        conf: { id: "_no_conf", name: t("admin.clubsMaster.unassigned"), slug: "_no_conf" },
        countries: [{
          country: { id: "_no_country", name: t("admin.clubsMaster.noCountry"), slug: "_no_country", confederation_id: null },
          leagues: [{ league: null, clubs: orphans }],
        }],
      });
    }
    return result;
  }, [data, filteredClubs, idx, t]);

  const selectedClub = useMemo(
    () => (data?.clubs ?? []).find(c => c.id === selectedClubId) ?? null,
    [data, selectedClubId]
  );

  const totals = useMemo(() => {
    if (!data) return {
      total: 0, ticketing: 0, identity: 0, published: 0, draft: 0,
      missingSeo: 0, missingStadium: 0, duplicates: 0,
    };
    return {
      total: data.clubs.length,
      ticketing: data.clubs.filter(c => data.ticketingMap.has(c.id)).length,
      identity: data.clubs.filter(c => c.club_type === "identity_only").length,
      published: data.clubs.filter(c => c.publication_status === "published").length,
      draft: data.clubs.filter(c => c.publication_status === "draft").length,
      missingSeo: data.clubs.filter(c => !c.seo_title || !c.seo_description).length,
      missingStadium: data.clubs.filter(c => !c.home_stadium_id).length,
      duplicates: data.pendingDuplicates,
    };
  }, [data]);

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const bulk = async (action: "publish" | "draft" | "archive") => {
    if (selectedIds.size === 0) return;
    setBusy(true);
    const ids = Array.from(selectedIds);
    let payload: Record<string, unknown> = {};
    if (action === "publish") payload = { publication_status: "published" };
    if (action === "draft") payload = { publication_status: "draft" };
    if (action === "archive") payload = { archived_at: new Date().toISOString(), publication_status: "hidden" };
    const { error } = await (supabase.from("clubs" as never) as any).update(payload).in("id", ids);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.clubsMaster.bulkDone"));
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ["admin-clubs-master"] });
  };

  const bulkMerge = async () => {
    if (selectedIds.size < 2) { toast.error(t("admin.clubsMaster.bulkMergeMin")); return; }
    const ids = Array.from(selectedIds);
    setBusy(true);
    const { data: canon, error: e1 } = await (supabase.rpc as any)("pick_canonical_club", { _a: ids[0], _b: ids[1] });
    if (e1) { setBusy(false); toast.error(e1.message); return; }
    let canonicalId: string = canon as string;
    for (let i = 2; i < ids.length; i++) {
      const { data: next } = await (supabase.rpc as any)("pick_canonical_club", { _a: canonicalId, _b: ids[i] });
      if (next) canonicalId = next as string;
    }
    let merged = 0, failed = 0;
    for (const id of ids) {
      if (id === canonicalId) continue;
      const { error } = await (supabase.rpc as any)("merge_clubs_master", {
        p_canonical_id: canonicalId, p_duplicate_id: id, p_reason: "bulk_merge",
      });
      if (error) failed++; else merged++;
    }
    setBusy(false);
    toast.success(`${t("admin.clubsMaster.bulkMerged")}: ${merged}${failed ? ` · ${failed} ${t("admin.clubsMaster.failed")}` : ""}`);
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ["admin-clubs-master"] });
  };

  const highlight = (text: string) => {
    const q = search.trim();
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-amber-200 text-slate-900 rounded px-0.5">{text.slice(i, i + q.length)}</mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  const filters: { key: QuickFilter; label: string; icon?: React.ReactNode }[] = [
    { key: "all", label: t("admin.clubsMaster.f.all") },
    { key: "ticketing", label: t("admin.clubsMaster.f.ticketing") },
    { key: "identity", label: t("admin.clubsMaster.f.identity") },
    { key: "published", label: t("admin.clubsMaster.f.published") },
    { key: "draft", label: t("admin.clubsMaster.f.draft") },
    { key: "missing_seo", label: t("admin.clubsMaster.f.missingSeo"), icon: <FileWarning className="h-3 w-3" /> },
    { key: "missing_stadium", label: t("admin.clubsMaster.f.missingStadium"), icon: <Building2 className="h-3 w-3" /> },
    { key: "missing_league", label: t("admin.clubsMaster.f.missingLeague"), icon: <Trophy className="h-3 w-3" /> },
    { key: "missing_country", label: t("admin.clubsMaster.f.missingCountry"), icon: <FlagOff className="h-3 w-3" /> },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">{t("admin.clubsMaster.title")}</h1>
          <p className="text-sm text-slate-500 truncate">{t("admin.clubsMaster.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link to="/admin/clubs-master/review">
            <Button variant="outline" size="sm" className="relative">
              <ShieldAlert className="h-4 w-4 mr-1" />
              {t("admin.clubsMaster.openReview")}
              {totals.duplicates > 0 && (
                <Badge className="ml-2 bg-rose-600 text-white text-[10px]">{totals.duplicates}</Badge>
              )}
            </Button>
          </Link>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("admin.clubsMaster.search")}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <Kpi icon={<Users2 className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.total")} value={totals.total} />
        <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.withTicketing")} value={totals.ticketing} />
        <Kpi icon={<AlertCircle className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.identityOnly")} value={totals.identity} />
        <Kpi icon={<Trophy className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.published")} value={totals.published} />
        <Kpi icon={<Eye className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.draft")} value={totals.draft} />
        <Kpi icon={<ShieldAlert className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.duplicates")} value={totals.duplicates} tone="rose" />
        <Kpi icon={<FileWarning className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.missingSeo")} value={totals.missingSeo} tone="amber" />
        <Kpi icon={<Building2 className="h-4 w-4" />} label={t("admin.clubsMaster.kpi.missingStadium")} value={totals.missingStadium} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
            className="h-8"
          >
            {f.icon && <span className="mr-1">{f.icon}</span>}
            {f.label}
          </Button>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900 text-white rounded-md">
          <span className="text-sm font-semibold mr-2">{selectedIds.size} {t("admin.clubsMaster.selected")}</span>
          <Button size="sm" variant="secondary" onClick={() => bulk("publish")} disabled={busy}>
            <CheckCircle2 className="h-3 w-3 mr-1" />{t("admin.clubsMaster.bulk.publish")}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => bulk("draft")} disabled={busy}>
            <Eye className="h-3 w-3 mr-1" />{t("admin.clubsMaster.bulk.draft")}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => bulk("archive")} disabled={busy}>
            <Archive className="h-3 w-3 mr-1" />{t("admin.clubsMaster.bulk.archive")}
          </Button>
          <Button size="sm" variant="secondary" onClick={bulkMerge} disabled={busy || selectedIds.size < 2}>
            <GitMerge className="h-3 w-3 mr-1" />{t("admin.clubsMaster.bulk.merge")}
          </Button>
          <Button size="sm" variant="ghost" className="text-white hover:text-white" onClick={() => setSelectedIds(new Set())}>
            {t("admin.clubsMaster.clearSelection")}
          </Button>
        </div>
      )}

      <Card className="border-slate-200">
        <CardContent className="p-2 sm:p-3">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.clubsMaster.loading")}
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map(({ conf, countries }) => {
                const confOpen = openConfs.has(conf.id) || search.trim().length > 0 || filter !== "all";
                const confClubCount = countries.reduce((acc, c) => acc + c.leagues.reduce((a, l) => a + l.clubs.length, 0), 0);
                return (
                  <div key={conf.id}>
                    <button
                      onClick={() => toggle(openConfs, conf.id, setOpenConfs)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-100 text-left bg-slate-50/60"
                    >
                      <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${confOpen ? "rotate-90" : ""}`} />
                      <Globe2 className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-extrabold text-slate-900 uppercase text-xs tracking-wider truncate">{conf.name}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0 font-bold">{confClubCount}</Badge>
                    </button>
                    {confOpen && countries.map(({ country, leagues }) => {
                      const cKey = `${conf.id}:${country.id}`;
                      const cOpen = openCountries.has(cKey) || search.trim().length > 0 || filter !== "all";
                      const countryClubCount = leagues.reduce((a, l) => a + l.clubs.length, 0);
                      return (
                        <div key={cKey} className="ml-5">
                          <button
                            onClick={() => toggle(openCountries, cKey, setOpenCountries)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 text-left"
                          >
                            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${cOpen ? "rotate-90" : ""}`} />
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="text-sm font-bold text-slate-900 truncate">{country.name}</span>
                            <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{countryClubCount}</Badge>
                          </button>
                          {cOpen && leagues.map(({ league, clubs }) => {
                            const lKey = `${cKey}:${league?.id ?? "_no_league"}`;
                            const lOpen = openLeagues.has(lKey) || search.trim().length > 0 || filter !== "all";
                            return (
                              <div key={lKey} className="ml-5">
                                <button
                                  onClick={() => toggle(openLeagues, lKey, setOpenLeagues)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 text-left"
                                >
                                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${lOpen ? "rotate-90" : ""}`} />
                                  <Trophy className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  <span className="text-sm font-semibold text-slate-800 truncate">
                                    {league?.league_name ?? t("admin.clubsMaster.noLeague")}
                                  </span>
                                  <Badge variant="outline" className="ml-auto text-[10px] shrink-0">{clubs.length}</Badge>
                                </button>
                                {lOpen && (
                                  <ul className="ml-9 my-1 space-y-0.5">
                                    {clubs.map(club => {
                                      const hasTicketing = data!.ticketingMap.has(club.id);
                                      const checked = selectedIds.has(club.id);
                                      return (
                                        <li key={club.id} className="group">
                                          <div className={`w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 ${checked ? "bg-slate-100" : ""}`}>
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={() => toggleSelect(club.id)}
                                              className="shrink-0"
                                            />
                                            <button
                                              onClick={() => setSelectedClubId(club.id)}
                                              className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                            >
                                              {club.crest_url ? (
                                                <img src={club.crest_url} alt="" className="h-4 w-4 object-contain shrink-0" />
                                              ) : (
                                                <Users2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                              )}
                                              <span className="text-sm font-medium text-slate-900 truncate">
                                                {highlight(club.club_name)}
                                              </span>
                                              {club.club_type === "identity_only" && (
                                                <Badge variant="outline" className="text-[10px] shrink-0">{t("admin.clubsMaster.identityOnlyTag")}</Badge>
                                              )}
                                              {hasTicketing && (
                                                <Badge variant="secondary" className="text-[10px] shrink-0">{t("admin.clubsMaster.ticketingTag")}</Badge>
                                              )}
                                              {(!club.seo_title || !club.seo_description) && (
                                                <Badge className="text-[10px] shrink-0 bg-amber-100 text-amber-800 border border-amber-200">{t("admin.clubsMaster.f.missingSeo")}</Badge>
                                              )}
                                              <Badge
                                                variant={club.publication_status === "published" ? "default" : "outline"}
                                                className="ml-auto text-[10px] shrink-0"
                                              >
                                                {club.publication_status}
                                              </Badge>
                                            </button>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!tree.length && (
                <p className="p-6 text-center text-sm text-slate-500">{t("admin.clubsMaster.empty")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedClub} onOpenChange={(o) => !o && setSelectedClubId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="truncate">{selectedClub?.club_name}</SheetTitle>
          </SheetHeader>
          {selectedClub && data && (
            <ClubDetail
              club={selectedClub}
              ticketing={data.ticketingMap.get(selectedClub.id) ?? null}
              countryName={selectedClub.country_id ? idx.countryById.get(selectedClub.country_id)?.name ?? null : null}
              confName={selectedClub.country_id ? (idx.countryById.get(selectedClub.country_id)?.confederation_id ? idx.confById.get(idx.countryById.get(selectedClub.country_id)!.confederation_id!)?.name ?? null : null) : null}
              leagueName={selectedClub.primary_league_id ? idx.leagueById.get(selectedClub.primary_league_id)?.league_name ?? null : null}
              stadiumName={selectedClub.home_stadium_id ? idx.stadiumById.get(selectedClub.home_stadium_id)?.stadium_name ?? null : null}
              otherStadiums={data.clubStadiums
                .filter(cs => cs.club_id === selectedClub.id && cs.stadium_id !== selectedClub.home_stadium_id)
                .map(cs => ({
                  role: cs.role,
                  name: idx.stadiumById.get(cs.stadium_id)?.stadium_name ?? cs.stadium_id,
                }))}
              onSaved={() => qc.invalidateQueries({ queryKey: ["admin-clubs-master"] })}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Kpi = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "rose" | "amber" }) => {
  const toneCls = tone === "rose" ? "bg-rose-50 border-rose-200 text-rose-900"
    : tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-900"
    : "bg-white border-slate-200 text-slate-900";
  return (
    <Card className={`border ${toneCls}`}>
      <CardContent className="p-3 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-white/70 flex items-center justify-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide opacity-70 truncate font-semibold">{label}</p>
          <p className="text-xl font-extrabold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ClubDetail = ({
  club, ticketing, countryName, confName, leagueName, stadiumName, otherStadiums, onSaved,
}: {
  club: Club;
  ticketing: Ticketing | null;
  countryName: string | null;
  confName: string | null;
  leagueName: string | null;
  stadiumName: string | null;
  otherStadiums: Array<{ role: string; name: string }>;
  onSaved: () => void;
}) => {
  const { t } = useLanguage();
  const [seoTitle, setSeoTitle] = useState(club.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(club.seo_description ?? "");
  const [publicationStatus, setPublicationStatus] = useState(club.publication_status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from("clubs" as never) as any)
      .update({
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        publication_status: publicationStatus,
      })
      .eq("id", club.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.clubsMaster.saved"));
    onSaved();
  };

  return (
    <div className="mt-4 space-y-4 text-sm">
      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("admin.clubsMaster.section.identity")}</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("admin.clubsMaster.field.name")} value={club.club_name} />
          <Field label={t("admin.clubsMaster.field.shortName")} value={club.short_name ?? "—"} />
          <Field label={t("admin.clubsMaster.field.slug")} value={club.slug} />
          <Field label={t("admin.clubsMaster.field.type")} value={club.club_type} />
        </div>
        {club.aliases?.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{t("admin.clubsMaster.field.aliases")}</p>
            <div className="flex flex-wrap gap-1">
              {club.aliases.map((a, i) => <Badge key={i} variant="outline" className="text-[10px]">{a}</Badge>)}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("admin.clubsMaster.section.structure")}</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("admin.clubsMaster.field.confederation")} value={confName ?? "—"} />
          <Field label={t("admin.clubsMaster.field.country")} value={countryName ?? "—"} />
          <Field label={t("admin.clubsMaster.field.league")} value={leagueName ?? "—"} />
          <Field label={t("admin.clubsMaster.field.stadium")} value={stadiumName ?? "—"} />
        </div>
        {otherStadiums.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{t("admin.clubsMaster.otherStadiums")}</p>
            <div className="flex flex-wrap gap-1.5">
              {otherStadiums.map((s, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{s.name} · {s.role}</Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("admin.clubsMaster.section.ticketing")}</p>
        {ticketing ? (
          <div className="grid grid-cols-3 gap-2">
            <Field label={t("admin.clubsMaster.field.membership")} value={ticketing.membership_required ? "✓" : "—"} />
            <Field label={t("admin.clubsMaster.field.hospitality")} value={ticketing.hospitality_available ? "✓" : "—"} />
            <Field label={t("admin.clubsMaster.field.resale")} value={ticketing.resale_exchange_available ? "✓" : "—"} />
          </div>
        ) : (
          <p className="text-xs text-slate-500">{t("admin.clubsMaster.notLinked")}</p>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("admin.clubsMaster.seo")}</p>
        <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={t("admin.clubsMaster.seoTitlePh")} />
        <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder={t("admin.clubsMaster.seoDescPh")} rows={3} />
      </section>

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("admin.clubsMaster.publication")}</p>
        <div className="flex gap-2">
          {["draft", "published", "hidden"].map(s => (
            <Button
              key={s}
              size="sm"
              variant={publicationStatus === s ? "default" : "outline"}
              onClick={() => setPublicationStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </section>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {t("admin.clubsMaster.save")}
      </Button>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-wide text-slate-500 truncate">{label}</p>
    <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
  </div>
);

export default AdminClubsMasterPage;
