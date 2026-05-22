import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Check, X, Loader2, Trophy, Save, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { WorldCupImportDialog } from "./WorldCupImportDialog";

const ENRICHMENT_FIELDS = [
  "host_city_context",
  "architecture_notes",
  "seat_recommendations",
  "fan_zones",
  "transport_notes",
  "hospitality_notes",
  "ticket_guidance",
  "matchday_advice",
  "travel_notes",
  "historical_facts",
] as const;

type Field = typeof ENRICHMENT_FIELDS[number];

type Proposal = {
  id: string;
  stadium_id: string;
  field: string;
  proposed_value: string;
  rationale: string | null;
  status: string;
  created_at: string;
};

type StadiumWC = {
  id: string;
  is_world_cup_host: boolean;
  world_cup_edition: string | null;
  world_cup_role: string | null;
  enrichment_status: string;
  enrichment_updated_at: string | null;
} & Record<Field, string | null>;

export function WorldCupEnrichmentPanel({ stadiumSlug }: { stadiumSlug: string }) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [proposing, setProposing] = useState(false);
  const [savingField, setSavingField] = useState<Field | null>(null);
  const [importBatch, setImportBatch] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [proposingMatch, setProposingMatch] = useState(false);

  const proposeMissingMatch = async () => {
    if (!stadium?.id) return;
    setProposingMatch(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-copilot-propose-match", {
        body: { stadium_id: stadium.id },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      if (!data.batch_id) {
        toast.info(t("admin.wcimport.no_missing") || "No missing fixtures for this stadium");
        return;
      }
      setImportBatch(data);
      setImportOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Propose failed");
    } finally {
      setProposingMatch(false);
    }
  };

  const { data: stadium, refetch } = useQuery({
    queryKey: ["admin-stadium-wc", stadiumSlug],
    queryFn: async () => {
      const cols = ["id", "is_world_cup_host", "world_cup_edition", "world_cup_role",
        "enrichment_status", "enrichment_updated_at", ...ENRICHMENT_FIELDS].join(", ");
      const { data, error } = await supabase
        .from("stadiums").select(cols).eq("slug", stadiumSlug).maybeSingle();
      if (error) throw error;
      return (data as unknown) as StadiumWC | null;
    },
  });

  const { data: proposals = [], refetch: refetchProposals } = useQuery({
    queryKey: ["admin-stadium-wc-proposals", stadium?.id],
    enabled: !!stadium?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("stadium_enrichment_proposals")
        .select("*")
        .eq("stadium_id", stadium!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return (data || []) as Proposal[];
    },
  });

  const [edits, setEdits] = useState<Record<string, string>>({});

  if (!stadium) return <p className="text-sm text-slate-500">{t("admin.loading") || "Loading…"}</p>;

  const updateStadiumFields = async (patch: Partial<StadiumWC>) => {
    const { error } = await supabase.from("stadiums").update(patch).eq("id", stadium.id);
    if (error) throw error;
    await refetch();
    qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] });
  };

  const toggleHost = async (next: boolean) => {
    try {
      await updateStadiumFields({
        is_world_cup_host: next,
        world_cup_edition: next ? (stadium.world_cup_edition || "wc2026") : stadium.world_cup_edition,
      } as Partial<StadiumWC>);
      toast.success(next ? "Marked as World Cup host" : "Removed from World Cup hosts");
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  const proposeAll = async () => {
    setProposing(true);
    try {
      const { data, error } = await supabase.functions.invoke("wc-copilot-enrich", {
        body: { stadium_id: stadium.id },
      });
      if (error) throw error;
      const count = data?.proposals?.length ?? 0;
      toast.success(count > 0 ? `${count} proposals added` : (data?.message || "No proposals returned"));
      refetchProposals();
    } catch (e: any) {
      toast.error(e?.message || "Copilot failed");
    } finally {
      setProposing(false);
    }
  };

  const approveProposal = async (p: Proposal, valueOverride?: string) => {
    setSavingField(p.field as Field);
    try {
      const value = (valueOverride ?? p.proposed_value).trim();
      await updateStadiumFields({ [p.field]: value, enrichment_updated_at: new Date().toISOString() } as any);
      await supabase.from("stadium_enrichment_proposals").update({
        status: "approved", reviewed_at: new Date().toISOString(),
      }).eq("id", p.id);
      refetchProposals();
      toast.success(`${p.field} approved`);
    } catch (e: any) {
      toast.error(e?.message || "Approve failed");
    } finally {
      setSavingField(null);
    }
  };

  const rejectProposal = async (p: Proposal) => {
    await supabase.from("stadium_enrichment_proposals").update({
      status: "rejected", reviewed_at: new Date().toISOString(),
    }).eq("id", p.id);
    refetchProposals();
  };

  const saveField = async (field: Field) => {
    const v = edits[field] ?? "";
    setSavingField(field);
    try {
      await updateStadiumFields({ [field]: v, enrichment_updated_at: new Date().toISOString() } as any);
      setEdits((e) => { const { [field]: _, ...rest } = e; return rest; });
      toast.success(`${field} saved`);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSavingField(null);
    }
  };

  const markApproved = async () => {
    try {
      await updateStadiumFields({ enrichment_status: "approved" } as any);
      toast.success("Enrichment approved for publication");
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header / host toggle */}
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-extrabold text-slate-900">World Cup host</h3>
          </div>
          <Switch checked={!!stadium.is_world_cup_host} onCheckedChange={toggleHost} />
        </div>
        {stadium.is_world_cup_host && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-600">Edition</Label>
              <Input value={stadium.world_cup_edition || "wc2026"}
                onChange={(e) => updateStadiumFields({ world_cup_edition: e.target.value } as any)}
                className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-600">Role</Label>
              <Input value={stadium.world_cup_role || ""}
                placeholder="group / knockout / final…"
                onChange={(e) => updateStadiumFields({ world_cup_role: e.target.value } as any)}
                className="h-8 text-xs" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={stadium.enrichment_status === "approved" ? "default" : "secondary"} className="text-[10px]">
            {stadium.enrichment_status}
          </Badge>
          {stadium.enrichment_status !== "approved" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={markApproved}>
              <Check className="w-3 h-3 mr-1" /> {t("admin.wcimport.mark_approved") || "Mark approved for publication"}
            </Button>
          )}
          {stadium.is_world_cup_host && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              disabled={proposingMatch}
              onClick={proposeMissingMatch}
            >
              {proposingMatch ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CalendarPlus className="w-3 h-3 mr-1" />}
              {t("admin.wcimport.propose_match") || "Propose missing World Cup match"}
            </Button>
          )}
        </div>
      </section>

      <WorldCupImportDialog
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportBatch(null); }}
        initialBatch={importBatch}
      />

      {/* Copilot */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Copilot enrichment</h3>
          </div>
          <Button size="sm" disabled={proposing} onClick={proposeAll}
            className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs">
            {proposing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Propose missing fields
          </Button>
        </div>
        {proposals.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No pending proposals. Click "Propose missing fields" to ask Copilot.</p>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={p.id} className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">{p.field}</Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-rose-600" onClick={() => rejectProposal(p)}>
                      <X className="w-3 h-3" />
                    </Button>
                    <Button size="sm" className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={savingField === p.field}
                      onClick={() => approveProposal(p, edits[`prop-${p.id}`])}>
                      {savingField === p.field ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                <Textarea rows={3} defaultValue={p.proposed_value}
                  onChange={(e) => setEdits((s) => ({ ...s, [`prop-${p.id}`]: e.target.value }))}
                  className="text-xs" />
                {p.rationale && <p className="text-[10px] text-slate-500 italic">{p.rationale}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editable enrichment fields */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Approved enrichment</h3>
        {ENRICHMENT_FIELDS.map((f) => {
          const current = (edits[f] ?? stadium[f] ?? "") as string;
          const dirty = edits[f] !== undefined && edits[f] !== (stadium[f] || "");
          return (
            <div key={f} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-bold text-slate-600">{f.replace(/_/g, " ")}</Label>
                {dirty && (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-700"
                    disabled={savingField === f}
                    onClick={() => saveField(f)}>
                    {savingField === f ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                )}
              </div>
              <Textarea rows={2} value={current}
                onChange={(e) => setEdits((s) => ({ ...s, [f]: e.target.value }))}
                placeholder="—" className="text-xs" />
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default WorldCupEnrichmentPanel;
