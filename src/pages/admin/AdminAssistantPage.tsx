import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS_EN = [
  "Find duplicate stadiums",
  "Which stadiums are missing coordinates?",
  "Show me Real Madrid's ticketing profile",
  "List upcoming Premier League matches",
];
const SUGGESTIONS_FR = [
  "Trouve les stades en doublon",
  "Quels stades n'ont pas de coordonnées ?",
  "Montre le profil billetterie du Real Madrid",
  "Liste les prochains matchs de Premier League",
];

export const AdminAssistantPage = () => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-assistant", {
        body: { messages: next },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") { toast.error(t("admin.assistant.rate_limited")); return; }
      if (data?.error === "payment_required") { toast.error(t("admin.assistant.payment_required")); return; }
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "" }]);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.assistant.error"));
    } finally {
      setLoading(false);
    }
  };

  const suggestions = language === "fr" ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-9rem)] lg:h-[calc(100vh-7rem)]">
      <header className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-[#2C3E50] flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></span>
          {t("admin.assistant.title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{t("admin.assistant.subtitle")}</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-bold text-[#2C3E50]">{t("admin.assistant.ready")}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#2ECC71] hover:bg-emerald-50 transition text-[#2C3E50]">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-white" /></div>}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-[#2C3E50] text-white" : "bg-white border border-slate-200 text-[#2C3E50]"}`}>
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-headings:text-[#2C3E50] prose-strong:text-[#2C3E50] prose-code:text-[#2ECC71] prose-code:bg-emerald-50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {m.role === "user" && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><UserIcon className="w-4 h-4 text-slate-600" /></div>}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center"><Sparkles className="w-4 h-4 text-white animate-pulse" /></div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> {t("admin.assistant.thinking")}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-3 bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-1">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder={t("admin.assistant.placeholder")}
            rows={1}
            className="resize-none bg-white"
          />
          <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="bg-[#2ECC71] hover:bg-[#27AE60]">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAssistantPage;
