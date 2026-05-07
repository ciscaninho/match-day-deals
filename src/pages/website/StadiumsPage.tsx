import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Building2, Users, ChevronRight, Search, Trophy, Flame, LayoutGrid, Table as TableIcon, AlertTriangle, CheckCircle2, ImageOff, MapPinOff, Database, Image as ImageIcon, Percent, ShieldAlert } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useStadiums, type Stadium } from "@/hooks/useStadium";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

type SortKey = "atmosphere" | "capacity" | "popularity" | "country" | "league" | "name";
type QualityFilter = "all" | "missing_image" | "missing_hero" | "missing_coords" | "missing_meta" | "no_reviews" | "incomplete";

type QualityIssue = { key: string; label: string };

const getIssues = (s: Stadium, reviewCount: number, t: (k: string) => string): QualityIssue[] => {
  const list: QualityIssue[] = [];
  if (!s.image_url && !s.background_image_url && !s.thumbnail_image_url) list.push({ key: "img", label: t("stadium.quality_missing_image") });
  if (!s.hero_image_url) list.push({ key: "hero", label: t("stadium.quality_missing_hero") });
  if (s.latitude == null || s.longitude == null) list.push({ key: "coords", label: t("stadium.quality_missing_coords") });
  if (!s.capacity) list.push({ key: "cap", label: t("stadium.quality_missing_capacity") });
  if (!s.atmosphere_score) list.push({ key: "atm", label: t("stadium.quality_missing_atmosphere") });
  if (!s.popularity_score) list.push({ key: "meta", label: t("stadium.quality_incomplete") });
  if (reviewCount === 0) list.push({ key: "rev", label: t("stadium.quality_no_reviews") });
  return list;
};

const matchesQualityFilter = (s: Stadium, reviewCount: number, qf: QualityFilter): boolean => {
  switch (qf) {
    case "all": return true;
    case "missing_image": return !s.image_url && !s.background_image_url && !s.thumbnail_image_url;
    case "missing_hero": return !s.hero_image_url;
    case "missing_coords": return s.latitude == null || s.longitude == null;
    case "missing_meta": return !s.capacity || !s.atmosphere_score || !s.popularity_score;
    case "no_reviews": return reviewCount === 0;
    case "incomplete": return (
      (!s.image_url && !s.background_image_url && !s.thumbnail_image_url) ||
      !s.hero_image_url || s.latitude == null || s.longitude == null ||
      !s.capacity || !s.atmosphere_score || !s.popularity_score
    );
  }
};

const useReviewCounts = () => useQuery({
  queryKey: ["stadium-review-counts"],
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase.from("stadium_reviews").select("stadium_slug");
    if (error) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r: any) => { counts[r.stadium_slug] = (counts[r.stadium_slug] ?? 0) + 1; });
    return counts;
  },
});

