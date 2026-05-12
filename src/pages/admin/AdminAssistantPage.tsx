import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, User as UserIcon, Plus, MessageSquare, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Action = { id: string; kind: string; payload: any; preview: any; status: string };

const SUGGESTIONS_EN = [
  "Find duplicate stadiums",
  "Which stadiums are missing coordinates?",
  "Attach Bayern Munich to Allianz Arena",
  "Set Anfield capacity to 61276",
];
const SUGGESTIONS_FR = [
  "Trouve les stades en doublon",
  "Quels stades n'ont pas de coordonnées ?",
  "Attache le Bayern Munich à l'Allianz Arena",
  "Mets la capacité d'Anfield à 61276",
];

export const AdminAssistantPage = () => {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: threads = [] } = useQuery({
    queryKey: ["assistant-threads", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("admin_assistant_threads")
        .select("id,title,updated_at").eq("user_id", user.id)
        .order("updated_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const loadThread = async (id: string) => {
    setThreadId(id);
    const { data } = await supabase.from("admin_assistant_messages")
      .select("id,role,content").eq("thread_id", id).order("created_at");
    setMessages((data || []).filter((m: any) => m.role === "user" || m.role === "assistant") as Msg[]);
    const { data: acts } = await supabase.from("admin_actions")
      .select("id,kind,payload,preview,status").eq("thread_id", id);
    const map: Record<string, Action> = {};
    (acts || []).forEach((a: any) => { map[a.id] = a; });
    setActions(map);
  };

  const newThread = () => { setThreadId(null); setMessages([]); setActions({}); };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-assistant", {
        body: { thread_id: threadId, message: content },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") { toast.error(t("admin.assistant.rate_limited")); return; }
      if (data?.error === "payment_required") { toast.error(t("admin.assistant.payment_required")); return; }
      if (data?.error) throw new Error(data.error);
      if (data.thread_id && !threadId) {
        setThreadId(data.thread_id);
        qc.invalidateQueries({ queryKey: ["assistant-threads"] });
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "" }]);
      if (data.proposed_actions?.length) {
        setActions((prev) => {
          const next = { ...prev };
          for (const a of data.proposed_actions) next[a.id] = a;
          return next;
        });
      }
      qc.invalidateQueries({ queryKey: ["assistant-threads"] });
    } catch (e) {
      console.error(e);
      toast.error(t("admin.assistant.error"));
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (id: string, mode: "execute" | "reject") => {
    setPendingAction(id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions-execute", { body: { action_id: id, mode } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setActions((p) => ({ ...p, [id]: { ...p[id], status: data.status } }));
      toast.success(mode === "execute" ? t("admin.audit.execute_ok") : t("admin.audit.reject_ok"));
      qc.invalidateQueries({ queryKey: ["admin-stadiums-v2"] });
      qc.invalidateQueries({ queryKey: ["admin-actions"] });
    } catch (e: any) {
      toast.error(e?.message || t("admin.audit.error"));
    } finally { setPendingAction(null); }
  };

  const deleteThread = async (id: string) => {
    if (!confirm(t("admin.assistant.delete_confirm"))) return;
    await supabase.from("admin_assistant_threads").delete().eq("id", id);
    if (threadId === id) newThread();
    qc.invalidateQueries({ queryKey: ["assistant-threads"] });
  };

  const suggestions = locale === "fr" ? SUGGESTIONS_FR : SUGGESTIONS_EN;
  const proposedActions = Object.values(actions);

  return (
    <div className="max-w-7xl mx-auto flex gap-4 h-[calc(100vh-9rem)] lg:h-[calc(100vh-7rem)]">
      {/* Thread sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <Button onClick={newThread} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> {t("admin.assistant.new_chat")}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.map((th: any) => (
            <div key={th.id} className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm cursor-pointer transition ${threadId === th.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
              <button onClick={() => loadThread(th.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-medium">{th.title}</span>
              </button>
              <button onClick={() => deleteThread(th.id)} className={`opacity-0 group-hover:opacity-100 ${threadId === th.id ? "text-white" : "text-slate-400 hover:text-red-600"}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {threads.length === 0 && <p className="text-xs text-slate-500 text-center px-3 py-4">{t("admin.assistant.no_threads")}</p>}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="pb-3 border-b border-slate-200">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md"><Sparkles className="w-5 h-5 text-white" /></span>
            {t("admin.assistant.title")}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t("admin.assistant.subtitle")}</p>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg"><Sparkles className="w-8 h-8 text-white" /></div>
              <p className="text-base font-bold text-slate-900">{t("admin.assistant.ready")}</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-sm font-semibold px-4 py-2 rounded-full bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition text-slate-800 shadow-sm">{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow"><Sparkles className="w-4 h-4 text-white" /></div>}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-900"}`}>
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:text-slate-800 prose-li:text-slate-800 prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-bold prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {m.role === "user" && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><UserIcon className="w-4 h-4 text-slate-700" /></div>}
            </div>
          ))}

          {/* Proposed action cards */}
          {proposedActions.map((a) => (
            <div key={a.id} className="ml-11 bg-amber-50 border border-amber-300 rounded-xl p-3 max-w-[85%]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">{t("admin.assistant.proposed")}</span>
                  <code className="text-xs font-bold text-slate-800">{a.kind}</code>
                </div>
                <span className={`text-[11px] font-bold ${a.status === "executed" ? "text-emerald-700" : a.status === "rejected" ? "text-slate-500" : a.status === "failed" ? "text-red-700" : "text-amber-700"}`}>{a.status}</span>
              </div>
              <pre className="text-xs text-slate-800 bg-white/60 rounded p-2 overflow-x-auto max-h-40">{JSON.stringify(a.preview || a.payload, null, 2)}</pre>
              {a.status === "proposed" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => runAction(a.id, "execute")} disabled={pendingAction === a.id} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {pendingAction === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}{t("admin.audit.approve")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => runAction(a.id, "reject")} disabled={pendingAction === a.id}>
                    <XCircle className="w-3 h-3 mr-1" />{t("admin.audit.reject")}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow"><Sparkles className="w-4 h-4 text-white animate-pulse" /></div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-600 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("admin.assistant.thinking")}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-3 bg-white">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder={t("admin.assistant.placeholder")}
              rows={1}
              className="resize-none bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
            <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 p-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAssistantPage;
