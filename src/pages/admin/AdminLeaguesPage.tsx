import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trophy, ChevronRight, ChevronDown, Shield, MapPin, AlertTriangle,
  Loader2, Search, Building2, Archive, GitMerge, Pencil, X, CheckCircle2, Globe2,
} from "lucide-react";
import { toast } from "sonner";
import { matchesQuery } from "@/lib/normalize";

/* ============================================================
 * LM3.5 — Football Operations Center
 * Country → League → Verified Clubs
 * ============================================================ */

type LeagueRow = {
  id: string;
  league_name: string;
  slug: string | null;
  country_id: string | null;
  country: string | null;
  is_active: boolean;
  publication_status: string;
  archived_at: string | null;
  expected_club_count: number | null;
};

type ClubRow = {
  id: string;
  slug: string;
  club_name: string;
  display_name: string | null;
  official_name: string | null;
  short_name: string | null;
  country_id: string | null;
  primary_league_id: string | null;
  home_stadium_id: string | null;
  publication_status: string;
  club_type: string | null;
  crest_url: string | null;
  conference: string | null;
  archived_at: string | null;
};

type TicketingRow = { club_id: string | null };
type CountryRow = { id: string; name: string };
type StadiumRow = { id: string; stadium_name: string; country_id: string | null };

const UNASSIGNED = "__unassigned__";

/* ============================================================
 * EDIT CLUB DIALOG
 * ============================================================ */
