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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Trophy, Globe2, Search, CheckCircle2, AlertTriangle, Pencil, Loader2,
  ChevronRight, Flag, ListChecks,
} from "lucide-react";
import { toast } from "sonner";

/* ============================================================
 * LM3.3 — Football Validation Workspace
 * Country → League → Club  (no DB jargon)
 * ============================================================ */

type Country = { id: string; name: string; iso2: string | null };
type League = {
  id: string; league_name: string; slug: string | null; country_id: string | null;
  expected_club_count: number | null; archived_at: string | null; is_active: boolean;
};
type Club = {
  id: string; slug: string; club_name: string;
  display_name: string | null; official_name: string | null;
  country_id: string | null; primary_league_id: string | null; home_stadium_id: string | null;
  crest_url: string | null; archived_at: string | null;
  validation_status: "pending" | "validated" | "needs_review";
  validated_at: string | null;
};
type Stadium = { id: string; stadium_name: string; country_id: string | null };

const STATUS_LABEL: Record<Club["validation_status"], string> = {
  pending: "Pending",
  validated: "Validated",
  needs_review: "Needs review",
};

const occColor = (actual: number, expected: number | null) => {
  if (!expected) return "slate";
  const d = Math.abs(actual - expected);
  if (d === 0) return "green";
  if (d <= 2) return "amber";
  return "red";
};

