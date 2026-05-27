import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWcViewMode } from "@/hooks/useWcViewMode";
import { toast } from "@/hooks/use-toast";
import { Lock, RotateCcw, Eye, Globe, Database, Loader2, ChevronRight } from "lucide-react";
import MatchesTab from "./wc2026/MatchesTab";
import CoverageTab from "./wc2026/CoverageTab";
import ResolverTab from "./wc2026/ResolverTab";
import StadiumsTab from "./wc2026/StadiumsTab";

type TabId = "overview" | "matches" | "groups" | "stadiums" | "coverage" | "resolver" | "analytics";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "matches", label: "Matches" },
  { id: "groups", label: "Groups" },
  { id: "stadiums", label: "Stadiums" },
  { id: "coverage", label: "Coverage" },
  { id: "resolver", label: "Resolver" },
  { id: "analytics", label: "Analytics" },
];
const TAB_KEY = "wc2026.activeTab.v1";
const DEFAULT_TAB: TabId = "matches";


interface Slot {
  id: string;
  group_code: string;
  slot_position: number;
  team_name: string | null;
  team_short: string | null;
  source: string;
  status: string;
  is_locked: boolean;
}

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

function useSlots() {
  return useQuery({
    queryKey: ["wc-group-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wc_group_slots" as never)
        .select("*")
        .order("group_code")
        .order("slot_position");
      if (error) throw error;
      return (data ?? []) as unknown as Slot[];
    },
  });
}

function useOverviewKpis() {
  return useQuery({
    queryKey: ["wc-overview-kpis"],
    queryFn: async () => {
      const [matchesRes, ticketedRes, publishedRes, withPricesRes, withImagesRes, slotsRes] = await Promise.all([
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("competition", "FIFA World Cup 2026"),
        supabase.from("wc_ticket_coverage" as never).select("match_id", { count: "exact", head: true }).not("match_id", "is", null),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("competition", "FIFA World Cup 2026").eq("publication_status", "published"),
        supabase.from("wc_ticket_coverage" as never).select("id", { count: "exact", head: true }).not("starting_price", "is", null),
        supabase.from("wc_ticket_coverage" as never).select("id", { count: "exact", head: true }).not("image_url", "is", null),
        supabase.from("wc_group_slots" as never).select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      ]);
      const imported = matchesRes.count ?? 0;
      const coverageTotalRes = await supabase.from("wc_ticket_coverage" as never).select("id", { count: "exact", head: true });
      return {
        imported,
        ticketed: ticketedRes.count ?? 0,
        published: publishedRes.count ?? 0,
        coverage_total: coverageTotalRes.count ?? 0,
        with_prices: withPricesRes.count ?? 0,
        with_images: withImagesRes.count ?? 0,
        slots_confirmed: slotsRes.count ?? 0,
      };
    },
  });
}

