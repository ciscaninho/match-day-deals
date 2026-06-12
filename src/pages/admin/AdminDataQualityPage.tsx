import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2, Search, ShieldCheck, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";

/* ============================================================
 * LM3.2 — Football Data Quality Console
 * Source of truth: 120 verified clubs (ticketing-backed)
 * Spreadsheet view + bulk corrections + league validation
 * ============================================================ */

type Club = {
  id: string;
  slug: string;
  club_name: string;
  display_name: string | null;
  country_id: string | null;
  primary_league_id: string | null;
  home_stadium_id: string | null;
  publication_status: string;
  updated_at: string;
};
type League = {
  id: string; league_name: string; country_id: string | null;
  is_active: boolean; archived_at: string | null; expected_club_count: number | null;
};
type Country = { id: string; name: string };
type Stadium = { id: string; stadium_name: string; country_id: string | null };

const ANY = "__any__";
const NONE = "__none__";
const KEEP = "__keep__";

const AdminDataQualityPage = () => {
  const qc = useQueryClient();
  const [filterCountry, setFilterCountry] = useState<string>(ANY);
  const [filterLeague, setFilterLeague] = useState<string>(ANY);
  const [filterMissingStadium, setFilterMissingStadium] = useState(false);
  const [filterMissingLeague, setFilterMissingLeague] = useState(false);
  const [filterMissingCountry, setFilterMissingCountry] = useState(false);
  const [filterMismatchOnly, setFilterMismatchOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState<null | "league" | "country" | "stadium" | "status">(null);
  const [busy, setBusy] = useState(false);

  /* ---------------- DATA ---------------- */
  const verifiedQuery = useQuery({
    queryKey: ["dq:verified-club-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_ticketing_profiles")
        .select("club_id")
        .is("archived_at", null);
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r: any) => r.club_id).filter(Boolean) as string[]));
    },
  });

  const verifiedIds = verifiedQuery.data ?? [];

  const clubsQuery = useQuery({
    enabled: verifiedIds.length > 0,
    queryKey: ["dq:clubs", verifiedIds.length],
    queryFn: async (): Promise<Club[]> => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, slug, club_name, display_name, country_id, primary_league_id, home_stadium_id, publication_status, updated_at")
        .in("id", verifiedIds)
        .is("archived_at", null)
        .order("club_name");
      if (error) throw error;
      return (data ?? []) as Club[];
    },
  });

  const leaguesQuery = useQuery({
    queryKey: ["dq:leagues"],
    queryFn: async (): Promise<League[]> => {
      const { data, error } = await supabase
        .from("league_publication")
        .select("id, league_name, country_id, is_active, archived_at, expected_club_count")
        .is("archived_at", null)
        .order("league_name");
      if (error) throw error;
      return (data ?? []) as League[];
    },
  });

  const countriesQuery = useQuery({
    queryKey: ["dq:countries"],
    queryFn: async (): Promise<Country[]> => {
      const { data, error } = await supabase.from("countries").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as Country[];
    },
  });

  const stadiumsQuery = useQuery({
    queryKey: ["dq:stadiums"],
    queryFn: async (): Promise<Stadium[]> => {
      const { data, error } = await supabase
        .from("stadiums")
        .select("id, stadium_name, country_id")
        .is("archived_at", null)
        .order("stadium_name");
      if (error) throw error;
      return (data ?? []) as Stadium[];
    },
  });

  const loading =
    verifiedQuery.isLoading || clubsQuery.isLoading || leaguesQuery.isLoading ||
    countriesQuery.isLoading || stadiumsQuery.isLoading;

  /* ---------------- DERIVED ---------------- */
  const countryById = useMemo(() => {
    const m = new Map<string, Country>();
    (countriesQuery.data ?? []).forEach(c => m.set(c.id, c));
    return m;
  }, [countriesQuery.data]);
  const leagueById = useMemo(() => {
    const m = new Map<string, League>();
    (leaguesQuery.data ?? []).forEach(l => m.set(l.id, l));
    return m;
  }, [leaguesQuery.data]);
  const stadiumById = useMemo(() => {
    const m = new Map<string, Stadium>();
    (stadiumsQuery.data ?? []).forEach(s => m.set(s.id, s));
    return m;
  }, [stadiumsQuery.data]);

  const clubs = clubsQuery.data ?? [];

  // League occupancy (counting verified clubs only)
  const leagueOccupancy = useMemo(() => {
    const counts = new Map<string, number>();
    clubs.forEach(c => {
      if (c.primary_league_id) counts.set(c.primary_league_id, (counts.get(c.primary_league_id) ?? 0) + 1);
    });
    return (leaguesQuery.data ?? []).map(l => {
      const actual = counts.get(l.id) ?? 0;
      const expected = l.expected_club_count ?? null;
      const diff = expected == null ? null : actual - expected;
      return { league: l, actual, expected, diff };
    }).sort((a, b) => {
      const da = a.diff == null ? -Infinity : Math.abs(a.diff);
      const db = b.diff == null ? -Infinity : Math.abs(b.diff);
      return db - da;
    });
  }, [clubs, leaguesQuery.data]);

  const mismatchLeagueIds = useMemo(
    () => new Set(leagueOccupancy.filter(o => o.diff != null && o.diff !== 0).map(o => o.league.id)),
    [leagueOccupancy],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clubs.filter(c => {
      if (filterCountry !== ANY && c.country_id !== filterCountry) return false;
      if (filterLeague !== ANY) {
        if (filterLeague === NONE ? !!c.primary_league_id : c.primary_league_id !== filterLeague) return false;
      }
      if (filterMissingStadium && c.home_stadium_id) return false;
      if (filterMissingLeague && c.primary_league_id) return false;
      if (filterMissingCountry && c.country_id) return false;
      if (filterMismatchOnly && (!c.primary_league_id || !mismatchLeagueIds.has(c.primary_league_id))) return false;
      if (q) {
        const hay = `${c.club_name} ${c.display_name ?? ""} ${c.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [clubs, filterCountry, filterLeague, filterMissingStadium, filterMissingLeague, filterMissingCountry, filterMismatchOnly, mismatchLeagueIds, search]);

  /* ---------------- ACTIONS ---------------- */
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["dq:clubs", verifiedIds.length] });
  };

  const allSelectedOnPage = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelectedOnPage) filtered.forEach(c => next.delete(c.id));
      else filtered.forEach(c => next.add(c.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const applyBulk = async (patch: Partial<Club>) => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("clubs").update(patch).in("id", ids);
      if (error) throw error;
      toast.success(`Updated ${ids.length} club${ids.length === 1 ? "" : "s"}`);
      setBulkOpen(null);
      clearSelection();
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const countries = countriesQuery.data ?? [];
  const leagues = leaguesQuery.data ?? [];
  const stadiums = stadiumsQuery.data ?? [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h1 className="text-2xl font-extrabold text-slate-900">Football Data Quality</h1>
          <Badge variant="outline" className="ml-2">{clubs.length} verified clubs</Badge>
        </div>
        <p className="text-sm text-slate-600">
          Spreadsheet view of ticketing-backed clubs. Filter, bulk-correct, and audit league occupancy.
        </p>
      </header>

      {/* League Validation Panel */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">League Occupancy (verified clubs only)</h2>
            <Badge variant="outline">
              {leagueOccupancy.filter(o => o.diff != null && o.diff !== 0).length} mismatching
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b">
                <tr>
                  <th className="text-left py-2 pr-3 font-semibold">League</th>
                  <th className="text-right py-2 px-3 font-semibold">Expected</th>
                  <th className="text-right py-2 px-3 font-semibold">Actual</th>
                  <th className="text-right py-2 px-3 font-semibold">Diff</th>
                  <th className="py-2 pl-3 font-semibold w-20"></th>
                </tr>
              </thead>
              <tbody>
                {leagueOccupancy.map(({ league, actual, expected, diff }) => {
                  const cls =
                    diff == null ? "text-slate-400" :
                    diff === 0 ? "text-emerald-600" :
                    Math.abs(diff) >= 3 ? "text-red-600" : "text-amber-600";
                  return (
                    <tr key={league.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-2 pr-3 font-medium text-slate-900">{league.league_name}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{expected ?? "—"}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{actual}</td>
                      <td className={`py-2 px-3 text-right font-bold ${cls}`}>
                        {diff == null ? "—" : (diff > 0 ? `+${diff}` : diff)}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => { setFilterLeague(league.id); setFilterCountry(ANY); }}
                          className="h-7 text-xs"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clubs…"
                className="pl-8 h-9"
              />
            </div>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All countries</SelectItem>
                {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLeague} onValueChange={setFilterLeague}>
              <SelectTrigger className="h-9 w-52"><SelectValue placeholder="League" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All leagues</SelectItem>
                <SelectItem value={NONE}>— No league —</SelectItem>
                {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.league_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm" variant={filterMissingStadium ? "default" : "outline"}
              onClick={() => setFilterMissingStadium(v => !v)}
            >Missing stadium</Button>
            <Button
              size="sm" variant={filterMissingLeague ? "default" : "outline"}
              onClick={() => setFilterMissingLeague(v => !v)}
            >Missing league</Button>
            <Button
              size="sm" variant={filterMissingCountry ? "default" : "outline"}
              onClick={() => setFilterMissingCountry(v => !v)}
            >Missing country</Button>
            <Button
              size="sm" variant={filterMismatchOnly ? "default" : "outline"}
              onClick={() => setFilterMismatchOnly(v => !v)}
            >Occupancy mismatch</Button>
            {(filterCountry !== ANY || filterLeague !== ANY || filterMissingStadium ||
              filterMissingLeague || filterMissingCountry || filterMismatchOnly || search) && (
              <Button
                size="sm" variant="ghost"
                onClick={() => {
                  setFilterCountry(ANY); setFilterLeague(ANY);
                  setFilterMissingStadium(false); setFilterMissingLeague(false);
                  setFilterMissingCountry(false); setFilterMismatchOnly(false);
                  setSearch("");
                }}
              ><X className="w-4 h-4 mr-1" />Clear</Button>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Showing <b>{filtered.length}</b> of {clubs.length} verified clubs
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-14 z-20 bg-slate-900 text-white rounded-lg shadow-lg p-3 flex flex-wrap items-center gap-2">
          <span className="font-semibold mr-2">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={() => setBulkOpen("league")}>Move to league</Button>
          <Button size="sm" variant="secondary" onClick={() => setBulkOpen("country")}>Change country</Button>
          <Button size="sm" variant="secondary" onClick={() => setBulkOpen("stadium")}>Change stadium</Button>
          <Button size="sm" variant="secondary" onClick={() => setBulkOpen("status")}>Publish / Draft</Button>
          <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800 ml-auto" onClick={clearSelection}>
            <X className="w-4 h-4 mr-1" />Clear
          </Button>
        </div>
      )}

      {/* Spreadsheet */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b bg-slate-50 sticky top-0">
              <tr>
                <th className="py-2 pl-3 pr-2 w-9">
                  <Checkbox checked={allSelectedOnPage} onCheckedChange={toggleAll} />
                </th>
                <th className="text-left py-2 px-2 font-semibold">Club</th>
                <th className="text-left py-2 px-2 font-semibold">Display Name</th>
                <th className="text-left py-2 px-2 font-semibold">Country</th>
                <th className="text-left py-2 px-2 font-semibold">League</th>
                <th className="text-left py-2 px-2 font-semibold">Stadium</th>
                <th className="text-left py-2 px-2 font-semibold">Status</th>
                <th className="text-left py-2 px-2 font-semibold">Verified</th>
                <th className="text-left py-2 px-2 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const country = c.country_id ? countryById.get(c.country_id) : null;
                const league = c.primary_league_id ? leagueById.get(c.primary_league_id) : null;
                const stadium = c.home_stadium_id ? stadiumById.get(c.home_stadium_id) : null;
                const mismatch = league && mismatchLeagueIds.has(league.id);
                const isSel = selected.has(c.id);
                return (
                  <tr key={c.id} className={`border-b last:border-0 hover:bg-slate-50 ${isSel ? "bg-emerald-50/40" : ""}`}>
                    <td className="py-2 pl-3 pr-2">
                      <Checkbox checked={isSel} onCheckedChange={() => toggleOne(c.id)} />
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-900">{c.club_name}</td>
                    <td className="py-2 px-2 text-slate-700">{c.display_name ?? <span className="text-slate-400">—</span>}</td>
                    <td className="py-2 px-2 text-slate-700">
                      {country?.name ?? <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />missing</span>}
                    </td>
                    <td className="py-2 px-2 text-slate-700">
                      {league
                        ? <span className={mismatch ? "text-amber-700" : ""}>{league.league_name}</span>
                        : <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />missing</span>}
                    </td>
                    <td className="py-2 px-2 text-slate-700">
                      {stadium?.stadium_name ?? <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />missing</span>}
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={c.publication_status === "published" ? "default" : "outline"} className="capitalize">
                        {c.publication_status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />Locked
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-slate-500">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-10 text-center text-slate-400">No clubs match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <BulkDialog
        kind={bulkOpen}
        onClose={() => setBulkOpen(null)}
        busy={busy}
        countries={countries}
        leagues={leagues}
        stadiums={stadiums}
        onApply={applyBulk}
      />
    </div>
  );
};

/* ============================================================
 * Bulk dialog
 * ============================================================ */
const BulkDialog = ({
  kind, onClose, busy, countries, leagues, stadiums, onApply,
}: {
  kind: null | "league" | "country" | "stadium" | "status";
  onClose: () => void;
  busy: boolean;
  countries: Country[];
  leagues: League[];
  stadiums: Stadium[];
  onApply: (patch: Partial<Club>) => void | Promise<void>;
}) => {
  const [val, setVal] = useState<string>(KEEP);
  if (!kind) return null;

  const titleMap = {
    league: "Move clubs to another league",
    country: "Change country",
    stadium: "Change home stadium",
    status: "Set publication status",
  } as const;

  const handleApply = () => {
    if (val === KEEP) return;
    const patch: Partial<Club> = {};
    const realVal = val === NONE ? null : val;
    if (kind === "league") patch.primary_league_id = realVal as any;
    if (kind === "country") patch.country_id = realVal as any;
    if (kind === "stadium") patch.home_stadium_id = realVal as any;
    if (kind === "status") patch.publication_status = val;
    onApply(patch);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleMap[kind]}</DialogTitle>
          <DialogDescription>Applies to all selected clubs.</DialogDescription>
        </DialogHeader>

        {kind === "status" ? (
          <Select value={val} onValueChange={setVal}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={KEEP}>Choose…</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={val} onValueChange={setVal}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value={KEEP}>Choose…</SelectItem>
              <SelectItem value={NONE}>— Unassign —</SelectItem>
              {kind === "league" && leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.league_name}</SelectItem>)}
              {kind === "country" && countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              {kind === "stadium" && stadiums.map(s => <SelectItem key={s.id} value={s.id}>{s.stadium_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleApply} disabled={busy || val === KEEP}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDataQualityPage;
