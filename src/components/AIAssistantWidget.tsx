import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useAssistantSettings } from "@/hooks/useAssistantSettings";
import { useMatches } from "@/hooks/useMatches";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const ESCALATE_MARKER = "[[ESCALATE]]";

export const AIAssistantWidget = () => {
  const { settings } = useAssistantSettings();
  const { t, locale } = useLanguage();
  const { isPremium } = useUser();
  const location = useLocation();
  const { data: matches = [] } = useMatches();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationMsg, setEscalationMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on first open
  useEffect(() => {
    if (open && messages.length === 0 && settings.greeting) {
      setMessages([{ role: "assistant", content: settings.greeting }]);
    }
  }, [open, settings.greeting, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Get current match context if on match detail page
  const matchIdMatch = location.pathname.match(/^\/match\/(.+)$/);
  const currentMatch = matchIdMatch
    ? matches.find((m) => m.id === matchIdMatch[1])
    : null;

  if (!settings.enabled) return null;

  const buildContext = () => {
    // Send a compact summary of upcoming matches so the AI can answer factually.
    const now = new Date();
    const summary = matches
      .filter((m) => new Date(m.date) >= now)
      .slice(0, 20)
      .map((m) => ({
        id: m.id,
        match: `${m.homeTeam} vs ${m.awayTeam}`,
        competition: m.competition,
        date: m.date,
        stadium: m.stadium,
        city: m.city,
        startingPrice: m.startingPrice,
        ticketStatus: m.ticketStatus,
        ticketReleaseDate: m.ticketReleaseDate,
        official: m.ticketSources.find((s) => s.type === "official")?.url || null,
        resale: m.ticketSources.find((s) => s.type === "resale")?.url || null,
      }));
    return {
      currentPage: location.pathname,
      userType: isPremium ? "premium" : "free",
      matchInfo: currentMatch
        ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam} (${currentMatch.competition}, ${currentMatch.date})`
        : null,
      matchesSummary: JSON.stringify(summary),
    };
  };

  const streamChat = async (history: Msg[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: history,
        language: locale,
        context: buildContext(),
      }),
    });

    if (resp.status === 429) throw new Error(t("ai.rate_limit"));
    if (resp.status === 402) throw new Error(t("ai.credits"));
    if (!resp.ok || !resp.body) throw new Error(t("ai.error"));

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";
    let done = false;

    // Insert empty assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (!done) {
      const { done: d, value } = await reader.read();
      if (d) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          done = true;
          break;
        }
        try {
          const parsed = JSON.parse(json);
          const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (chunk) {
            assistantText += chunk;
            const visible = assistantText.replace(ESCALATE_MARKER, "").trim();
            setMessages((prev) =>
              prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: visible } : m,
              ),
            );
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // After stream finishes, check for escalate marker
    if (assistantText.includes(ESCALATE_MARKER) && settings.escalation_enabled) {
      const lastUser = [...history].reverse().find((m) => m.role === "user");
      setEscalationMsg(lastUser?.content || "");
      setShowEscalation(true);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setSending(true);
    try {
      await streamChat(next);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e.message || t("ai.error") },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalationMsg.trim()) return;
    const { error } = await supabase.from("support_escalations").insert({
      user_message: escalationMsg.trim(),
      current_page: location.pathname,
      related_match_id: currentMatch?.id || null,
      related_match_name: currentMatch
        ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam}`
        : null,
      language: locale,
      user_type: isPremium ? "premium" : "free",
    });
    if (error) {
      toast.error(t("ai.escalation_failed"));
      return;
    }
    toast.success(t("ai.escalation_sent"));
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: t("ai.escalation_success_msg") },
    ]);
    setShowEscalation(false);
    setEscalationMsg("");
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("ai.open")}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:bottom-6 md:right-6"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 md:w-[380px] md:h-[600px] bg-background md:rounded-2xl md:shadow-2xl md:border md:border-border flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground md:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {settings.display_name}
                </p>
                <p className="text-[11px] opacity-80">{t("ai.subtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("ai.close")}
              className="p-1.5 rounded-full hover:bg-primary-foreground/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.content || (
                      <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                    )}
                  </div>
                </div>
              ))}
              {sending && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Escalation block */}
          {showEscalation && (
            <div className="border-t border-border p-3 bg-muted/40 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {settings.fallback_message}
              </p>
              <Textarea
                value={escalationMsg}
                onChange={(e) => setEscalationMsg(e.target.value)}
                placeholder={t("ai.escalation_placeholder")}
                className="text-sm min-h-[70px]"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleEscalate}>
                  {t("ai.escalation_send")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEscalation(false)}
                >
                  {t("ai.escalation_cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("ai.placeholder")}
                disabled={sending}
                className="text-sm"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !input.trim()}
                aria-label={t("ai.send")}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              {t("ai.disclaimer")}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