const StadiumsPage = () => {
  const { t } = useLanguage();
  const { data: stadiums = [], isLoading } = useStadiums();
  const { data: reviewCounts = {} } = useReviewCounts();
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("all");
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("all");
  const [club, setClub] = useState("all");
  const [quality, setQuality] = useState<QualityFilter>("all");
  const [sort, setSort] = useState<SortKey>("popularity");
  const [view, setView] = useState<"grid" | "table">("grid");

  useSEO({
    title: "Stadium Directory — Football Stadium Intelligence | Foot Ticket Finder",
    description: "Explore, search and verify football stadiums: capacity, atmosphere, accessibility, coordinates and data quality.",
  });

  const leagues = useMemo(() => Array.from(new Set(stadiums.map((s) => s.league))).sort(), [stadiums]);
  const countries = useMemo(() => Array.from(new Set(stadiums.map((s) => s.country))).sort(), [stadiums]);
  const cities = useMemo(
    () => Array.from(new Set(stadiums.filter((s) => country === "all" || s.country === country).map((s) => s.city))).sort(),
    [stadiums, country]
  );
  const clubs = useMemo(() => {
    const set = new Set<string>();
    stadiums.forEach((s) => {
      if (s.club_name) set.add(s.club_name);
      s.clubs?.forEach((c) => c && set.add(c));
    });
    return Array.from(set).sort();
  }, [stadiums]);

  // Quick stats — computed across all stadiums (not the filtered list)
  const stats = useMemo(() => {
    const total = stadiums.length;
    let missingImages = 0;
    let missingCoords = 0;
    let complete = 0;
    stadiums.forEach((s) => {
      const noImg = !s.image_url && !s.background_image_url && !s.thumbnail_image_url;
      const noCoords = s.latitude == null || s.longitude == null;
      if (noImg) missingImages++;
      if (noCoords) missingCoords++;
      const isComplete = !noImg && !noCoords && !!s.hero_image_url && !!s.capacity && !!s.atmosphere_score && !!s.popularity_score;
      if (isComplete) complete++;
    });
    const completePct = total === 0 ? 0 : Math.round((complete / total) * 100);
    return { total, missingImages, missingCoords, complete, completePct };
  }, [stadiums]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = stadiums.filter((s) => {
      if (league !== "all" && s.league !== league) return false;
      if (country !== "all" && s.country !== country) return false;
      if (city !== "all" && s.city !== city) return false;
      if (club !== "all" && s.club_name !== club && !s.clubs?.includes(club)) return false;
      if (!matchesQualityFilter(s, reviewCounts[s.slug] ?? 0, quality)) return false;
      if (!q) return true;
      return [s.stadium_name, s.city, s.country, s.league, s.club_name ?? "", ...(s.clubs ?? [])]
        .some((v) => v?.toLowerCase().includes(q));
    });
    const cmp = (a: Stadium, b: Stadium) => {
      switch (sort) {
        case "atmosphere": return (b.atmosphere_score ?? 0) - (a.atmosphere_score ?? 0);
        case "capacity": return (b.capacity ?? 0) - (a.capacity ?? 0);
        case "popularity": return (b.popularity_score ?? 0) - (a.popularity_score ?? 0);
        case "country": return a.country.localeCompare(b.country);
        case "league": return a.league.localeCompare(b.league);
        case "name": return a.stadium_name.localeCompare(b.stadium_name);
      }
    };
    return [...list].sort(cmp);
  }, [stadiums, query, league, country, city, club, quality, reviewCounts, sort]);

  const selectCls = "bg-[#0b1220] text-white border border-white/15 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#2ECC71]/60 min-w-0 [&>option]:bg-[#0b1220] [&>option]:text-white [&>option:checked]:bg-[#2ECC71] [&>option:checked]:text-[#0b1220]";

  const StatCard = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: "neutral" | "warn" | "ok" }) => {
    const toneCls = tone === "warn"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
      : tone === "ok"
        ? "border-[#2ECC71]/30 bg-[#2ECC71]/5 text-[#2ECC71]"
        : "border-white/10 bg-white/[0.03] text-white";
    return (
      <div className={`rounded-2xl border ${toneCls} p-3 md:p-4`}>
        <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-wider opacity-80">
          <Icon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{label}</span>
        </div>
        <div className="mt-1 text-xl md:text-2xl font-black">{value}</div>
      </div>
    );
  };

  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-br from-[#0b1220] via-[#111a2c] to-[#0b1220] text-white">
        <div className="max-w-7xl mx-auto px-5 pt-8 pb-6">
          <div className="text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> {t("stadium.directory_title")}
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-black">{t("stadium.directory_title")}</h1>
          <p className="mt-2 text-white/70 text-sm md:text-base max-w-2xl">{t("stadium.directory_subtitle")}</p>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <StatCard icon={Database} label={t("stadium.stat_total")} value={stats.total} tone="neutral" />
            <StatCard icon={ImageOff} label={t("stadium.stat_missing_images")} value={stats.missingImages} tone="warn" />
            <StatCard icon={MapPinOff} label={t("stadium.stat_missing_coords")} value={stats.missingCoords} tone="warn" />
            <StatCard icon={Percent} label={t("stadium.stat_complete_pct")} value={`${stats.completePct}%`} tone="ok" />
          </div>

          {/* Search */}
          <div className="mt-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("stadium.search_placeholder")}
              className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-white/40 focus:outline-none focus:border-[#2ECC71]/60"
            />
          </div>

          {/* Filters + sort */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-7 gap-2">
            <select value={league} onChange={(e) => setLeague(e.target.value)} className={selectCls}>
              <option value="all">{t("stadium.all_leagues")}</option>
              {leagues.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={country} onChange={(e) => { setCountry(e.target.value); setCity("all"); }} className={selectCls}>
              <option value="all">{t("stadium.all_countries")}</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
              <option value="all">{t("stadium.all_cities")}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={club} onChange={(e) => setClub(e.target.value)} className={selectCls}>
              <option value="all">{t("stadium.all_clubs")}</option>
              {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={quality} onChange={(e) => setQuality(e.target.value as QualityFilter)} className={selectCls}>
              <option value="all">{t("stadium.qf_label")}: {t("stadium.qf_all")}</option>
              <option value="missing_image">{t("stadium.qf_missing_image")}</option>
              <option value="missing_hero">{t("stadium.qf_missing_hero")}</option>
              <option value="missing_coords">{t("stadium.qf_missing_coords")}</option>
              <option value="missing_meta">{t("stadium.qf_missing_meta")}</option>
              <option value="no_reviews">{t("stadium.qf_no_reviews")}</option>
              <option value="incomplete">{t("stadium.qf_incomplete")}</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
              <option value="popularity">{t("stadium.sort_by")}: {t("stadium.sort_popularity")}</option>
              <option value="atmosphere">{t("stadium.sort_by")}: {t("stadium.sort_atmosphere")}</option>
              <option value="capacity">{t("stadium.sort_by")}: {t("stadium.sort_capacity")}</option>
              <option value="country">{t("stadium.sort_by")}: {t("stadium.sort_country")}</option>
              <option value="league">{t("stadium.sort_by")}: {t("stadium.sort_league")}</option>
              <option value="name">{t("stadium.sort_by")}: {t("stadium.sort_name")}</option>
            </select>
            <div className="flex gap-1 bg-white/5 border border-white/15 rounded-xl p-1">
              <button
                onClick={() => setView("grid")}
                className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${view === "grid" ? "bg-[#2ECC71] text-[#0b1220]" : "text-white/70 hover:text-white"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> {t("stadium.view_grid")}
              </button>
              <button
                onClick={() => setView("table")}
                className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${view === "table" ? "bg-[#2ECC71] text-[#0b1220]" : "text-white/70 hover:text-white"}`}
              >
                <TableIcon className="w-3.5 h-3.5" /> {t("stadium.view_table")}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span>{t("stadium.results_count").replace("{count}", String(filtered.length))}</span>
            {quality !== "all" && (
              <button
                onClick={() => setQuality("all")}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold"
              >
                <ShieldAlert className="w-3 h-3" /> {t(`stadium.qf_${quality}` as any)} ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="bg-[#0b1220] text-white min-h-[60vh]">
        <section className="max-w-7xl mx-auto px-5 py-8">
          {isLoading ? (
            <div className="text-center text-white/60 text-sm py-20">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/60 text-sm py-20">{t("stadium.no_stadiums")}</div>
          ) : view === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s) => {
                const bg = s.hero_image_url || s.background_image_url || s.image_url || s.thumbnail_image_url;
                const issues = getIssues(s, reviewCounts[s.slug] ?? 0, t);
                return (
                  <Link
                    key={s.id}
                    to={`/stadiums/${s.slug}`}
                    className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-[#2ECC71]/40 transition flex flex-col"
                  >
                    <div
                      className="h-28 bg-cover bg-center relative"
                      style={bg
                        ? { backgroundImage: `url(${bg})` }
                        : { background: "linear-gradient(135deg, rgba(46,204,113,0.25), rgba(99,102,241,0.25))" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <Flame className="w-3 h-3 text-red-300" />
                        {s.atmosphere_score != null ? Number(s.atmosphere_score).toFixed(0) : "—"}
                      </div>
                      {!bg && (
                        <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 backdrop-blur px-2 py-0.5 text-[9px] font-bold uppercase">
                          <ImageOff className="w-3 h-3" /> {t("stadium.quality_missing_image")}
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col">
                      <div className="text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold flex items-center gap-1 truncate">
                        <Trophy className="w-3 h-3 shrink-0" /><span className="truncate">{s.league}</span>
                      </div>
                      <div className="mt-1 text-sm font-extrabold leading-tight line-clamp-2">{s.stadium_name}</div>
                      <div className="mt-1 text-xs text-white/60 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{s.city}, {s.country}</span>
                      </div>
                      {s.club_name && (
                        <div className="mt-0.5 text-xs text-white/50 flex items-center gap-1 truncate">
                          <Users className="w-3 h-3 shrink-0" /><span className="truncate">{s.club_name}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
                        <span>{s.capacity ? s.capacity.toLocaleString() : "—"}</span>
                        <span className="inline-flex items-center gap-1">
                          {issues.length === 0 ? (
                            <><CheckCircle2 className="w-3 h-3 text-[#2ECC71]" /><span className="text-[#2ECC71] font-bold">{t("stadium.quality_complete")}</span></>
                          ) : (
                            <><AlertTriangle className="w-3 h-3 text-amber-400" /><span className="text-amber-400 font-bold">{issues.length}</span></>
                          )}
                        </span>
                      </div>
                      {issues.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {issues.slice(0, 4).map((i) => (
                            <span key={i.key} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">{i.label}</span>
                          ))}
                          {issues.length > 4 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">+{issues.length - 4}</span>
                          )}
                        </div>
                      )}
                      <div className="mt-auto pt-2 inline-flex items-center justify-end gap-1 text-[#2ECC71] text-xs font-bold">
                        {t("stadium.view_guide")} <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-white/5 text-white/60 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2.5">{t("stadium.col_stadium")}</th>
                    <th className="text-left px-3 py-2.5 hidden md:table-cell">{t("stadium.col_clubs")}</th>
                    <th className="text-left px-3 py-2.5 hidden sm:table-cell">{t("stadium.col_city")}</th>
                    <th className="text-left px-3 py-2.5 hidden md:table-cell">{t("stadium.col_country")}</th>
                    <th className="text-left px-3 py-2.5 hidden lg:table-cell">{t("stadium.col_league")}</th>
                    <th className="text-right px-3 py-2.5">{t("stadium.col_capacity")}</th>
                    <th className="text-right px-3 py-2.5 hidden sm:table-cell">{t("stadium.col_atmosphere")}</th>
                    <th className="text-right px-3 py-2.5 hidden lg:table-cell">{t("stadium.col_popularity")}</th>
                    <th className="text-left px-3 py-2.5">{t("stadium.col_quality")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const issues = getIssues(s, reviewCounts[s.slug] ?? 0, t);
                    return (
                      <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                        <td className="px-3 py-2.5">
                          <Link to={`/stadiums/${s.slug}`} className="font-bold hover:text-[#2ECC71]">{s.stadium_name}</Link>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-white/70 truncate max-w-[180px]">{s.club_name ?? s.clubs?.join(", ") ?? "—"}</td>
                        <td className="px-3 py-2.5 hidden sm:table-cell text-white/70">{s.city}</td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-white/70">{s.country}</td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-white/70">{s.league}</td>
                        <td className="px-3 py-2.5 text-right text-white/80">{s.capacity ? s.capacity.toLocaleString() : "—"}</td>
                        <td className="px-3 py-2.5 text-right hidden sm:table-cell">{s.atmosphere_score != null ? Number(s.atmosphere_score).toFixed(0) : "—"}</td>
                        <td className="px-3 py-2.5 text-right hidden lg:table-cell">{s.popularity_score != null ? Number(s.popularity_score).toFixed(0) : "—"}</td>
                        <td className="px-3 py-2.5">
                          {issues.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[#2ECC71] font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" />{t("stadium.quality_complete")}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px]" title={issues.map((i) => i.label).join(", ")}>
                              <AlertTriangle className="w-3 h-3" />{issues.length}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default StadiumsPage;
