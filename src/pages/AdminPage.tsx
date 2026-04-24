import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matches } from "@/data/matches";
import { Shield, Plus, Edit2, Bot, Inbox, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { TicketStatus } from "@/data/matches";
import { supabase } from "@/integrations/supabase/client";
import { useAssistantSettings } from "@/hooks/useAssistantSettings";
import { syncApiFootballFixtures } from "@/services/apiFootball";
import { useQueryClient } from "@tanstack/react-query";

const AdminPage = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    competition: "",
    date: "",
    stadium: "",
    city: "",
    startingPrice: "",
    ticketStatus: "not_released" as TicketStatus,
    officialTicketUrl: "",
    resaleUrl: "",
  });

  const resetForm = () => {
    setForm({
      homeTeam: "",
      awayTeam: "",
      competition: "",
      date: "",
      stadium: "",
      city: "",
      startingPrice: "",
      ticketStatus: "not_released",
      officialTicketUrl: "",
      resaleUrl: "",
    });
    setEditingId(null);
  };

  const loadMatch = (id: string) => {
    const m = matches.find((x) => x.id === id);
    if (!m) return;
    setEditingId(id);
    setForm({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      competition: m.competition,
      date: m.date.slice(0, 16),
      stadium: m.stadium,
      city: m.city,
      startingPrice: m.startingPrice?.toString() || "",
      ticketStatus: m.ticketStatus,
      officialTicketUrl: m.ticketSources.find((s) => s.type === "official")?.url || "",
      resaleUrl: m.ticketSources.find((s) => s.type === "resale")?.url || "",
    });
  };

  const handleSave = () => {
    toast.success(editingId ? "Match updated (simulated)" : "Match added (simulated)");
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Admin Panel
        </h1>
        <p className="text-xs text-muted-foreground mb-6">Manage matches and ticket info</p>

        <ApiFootballSyncCard />

        {/* Existing matches */}
        <h2 className="text-sm font-bold text-foreground mb-2">Existing Matches</h2>
        <div className="space-y-1 mb-6 max-h-48 overflow-y-auto">
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => loadMatch(m.id)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                editingId === m.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className="text-foreground font-medium">{m.homeTeam} vs {m.awayTeam}</span>
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Edit Match" : "Add New Match"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Home Team" value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} className="text-xs" />
              <Input placeholder="Away Team" value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} className="text-xs" />
            </div>
            <Input placeholder="Competition" value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} className="text-xs" />
            <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Stadium" value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} className="text-xs" />
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Starting Price (€)" type="number" value={form.startingPrice} onChange={(e) => setForm({ ...form, startingPrice: e.target.value })} className="text-xs" />
              <Select value={form.ticketStatus} onValueChange={(v) => setForm({ ...form, ticketStatus: v as TicketStatus })}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_released">Not Released</SelectItem>
                  <SelectItem value="on_sale">On Sale</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Official Ticket URL" value={form.officialTicketUrl} onChange={(e) => setForm({ ...form, officialTicketUrl: e.target.value })} className="text-xs" />
            <Input placeholder="Resale URL" value={form.resaleUrl} onChange={(e) => setForm({ ...form, resaleUrl: e.target.value })} className="text-xs" />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs" onClick={handleSave}>
                {editingId ? "Update" : "Add"} Match
              </Button>
              {editingId && (
                <Button size="sm" variant="outline" className="text-xs" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <AssistantSettingsCard />
        <EscalationInbox />
      </div>
      <BottomNav />
    </div>
  );
};

// ---------- AI Assistant Settings ----------
const AssistantSettingsCard = () => {
  const { settings, refresh } = useAssistantSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("assistant_settings")
      .update({
        enabled: form.enabled,
        escalation_enabled: form.escalation_enabled,
        display_name: form.display_name,
        greeting: form.greeting,
        fallback_message: form.fallback_message,
        support_email: form.support_email,
        email_subject: form.email_subject,
        faq_seed: form.faq_seed,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("Could not save settings (admin role required)");
    } else {
      toast.success("Assistant settings saved");
      refresh();
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Bot className="w-4 h-4" /> AI Assistant Settings
        </h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="ai-enabled" className="text-xs">Enable AI assistant</Label>
          <Switch
            id="ai-enabled"
            checked={form.enabled}
            onCheckedChange={(v) => setForm({ ...form, enabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-esc" className="text-xs">Enable support escalation</Label>
          <Switch
            id="ai-esc"
            checked={form.escalation_enabled}
            onCheckedChange={(v) => setForm({ ...form, escalation_enabled: v })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Assistant display name</Label>
          <Input
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Greeting message</Label>
          <Textarea
            value={form.greeting}
            onChange={(e) => setForm({ ...form, greeting: e.target.value })}
            className="text-xs min-h-[60px]"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Fallback message (when AI is unsure)</Label>
          <Textarea
            value={form.fallback_message}
            onChange={(e) => setForm({ ...form, fallback_message: e.target.value })}
            className="text-xs min-h-[60px]"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Support email</Label>
          <Input
            type="email"
            value={form.support_email}
            onChange={(e) => setForm({ ...form, support_email: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Email subject</Label>
          <Input
            value={form.email_subject}
            onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">FAQ seed content (optional)</Label>
          <Textarea
            value={form.faq_seed}
            onChange={(e) => setForm({ ...form, faq_seed: e.target.value })}
            placeholder="Add custom FAQ knowledge the AI should know about…"
            className="text-xs min-h-[80px]"
          />
        </div>

        <Button size="sm" className="w-full text-xs" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

// ---------- Support Escalation Inbox ----------
interface Escalation {
  id: string;
  user_message: string;
  current_page: string | null;
  related_match_name: string | null;
  language: string | null;
  user_type: string | null;
  escalation_status: string;
  created_at: string;
}

const EscalationInbox = () => {
  const [items, setItems] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("support_escalations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setItems(data as Escalation[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-4 h-4" /> Support Escalations
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">
            {items.length} recent
          </span>
        </h3>
        {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-xs text-muted-foreground">No escalations yet. Admin role required to view all.</p>
        )}
        <div className="space-y-2">
          {items.map((e) => (
            <div key={e.id} className="border border-border rounded-lg p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{e.user_type || "free"}</span>
                <span className="text-muted-foreground text-[10px]">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-foreground">{e.user_message}</p>
              <p className="text-muted-foreground text-[10px]">
                {e.current_page} · {e.language?.toUpperCase()}
                {e.related_match_name ? ` · ${e.related_match_name}` : ""}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- API-FOOTBALL Sync ----------
const ApiFootballSyncCard = () => {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const result = await syncApiFootballFixtures();
      if (result.success) {
        const msg = `Synced ${result.synced ?? 0} fixtures from API-FOOTBALL`;
        toast.success(msg);
        setLastResult(msg);
        await queryClient.invalidateQueries({ queryKey: ["matches"] });
      } else {
        const msg = result.error ?? "Sync failed";
        toast.error(msg);
        setLastResult(`Error: ${msg}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setLastResult(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> API-FOOTBALL Sync
        </h3>
        <p className="text-xs text-muted-foreground">
          Récupère les matchs API-FOOTBALL de Ligue 1 et Premier League pour la saison 2025,
          puis les enregistre dans la base via upsert. Les entrées existantes sont mises à jour.
        </p>
        <Button
          size="sm"
          className="w-full text-xs gap-2"
          onClick={handleSync}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Synchronisation en cours…" : "Forcer la synchronisation API-FOOTBALL"}
        </Button>
        {lastResult && (
          <p className="text-[11px] text-muted-foreground border-t border-border pt-2 break-words">
            {lastResult}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPage;
