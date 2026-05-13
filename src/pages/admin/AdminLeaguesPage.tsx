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
  Trophy, ChevronRight, ChevronDown, Globe2, MapPin, AlertTriangle,
  ArrowRightLeft, Loader2, Search, Building2, Users,
} from "lucide-react";
import { toast } from "sonner";

// ---------- Continent map ----------
const CONTINENT_BY_COUNTRY: Record<string, string> = {
  // Europe
  England: "Europe", Scotland: "Europe", Wales: "Europe", "Northern Ireland": "Europe",
  Spain: "Europe", Italy: "Europe", Germany: "Europe", France: "Europe", Portugal: "Europe",
  Netherlands: "Europe", Belgium: "Europe", Turkey: "Europe", Greece: "Europe", Russia: "Europe",
  Ukraine: "Europe", Poland: "Europe", Austria: "Europe", Switzerland: "Europe", Denmark: "Europe",
  Sweden: "Europe", Norway: "Europe", Finland: "Europe", Croatia: "Europe", Serbia: "Europe",
  Romania: "Europe", "Czech Republic": "Europe", Czechia: "Europe", Hungary: "Europe",
  Ireland: "Europe", Bulgaria: "Europe", Slovakia: "Europe", Slovenia: "Europe",
  // South America
  Brazil: "South America", Argentina: "South America", Uruguay: "South America",
  Chile: "South America", Colombia: "South America", Peru: "South America", Ecuador: "South America",
  Paraguay: "South America", Venezuela: "South America", Bolivia: "South America",
  // North America
  "United States": "North America", USA: "North America", Mexico: "North America",
  Canada: "North America", "Costa Rica": "North America",
  // Asia
  Japan: "Asia", "South Korea": "Asia", China: "Asia", "Saudi Arabia": "Asia", UAE: "Asia",
  Qatar: "Asia", Iran: "Asia", Iraq: "Asia", India: "Asia", Thailand: "Asia", Vietnam: "Asia",
  Indonesia: "Asia", Malaysia: "Asia", Singapore: "Asia", Israel: "Asia",
  // Africa
  Morocco: "Africa", Egypt: "Africa", Algeria: "Africa", Tunisia: "Africa", Nigeria: "Africa",
  "South Africa": "Africa", Senegal: "Africa", Ghana: "Africa", Cameroon: "Africa", "Ivory Coast": "Africa",
  // Oceania
  Australia: "Oceania", "New Zealand": "Oceania",
};
const continentOf = (country: string | null | undefined) => CONTINENT_BY_COUNTRY[country ?? ""] || "Other";

type Club = {
  slug: string; club_name: string; league: string | null; country: string | null;
  stadium_name: string | null; stadium_slug: string | null; logo_url: string | null;
};
type Stadium = {
  slug: string; stadium_name: string; league: string | null; country: string | null;
  clubs: string[] | null;
};

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
    } catch (e: any) { toast.error(e.message || "Move failed"); }
    finally { setBusy(false); }
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
              <p className="text-[10px] text-muted-foreground mt-1">Stadium link follows the club automatically (no change needed).</p>
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

