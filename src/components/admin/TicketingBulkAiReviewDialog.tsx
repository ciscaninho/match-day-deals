import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Sparkles, CheckCircle2, XCircle, SkipForward, ExternalLink,
} from "lucide-react";
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

export type BulkClub = {
  slug: string;
  club_name: string;
  official_ticketing_url: string | null;
  hospitality_url: string | null;
  membership_required: boolean;
  membership_required_for_big_games: boolean;
};

type Item = {
  club: BulkClub;
  suggestion?: Suggestion;
  draft?: Suggestion;
  error?: string;
};

const BATCH = 6;

export function TicketingBulkAiReviewDialog({
  open, onOpenChange, clubs, onAnyApplied,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clubs: BulkClub[];
  onAnyApplied: () => void;
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [applying, setApplying] = useState(false);
  const [counts, setCounts] = useState({ approved: 0, rejected: 0, skipped: 0, failed: 0 });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setItems(clubs.map((c) => ({ club: c })));
    setCursor(0);
    setFetchedCount(0);
    setCounts({ approved: 0, rejected: 0, skipped: 0, failed: 0 });
    setFetching(true);

    (async () => {
      try {
        const all: Item[] = clubs.map((c) => ({ club: c }));
        for (let i = 0; i < clubs.length; i += BATCH) {
          if (cancelled) return;
          const slice = clubs.slice(i, i + BATCH);
          try {
            const { data, error } = await supabase.functions.invoke(
              "ticketing-enrich-suggest",
              { body: { club_slugs: slice.map((c) => c.slug) } },
            );
            if (error) throw error;
            const results = (data?.results ?? []) as Array<{
              slug: string;
              suggestion: Suggestion | { error: string };
            }>;
            for (const r of results) {
              const idx = all.findIndex((it) => it.club.slug === r.slug);
              if (idx < 0) continue;
              const s = r.suggestion as Suggestion | { error: string };
              if ("error" in s) {
                all[idx] = { ...all[idx], error: s.error };
              } else {
                all[idx] = { ...all[idx], suggestion: s, draft: s };
              }
            }
          } catch (e: any) {
            for (const c of slice) {
              const idx = all.findIndex((it) => it.club.slug === c.slug);
              if (idx >= 0) all[idx] = { ...all[idx], error: e?.message ?? "ai_error" };
            }
          }
          if (cancelled) return;
          setItems([...all]);
          setFetchedCount(Math.min(i + slice.length, clubs.length));
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, clubs]);

  const total = items.length;
  const current = items[cursor];

  const setDraft = (patch: Partial<Suggestion>) => {
    setItems((prev) => prev.map((it, i) =>
      i === cursor && it.draft ? { ...it, draft: { ...it.draft, ...patch } } : it,
    ));
  };

  const advance = () => setCursor((c) => Math.min(c + 1, total));

  const approve = async () => {
    if (!current?.draft) return;
    setApplying(true);
    try {
      const d = current.draft;
      const club = current.club;
      const patch: Record<string, unknown> = {
        official_ticketing_url: d.official_ticketing_url || null,
        hospitality_url: d.hospitality_url || null,
        hospitality_available: !!d.hospitality_url,
        membership_required: d.membership_required,
        membership_name: d.membership_name || null,
        membership_required_for_big_games: d.membership_required_for_big_games,
        resale_exchange_available: d.resale_exchange_available,
        resale_exchange_name: d.resale_exchange_name || null,
        resale_exchange_url: d.resale_exchange_url || null,
        geo_restrictions: d.geo_restrictions,
        source_confidence: d.source_confidence,
        verification_status: "unverified",
        tickets_last_checked_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("club_ticketing_profiles")
        .update(patch as never)
        .eq("slug", club.slug);
      if (error) throw error;

      if (d.official_ticketing_url) {
        const { data: existing } = await supabase
          .from("ticket_sources" as never)
          .select("id")
          .eq("club_slug", club.slug)
          .eq("url", d.official_ticketing_url)
          .maybeSingle();
        if (!existing) {
          await supabase.from("ticket_sources" as never).insert({
            club_slug: club.slug,
            kind: "official",
            provider_name: club.club_name,
            url: d.official_ticketing_url,
            verification_status: "unverified",
            priority: 10,
          } as never);
        }
      }
      setCounts((c) => ({ ...c, approved: c.approved + 1 }));
      onAnyApplied();
      advance();
    } catch (e: any) {
      toast({ title: t("admin.ticketing.ai.error"), description: e?.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const reject = () => {
    setCounts((c) => ({ ...c, rejected: c.rejected + 1 }));
    advance();
  };
  const skip = () => {
    setCounts((c) => ({ ...c, skipped: c.skipped + 1 }));
    advance();
  };

  const fetchProgress = useMemo(
    () => (total === 0 ? 0 : Math.round((fetchedCount / total) * 100)),
    [fetchedCount, total],
  );

  const done = cursor >= total && total > 0;

  // Auto-skip failed items
  useEffect(() => {
    if (!open) return;
    if (!current) return;
    if (current.error && !applying) {
      setCounts((c) => ({ ...c, failed: c.failed + 1 }));
      toast({
        title: t("admin.ticketing.ai.failed_for").replace("{club}", current.club.club_name),
        description: current.error,
        variant: "destructive",
      });
      const id = setTimeout(advance, 50);
      return () => clearTimeout(id);
    }
  }, [cursor, current?.error, applying]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {t("admin.ticketing.ai.bulk_title")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("admin.ticketing.ai.bulk_subtitle")}
          </DialogDescription>
        </DialogHeader>

        {/* Fetch progress bar */}
        {fetching && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("admin.ticketing.ai.bulk_fetching")}
              </span>
              <span>{fetchedCount} / {total}</span>
            </div>
            <Progress value={fetchProgress} className="h-1" />
          </div>
        )}

        {done ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-sm font-bold text-foreground">{t("admin.ticketing.ai.bulk_done")}</p>
            <p className="text-xs text-muted-foreground">
              {t("admin.ticketing.ai.bulk_summary")
                .replace("{approved}", String(counts.approved))
                .replace("{rejected}", String(counts.rejected))
                .replace("{skipped}", String(counts.skipped))
                .replace("{failed}", String(counts.failed))}
            </p>
            <Button size="sm" onClick={() => onOpenChange(false)} className="mt-2">
              {t("admin.ticketing.ai.close")}
            </Button>
          </div>
        ) : current && current.draft && current.suggestion ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground truncate">{current.club.club_name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">
                {t("admin.ticketing.ai.bulk_progress")
                  .replace("{current}", String(cursor + 1))
                  .replace("{total}", String(total))}
              </span>
            </div>
            <Progress value={((cursor) / Math.max(total, 1)) * 100} className="h-1" />

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${confidenceTone(current.suggestion.confidence)}`}>
                {t("admin.ticketing.ai.confidence")}: {current.suggestion.confidence}% · {current.suggestion.source_confidence}
              </span>
            </div>
            {current.suggestion.rationale && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-violet-300 pl-2">
                {current.suggestion.rationale}
              </p>
            )}

            <FieldRow
              label={t("admin.ticketing.ai.official_url")}
              current={current.club.official_ticketing_url}
              value={current.draft.official_ticketing_url ?? ""}
              onChange={(v) => setDraft({ official_ticketing_url: v || null })}
            />
            <FieldRow
              label={t("admin.ticketing.ai.hospitality_url")}
              current={current.club.hospitality_url}
              value={current.draft.hospitality_url ?? ""}
              onChange={(v) => setDraft({ hospitality_url: v || null })}
            />

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox
                  checked={current.draft.membership_required}
                  onCheckedChange={(c) => setDraft({ membership_required: !!c })}
                />
                {t("admin.ticketing.ai.membership_required")}
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox
                  checked={current.draft.membership_required_for_big_games}
                  onCheckedChange={(c) => setDraft({ membership_required_for_big_games: !!c })}
                />
                {t("admin.ticketing.ai.membership_big_games")}
              </label>
            </div>

            <FieldRow
              label={t("admin.ticketing.ai.membership_name")}
              current={null}
              value={current.draft.membership_name ?? ""}
              onChange={(v) => setDraft({ membership_name: v || null })}
            />
            <FieldRow
              label={t("admin.ticketing.ai.resale_name")}
              current={null}
              value={current.draft.resale_exchange_name ?? ""}
              onChange={(v) => setDraft({
                resale_exchange_name: v || null,
                resale_exchange_available: !!(v || current.draft?.resale_exchange_url),
              })}
            />
            <FieldRow
              label={t("admin.ticketing.ai.resale_url")}
              current={null}
              value={current.draft.resale_exchange_url ?? ""}
              onChange={(v) => setDraft({
                resale_exchange_url: v || null,
                resale_exchange_available: !!(v || current.draft?.resale_exchange_name),
              })}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={skip} disabled={applying}>
                <SkipForward className="w-3.5 h-3.5 mr-1" />{t("admin.ticketing.ai.skip")}
              </Button>
              <Button variant="ghost" size="sm" onClick={reject} disabled={applying}>
                <XCircle className="w-3.5 h-3.5 mr-1" />{t("admin.ticketing.ai.reject")}
              </Button>
              <Button size="sm" onClick={approve} disabled={applying} className="bg-violet-600 hover:bg-violet-700 text-white">
                {applying ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                {t("admin.ticketing.ai.approve")}
              </Button>
            </div>
          </div>
        ) : current ? (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("admin.ticketing.ai.thinking")}
          </div>
        ) : null}
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
