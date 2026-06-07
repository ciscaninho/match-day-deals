import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Mail, Loader2, Search, Tag, Bell, Crown, LifeBuoy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useAssistantSettings } from "@/hooks/useAssistantSettings";
import { useMatches } from "@/hooks/useMatches";
import { useStadiums } from "@/hooks/useStadium";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const ESCALATE_MARKER = "[[ESCALATE]]";

export const AIAssistantWidget = () => {
  const { settings } = useAssistantSettings();
  const { t, locale } = useLanguage();
  const { isPremium } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: matches = [] } = useMatches();
  const { data: stadiums = [] } = useStadiums();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationMsg, setEscalationMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset greeting when locale changes (so the welcome message switches language live)
  useEffect(() => {
    if (open && messages.length <= 1) {
      setMessages([{ role: "assistant", content: t("ai.greeting") }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const matchIdMatch = location.pathname.match(/^\/match(?:es)?\/(.+)$/);
  const currentMatch = matchIdMatch ? matches.find((m) => m.id === matchIdMatch[1]) : null;

  const quickActions = useMemo(
    () => [
      { icon: Search, label: t("ai.quick.find_matches"), prompt: t("ai.quick.find_matches") },
      { icon: Tag, label: t("ai.quick.compare_prices"), prompt: t("ai.quick.compare_prices") },
      { icon: Bell, label: t("ai.quick.track_prices"), prompt: t("ai.quick.track_prices") },
      { icon: Crown, label: t("ai.quick.premium"), prompt: t("ai.quick.premium") },
      { icon: LifeBuoy, label: t("ai.quick.contact"), prompt: t("ai.quick.contact") },
    ],
    [t],
  );

  if (!settings.enabled) return null;

  const buildContext = () => {
    const now = new Date();
    const upcoming = matches
      .filter((m) => new Date(m.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 200)
      .map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        match: `${m.homeTeam} vs ${m.awayTeam}`,
        competition: m.competition,
        country: m.country,
        date: m.date,
        stadium: m.stadium,
        city: m.city,
        startingPrice: m.startingPrice,
        ticketStatus: m.ticketStatus,
        ticketReleaseDate: m.ticketReleaseDate,
        featured: m.featured,
        priority: m.priority,
        url: `/matches/${m.id}`,
        providers: m.ticketSources.map((s) => ({ type: s.type, name: s.name, url: s.url })),
      }));
    const stadiumsSummary = stadiums.map((s) => ({
      name: s.stadium_name,
      slug: s.slug,
      city: s.city,
      country: s.country,
      league: s.league,
      club: s.club_name,
      capacity: s.capacity,
      atmosphere: s.atmosphere_score,
      family: s.family_friendly_score,
      accessibility: s.accessibility_score,
      popularity: s.popularity_score,
      value: s.value_score,
      url: `/stadiums/${s.slug}`,
    }));
    return {
      currentPage: location.pathname,
      userType: isPremium ? "premium" : "free",
      nowIso: now.toISOString(),
      matchInfo: currentMatch
        ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam} (${currentMatch.competition}, ${currentMatch.date})`
        : null,
      matchesSummary: JSON.stringify(upcoming),
      stadiumsSummary: JSON.stringify(stadiumsSummary),
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
      body: JSON.stringify({ messages: history, language: locale, context: buildContext() }),
    });

    if (resp.status === 429) throw new Error(t("ai.rate_limit"));
    if (resp.status === 402) throw new Error(t("ai.credits"));
    if (!resp.ok || !resp.body) throw new Error(t("ai.error"));

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";
    let done = false;

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
              prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: visible } : m)),
            );
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    if (assistantText.includes(ESCALATE_MARKER) && settings.escalation_enabled) {
      const lastUser = [...history].reverse().find((m) => m.role === "user");
      setEscalationMsg(lastUser?.content || "");
      setShowEscalation(true);
    }
  };

  const sendPrompt = async (text: string) => {
    if (!text.trim() || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      trackEvent("chatbot_message", { length: text.trim().length });
    } catch { /* noop */ }
    try {
      await streamChat(next);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: e.message || t("ai.fallback") }]);
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
      related_match_name: currentMatch ? `${currentMatch.homeTeam} vs ${currentMatch.awayTeam}` : null,
      language: locale,
      user_type: isPremium ? "premium" : "free",
    });
    if (error) {
      toast.error(t("ai.escalation_failed"));
      return;
    }
    toast.success(t("ai.escalation_sent"));
    setMessages((prev) => [...prev, { role: "assistant", content: t("ai.escalation_success_msg") }]);
    setShowEscalation(false);
    setEscalationMsg("");
  };

  // Intercept internal links so they navigate via React Router (no full reload)
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (!href) return;
    if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      navigate(href);
      setOpen(false);
    }
  };

  const lastIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); trackEvent("chatbot_open"); }}
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

      {open && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[640px] bg-background md:rounded-2xl md:shadow-2xl md:border md:border-border flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary to-primary/80 text-primary-foreground md:rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center ring-2 ring-primary-foreground/30">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{settings.display_name}</p>
                <p className="text-[11px] opacity-80 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {t("ai.subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("ai.close")}
              className="p-1.5 rounded-full hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm break-words shadow-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-a:text-primary prose-a:font-medium prose-a:underline-offset-2">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) => (
                              <a
                                {...props}
                                href={href}
                                onClick={(e) => handleLinkClick(e, href)}
                                target={href?.startsWith("/") ? "_self" : "_blank"}
                                rel="noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                    )}
                  </div>
                </div>
              ))}
              {sending && lastIsUser && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" />
                  </div>
                </div>
              )}

              {/* Quick actions — show when conversation is fresh */}
              {messages.length <= 1 && !sending && (
                <div className="pt-2 space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium px-1">
                    {t("ai.quick.title")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => sendPrompt(qa.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <qa.icon className="w-3.5 h-3.5" />
                        {qa.label}
                      </button>
                    ))}
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
                <Button size="sm" variant="outline" onClick={() => setShowEscalation(false)}>
                  {t("ai.escalation_cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3 bg-card/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPrompt(input);
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
              <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label={t("ai.send")}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">{t("ai.disclaimer")}</p>
          </div>
        </div>
      )}
    </>
  );
};
