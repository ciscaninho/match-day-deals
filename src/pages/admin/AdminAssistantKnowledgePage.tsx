import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Knowledge {
  id: string;
  topic: string;
  title: string;
  body: string;
  locale: string;
  priority: number;
  is_published: boolean;
  updated_at: string;
}

const empty: Omit<Knowledge, "id" | "updated_at"> = {
  topic: "world_cup_2026",
  title: "",
  body: "",
  locale: "en",
  priority: 0,
  is_published: true,
};

const AdminAssistantKnowledgePage = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["assistant_knowledge"],
    queryFn: async (): Promise<Knowledge[]> => {
      const { data, error } = await supabase
        .from("assistant_knowledge" as never)
        .select("*")
        .order("topic", { ascending: true })
        .order("priority", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Knowledge[];
    },
  });

  useEffect(() => {
    if (!editingId) return;
    const found = items.find((k) => k.id === editingId);
    if (found) setForm({
      topic: found.topic, title: found.title, body: found.body,
      locale: found.locale, priority: found.priority, is_published: found.is_published,
    });
  }, [editingId, items]);

  const reset = () => { setEditingId(null); setForm(empty); };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body required");
      return;
    }
    const payload = { ...form };
    const op = editingId
      ? supabase.from("assistant_knowledge" as never).update(payload as never).eq("id", editingId)
      : supabase.from("assistant_knowledge" as never).insert(payload as never);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["assistant_knowledge"] });
    reset();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this knowledge entry?")) return;
    const { error } = await supabase.from("assistant_knowledge" as never).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["assistant_knowledge"] });
    if (editingId === id) reset();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingId ? "Edit entry" : "New knowledge entry"}
        </h2>
        <div className="grid md:grid-cols-3 gap-2">
          <Field label="Topic">
            <input className={cls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </Field>
          <Field label="Locale">
            <input className={cls} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
          </Field>
          <Field label="Priority (higher = first)">
            <input type="number" className={cls} value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value || "0", 10) })} />
          </Field>
        </div>
        <Field label="Title">
          <input className={cls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Body (markdown supported)">
          <textarea className={`${cls} min-h-[160px] font-mono`} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          Published (assistant will use it)
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="rounded-md bg-slate-900 text-white text-xs font-bold px-3 py-1.5">{editingId ? "Update" : "Create"}</button>
          {editingId && <button onClick={reset} className="rounded-md border border-slate-200 text-xs font-bold px-3 py-1.5">Cancel</button>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Knowledge entries {isLoading ? "(loading…)" : `(${items.length})`}
        </div>
        <div className="divide-y divide-slate-100">
          {items.length === 0 && !isLoading && (
            <div className="p-3 text-xs text-slate-500">No knowledge entries yet — seed the assistant with topics like world_cup_2026, ticketing, travel, foot_ticket_finder.</div>
          )}
          {items.map((k) => (
            <div key={k.id} className="p-3 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-extrabold text-slate-900">{k.title}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {k.topic} · {k.locale.toUpperCase()} · priority {k.priority} {k.is_published ? "" : "· hidden"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(k.id)} className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">Edit</button>
                  <button onClick={() => remove(k.id)} className="rounded-md border border-rose-200 text-rose-700 px-2 py-1 hover:bg-rose-50 inline-flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-slate-600 whitespace-pre-wrap line-clamp-4">{k.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const cls = "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1">
    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
    {children}
  </label>
);

export default AdminAssistantKnowledgePage;