/* ============================================================ */
const EditClubDialog = ({
  club, countries, leagues, stadiums, open, onClose, onSaved,
}: {
  club: Club | null;
  countries: Country[]; leagues: League[]; stadiums: Stadium[];
  open: boolean; onClose: () => void; onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    display_name: "", official_name: "",
    country_id: "" as string | null,
    primary_league_id: "" as string | null,
    home_stadium_id: "" as string | null,
  });
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (!club) return;
    setForm({
      display_name: club.display_name || club.club_name || "",
      official_name: club.official_name || "",
      country_id: club.country_id,
      primary_league_id: club.primary_league_id,
      home_stadium_id: club.home_stadium_id,
    });
  }, [club?.id]);

  if (!club) return null;
  const countryLeagues = leagues.filter(l => !l.archived_at && (!form.country_id || l.country_id === form.country_id));
  const countryStadiums = stadiums.filter(s => !form.country_id || s.country_id === form.country_id);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("clubs").update({
      display_name: form.display_name || null,
      official_name: form.official_name || null,
      country_id: form.country_id || null,
      primary_league_id: form.primary_league_id || null,
      home_stadium_id: form.home_stadium_id || null,
    } as any).eq("id", club.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Club updated");
    onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit {club.club_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Display name</label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Official name</label>
            <Input value={form.official_name} onChange={(e) => setForm({ ...form, official_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Country</label>
            <Select value={form.country_id || ""} onValueChange={(v) => setForm({ ...form, country_id: v, primary_league_id: null, home_stadium_id: null })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">League</label>
            <Select value={form.primary_league_id || ""} onValueChange={(v) => setForm({ ...form, primary_league_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{countryLeagues.map(l => <SelectItem key={l.id} value={l.id}>{l.league_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Stadium</label>
            <Select value={form.home_stadium_id || ""} onValueChange={(v) => setForm({ ...form, home_stadium_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{countryStadiums.map(s => <SelectItem key={s.id} value={s.id}>{s.stadium_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ============================================================ */
const AdminFootballAuditPage = () => {
  const qc = useQueryClient();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Club | null>(null);
  const [issueFilter, setIssueFilter] = useState<"all" | "occupancy" | "no_stadium" | "no_league" | "no_country">("all");

  const { data: countries = [] } = useQuery({
    queryKey: ["fa-countries"],
    queryFn: async () => {
      const { data } = await supabase.from("countries").select("id,name,iso2").order("name");
      return (data || []) as Country[];
    },
  });

  const { data: leagues = [] } = useQuery({
    queryKey: ["fa-leagues"],
    queryFn: async () => {
      const { data } = await supabase.from("league_publication")
        .select("id,league_name,slug,country_id,expected_club_count,archived_at,is_active")
        .is("archived_at", null)
        .order("league_name");
      return (data || []) as League[];
    },
  });

  const { data: clubs = [], isLoading } = useQuery({
    queryKey: ["fa-clubs"],
    queryFn: async () => {
      const { data } = await supabase.from("clubs")
        .select("id,slug,club_name,display_name,official_name,country_id,primary_league_id,home_stadium_id,crest_url,archived_at,validation_status,validated_at")
        .is("archived_at", null)
        .order("club_name");
      return (data || []) as Club[];
    },
  });

  const { data: stadiums = [] } = useQuery({
    queryKey: ["fa-stadiums"],
    queryFn: async () => {
      const { data } = await supabase.from("stadiums").select("id,stadium_name,country_id").is("archived_at", null).order("stadium_name");
      return (data || []) as Stadium[];
    },
  });

  /* derived: country counts (using all non-archived clubs) */
  const countryStats = useMemo(() => {
    const map = new Map<string, { actual: number; validated: number; expected: number }>();
    // expected by country = sum of league expectations
    for (const l of leagues) {
      if (!l.country_id || !l.expected_club_count) continue;
      const cur = map.get(l.country_id) || { actual: 0, validated: 0, expected: 0 };
      cur.expected += l.expected_club_count;
      map.set(l.country_id, cur);
    }
    for (const c of clubs) {
      if (!c.country_id) continue;
      const cur = map.get(c.country_id) || { actual: 0, validated: 0, expected: 0 };
      cur.actual += 1;
      if (c.validation_status === "validated") cur.validated += 1;
      map.set(c.country_id, cur);
    }
    return map;
  }, [clubs, leagues]);

  const orderedCountries = useMemo(() => {
    return countries
      .map(c => ({ ...c, stats: countryStats.get(c.id) || { actual: 0, validated: 0, expected: 0 } }))
      .filter(c => c.stats.actual > 0 || c.stats.expected > 0)
      .sort((a, b) => b.stats.actual - a.stats.actual);
  }, [countries, countryStats]);

  const leagueStats = useMemo(() => {
    const map = new Map<string, { actual: number; validated: number }>();
    for (const c of clubs) {
      if (!c.primary_league_id) continue;
      const cur = map.get(c.primary_league_id) || { actual: 0, validated: 0 };
      cur.actual += 1;
      if (c.validation_status === "validated") cur.validated += 1;
      map.set(c.primary_league_id, cur);
    }
    return map;
  }, [clubs]);

  const visibleLeagues = useMemo(() => {
    const ls = leagues
      .filter(l => !selectedCountry || l.country_id === selectedCountry)
      .map(l => {
        const s = leagueStats.get(l.id) || { actual: 0, validated: 0 };
        const diff = s.actual - (l.expected_club_count || 0);
        return { ...l, actual: s.actual, validated: s.validated, diff };
      });
    return ls.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff) || a.league_name.localeCompare(b.league_name));
  }, [leagues, selectedCountry, leagueStats]);

  const stadiumName = (id: string | null) => stadiums.find(s => s.id === id)?.stadium_name || "—";
  const countryName = (id: string | null) => countries.find(c => c.id === id)?.name || "—";
  const leagueName = (id: string | null) => leagues.find(l => l.id === id)?.league_name || "—";

  const visibleClubs = useMemo(() => {
    let list = clubs;
    if (selectedLeague) list = list.filter(c => c.primary_league_id === selectedLeague);
    else if (selectedCountry) list = list.filter(c => c.country_id === selectedCountry);
    if (issueFilter === "no_stadium") list = list.filter(c => !c.home_stadium_id);
    if (issueFilter === "no_league") list = list.filter(c => !c.primary_league_id);
    if (issueFilter === "no_country") list = list.filter(c => !c.country_id);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.club_name.toLowerCase().includes(q) ||
        (c.display_name || "").toLowerCase().includes(q) ||
        (c.official_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [clubs, selectedLeague, selectedCountry, issueFilter, search]);

  /* global kpis */
  const kpis = useMemo(() => {
    const totalClubs = clubs.length;
    const validatedClubs = clubs.filter(c => c.validation_status === "validated").length;
    const pendingClubs = clubs.filter(c => c.validation_status === "pending").length;
    const needsReviewClubs = clubs.filter(c => c.validation_status === "needs_review").length;
    const totalLeagues = leagues.length;
    const validatedLeagues = leagues.filter(l => {
      const s = leagueStats.get(l.id);
      if (!s || !l.expected_club_count) return false;
      return s.actual === l.expected_club_count && s.validated === s.actual;
    }).length;
    const totalCountries = orderedCountries.length;
    const validatedCountries = orderedCountries.filter(c => {
      const exp = c.stats.expected;
      return exp > 0 && c.stats.actual === exp && c.stats.validated === c.stats.actual;
    }).length;
    return { totalClubs, validatedClubs, pendingClubs, needsReviewClubs, totalLeagues, validatedLeagues, totalCountries, validatedCountries };
  }, [clubs, leagues, leagueStats, orderedCountries]);

  /* issues */
  const issues = useMemo(() => {
    const out: { label: string; tone: "amber" | "red"; onClick: () => void }[] = [];
    for (const l of leagues) {
      const s = leagueStats.get(l.id);
      const actual = s?.actual || 0;
      if (l.expected_club_count && actual !== l.expected_club_count) {
        const diff = actual - l.expected_club_count;
        out.push({
          label: `${l.league_name} has ${diff > 0 ? "+" : ""}${diff} clubs`,
          tone: Math.abs(diff) > 2 ? "red" : "amber",
          onClick: () => { setSelectedCountry(l.country_id); setSelectedLeague(l.id); setIssueFilter("all"); },
        });
      }
    }
    const noStadium = clubs.filter(c => !c.home_stadium_id).length;
    if (noStadium > 0) out.push({ label: `${noStadium} clubs without stadium`, tone: "amber", onClick: () => { setSelectedLeague(null); setIssueFilter("no_stadium"); } });
    const noLeague = clubs.filter(c => !c.primary_league_id).length;
    if (noLeague > 0) out.push({ label: `${noLeague} clubs without league`, tone: "amber", onClick: () => { setSelectedLeague(null); setIssueFilter("no_league"); } });
    return out.sort((a, b) => (a.tone === "red" ? -1 : 1));
  }, [leagues, leagueStats, clubs]);

  const setStatus = async (club: Club, status: Club["validation_status"]) => {
    const { error } = await supabase.from("clubs").update({
      validation_status: status,
      validated_at: status === "validated" ? new Date().toISOString() : null,
    } as any).eq("id", club.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["fa-clubs"] });
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ["fa-clubs"] });

  const progress = kpis.totalClubs > 0 ? Math.round((kpis.validatedClubs / kpis.totalClubs) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* KPI HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Football Validation</h1>
        <p className="text-sm text-slate-600">Validate countries, leagues, and clubs before content generation.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Countries</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.validatedCountries} / {kpis.totalCountries}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Leagues</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.validatedLeagues} / {kpis.totalLeagues}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Clubs</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.validatedClubs} / {kpis.totalClubs}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase">Progress</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{progress}%</div>
          <div className="h-1.5 bg-slate-200 rounded mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
        </CardContent></Card>
      </div>

      {/* ISSUES */}
      {issues.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <div className="text-sm font-bold text-slate-900">Football data issues</div>
              <Badge variant="outline">{issues.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {issues.slice(0, 12).map((i, idx) => (
                <button key={idx} onClick={i.onClick}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                    i.tone === "red"
                      ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}>
                  {i.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* COUNTRY PANEL */}
        <Card className="self-start">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Globe2 className="w-4 h-4 text-slate-500" />
              <div className="text-xs font-bold uppercase text-slate-500">Countries</div>
            </div>
            <button
              onClick={() => { setSelectedCountry(null); setSelectedLeague(null); }}
              className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium ${!selectedCountry ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"}`}
            >All countries</button>
            <div className="mt-1 max-h-[60vh] overflow-auto">
              {orderedCountries.map(c => {
                const tone = occColor(c.stats.actual, c.stats.expected || null);
                const dot = tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "red" ? "bg-rose-500" : "bg-slate-300";
                return (
                  <button key={c.id}
                    onClick={() => { setSelectedCountry(c.id); setSelectedLeague(null); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs ${selectedCountry === c.id ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="flex-1 text-left truncate font-medium">{c.name}</span>
                    <span className={`text-[11px] tabular-nums ${selectedCountry === c.id ? "text-slate-300" : "text-slate-500"}`}>
                      {c.stats.actual}{c.stats.expected ? `/${c.stats.expected}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT */}
        <div className="space-y-4 min-w-0">
          {/* LEAGUE LIST */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-slate-500" />
                <div className="text-sm font-bold text-slate-900">
                  Leagues {selectedCountry && <span className="text-slate-500 font-normal">in {countryName(selectedCountry)}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {visibleLeagues.map(l => {
                  const tone = occColor(l.actual, l.expected_club_count);
                  const border = tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : tone === "red" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white";
                  const active = selectedLeague === l.id;
                  return (
                    <button key={l.id}
                      onClick={() => setSelectedLeague(active ? null : l.id)}
                      className={`text-left rounded-lg border p-3 transition ${border} ${active ? "ring-2 ring-slate-900" : "hover:shadow-sm"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-slate-900 text-sm truncate">{l.league_name}</div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 truncate">{countryName(l.country_id)}</div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="tabular-nums font-semibold">
                          {l.actual} / {l.expected_club_count ?? "—"}
                        </span>
                        {l.expected_club_count && l.diff !== 0 && (
                          <span className={`tabular-nums font-bold ${l.diff > 0 ? "text-rose-700" : "text-amber-700"}`}>
                            {l.diff > 0 ? "+" : ""}{l.diff}
                          </span>
                        )}
                        {l.expected_club_count && l.diff === 0 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
                {visibleLeagues.length === 0 && (
                  <div className="text-sm text-slate-500 py-6 text-center col-span-full">No leagues</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CLUB TABLE */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4 text-slate-500" />
                <div className="text-sm font-bold text-slate-900">
                  Clubs {selectedLeague && <span className="text-slate-500 font-normal">in {leagueName(selectedLeague)}</span>}
                </div>
                <Badge variant="outline">{visibleClubs.length}</Badge>
                <div className="ml-auto flex items-center gap-2">
                  <Select value={issueFilter} onValueChange={(v: any) => setIssueFilter(v)}>
                    <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All clubs</SelectItem>
                      <SelectItem value="no_stadium">Missing stadium</SelectItem>
                      <SelectItem value="no_league">Missing league</SelectItem>
                      <SelectItem value="no_country">Missing country</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Search club" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-9 w-48 text-xs" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase text-slate-500 border-b">
                    <tr>
                      <th className="text-left py-2 px-2 w-8"></th>
                      <th className="text-left py-2 px-2 w-10"></th>
                      <th className="text-left py-2 px-2">Display name</th>
                      <th className="text-left py-2 px-2">Official name</th>
                      <th className="text-left py-2 px-2">Country</th>
                      <th className="text-left py-2 px-2">League</th>
                      <th className="text-left py-2 px-2">Stadium</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && <tr><td colSpan={9} className="py-8 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>}
                    {!isLoading && visibleClubs.map(c => {
                      const validated = c.validation_status === "validated";
                      const review = c.validation_status === "needs_review";
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-2 px-2">
                            <Checkbox checked={validated} onCheckedChange={(v) => setStatus(c, v ? "validated" : "pending")} />
                          </td>
                          <td className="py-2 px-2">
                            {c.crest_url
                              ? <img src={c.crest_url} alt="" className="w-7 h-7 object-contain" />
                              : <div className="w-7 h-7 rounded bg-slate-200" />}
                          </td>
                          <td className="py-2 px-2 font-semibold text-slate-900">{c.display_name || c.club_name}</td>
                          <td className="py-2 px-2 text-slate-600">{c.official_name || <span className="text-slate-400">—</span>}</td>
                          <td className="py-2 px-2 text-slate-600">{countryName(c.country_id)}</td>
                          <td className="py-2 px-2 text-slate-600">{leagueName(c.primary_league_id)}</td>
                          <td className="py-2 px-2 text-slate-600">{c.home_stadium_id ? stadiumName(c.home_stadium_id) : <span className="text-amber-600">— missing</span>}</td>
                          <td className="py-2 px-2">
                            <Select value={c.validation_status} onValueChange={(v: any) => setStatus(c, v)}>
                              <SelectTrigger className={`h-7 text-xs w-[130px] ${
                                validated ? "border-emerald-300 bg-emerald-50 text-emerald-800" :
                                review ? "border-amber-300 bg-amber-50 text-amber-800" :
                                "border-slate-200 bg-white text-slate-700"
                              }`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="validated">Validated</SelectItem>
                                <SelectItem value="needs_review">Needs review</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!isLoading && visibleClubs.length === 0 && (
                      <tr><td colSpan={9} className="py-8 text-center text-slate-500">No clubs match the current filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status footer */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {kpis.validatedClubs} validated</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> {kpis.pendingClubs} pending</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {kpis.needsReviewClubs} needs review</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditClubDialog
        club={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
        countries={countries}
        leagues={leagues}
        stadiums={stadiums}
      />
    </div>
  );
};

export default AdminFootballAuditPage;
