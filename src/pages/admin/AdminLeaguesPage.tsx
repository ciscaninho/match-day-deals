import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Trophy, ChevronRight, ChevronDown, Shield, MapPin, AlertTriangle,
  ArrowRightLeft, Loader2, Search, Building2, Users, Globe2, X,
} from "lucide-react";
import { toast } from "sonner";
import { matchesQuery } from "@/lib/normalize";

// ---------- Types ----------
type Confederation = { id: string; name: string; slug: string };
type Country = { id: string; name: string; slug: string; iso3: string | null; confederation_id: string | null };
type League = {
  id: string; league_name: string; slug: string | null; country: string;
  country_id: string | null; confederation_id: string | null;
  league_type: string; tier_level: number | null; is_active: boolean;
  publication_status: string;
};
type Club = {
  slug: string; club_name: string; league: string | null; country: string | null;
  stadium_name: string | null; stadium_slug: string | null; logo_url: string | null;
};
type Stadium = {
  slug: string; stadium_name: string; league: string | null; country: string | null;
  clubs: string[] | null;
};

const CONF_ORDER = ["UEFA", "CONMEBOL", "CONCACAF", "AFC", "CAF", "OFC"];
const UNASSIGNED = "__unassigned__";

// ---------- Move-club dialog ----------
const MoveClubDialog = ({
  club, allLeagues, open, onClose, onMoved,
}: {
  club: Club | null; allLeagues: string[];
  open: boolean; onClose: () => void; onMoved: () => void;
}) => {
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!club || !target.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("club_ticketing_profiles")
        .update({ league: target.trim(), updated_at: new Date().toISOString() })
        .eq("slug", club.slug);
      if (error) throw error;
      toast.success(`Moved ${club.club_name} → ${target.trim()}`);
      onMoved();
      onClose();
      setTarget("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Move failed");
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Move club to a different league</DialogTitle>
        </DialogHeader>
        {club && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-bold text-sm text-foreground">{club.club_name}</p>
              <p className="text-[11px] text-muted-foreground">{club.country} · currently {club.league || "no league"}</p>
            </div>
            <div>
              <label className="text-[11px] uppercase font-bold text-muted-foreground">Target league</label>
              <Input list="leagues-datalist" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Championship, Serie B…" />
              <datalist id="leagues-datalist">
                {allLeagues.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={run} disabled={busy || !target.trim()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />} Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Quality filter chip ----------
type FilterKind =
  | "none"
  | "leagues_without_country"
  | "clubs_without_league"
  | "clubs_without_country"
  | "stadiums_without_country";

// ---------- Page ----------
export const AdminLeaguesPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [openConfs, setOpenConfs] = useState<Set<string>>(new Set(["UEFA"]));
  const [openCountries, setOpenCountries] = useState<Set<string>>(new Set());
  const [openLeagues, setOpenLeagues] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState<Club | null>(null);
  const [filter, setFilter] = useState<FilterKind>("none");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leagues-hierarchy-v2"],
    queryFn: async () => {
      const [confRes, countriesRes, leaguesRes, clubsRes, stadiumsRes] = await Promise.all([
        supabase.from("confederations" as never).select("id,name,slug").order("name"),
        supabase.from("countries" as never).select("id,name,slug,iso3,confederation_id"),
        supabase.from("league_publication")
          .select("id,league_name,slug,country,country_id,confederation_id,league_type,tier_level,is_active,publication_status")
          .is("archived_at", null),
        supabase.from("club_ticketing_profiles")
          .select("slug,club_name,league,country,stadium_name,stadium_slug,logo_url")
          .is("archived_at", null),
        supabase.from("stadiums")
          .select("slug,stadium_name,league,country,clubs")
          .is("archived_at", null),
      ]);
      return {
        confederations: ((confRes.data ?? []) as unknown as Confederation[]),
        countries: ((countriesRes.data ?? []) as unknown as Country[]),
        leagues: ((leaguesRes.data ?? []) as unknown as League[]),
        clubs: (clubsRes.data || []) as Club[],
        stadiums: (stadiumsRes.data || []) as Stadium[],
      };
    },
  });

  // Indexes
  const idx = useMemo(() => {
    const confById = new Map<string, Confederation>();
    (data?.confederations ?? []).forEach((c) => confById.set(c.id, c));
    const countryById = new Map<string, Country>();
    const countryByLowerName = new Map<string, Country>();
    (data?.countries ?? []).forEach((c) => {
      countryById.set(c.id, c);
      countryByLowerName.set(c.name.toLowerCase(), c);
    });
    return { confById, countryById, countryByLowerName };
  }, [data]);

  // Resolve a country name string against the canonical catalog (with light normalization)
  const resolveCountry = (name: string | null | undefined): Country | null => {
    if (!name) return null;
    const key = name.trim().toLowerCase();
    const direct = idx.countryByLowerName.get(key);
    if (direct) return direct;
    const aliasMap: Record<string, string> = {
      "espagne": "spain", "usa": "united states", "u.s.a.": "united states",
      "états-unis": "united states", "etats-unis": "united states",
      "angleterre": "england", "écosse": "scotland", "ecosse": "scotland",
      "allemagne": "germany", "italie": "italy", "pays-bas": "netherlands",
      "holland": "netherlands", "belgique": "belgium", "ireland": "republic of ireland",
    };
    const aliased = aliasMap[key];
    return aliased ? idx.countryByLowerName.get(aliased) ?? null : null;
  };

  // Quality buckets
  const buckets = useMemo(() => {
    const leagues = data?.leagues ?? [];
    const clubs = data?.clubs ?? [];
    const stadiums = data?.stadiums ?? [];
    return {
      leaguesWithoutCountry: leagues.filter((l) => !l.country_id && l.league_type !== "continental"),
      clubsWithoutLeague: clubs.filter((c) => !c.league || !c.league.trim()),
      clubsWithoutCountry: clubs.filter((c) => !resolveCountry(c.country)),
      stadiumsWithoutCountry: stadiums.filter((s) => !resolveCountry(s.country)),
    };
  }, [data, idx]);

  // Tree: confederation → country → league → { clubs, stadiums, leagueRow? }
  type LeafNode = { clubs: Club[]; stadiums: Stadium[]; league?: League };
  const tree = useMemo(() => {
    const root = new Map<string, Map<string, Map<string, LeafNode>>>();
    const ensure = (conf: string, country: string, league: string): LeafNode => {
      if (!root.has(conf)) root.set(conf, new Map());
      const c = root.get(conf)!;
      if (!c.has(country)) c.set(country, new Map());
      const co = c.get(country)!;
      if (!co.has(league)) co.set(league, { clubs: [], stadiums: [] });
      return co.get(league)!;
    };
    const confLabel = (id: string | null | undefined) =>
      id ? idx.confById.get(id)?.name ?? UNASSIGNED : UNASSIGNED;

    // Seed every league
    (data?.leagues ?? []).forEach((l) => {
      const confName = l.league_type === "continental" ? "UEFA" : confLabel(l.confederation_id);
      const countryName = l.country_id ? idx.countryById.get(l.country_id)?.name ?? l.country : l.country;
      const node = ensure(confName, countryName || UNASSIGNED, l.league_name);
      node.league = l;
    });

    // Attach clubs
    (data?.clubs ?? []).forEach((c) => {
      const country = resolveCountry(c.country);
      const confName = country?.confederation_id ? confLabel(country.confederation_id) : UNASSIGNED;
      const countryName = country?.name ?? c.country ?? UNASSIGNED;
      const node = ensure(confName, countryName, c.league || "— No league —");
      node.clubs.push(c);
    });

    // Attach stadiums (only if not already represented by a club's league/country)
    (data?.stadiums ?? []).forEach((s) => {
      const country = resolveCountry(s.country);
      const confName = country?.confederation_id ? confLabel(country.confederation_id) : UNASSIGNED;
      const countryName = country?.name ?? s.country ?? UNASSIGNED;
      const node = ensure(confName, countryName, s.league || "— No league —");
      node.stadiums.push(s);
    });

    return root;
  }, [data, idx]);

  const allLeagues = useMemo(() => {
    const set = new Set<string>();
    (data?.leagues ?? []).forEach((l) => set.add(l.league_name));
    (data?.clubs || []).forEach((c) => c.league && set.add(c.league));
    return Array.from(set).sort();
  }, [data]);

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  };
  const matchesSearch = (s: string) => matchesQuery(s, q);

  const confOrder = [...CONF_ORDER, UNASSIGNED];

  // ---------- Filter overlay list ----------
  const filterList = useMemo(() => {
    switch (filter) {
      case "leagues_without_country":
        return {
          title: "Leagues without a country",
          rows: buckets.leaguesWithoutCountry.map((l) => ({
            key: l.id, label: l.league_name, sub: `${l.country} · ${l.league_type}`,
          })),
        };
      case "clubs_without_league":
        return {
          title: "Clubs without a league",
          rows: buckets.clubsWithoutLeague.map((c) => ({
            key: c.slug, label: c.club_name, sub: c.country || "—",
          })),
        };
      case "clubs_without_country":
        return {
          title: "Clubs without a recognized country",
          rows: buckets.clubsWithoutCountry.map((c) => ({
            key: c.slug, label: c.club_name, sub: c.country || "(no country)",
          })),
        };
      case "stadiums_without_country":
        return {
          title: "Stadiums without a recognized country",
          rows: buckets.stadiumsWithoutCountry.map((s) => ({
            key: s.slug, label: s.stadium_name, sub: s.country || "(no country)",
          })),
        };
      default:
        return null;
    }
  }, [filter, buckets]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Leagues</h1>
          <p className="text-xs text-muted-foreground">
            Confederation → Country → League · {data?.leagues.length ?? 0} leagues · {data?.clubs.length ?? 0} clubs · {data?.stadiums.length ?? 0} stadiums
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by league, country, club…" className="pl-9" />
        </div>
      </header>

      {/* Data Quality Panel */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <QualityCard icon={Shield} label="Confederations" value={data?.confederations.length ?? 0} tone="neutral" />
        <QualityCard icon={Globe2} label="Countries" value={data?.countries.length ?? 0} tone="neutral" />
        <QualityCard icon={Trophy} label="Leagues" value={data?.leagues.length ?? 0} tone="neutral" />
        <QualityCard icon={AlertTriangle} label="Leagues w/o country" value={buckets.leaguesWithoutCountry.length}
          tone={buckets.leaguesWithoutCountry.length ? "warn" : "ok"}
          active={filter === "leagues_without_country"}
          onClick={() => setFilter(filter === "leagues_without_country" ? "none" : "leagues_without_country")} />
        <QualityCard icon={AlertTriangle} label="Clubs w/o league" value={buckets.clubsWithoutLeague.length}
          tone={buckets.clubsWithoutLeague.length ? "warn" : "ok"}
          active={filter === "clubs_without_league"}
          onClick={() => setFilter(filter === "clubs_without_league" ? "none" : "clubs_without_league")} />
        <QualityCard icon={AlertTriangle} label="Clubs w/o country" value={buckets.clubsWithoutCountry.length}
          tone={buckets.clubsWithoutCountry.length ? "warn" : "ok"}
          active={filter === "clubs_without_country"}
          onClick={() => setFilter(filter === "clubs_without_country" ? "none" : "clubs_without_country")} />
        <QualityCard icon={AlertTriangle} label="Stadiums w/o country" value={buckets.stadiumsWithoutCountry.length}
          tone={buckets.stadiumsWithoutCountry.length ? "warn" : "ok"}
          active={filter === "stadiums_without_country"}
          onClick={() => setFilter(filter === "stadiums_without_country" ? "none" : "stadiums_without_country")} />
      </div>

      {/* Filter list panel */}
      {filterList && (
        <Card className="border-amber-300">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b bg-amber-50">
              <p className="text-sm font-extrabold text-amber-900">{filterList.title} · {filterList.rows.length}</p>
              <Button variant="ghost" size="sm" onClick={() => setFilter("none")} className="h-7 px-2">
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="max-h-96 overflow-auto divide-y">
              {filterList.rows.length === 0 && <p className="p-3 text-xs text-muted-foreground">All clean ✓</p>}
              {filterList.rows.map((r) => (
                <div key={r.key} className="px-3 py-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground truncate mr-3">{r.label}</span>
                  <span className="text-muted-foreground shrink-0">{r.sub}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {confOrder.filter((c) => tree.has(c)).map((conf) => {
            const countries = tree.get(conf)!;
            const isOpen = openConfs.has(conf);
            const totalLeagues = Array.from(countries.values()).reduce((acc, m) => acc + m.size, 0);
            const totalClubs = Array.from(countries.values()).reduce(
              (acc, m) => acc + Array.from(m.values()).reduce((a, n) => a + n.clubs.length, 0), 0);
            const confLabel = conf === UNASSIGNED ? "Unassigned" : conf;
            return (
              <Card key={conf} className="overflow-hidden">
                <button onClick={() => toggle(openConfs, conf, setOpenConfs)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/40 transition text-left">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <p className="font-extrabold text-foreground flex-1">{confLabel}</p>
                  <Badge variant="outline" className="text-[10px]">{countries.size} countries · {totalLeagues} leagues · {totalClubs} clubs</Badge>
                </button>
                {isOpen && (
                  <div className="border-t bg-muted/10">
                    {Array.from(countries.entries())
                      .filter(([country, leagues]) => matchesSearch(country) || Array.from(leagues.keys()).some(matchesSearch))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([country, leagues]) => {
                        const ckey = `${conf}/${country}`;
                        const isCountryOpen = openCountries.has(ckey);
                        const countryClubs = Array.from(leagues.values()).reduce((a, n) => a + n.clubs.length, 0);
                        const countryLabel = country === UNASSIGNED ? "(unassigned country)" : country;
                        return (
                          <div key={ckey}>
                            <button onClick={() => toggle(openCountries, ckey, setOpenCountries)}
                              className="w-full flex items-center gap-2 px-3 py-2 pl-8 hover:bg-muted/30 transition text-left border-t">
                              {isCountryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="font-bold text-sm text-foreground flex-1">{countryLabel}</p>
                              <span className="text-[10px] text-muted-foreground">{leagues.size} leagues · {countryClubs} clubs</span>
                            </button>
                            {isCountryOpen && (
                              <div className="bg-background">
                                {Array.from(leagues.entries())
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([league, node]) => {
                                    const lkey = `${ckey}/${league}`;
                                    const isLeagueOpen = openLeagues.has(lkey);
                                    return (
                                      <div key={lkey} className="border-t">
                                        <button onClick={() => toggle(openLeagues, lkey, setOpenLeagues)}
                                          className="w-full flex items-center gap-2 px-3 py-2 pl-14 hover:bg-muted/20 transition text-left">
                                          {isLeagueOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                          <p className="font-semibold text-sm text-foreground flex-1">{league}</p>
                                          {node.league?.tier_level && (
                                            <Badge variant="outline" className="text-[10px]">T{node.league.tier_level}</Badge>
                                          )}
                                          {node.league?.league_type && node.league.league_type !== "domestic" && (
                                            <Badge variant="outline" className="text-[10px] capitalize">{node.league.league_type}</Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Users className="w-3 h-3" />{node.clubs.length}</span>
                                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{node.stadiums.length}</span>
                                        </button>
                                        {isLeagueOpen && (
                                          <div className="px-3 pb-3 pl-14 space-y-3">
                                            {node.clubs.length > 0 && (
                                              <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Clubs</p>
                                                <div className="grid sm:grid-cols-2 gap-1.5">
                                                  {node.clubs.map((c) => (
                                                    <div key={c.slug} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                                                      <div className="w-7 h-7 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                                        {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-contain" /> : <Trophy className="w-3 h-3 text-muted-foreground" />}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <Link to={`/clubs/${c.slug}`} className="text-xs font-bold text-foreground hover:text-emerald-600 truncate block">{c.club_name}</Link>
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                          {c.stadium_slug ? <Link to={`/stadiums/${c.stadium_slug}`} className="hover:text-emerald-600">🏟 {c.stadium_name}</Link> : <span className="text-amber-700">no stadium</span>}
                                                        </p>
                                                      </div>
                                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => setMoving(c)}>
                                                        <ArrowRightLeft className="w-3 h-3" />
                                                      </Button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            {node.stadiums.length > 0 && (
                                              <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Stadiums</p>
                                                <div className="grid sm:grid-cols-2 gap-1.5">
                                                  {node.stadiums.map((s) => (
                                                    <Link key={s.slug} to={`/stadiums/${s.slug}`} className="flex items-center gap-2 rounded-lg border bg-card p-2 hover:border-emerald-500 transition">
                                                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate">{s.stadium_name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{s.clubs?.join(", ") || "no clubs"}</p>
                                                      </div>
                                                    </Link>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <MoveClubDialog
        club={moving}
        allLeagues={allLeagues}
        open={!!moving}
        onClose={() => setMoving(null)}
        onMoved={() => qc.invalidateQueries({ queryKey: ["admin-leagues-hierarchy-v2"] })}
      />
    </div>
  );
};

// ---------- Quality card ----------
const QualityCard = ({
  icon: Icon, label, value, tone, active, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
  tone: "neutral" | "warn" | "ok";
  active?: boolean;
  onClick?: () => void;
}) => {
  const toneCls = tone === "warn"
    ? "border-amber-200 hover:border-amber-400"
    : tone === "ok"
    ? "border-emerald-200"
    : "border-slate-200";
  const activeCls = active ? "ring-2 ring-amber-500 border-amber-500" : "";
  const valueCls = tone === "warn" ? "text-amber-700" : tone === "ok" ? "text-emerald-700" : "text-slate-900";
  const Wrap = onClick ? "button" : "div";
  return (
    <Wrap
      onClick={onClick}
      className={`text-left rounded-xl border bg-white p-3 transition ${toneCls} ${activeCls} ${onClick ? "cursor-pointer hover:shadow-sm" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className={`text-xl font-extrabold mt-0.5 ${valueCls}`}>{value.toLocaleString()}</div>
    </Wrap>
  );
};

export default AdminLeaguesPage;
