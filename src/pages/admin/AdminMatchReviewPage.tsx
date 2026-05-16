import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, AlertTriangle, ShieldCheck, Trash2, X, Save, Loader2, Calendar, MapPin } from "lucide-react";
import { FootballFilterBar, useFootballFilters } from "@/components/admin/FootballFilterBar";
import { formatLeagueLabel, isSharedLeagueName } from "@/lib/leagueLabels";
import { StadiumCreateDialog } from "@/components/admin/StadiumCreateDialog";
import { Plus } from "lucide-react";
import { foldText, matchesQuery } from "@/lib/normalize";

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  competition: string;
  date: string;
  stadium: string | null;
  city: string | null;
  country: string | null;
  ticket_status: string | null;
  verified: boolean | null;
  home_logo: string | null;
  away_logo: string | null;
  data_source: string | null;
};

type ClubLite = { slug: string; club_name: string; country: string | null; league: string | null; stadium_name: string | null };
type StadiumLite = { slug: string; stadium_name: string; city: string | null; country: string | null };
type LeagueLite = { league_name: string; country: string };

const norm = (s: string | null | undefined) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

type Flags = {
  unknown_country: boolean;
  unknown_league: boolean;
  ambiguous_league: boolean;
  missing_stadium: boolean;
  unresolved_clubs: boolean;
  duplicate_fixture: boolean;
  not_verified: boolean;
};

const computeFlags = (
  m: MatchRow,
  clubsByName: Map<string, ClubLite>,
  stadiumsByName: Map<string, StadiumLite>,
  knownLeaguesByCountry: Map<string, Set<string>>,
  duplicateIds: Set<string>,
): Flags => {
  const homeC = clubsByName.get(norm(m.home_team));
  const awayC = clubsByName.get(norm(m.away_team));
  const stadium = stadiumsByName.get(norm(m.stadium));
  const country = (m.country || homeC?.country || "").trim();
  const leagueKnown =
    !!country && (knownLeaguesByCountry.get(country)?.has(norm(m.competition)) ?? false);
  return {
    unknown_country: !country,
    unknown_league: !m.competition || !leagueKnown,
    ambiguous_league: isSharedLeagueName(m.competition) && !country,
    missing_stadium: !stadium,
    unresolved_clubs: !homeC || !awayC,
    duplicate_fixture: duplicateIds.has(m.id),
    not_verified: !m.verified,
  };
};

const flagsToScore = (f: Flags) => {
  const weights: Record<keyof Flags, number> = {
    unknown_country: 25,
    unknown_league: 20,
    ambiguous_league: 15,
    missing_stadium: 10,
    unresolved_clubs: 20,
    duplicate_fixture: 25,
    not_verified: 5,
  };
  let score = 100;
  (Object.keys(weights) as (keyof Flags)[]).forEach((k) => {
    if (f[k]) score -= weights[k];
  });
  return Math.max(0, score);
};

const FLAG_DEFS: { key: keyof Flags; label: string; cls: string }[] = [
  { key: "unknown_country", label: "Country missing", cls: "bg-rose-100 text-rose-700" },
  { key: "unknown_league", label: "League unknown", cls: "bg-rose-100 text-rose-700" },
  { key: "ambiguous_league", label: "League ambiguous", cls: "bg-amber-100 text-amber-700" },
  { key: "missing_stadium", label: "Stadium not linked", cls: "bg-amber-100 text-amber-700" },
  { key: "unresolved_clubs", label: "Clubs not linked", cls: "bg-amber-100 text-amber-700" },
  { key: "duplicate_fixture", label: "Duplicate fixture", cls: "bg-fuchsia-100 text-fuchsia-700" },
  { key: "not_verified", label: "Not verified", cls: "bg-slate-100 text-slate-600" },
];

const AdminMatchReviewPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const filters = useFootballFilters();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["admin-match-review"],
    queryFn: async () => {
      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("matches")
        .select("id,home_team,away_team,competition,date,stadium,city,country,ticket_status,verified,home_logo,away_logo,data_source")
        .gte("date", since)
        .order("date", { ascending: true })
        .limit(800);
      return (data || []) as MatchRow[];
    },
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ["admin-match-review-clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,aliases,country,league,stadium_name")
        .is("archived_at", null);
      return (data || []).flatMap((c: any) => {
        const names = [c.club_name, c.short_name, ...(c.aliases || [])].filter(Boolean) as string[];
        return names.map((n) => ({ ...c, _alias: n })) as (ClubLite & { _alias: string })[];
      });
    },
  });

  const { data: stadiums = [] } = useQuery({
    queryKey: ["admin-match-review-stadiums"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,aliases,city,country")
        .is("archived_at", null);
      return (data || []).flatMap((s: any) => {
        const names = [s.stadium_name, ...(s.aliases || [])].filter(Boolean) as string[];
        return names.map((n) => ({ ...s, _alias: n })) as (StadiumLite & { _alias: string })[];
      });
    },
  });

  const clubsByName = useMemo(() => {
    const map = new Map<string, ClubLite>();
    clubs.forEach((c: any) => map.set(norm(c._alias), c));
    return map;
  }, [clubs]);

  const stadiumsByName = useMemo(() => {
    const map = new Map<string, StadiumLite>();
    stadiums.forEach((s: any) => map.set(norm(s._alias), s));
    return map;
  }, [stadiums]);

  const knownLeaguesByCountry = useMemo(() => {
    const map = new Map<string, Set<string>>();
    clubs.forEach((c: any) => {
      if (!c.country || !c.league) return;
      if (!map.has(c.country)) map.set(c.country, new Set());
      map.get(c.country)!.add(norm(c.league));
    });
    return map;
  }, [clubs]);

  const duplicateIds = useMemo(() => {
    const seen = new Map<string, string[]>();
    matches.forEach((m) => {
      const key = `${norm(m.home_team)}|${norm(m.away_team)}|${m.date.slice(0, 10)}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(m.id);
    });
    const dup = new Set<string>();
    seen.forEach((ids) => {
      if (ids.length > 1) ids.forEach((id) => dup.add(id));
    });
    return dup;
  }, [matches]);

  const enriched = useMemo(
    () =>
      matches.map((m) => {
        const flags = computeFlags(m, clubsByName, stadiumsByName, knownLeaguesByCountry, duplicateIds);
        return { m, flags, score: flagsToScore(flags) };
      }),
    [matches, clubsByName, stadiumsByName, knownLeaguesByCountry, duplicateIds],
  );

  const filterRows = useMemo(
    () => enriched.map((r) => ({ country: r.m.country, league: r.m.competition })),
    [enriched],
  );

  const hierarchyFiltered = useMemo(() => {
    const set = new Set<number>();
    filters.apply(filterRows.map((r, i) => ({ ...r, _i: i }))).forEach((r: any) => set.add(r._i));
    return enriched.filter((_, i) => set.has(i));
  }, [enriched, filterRows, filters]);

  const filtered = useMemo(() => {
    return hierarchyFiltered.filter(({ m, flags }) => {
      const s = q.toLowerCase();
      if (s && !`${m.home_team} ${m.away_team} ${m.competition} ${m.stadium} ${m.city}`.toLowerCase().includes(s)) return false;
      const activeFlags = filters.state.flags;
      if (activeFlags.includes("only_unresolved") && Object.values(flags).every((v) => !v)) return false;
      for (const fk of activeFlags) {
        if (fk === "only_unresolved") continue;
        if (fk in flags && !(flags as any)[fk]) return false;
      }
      return true;
    });
  }, [hierarchyFiltered, q, filters.state.flags]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: hierarchyFiltered.length };
    FLAG_DEFS.forEach((f) => (c[f.key] = hierarchyFiltered.filter((r) => r.flags[f.key]).length));
    c.only_unresolved = hierarchyFiltered.filter((r) => Object.values(r.flags).some(Boolean)).length;
    return c;
  }, [hierarchyFiltered]);

  const editing = useMemo(
    () => filtered.find((r) => r.m.id === editingId) || enriched.find((r) => r.m.id === editingId),
    [filtered, enriched, editingId],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.match_review.title") || "Match Review Center"}</h1>
            <p className="text-xs text-muted-foreground">
              {enriched.length} · {filtered.length} {t("admin.shown") || "shown"}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder") || "Search…"} className="pl-9" />
          </div>
        </div>

        <FootballFilterBar
          rows={filterRows}
          state={filters.state}
          onChange={filters.update}
          onReset={filters.reset}
          onToggleFlag={filters.toggleFlag}
          flags={[
            { key: "only_unresolved", labelKey: "admin.match_review.flag.unresolved", fallback: "Only unresolved" },
            ...FLAG_DEFS.map((f) => ({
              key: f.key,
              labelKey: `admin.match_review.flag.${f.key}`,
              fallback: `Only ${f.label.toLowerCase()}`,
            })),
          ]}
          flagCounts={counts}
        />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty") || "No matches need review."}</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(({ m, flags, score }) => (
            <button
              key={m.id}
              onClick={() => setEditingId(m.id)}
              className="text-left bg-white rounded-2xl border border-slate-200 hover:border-[#2ECC71] hover:shadow-md transition p-4"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                  {formatLeagueLabel(m.competition, m.country) || "—"}
                </span>
                <ScorePill score={score} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-[#2C3E50] truncate flex-1">{m.home_team}</span>
                <span className="text-slate-400 text-xs">vs</span>
                <span className="font-bold text-sm text-[#2C3E50] truncate flex-1 text-right">{m.away_team}</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{m.stadium || "—"}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {FLAG_DEFS.filter((f) => flags[f.key]).map((f) => (
                  <span key={f.key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${f.cls}`}>
                    {f.label}
                  </span>
                ))}
                {Object.values(flags).every((v) => !v) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Clean
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <ReviewDrawer
          row={editing}
          clubs={clubs as any}
          stadiums={stadiums as any}
          onClose={() => setEditingId(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["admin-match-review"] })}
          duplicateIds={duplicateIds}
          allMatches={matches}
        />
      )}
    </div>
  );
};

