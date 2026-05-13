import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown, FileEdit, Eye, ShieldCheck, CheckCircle2 } from "lucide-react";

export type PublicationStatus = "draft" | "internal_review" | "verified" | "published";

export const PUBLICATION_STATUSES: PublicationStatus[] = [
  "draft",
  "internal_review",
  "verified",
  "published",
];

export const STATUS_META: Record<
  PublicationStatus,
  { labelKey: string; fallback: string; cls: string; icon: any }
> = {
  draft: {
    labelKey: "admin.pub.status.draft",
    fallback: "Draft",
    cls: "bg-slate-100 text-slate-700 border-slate-300",
    icon: FileEdit,
  },
  internal_review: {
    labelKey: "admin.pub.status.internal_review",
    fallback: "In review",
    cls: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Eye,
  },
  verified: {
    labelKey: "admin.pub.status.verified",
    fallback: "Verified",
    cls: "bg-sky-100 text-sky-700 border-sky-300",
    icon: ShieldCheck,
  },
  published: {
    labelKey: "admin.pub.status.published",
    fallback: "Published",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: CheckCircle2,
  },
};

export const PublicationStatusPill = ({
  status,
  className = "",
}: {
  status: PublicationStatus | string | null | undefined;
  className?: string;
}) => {
  const { t } = useLanguage();
  const key = (status || "draft") as PublicationStatus;
  const meta = STATUS_META[key] || STATUS_META.draft;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {t(meta.labelKey) || meta.fallback}
    </span>
  );
};

type Props = {
  table: "club_ticketing_profiles" | "stadiums" | "league_publication";
  matchColumn: string; // "slug" or "id"
  matchValue: string;
  status: PublicationStatus | string | null | undefined;
  invalidateKeys?: string[][];
  entityLabel?: string;
};

export const PublicationStatusControl = ({
  table,
  matchColumn,
  matchValue,
  status,
  invalidateKeys = [],
  entityLabel,
}: Props) => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const current = (status || "draft") as PublicationStatus;
  const meta = STATUS_META[current] || STATUS_META.draft;
  const Icon = meta.icon;

  const update = async (next: PublicationStatus) => {
    if (next === current) return;
    setBusy(true);
    try {
      const { error } = await (supabase.from(table as any) as any)
        .update({ publication_status: next, updated_at: new Date().toISOString() })
        .eq(matchColumn, matchValue);
      if (error) throw error;
      const label = STATUS_META[next].fallback;
      toast.success(
        entityLabel
          ? `${entityLabel} → ${label}`
          : `${t("admin.pub.updated") || "Status updated"} → ${label}`
      );
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={busy}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls} hover:opacity-80 transition disabled:opacity-50`}
          aria-label="Change publication status"
        >
          {busy ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Icon className="w-3 h-3" />
          )}
          {t(meta.labelKey) || meta.fallback}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">
          {t("admin.pub.move_to") || "Move to"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PUBLICATION_STATUSES.map((s) => {
          const m = STATUS_META[s];
          const I = m.icon;
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => update(s)}
              className={`gap-2 text-xs ${s === current ? "bg-muted/60 font-bold" : ""}`}
              disabled={s === current}
            >
              <I className="w-3.5 h-3.5" />
              {t(m.labelKey) || m.fallback}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