// ---------- Page ----------
export const AdminLeaguesPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [openContinents, setOpenContinents] = useState<Set<string>>(new Set(["Europe"]));
  const [openCountries, setOpenCountries] = useState<Set<string>>(new Set());
  const [openLeagues, setOpenLeagues] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState<Club | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leagues-hierarchy"],
    queryFn: async () => {
      const [clubsRes, stadiumsRes] = await Promise.all([
        supabase.from("club_ticketing_profiles")
          .select("slug,club_name,league,country,stadium_name,stadium_slug,logo_url")
          .is("archived_at", null),
        supabase.from("stadiums")
          .select("slug,stadium_name,league,country,clubs")
          .is("archived_at", null),
      ]);
      return {
        clubs: (clubsRes.data || []) as Club[],
        stadiums: (stadiumsRes.data || []) as Stadium[],
      };
    },
  });

  const tree = useMemo(() => {
    const clubs = data?.clubs || [];
    const stadiums = data?.stadiums || [];
    // continent → country → league → { clubs[], stadiums[] }
    const root = new Map<string, Map<string, Map<string, { clubs: Club[]; stadiums: Stadium[] }>>>();
    const ensure = (continent: string, country: string, league: string) => {
      if (!root.has(continent)) root.set(continent, new Map());
      const c = root.get(continent)!;
      if (!c.has(country)) c.set(country, new Map());
      const co = c.get(country)!;
      if (!co.has(league)) co.set(league, { clubs: [], stadiums: [] });
      return co.get(league)!;
    };
    clubs.forEach((c) => {
      const node = ensure(continentOf(c.country), c.country || "Unknown", c.league || "— No league —");
      node.clubs.push(c);
    });
    stadiums.forEach((s) => {
      const node = ensure(continentOf(s.country), s.country || "Unknown", s.league || "— No league —");
      node.stadiums.push(s);
    });
    return root;
  }, [data]);

  const allLeagues = useMemo(() => {
    const set = new Set<string>();
    (data?.clubs || []).forEach((c) => c.league && set.add(c.league));
    (data?.stadiums || []).forEach((s) => s.league && set.add(s.league));
    return Array.from(set).sort();
  }, [data]);

  // Inconsistencies: stadiums whose league differs from clubs that play there
  const stadiumsWithoutClubs = useMemo(
    () => (data?.stadiums || []).filter((s) => !(s.clubs && s.clubs.length > 0)),
    [data],
  );
  const clubsWithoutLeague = useMemo(
    () => (data?.clubs || []).filter((c) => !c.league),
    [data],
  );
  const clubsWithoutStadium = useMemo(
    () => (data?.clubs || []).filter((c) => !c.stadium_slug),
    [data],
  );

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  const matchesSearch = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());

  const continentOrder = ["Europe", "South America", "North America", "Africa", "Asia", "Oceania", "Other"];

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{t("admin.nav.leagues")}</h1>
          <p className="text-xs text-muted-foreground">
            Continent → Country → League · {data?.clubs.length ?? 0} clubs · {data?.stadiums.length ?? 0} stadiums
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by league, country, club…" className="pl-9" />
        </div>
      </header>

      {/* Inconsistency buckets */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-amber-200">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Clubs without league</p>
            <p className="text-2xl font-extrabold text-foreground">{clubsWithoutLeague.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Clubs without stadium</p>
            <p className="text-2xl font-extrabold text-foreground">{clubsWithoutStadium.length}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Stadiums without clubs</p>
            <p className="text-2xl font-extrabold text-foreground">{stadiumsWithoutClubs.length}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : (
        <div className="space-y-2">
          {continentOrder.filter((c) => tree.has(c)).map((continent) => {
            const countries = tree.get(continent)!;
            const isContOpen = openContinents.has(continent);
            const totalClubs = Array.from(countries.values()).reduce((acc, m) => acc + Array.from(m.values()).reduce((a, n) => a + n.clubs.length, 0), 0);
            return (
              <Card key={continent} className="overflow-hidden">
                <button onClick={() => toggle(openContinents, continent, setOpenContinents)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/40 transition text-left">
                  {isContOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Globe2 className="w-4 h-4 text-emerald-600" />
                  <p className="font-extrabold text-foreground flex-1">{continent}</p>
                  <Badge variant="outline" className="text-[10px]">{countries.size} countries · {totalClubs} clubs</Badge>
                </button>
                {isContOpen && (
                  <div className="border-t bg-muted/10">
                    {Array.from(countries.entries())
                      .filter(([country, leagues]) => matchesSearch(country) || Array.from(leagues.keys()).some(matchesSearch))
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([country, leagues]) => {
                        const ckey = `${continent}/${country}`;
                        const isCountryOpen = openCountries.has(ckey);
                        const countryClubs = Array.from(leagues.values()).reduce((a, n) => a + n.clubs.length, 0);
                        return (
                          <div key={ckey}>
                            <button onClick={() => toggle(openCountries, ckey, setOpenCountries)}
                              className="w-full flex items-center gap-2 px-3 py-2 pl-8 hover:bg-muted/30 transition text-left border-t">
                              {isCountryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="font-bold text-sm text-foreground flex-1">{country}</p>
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
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                          {s.clubs && s.clubs.length > 0 ? s.clubs.join(", ") : <span className="text-amber-700">no clubs linked</span>}
                                                        </p>
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
        onMoved={() => qc.invalidateQueries({ queryKey: ["admin-leagues-hierarchy"] })}
      />
    </div>
  );
};

export default AdminLeaguesPage;
