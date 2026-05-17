import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Suggestion = {
  official_ticketing_url: string | null;
  hospitality_url: string | null;
  membership_required: boolean;
  membership_name: string | null;
  membership_required_for_big_games: boolean;
  resale_exchange_available: boolean;
  resale_exchange_name: string | null;
  resale_exchange_url: string | null;
  geo_restrictions: string[];
  confidence: number;
  source_confidence: "high" | "medium" | "low";
  rationale: string;
};

type CurrentRow = {
  slug: string;
  club_name: string;
  official_ticketing_url: string | null;
  hospitality_url: string | null;
  membership_required: boolean;
  membership_required_for_big_games: boolean;
};

export function TicketingAiSuggestionDialog({
  open, onOpenChange, club, onApplied,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  club: CurrentRow | null;
  onApplied: () => void;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [draft, setDraft] = useState<Suggestion | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open || !club) { setSuggestion(null); setDraft(null); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("ticketing-enrich-suggest", {
          body: { club_slug: club.slug },
        });
        if (cancelled) return;
        if (error) throw error;
        const r = data?.results?.[0];
        if (!r || "error" in (r.suggestion || {})) {
          toast({ title: t("admin.ticketing.ai.error"), description: (r?.suggestion as any)?.error ?? "", variant: "destructive" });
          setSuggestion(null);
        } else {
          setSuggestion(r.suggestion);
          setDraft(r.suggestion);
        }
      } catch (e: any) {
        if (!cancelled) toast({ title: t("admin.ticketing.ai.error"), description: e.message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, club, t]);

  const apply = async () => {
    if (!club || !draft) return;
    setApplying(true);
    try {
      const patch: Record<string, unknown> = {
        official_ticketing_url: draft.official_ticketing_url || null,
        hospitality_url: draft.hospitality_url || null,
        hospitality_available: !!draft.hospitality_url,
        membership_required: draft.membership_required,
        membership_name: draft.membership_name || null,
        membership_required_for_big_games: draft.membership_required_for_big_games,
        resale_exchange_available: draft.resale_exchange_available,
        resale_exchange_name: draft.resale_exchange_name || null,
        resale_exchange_url: draft.resale_exchange_url || null,
        geo_restrictions: draft.geo_restrictions,
        source_confidence: draft.source_confidence,
        verification_status: "unverified",
        tickets_last_checked_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("club_ticketing_profiles")
        .update(patch as never)
        .eq("slug", club.slug);
      if (error) throw error;

      // Auto-create an "official" ticket source if one doesn't already exist for this URL.
      if (draft.official_ticketing_url) {
        const { data: existing } = await supabase
          .from("ticket_sources" as never)
          .select("id")
          .eq("club_slug", club.slug)
          .eq("url", draft.official_ticketing_url)
          .maybeSingle();
        if (!existing) {
          await supabase.from("ticket_sources" as never).insert({
            club_slug: club.slug,
            kind: "official",
            provider_name: club.club_name,
            url: draft.official_ticketing_url,
            verification_status: "unverified",
            priority: 10,
          } as never);
        }
      }

      toast({ title: t("admin.ticketing.ai.applied") });
      onApplied();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: t("admin.ticketing.ai.error"), description: e.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const confidenceTone = (c: number) =>
    c >= 80 ? "bg-emerald-100 text-emerald-700"
    : c >= 50 ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-4 h-4 text-violet-600" />
            {t("admin.ticketing.ai.title")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-bold text-foreground">{club?.club_name}</span> · {t("admin.ticketing.ai.subtitle")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("admin.ticketing.ai.thinking")}
          </div>
        ) : !suggestion || !draft ? (
          <p className="py-6 text-sm text-muted-foreground text-center">{t("admin.ticketing.ai.empty")}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${confidenceTone(suggestion.confidence)}`}>
                {t("admin.ticketing.ai.confidence")}: {suggestion.confidence}% · {suggestion.source_confidence}
              </span>
            </div>
            {suggestion.rationale && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-violet-300 pl-2">
                {suggestion.rationale}
              </p>
            )}

            <FieldRow
              label={t("admin.ticketing.ai.official_url")}
              current={club?.official_ticketing_url ?? null}
              value={draft.official_ticketing_url ?? ""}
              onChange={(v) => setDraft({ ...draft, official_ticketing_url: v || null })}
            />
            <FieldRow
              label={t("admin.ticketing.ai.hospitality_url")}
              current={club?.hospitality_url ?? null}
              value={draft.hospitality_url ?? ""}
              onChange={(v) => setDraft({ ...draft, hospitality_url: v || null })}
            />

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox
                  checked={draft.membership_required}
                  onCheckedChange={(c) => setDraft({ ...draft, membership_required: !!c })}
                />
                {t("admin.ticketing.ai.membership_required")}
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox
                  checked={draft.membership_required_for_big_games}
                  onCheckedChange={(c) => setDraft({ ...draft, membership_required_for_big_games: !!c })}
                />
                {t("admin.ticketing.ai.membership_big_games")}
              </label>
            </div>

            <FieldRow
              label={t("admin.ticketing.ai.membership_name")}
              current={null}
              value={draft.membership_name ?? ""}
              onChange={(v) => setDraft({ ...draft, membership_name: v || null })}
            />
            <FieldRow
              label={t("admin.ticketing.ai.resale_name")}
              current={null}
              value={draft.resale_exchange_name ?? ""}
              onChange={(v) => setDraft({ ...draft, resale_exchange_name: v || null, resale_exchange_available: !!(v || draft.resale_exchange_url) })}
            />
            <FieldRow
              label={t("admin.ticketing.ai.resale_url")}
              current={null}
              value={draft.resale_exchange_url ?? ""}
              onChange={(v) => setDraft({ ...draft, resale_exchange_url: v || null, resale_exchange_available: !!(v || draft.resale_exchange_name) })}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => { onOpenChange(false); }} disabled={applying}>
                <XCircle className="w-3.5 h-3.5 mr-1" />{t("admin.ticketing.ai.reject")}
              </Button>
              <Button size="sm" onClick={apply} disabled={applying} className="bg-violet-600 hover:bg-violet-700 text-white">
                {applying ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {t("admin.ticketing.ai.approve")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  label, current, value, onChange,
}: {
  label: string;
  current: string | null;
  value: string;
  onChange: (v: string) => void;
}) {
  const changed = (current ?? "") !== (value ?? "");
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</label>
        {value && /^https?:\/\//.test(value) && (
          <a href={value} target="_blank" rel="noreferrer" className="text-[10px] text-violet-600 hover:underline inline-flex items-center gap-0.5">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 text-xs ${changed ? "border-violet-400 bg-violet-50/30" : ""}`}
      />
      {current && changed && (
        <p className="text-[10px] text-muted-foreground truncate">→ was: <span className="font-mono">{current}</span></p>
      )}
    </div>
  );
}