function ModeToggle() {
  const [mode, setMode] = useWcViewMode();
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      <button onClick={() => setMode("preview")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${mode === "preview" ? "bg-amber-100 text-amber-900" : "text-slate-600 hover:bg-slate-50"}`}>
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
      <button onClick={() => setMode("live")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${mode === "live" ? "bg-emerald-100 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}>
        <Globe className="w-3.5 h-3.5" /> Live
      </button>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display text-2xl text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useOverviewKpis();
  if (isLoading) return <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading…</div>;
  const k = data!;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Imported" value={`${k.imported}/104`} sub="WC fixtures in DB" />
        <Kpi label="Ticketed" value={`${k.ticketed}/${k.imported}`} sub="With provider link" />
        <Kpi label="Published" value={`${k.published}/${k.imported}`} sub="Live on site" />
        <Kpi label="Slots confirmed" value={`${k.slots_confirmed}/48`} sub="Group teams set" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="Coverage rows" value={k.coverage_total} />
        <Kpi label="With prices" value={k.with_prices} />
        <Kpi label="With images" value={k.with_images} />
      </div>
    </div>
  );
}

function GroupsTab() {
  const qc = useQueryClient();
  const { data: slots, isLoading } = useSlots();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);
  const [resyncBusy, setResyncBusy] = useState<null | "validate" | "resync">(null);
  const [resyncReport, setResyncReport] = useState<any | null>(null);

  const applyMut = useMutation({
    mutationFn: async (input: { group_code: string; slot_position: number; team_name: string | null; preview: boolean }) => {
      const { data, error } = await supabase.functions.invoke("wc-groups-apply", { body: input });
      if (error) throw error;
      return data;
    },
  });

  const runResync = async (dryRun: boolean) => {
    setResyncBusy(dryRun ? "validate" : "resync");
    try {
      const { data, error } = await supabase.functions.invoke("wc-groups-resync", { body: { dry_run: dryRun, delete_duplicates: true } });
      if (error) throw error;
      setResyncReport(data);
      const invalid = data?.invalid_groups ?? [];
      toast({
        title: dryRun ? "Validation complete" : "Resync complete",
        description: `${data?.fixtures_updated ?? 0} fixture(s) updated · ${data?.duplicates_deleted ?? 0} duplicate(s) removed · ${invalid.length === 0 ? "all groups valid" : `invalid: ${invalid.join(", ")}`}`,
        variant: invalid.length === 0 ? undefined : "destructive",
      });
      qc.invalidateQueries({ queryKey: ["wc-group-slots"] });
      qc.invalidateQueries({ queryKey: ["wc-overview-kpis"] });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setResyncBusy(null); }
  };



  if (isLoading) return <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading slots…</div>;

  const byGroup: Record<string, Slot[]> = {};
  for (const s of slots ?? []) (byGroup[s.group_code] ??= []).push(s);

  const draftKey = (g: string, p: number) => `${g}${p}`;
  const dirty = (s: Slot) => {
    const k = draftKey(s.group_code, s.slot_position);
    return drafts[k] !== undefined && drafts[k] !== (s.team_name ?? "");
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">Edit unlocked slots. <strong>Preview</strong> shows impact. <strong>Apply</strong> propagates to fixtures. <strong>Revert</strong> empties the slot back to placeholder.</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {GROUPS.map((g) => (
          <div key={g} className="rounded-xl border border-slate-200 bg-white">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-sm text-slate-900">Group {g}</h3>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">4 slots</span>
            </div>
            <div className="p-2 space-y-1.5">
              {(byGroup[g] ?? []).map((s) => {
                const k = draftKey(s.group_code, s.slot_position);
                const value = drafts[k] ?? s.team_name ?? "";
                const placeholder = `${s.group_code}${s.slot_position}`;
                return (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 w-6 shrink-0">{placeholder}</span>
                    <input
                      disabled={s.is_locked}
                      value={value}
                      placeholder={s.is_locked ? `${s.team_name} (locked)` : placeholder}
                      onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value }))}
                      className="flex-1 px-2 py-1 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    {s.is_locked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                    {dirty(s) && (
                      <>
                        <button
                          onClick={async () => {
                            const res = await applyMut.mutateAsync({ group_code: s.group_code, slot_position: s.slot_position, team_name: value || null, preview: true });
                            setPreview({ slot: placeholder, value, ...res });
                          }}
                          className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >Preview</button>
                        <button
                          onClick={async () => {
                            setApplying(true);
                            try {
                              const res = await applyMut.mutateAsync({ group_code: s.group_code, slot_position: s.slot_position, team_name: value || null, preview: false });
                              toast({ title: `${placeholder} → ${value || placeholder}`, description: `${res.fixtures_updated} fixture(s), ${res.coverage_rows_affected} ticket row(s), ${res.public_cards_affected} public card(s) affected.` });
                              setDrafts((d) => { const n = { ...d }; delete n[k]; return n; });
                              setPreview(null);
                              qc.invalidateQueries({ queryKey: ["wc-group-slots"] });
                              qc.invalidateQueries({ queryKey: ["wc-overview-kpis"] });
                            } catch (e: any) {
                              toast({ title: "Apply failed", description: e.message, variant: "destructive" });
                            } finally { setApplying(false); }
                          }}
                          disabled={applying}
                          className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        >Apply</button>
                      </>
                    )}
                    {!dirty(s) && s.team_name && !s.is_locked && (
                      <button
                        onClick={async () => {
                          setApplying(true);
                          try {
                            const res = await applyMut.mutateAsync({ group_code: s.group_code, slot_position: s.slot_position, team_name: null, preview: false });
                            toast({ title: `${placeholder} reverted`, description: `${res.fixtures_updated} fixture(s) reverted.` });
                            qc.invalidateQueries({ queryKey: ["wc-group-slots"] });
                          } finally { setApplying(false); }
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        title="Revert to placeholder"
                      ><RotateCcw className="w-3 h-3" /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900 text-sm">Preview impact: {preview.slot} → {preview.value || "(empty)"}</p>
          <ul className="mt-2 text-xs text-amber-900 space-y-0.5">
            <li>• Fixtures to update: <strong>{preview.fixtures_to_update}</strong> (home: {preview.home_slots}, away: {preview.away_slots})</li>
            <li>• Coverage rows affected: <strong>{preview.coverage_rows_affected}</strong></li>
            <li>• Public cards affected: <strong>{preview.public_cards_affected}</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
}

function SeedPanel() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<null | "seed" | "reset">(null);
  const [result, setResult] = useState<any>(null);
  const run = async (action: "seed" | "reset") => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("wc-demo-seed", { body: { action } });
      if (error) throw error;
      setResult(data);
      toast({ title: action === "seed" ? "Demo data seeded" : "Demo data reset", description: JSON.stringify(data?.summary ?? data) });
      qc.invalidateQueries({ queryKey: ["wc-overview-kpis"] });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Database className="w-4 h-4" /> Demo data</p>
          <p className="text-xs text-slate-500 mt-0.5">Creates 1 draft fixture (home=A2), 1 unmatched provider row, 1 linked provider row.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => run("seed")} disabled={!!busy} className="px-3 py-1.5 text-xs font-bold uppercase rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">{busy === "seed" ? "Seeding…" : "Seed demo data"}</button>
          <button onClick={() => run("reset")} disabled={!!busy} className="px-3 py-1.5 text-xs font-bold uppercase rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50">{busy === "reset" ? "Resetting…" : "Reset demo data"}</button>
        </div>
      </div>
      {result && <pre className="mt-3 text-[10px] font-mono bg-slate-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
      <p className="text-sm text-slate-500">{label} — coming in Turn 2.</p>
    </div>
  );
}

export default function AdminWorldCup2026Page() {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();

  // Resolve active tab: URL param > localStorage > default. URL is source of truth.
  const fromUrl = TABS.find((t) => t.id === tabParam)?.id;
  const tab: TabId = fromUrl ?? (() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as TabId | null;
      if (saved && TABS.some((t) => t.id === saved)) return saved;
    } catch {}
    return DEFAULT_TAB;
  })();

  // If we landed on /admin/world-cup-2026 with no param, redirect to last visited / default.
  useEffect(() => {
    if (!tabParam) navigate(`/admin/world-cup-2026/${tab}`, { replace: true });
  }, [tabParam, tab, navigate]);

  // Persist last visited.
  useEffect(() => { try { localStorage.setItem(TAB_KEY, tab); } catch {} }, [tab]);

  const setTab = (next: TabId) => navigate(`/admin/world-cup-2026/${next}`);
  const activeLabel = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-slate-900">Admin</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/admin/world-cup-2026" className="hover:text-slate-900">World Cup 2026</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-semibold text-slate-900">{activeLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">FIFA World Cup 2026</p>
          <h1 className="font-display text-2xl text-slate-900">Operations hub</h1>
        </div>
        <ModeToggle />
      </div>

      <SeedPanel />

      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${tab === t.id ? "border-emerald-600 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "matches" && <MatchesTab />}
      {tab === "overview" && <OverviewTab />}
      {tab === "groups" && <GroupsTab />}
      {tab === "stadiums" && <StadiumsTab />}
      {tab === "coverage" && <CoverageTab />}
      {tab === "resolver" && <ResolverTab />}
      {tab === "analytics" && <Placeholder label="CTR, conversions, image quality" />}
    </div>
  );
}