const ScorePill = ({ score }: { score: number }) => {
  const cls =
    score >= 80 ? "bg-emerald-100 text-emerald-700" :
    score >= 50 ? "bg-amber-100 text-amber-700" :
    "bg-rose-100 text-rose-700";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{score}%</span>;
};

// ---------- Drawer ----------

const ReviewDrawer = ({
  row, clubs, stadiums, onClose, onChanged, duplicateIds, allMatches,
}: {
  row: { m: MatchRow; flags: Flags; score: number };
  clubs: (ClubLite & { _alias: string })[];
  stadiums: (StadiumLite & { _alias: string })[];
  onClose: () => void;
  onChanged: () => void;
  duplicateIds: Set<string>;
  allMatches: MatchRow[];
}) => {
  const { t } = useLanguage();
  const { m } = row;
  const [form, setForm] = useState({
    home_team: m.home_team,
    away_team: m.away_team,
    competition: m.competition,
    country: m.country || "",
    stadium: m.stadium || "",
    city: m.city || "",
    verified: !!m.verified,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createStadiumOpen, setCreateStadiumOpen] = useState(false);

  const clubMatches = (q: string) =>
    !q ? [] : clubs.filter((c) => norm(c._alias).includes(norm(q))).slice(0, 5);
  const stadiumMatches = (q: string) =>
    !q ? [] : stadiums.filter((s) => norm(s._alias).includes(norm(q))).slice(0, 5);

  const dupes = duplicateIds.has(m.id)
    ? allMatches.filter(
        (x) =>
          x.id !== m.id &&
          norm(x.home_team) === norm(m.home_team) &&
          norm(x.away_team) === norm(m.away_team) &&
          x.date.slice(0, 10) === m.date.slice(0, 10),
      )
    : [];

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("matches")
      .update({
        home_team: form.home_team.trim(),
        away_team: form.away_team.trim(),
        competition: form.competition.trim(),
        country: form.country.trim(),
        stadium: form.stadium.trim(),
        city: form.city.trim(),
        verified: form.verified,
      })
      .eq("id", m.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("admin.match_review.saved") || "Match updated");
      onChanged();
      onClose();
    }
  };

  const deleteMatch = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("matches").delete().eq("id", id);
    setDeleting(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("admin.match_review.deleted") || "Match deleted");
      onChanged();
      if (id === m.id) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#2C3E50] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t("admin.match_review.drawer_title") || "Resolve match"}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 mb-3">
          {new Date(m.date).toLocaleString()} · source: {m.data_source || "—"}
        </div>

        <div className="space-y-3">
          <Field label="Home team">
            <Input value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} />
            <Suggestions items={clubMatches(form.home_team)} render={(c) => `${c.club_name} (${c.country || "?"})`}
              onPick={(c) => setForm({ ...form, home_team: c.club_name, country: form.country || c.country || "", competition: form.competition || c.league || "" })} />
          </Field>
          <Field label="Away team">
            <Input value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} />
            <Suggestions items={clubMatches(form.away_team)} render={(c) => `${c.club_name} (${c.country || "?"})`}
              onPick={(c) => setForm({ ...form, away_team: c.club_name })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Competition / League">
              <Input value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </Field>
          </div>
          <Field label="Stadium">
            <Input value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} />
            <Suggestions items={stadiumMatches(form.stadium)} render={(s) => `${s.stadium_name} · ${s.city || "?"}`}
              onPick={(s) => setForm({ ...form, stadium: s.stadium_name, city: form.city || s.city || "", country: form.country || s.country || "" })} />
            {row.flags.missing_stadium && (
              <button
                type="button"
                onClick={() => setCreateStadiumOpen(true)}
                className="mt-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {t("admin.create.stadium.cta") || "Create stadium"}{form.stadium ? `: "${form.stadium}"` : ""}
              </button>
            )}
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Mark as verified
          </label>
        </div>

        {dupes.length > 0 && (
          <div className="mt-5 p-3 rounded-lg border border-fuchsia-200 bg-fuchsia-50">
            <p className="text-xs font-bold text-fuchsia-700 mb-2">
              {dupes.length} duplicate fixture{dupes.length > 1 ? "s" : ""} detected
            </p>
            <div className="space-y-1.5">
              {dupes.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-[11px] bg-white rounded p-1.5 border border-fuchsia-100">
                  <span className="truncate">{d.id} · {d.competition} · src:{d.data_source || "?"}</span>
                  <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => deleteMatch(d.id)} disabled={deleting}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Button onClick={save} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("admin.match_review.save") || "Save & resolve"}
          </Button>
          <Button variant="outline" onClick={onClose}>{t("admin.drawer.cancel") || "Cancel"}</Button>
        </div>
        <Button variant="ghost" className="w-full mt-2 text-rose-600 hover:text-rose-700 gap-2" onClick={() => deleteMatch(m.id)} disabled={deleting}>
          <Trash2 className="w-4 h-4" /> {t("admin.match_review.delete") || "Delete this match"}
        </Button>
      </div>
      <StadiumCreateDialog
        open={createStadiumOpen}
        onClose={() => setCreateStadiumOpen(false)}
        prefill={{ stadium_name: form.stadium, city: form.city, country: form.country, league: form.competition }}
        onCreated={(s) => {
          setForm((f) => ({ ...f, stadium: s.stadium_name, city: f.city || s.city || "", country: f.country || s.country || "" }));
          onChanged();
        }}
      />
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
    {children}
  </div>
);

function Suggestions<T>({ items, render, onPick }: { items: T[]; render: (x: T) => string; onPick: (x: T) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(it)}
          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
        >
          {render(it)}
        </button>
      ))}
    </div>
  );
}

export default AdminMatchReviewPage;
