import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matches } from "@/data/matches";
import { Shield, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import type { TicketStatus } from "@/data/matches";

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
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminPage;