const EditClubDialog = ({
  club, countries, leagues, stadiums, open, onClose, onSaved,
}: {
  club: ClubRow | null;
  countries: CountryRow[];
  leagues: LeagueRow[];
  stadiums: StadiumRow[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    display_name: "",
    official_name: "",
    country_id: "" as string,
    primary_league_id: "" as string,
    home_stadium_id: "" as string,
    publication_status: "draft",
    conference: "" as string,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (club) {
      setForm({
        display_name: club.display_name || club.club_name || "",
        official_name: club.official_name || club.club_name || "",
        country_id: club.country_id || "",
        primary_league_id: club.primary_league_id || "",
        home_stadium_id: club.home_stadium_id || "",
        publication_status: club.publication_status || "draft",
        conference: club.conference || "",
      });
    }
  }, [club]);

  const eligibleLeagues = useMemo(
    () => leagues.filter((l) => !l.archived_at && (!form.country_id || l.country_id === form.country_id)),
    [leagues, form.country_id],
  );
  const eligibleStadiums = useMemo(
    () => stadiums.filter((s) => !form.country_id || s.country_id === form.country_id),
    [stadiums, form.country_id],
  );

  const save = async () => {
    if (!club) return;
    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("clubs").update({
        display_name: form.display_name.trim(),
        official_name: form.official_name.trim() || form.display_name.trim(),
        club_name: form.display_name.trim(),
        country_id: form.country_id || null,
        primary_league_id: form.primary_league_id || null,
        home_stadium_id: form.home_stadium_id || null,
        publication_status: form.publication_status,
        conference: form.conference || null,
        updated_at: new Date().toISOString(),
      }).eq("id", club.id);
      if (error) throw error;
      toast.success("Club updated");
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit club</DialogTitle>
          <DialogDescription>Update club identity, country, league and home stadium.</DialogDescription>
        </DialogHeader>
        {club && (
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase font-bold text-muted-foreground">Display name (public)</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Inter Milan" />
            </div>
            <div>
              <Label className="text-[11px] uppercase font-bold text-muted-foreground">Official name</Label>
              <Input value={form.official_name} onChange={(e) => setForm({ ...form, official_name: e.target.value })} placeholder="Football Club Internazionale Milano" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] uppercase font-bold text-muted-foreground">Country</Label>
                <Select value={form.country_id || UNASSIGNED} onValueChange={(v) => setForm({ ...form, country_id: v === UNASSIGNED ? "" : v, primary_league_id: "", home_stadium_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Choose country" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value={UNASSIGNED}>— None —</SelectItem>
                    {countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase font-bold text-muted-foreground">Status</Label>
                <Select value={form.publication_status} onValueChange={(v) => setForm({ ...form, publication_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase font-bold text-muted-foreground">League</Label>
              <Select value={form.primary_league_id || UNASSIGNED} onValueChange={(v) => setForm({ ...form, primary_league_id: v === UNASSIGNED ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Choose league" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={UNASSIGNED}>— None —</SelectItem>
                  {eligibleLeagues.map((l) => <SelectItem key={l.id} value={l.id}>{l.league_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase font-bold text-muted-foreground">Home stadium</Label>
              <Select value={form.home_stadium_id || UNASSIGNED} onValueChange={(v) => setForm({ ...form, home_stadium_id: v === UNASSIGNED ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Choose stadium" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={UNASSIGNED}>— None —</SelectItem>
                  {eligibleStadiums.map((s) => <SelectItem key={s.id} value={s.id}>{s.stadium_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase font-bold text-muted-foreground">Conference (MLS only)</Label>
              <Select value={form.conference || UNASSIGNED} onValueChange={(v) => setForm({ ...form, conference: v === UNASSIGNED ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>— None —</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
 * MERGE LEAGUE DIALOG
 * ============================================================ */
const MergeLeagueDialog = ({
  source, leagues, open, onClose, onMerged,
}: {
  source: LeagueRow | null;
  leagues: LeagueRow[];
  open: boolean;
  onClose: () => void;
  onMerged: () => void;
}) => {
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);

  const targets = useMemo(
    () => leagues.filter((l) => !l.archived_at && source && l.id !== source.id),
    [leagues, source],
  );

  const run = async () => {
    if (!source || !targetId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("fn_merge_leagues", {
        p_target_id: targetId, p_source_id: source.id, p_reason: null,
      });
      if (error) throw error;
      const moved = (data as { clubs_moved?: number })?.clubs_moved ?? 0;
      toast.success(`Merged ${source.league_name} → target. ${moved} club${moved === 1 ? "" : "s"} moved.`);
      setTargetId("");
      onMerged();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitMerge className="w-4 h-4" /> Merge league</DialogTitle>
          <DialogDescription>All clubs, ticketing profiles and seasons move to the target. The source is archived.</DialogDescription>
        </DialogHeader>
        {source && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">Source (will be archived)</p>
              <p className="font-bold text-sm">{source.league_name} <span className="text-muted-foreground">· {source.country}</span></p>
            </div>
            <div>
              <Label className="text-[11px] uppercase font-bold text-muted-foreground">Merge into</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Choose target league" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {targets.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.league_name} · {l.country || "—"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={run} disabled={busy || !targetId} className="gap-2 bg-amber-600 hover:bg-amber-700">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />} Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================
 * PAGE
 * ============================================================ */
export const AdminLeaguesPage = () => {
  useLanguage();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [openCountries, setOpenCountries] = useState<Set<string>>(new Set());
  const [openLeagues, setOpenLeagues] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ClubRow | null>(null);
  const [merging, setMerging] = useState<LeagueRow | null>(null);
  const [expectedFor, setExpectedFor] = useState<LeagueRow | null>(null);
  const [activeFilter, setActiveFilter] = useState<null | "no_country" | "no_league" | "no_stadium" | "empty_league" | "oversize_league" | "occupancy_mismatch">(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-leagues-lm35"],
    queryFn: async () => {
      const [countriesRes, leaguesRes, clubsRes, ticketingRes, stadiumsRes] = await Promise.all([
        supabase.from("countries").select("id,name").order("name"),
        supabase.from("league_publication").select("id,league_name,slug,country_id,country,is_active,publication_status,archived_at,expected_club_count"),
        supabase.from("clubs").select("id,slug,club_name,display_name,official_name,short_name,country_id,primary_league_id,home_stadium_id,publication_status,club_type,crest_url,conference,archived_at"),
        supabase.from("club_ticketing_profiles").select("club_id").is("archived_at", null),
        supabase.from("stadiums").select("id,stadium_name,country_id").is("archived_at", null).order("stadium_name"),
      ]);
      if (countriesRes.error) throw countriesRes.error;
      if (leaguesRes.error) throw leaguesRes.error;
      if (clubsRes.error) throw clubsRes.error;
      if (ticketingRes.error) throw ticketingRes.error;
      if (stadiumsRes.error) throw stadiumsRes.error;
      return {
        countries: (countriesRes.data || []) as CountryRow[],
        leagues: (leaguesRes.data || []) as LeagueRow[],
        clubs: (clubsRes.data || []) as ClubRow[],
        ticketing: (ticketingRes.data || []) as TicketingRow[],
        stadiums: (stadiumsRes.data || []) as StadiumRow[],
      };
    },
  });

  const verifiedSet = useMemo(() => {
    const s = new Set<string>();
    data?.ticketing.forEach((t) => t.club_id && s.add(t.club_id));
    return s;
  }, [data]);

  // Apply verified-only filter to clubs
  const filteredClubs = useMemo(() => {
    if (!data) return [];
    return data.clubs.filter((c) => {
      if (c.archived_at) return false;
      if (verifiedOnly && !verifiedSet.has(c.id)) return false;
      return true;
    });
  }, [data, verifiedOnly, verifiedSet]);

  // All non-archived clubs by league (used for occupancy regardless of verifiedOnly)
  const clubsCountByLeague = useMemo(() => {
    const m = new Map<string, number>();
    data?.clubs.forEach((c) => {
      if (c.archived_at) return;
      if (c.primary_league_id) m.set(c.primary_league_id, (m.get(c.primary_league_id) || 0) + 1);
    });
    return m;
  }, [data]);

  // Stats
  const stats = useMemo(() => {
    if (!data) return null;
    const activeLeagues = data.leagues.filter((l) => !l.archived_at);
    const verifiedClubs = data.clubs.filter((c) => !c.archived_at && verifiedSet.has(c.id));
    const operationalClubs = verifiedOnly ? verifiedClubs : data.clubs.filter((c) => !c.archived_at);
    const noCountry = operationalClubs.filter((c) => !c.country_id);
    const noLeague = operationalClubs.filter((c) => !c.primary_league_id);
    const noStadium = operationalClubs.filter((c) => !c.home_stadium_id);

    const emptyLeagues = activeLeagues.filter((l) => (clubsCountByLeague.get(l.id) || 0) === 0);
    const oversize = activeLeagues.filter((l) => {
      const actual = clubsCountByLeague.get(l.id) || 0;
      const exp = l.expected_club_count ?? 0;
      return exp > 0 ? actual > exp : actual > 25;
    });
    const occupancyMismatch = activeLeagues.filter((l) => {
      if (!l.expected_club_count) return false;
      return (clubsCountByLeague.get(l.id) || 0) !== l.expected_club_count;
    });

    return {
      countries: data.countries.length,
      leagues: activeLeagues.length,
      verified: verifiedClubs.length,
      noCountry, noLeague, noStadium, emptyLeagues, oversize, occupancyMismatch,
    };
  }, [data, verifiedSet, verifiedOnly, clubsCountByLeague]);

  // Build hierarchy: country -> league -> clubs
  const tree = useMemo(() => {
    if (!data) return [];
    const countryMap = new Map(data.countries.map((c) => [c.id, c.name]));
    const activeLeagues = data.leagues.filter((l) => !l.archived_at);

    type LeagueNode = { league: LeagueRow; clubs: ClubRow[] };
    type CountryNode = { id: string; name: string; leagues: LeagueNode[]; unassignedClubs: ClubRow[] };

    const countries = new Map<string, CountryNode>();
    const ensureCountry = (id: string | null): CountryNode => {
      const key = id || UNASSIGNED;
      if (!countries.has(key)) {
        countries.set(key, {
          id: key,
          name: id ? countryMap.get(id) || "Unknown country" : "— No country —",
          leagues: [],
          unassignedClubs: [],
        });
      }
      return countries.get(key)!;
    };

    activeLeagues.forEach((l) => {
      const node = ensureCountry(l.country_id);
      node.leagues.push({ league: l, clubs: [] });
    });

    filteredClubs.forEach((c) => {
      // Apply quality filter
      if (activeFilter === "no_country" && c.country_id) return;
      if (activeFilter === "no_league" && c.primary_league_id) return;
      if (activeFilter === "no_stadium" && c.home_stadium_id) return;

      const country = ensureCountry(c.country_id);
      if (c.primary_league_id) {
        const lnode = country.leagues.find((x) => x.league.id === c.primary_league_id);
        if (lnode) lnode.clubs.push(c);
        else country.unassignedClubs.push(c);
      } else {
        country.unassignedClubs.push(c);
      }
    });

    let arr = Array.from(countries.values());

    if (activeFilter === "empty_league") {
      arr = arr.map((c) => ({
        ...c,
        leagues: c.leagues.filter((ln) => ln.clubs.length === 0),
        unassignedClubs: [],
      })).filter((c) => c.leagues.length > 0);
    } else if (activeFilter === "oversize_league") {
      arr = arr.map((c) => ({
        ...c,
        leagues: c.leagues.filter((ln) => {
          const exp = ln.league.expected_club_count ?? 0;
          return exp > 0 ? (clubsCountByLeague.get(ln.league.id) || 0) > exp : ln.clubs.length > 25;
        }),
        unassignedClubs: [],
      })).filter((c) => c.leagues.length > 0);
    } else if (activeFilter === "occupancy_mismatch") {
      arr = arr.map((c) => ({
        ...c,
        leagues: c.leagues.filter((ln) => {
          const exp = ln.league.expected_club_count;
          if (!exp) return false;
          return (clubsCountByLeague.get(ln.league.id) || 0) !== exp;
        }),
        unassignedClubs: [],
      })).filter((c) => c.leagues.length > 0);
    } else if (activeFilter === "no_country") {
      arr = arr.filter((c) => c.id === UNASSIGNED);
    } else if (activeFilter === "no_league") {
      arr = arr.map((c) => ({ ...c, leagues: [] })).filter((c) => c.unassignedClubs.length > 0);
    } else if (activeFilter === "no_stadium") {
      // already filtered in clubs; just drop empty leagues
      arr = arr.map((c) => ({
        ...c,
        leagues: c.leagues.filter((ln) => ln.clubs.length > 0),
      })).filter((c) => c.leagues.length > 0 || c.unassignedClubs.length > 0);
    }

    // Search filter
    if (q.trim()) {
      arr = arr.map((c) => {
        const matchCountry = matchesQuery(c.name, q);
        return {
          ...c,
          leagues: c.leagues
            .map((ln) => {
              const matchLeague = matchesQuery(ln.league.league_name, q);
              const clubs = ln.clubs.filter((cl) =>
                matchCountry || matchLeague ||
                matchesQuery(cl.display_name || cl.club_name, q) ||
                matchesQuery(cl.official_name || "", q),
              );
              return matchLeague || matchCountry ? ln : { ...ln, clubs };
            })
            .filter((ln) => ln.clubs.length > 0 || matchesQuery(ln.league.league_name, q) || matchCountry),
          unassignedClubs: c.unassignedClubs.filter((cl) =>
            matchCountry || matchesQuery(cl.display_name || cl.club_name, q),
          ),
        };
      }).filter((c) => c.leagues.length > 0 || c.unassignedClubs.length > 0 || matchesQuery(c.name, q));
    }

    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [data, filteredClubs, q, activeFilter]);

  const toggleCountry = (id: string) => setOpenCountries((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleLeague = (id: string) => setOpenLeagues((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const archiveLeague = async (l: LeagueRow) => {
    if (!confirm(`Archive league "${l.league_name}"? It will be hidden from operations.`)) return;
    try {
      const { error } = await supabase.rpc("fn_archive_league", { p_league_id: l.id, p_reason: null });
      if (error) throw error;
      toast.success(`Archived ${l.league_name}`);
      qc.invalidateQueries({ queryKey: ["admin-leagues-lm35"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Archive failed");
    }
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-leagues-lm35"] });

  if (isLoading || !data || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Football Operations
          </h1>
          <p className="text-sm text-muted-foreground">Country → League → Verified Clubs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
            <Switch id="verifiedOnly" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <Label htmlFor="verifiedOnly" className="text-xs font-bold cursor-pointer">Verified clubs only</Label>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 w-56" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Globe2 className="w-4 h-4" />} label="Countries" value={stats.countries} />
        <StatCard icon={<Trophy className="w-4 h-4" />} label="Leagues" value={stats.leagues} />
        <StatCard icon={<Shield className="w-4 h-4" />} label="Verified clubs" value={stats.verified} />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="No country" value={stats.noCountry.length}
          tone={stats.noCountry.length > 0 ? "warn" : undefined}
          active={activeFilter === "no_country"}
          onClick={() => setActiveFilter(activeFilter === "no_country" ? null : "no_country")}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="No league" value={stats.noLeague.length}
          tone={stats.noLeague.length > 0 ? "warn" : undefined}
          active={activeFilter === "no_league"}
          onClick={() => setActiveFilter(activeFilter === "no_league" ? null : "no_league")}
        />
        <StatCard
          icon={<Building2 className="w-4 h-4" />}
          label="No stadium" value={stats.noStadium.length}
          tone={stats.noStadium.length > 0 ? "warn" : undefined}
          active={activeFilter === "no_stadium"}
          onClick={() => setActiveFilter(activeFilter === "no_stadium" ? null : "no_stadium")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label={`Empty leagues (${verifiedOnly ? "verified" : "all"})`} value={stats.emptyLeagues.length}
          tone={stats.emptyLeagues.length > 0 ? "warn" : undefined}
          active={activeFilter === "empty_league"}
          onClick={() => setActiveFilter(activeFilter === "empty_league" ? null : "empty_league")}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Oversize leagues" value={stats.oversize.length}
          tone={stats.oversize.length > 0 ? "warn" : undefined}
          active={activeFilter === "oversize_league"}
          onClick={() => setActiveFilter(activeFilter === "oversize_league" ? null : "oversize_league")}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Occupancy mismatch" value={stats.occupancyMismatch.length}
          tone={stats.occupancyMismatch.length > 0 ? "warn" : undefined}
          active={activeFilter === "occupancy_mismatch"}
          onClick={() => setActiveFilter(activeFilter === "occupancy_mismatch" ? null : "occupancy_mismatch")}
        />
      </div>

      {activeFilter && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Filter:</span>
          <Badge variant="secondary" className="gap-1">
            {activeFilter.replace("_", " ")}
            <button onClick={() => setActiveFilter(null)}><X className="w-3 h-3" /></button>
          </Badge>
        </div>
      )}

      {/* Hierarchy */}
      <Card>
        <CardContent className="p-2">
          {tree.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results. {verifiedOnly && "Try turning off Verified clubs only."}
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((country) => {
                const cOpen = openCountries.has(country.id) || !!q || !!activeFilter;
                const clubCount = country.leagues.reduce((a, b) => a + b.clubs.length, 0) + country.unassignedClubs.length;
                return (
                  <div key={country.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCountry(country.id)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        {cOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Globe2 className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-sm">{country.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{clubCount} clubs · {country.leagues.length} leagues</Badge>
                    </button>
                    {cOpen && (
                      <div className="px-2 pb-2 space-y-1 bg-muted/20">
                        {country.leagues.map(({ league, clubs }) => {
                          const lOpen = openLeagues.has(league.id) || !!q || !!activeFilter;
                          return (
                            <div key={league.id} className="border rounded-md bg-card">
                              <div className="flex items-center justify-between gap-2 px-3 py-2">
                                <button
                                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                  onClick={() => toggleLeague(league.id)}
                                >
                                  {lOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="font-semibold text-sm truncate">{league.league_name}</span>
                                  {(() => {
                                    const actual = clubsCountByLeague.get(league.id) || 0;
                                    const exp = league.expected_club_count;
                                    if (!exp) {
                                      return <Badge variant="outline" className="text-[10px]">{actual}</Badge>;
                                    }
                                    const diff = actual - exp;
                                    const tone = diff === 0
                                      ? "bg-emerald-600 text-white"
                                      : "bg-amber-500 text-white";
                                    return (
                                      <Badge className={`text-[10px] ${tone}`} title={`Actual ${actual} / Expected ${exp}`}>
                                        {actual} / {exp}{diff !== 0 ? ` (${diff > 0 ? "+" : ""}${diff})` : ""}
                                      </Badge>
                                    );
                                  })()}
                                  {league.publication_status === "published" && <Badge className="text-[10px] bg-emerald-600">Live</Badge>}
                                </button>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => setExpectedFor(league)} title="Set expected club count">
                                    <Pencil className="w-3.5 h-3.5" /> Expected
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-amber-700" onClick={() => setMerging(league)}>
                                    <GitMerge className="w-3.5 h-3.5" /> Merge
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-red-700" onClick={() => archiveLeague(league)}>
                                    <Archive className="w-3.5 h-3.5" /> Archive
                                  </Button>
                                </div>
                              </div>
                              {lOpen && (
                                <div className="px-3 pb-2 space-y-1">
                                  {clubs.length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground italic pl-6 py-1">No clubs in this league{verifiedOnly ? " (verified only)" : ""}.</p>
                                  ) : clubs.map((c) => (
                                    <ClubRowItem
                                      key={c.id}
                                      club={c}
                                      verified={verifiedSet.has(c.id)}
                                      onEdit={() => setEditing(c)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {country.unassignedClubs.length > 0 && (
                          <div className="border border-dashed rounded-md bg-amber-50/40 dark:bg-amber-950/10 p-2">
                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 px-2 pb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Clubs without a league ({country.unassignedClubs.length})
                            </p>
                            {country.unassignedClubs.map((c) => (
                              <ClubRowItem key={c.id} club={c} verified={verifiedSet.has(c.id)} onEdit={() => setEditing(c)} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EditClubDialog
        club={editing}
        countries={data.countries}
        leagues={data.leagues}
        stadiums={data.stadiums}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
      <MergeLeagueDialog
        source={merging}
        leagues={data.leagues}
        open={!!merging}
        onClose={() => setMerging(null)}
        onMerged={refresh}
      />
      <ExpectedCountDialog
        league={expectedFor}
        open={!!expectedFor}
        onClose={() => setExpectedFor(null)}
        onSaved={refresh}
      />
    </div>
  );
};

/* ============================================================
 * SUB-COMPONENTS
 * ============================================================ */
const StatCard = ({
  icon, label, value, tone, active, onClick,
}: {
  icon: React.ReactNode; label: string; value: number;
  tone?: "warn"; active?: boolean; onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`rounded-xl border bg-card p-3 text-left transition ${
      onClick ? "hover:border-foreground/40 cursor-pointer" : "cursor-default"
    } ${active ? "ring-2 ring-foreground/60 border-foreground/60" : ""} ${
      tone === "warn" && value > 0 ? "border-amber-400/60" : ""
    }`}
  >
    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
      {icon} {label}
    </div>
    <div className={`text-2xl font-black mt-1 ${tone === "warn" && value > 0 ? "text-amber-600" : ""}`}>{value}</div>
  </button>
);

const ClubRowItem = ({
  club, verified, onEdit,
}: { club: ClubRow; verified: boolean; onEdit: () => void }) => (
  <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/60 group">
    <div className="flex items-center gap-2 min-w-0">
      {club.crest_url ? (
        <img src={club.crest_url} alt="" className="w-5 h-5 rounded object-contain" loading="lazy" />
      ) : (
        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
          <Shield className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{club.display_name || club.club_name}</p>
        {club.official_name && club.official_name !== (club.display_name || club.club_name) && (
          <p className="text-[10px] text-muted-foreground truncate">{club.official_name}</p>
        )}
      </div>
      {verified ? (
        <Badge className="text-[9px] bg-emerald-600 shrink-0">Verified</Badge>
      ) : (
        <Badge variant="outline" className="text-[9px] shrink-0">Identity</Badge>
      )}
      {!club.home_stadium_id && (
        <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-400 shrink-0">
          <MapPin className="w-2.5 h-2.5 mr-0.5" /> no stadium
        </Badge>
      )}
    </div>
    <Button size="sm" variant="ghost" className="h-7 gap-1 opacity-0 group-hover:opacity-100 transition" onClick={onEdit}>
      <Pencil className="w-3 h-3" /> Edit
    </Button>
  </div>
);

const ExpectedCountDialog = ({
  league, open, onClose, onSaved,
}: { league: LeagueRow | null; open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [value, setValue] = useState<string>("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setValue(league?.expected_club_count != null ? String(league.expected_club_count) : "");
  }, [league]);
  const save = async () => {
    if (!league) return;
    setBusy(true);
    try {
      const parsed = value.trim() === "" ? null : Number(value);
      if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 200)) {
        toast.error("Enter a number between 0 and 200, or leave blank.");
        setBusy(false);
        return;
      }
      const { error } = await supabase.from("league_publication")
        .update({ expected_club_count: parsed, updated_at: new Date().toISOString() })
        .eq("id", league.id);
      if (error) throw error;
      toast.success(`Expected count saved for ${league.league_name}`);
      onSaved(); onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Expected club count</DialogTitle>
          <DialogDescription>How many clubs should this league contain in a normal season?</DialogDescription>
        </DialogHeader>
        {league && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{league.league_name}</p>
            <Input type="number" min={0} max={200} value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 20" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLeaguesPage;
