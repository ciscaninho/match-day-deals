import { useMemo, useState } from "react";
import { Copy, ExternalLink, ShieldCheck, ShieldOff, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AFFILIATE_REGISTRY,
  inspectAffiliateUrl,
  transformAffiliateUrl,
} from "@/lib/affiliate";

interface RowInput {
  label: string;
  url: string | null | undefined;
}

interface Props {
  /** Optional pre-filled URLs to inspect (e.g. selected club's links). */
  samples?: RowInput[];
}

const SAMPLE_DEFAULTS: RowInput[] = [
  { label: "Sample match (Ticombo)", url: "https://www.ticombo.com/en/event/real-madrid-vs-barcelona-12345" },
  { label: "Sample club (Ticombo FR)", url: "https://www.ticombo.com/fr/tickets/real-madrid-vs-barca" },
  { label: "Comparison card (official)", url: "https://www.realmadrid.com/en/tickets" },
];

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      ok
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-slate-50 text-slate-600 border-slate-200"
    }`}
  >
    {ok ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
    {label}
  </span>
);

const copy = (s: string) => {
  navigator.clipboard.writeText(s).then(
    () => toast({ title: "Copied" }),
    () => toast({ title: "Copy failed", variant: "destructive" }),
  );
};

const DebugRow = ({ label, url }: RowInput) => {
  const info = useMemo(() => inspectAffiliateUrl(url ?? ""), [url]);
  if (!url) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs font-bold text-foreground">{label}</div>
        <div className="flex gap-1.5">
          <StatusPill ok={info.isTracked} label={info.isTracked ? "tracked" : "pass-through"} />
          {info.network && (
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
              {info.network}
            </span>
          )}
          {info.merchant && (
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              {info.merchant}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5 text-[11px]">
        <Field title="Destination" value={info.destination} />
        <Field title="Transformed" value={info.transformed} highlight={info.isTracked} />
        {info.campaign && <Field title="Campaign" value={info.campaign} />}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => copy(info.transformed)}>
          <Copy className="w-3 h-3 mr-1" /> Copy affiliate
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" asChild>
          <a href={info.destination} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> Open destination
          </a>
        </Button>
        <Button size="sm" className="h-7 text-[11px]" asChild>
          <a href={info.transformed} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> Open tracked
          </a>
        </Button>
      </div>
    </div>
  );
};

const Field = ({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) => (
  <div>
    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
    <div className={`break-all font-mono text-[11px] ${highlight ? "text-emerald-700 font-semibold" : "text-foreground"}`}>
      {value || "—"}
    </div>
  </div>
);

export const AffiliateDebugPanel = ({ samples }: Props) => {
  const [input, setInput] = useState("");
  const all = useMemo<RowInput[]>(() => {
    const list = (samples?.filter((s) => s.url) ?? []).concat(SAMPLE_DEFAULTS);
    if (input.trim()) list.unshift({ label: "Custom input", url: input.trim() });
    return list;
  }, [samples, input]);

  return (
    <section className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-extrabold text-foreground">Affiliate debug mode</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-bold">Registered:</span>
          {AFFILIATE_REGISTRY.map((p) => (
            <span
              key={p.id}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                p.affiliateEnabled
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              }`}
              title={`${p.network} — ${p.campaign ?? "no campaign"}`}
            >
              {p.merchant}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste any URL to inspect (e.g. https://www.ticombo.com/...)"
          className="h-8 text-xs font-mono"
        />
        {input && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => copy(transformAffiliateUrl(input.trim()))}>
            <Copy className="w-3 h-3 mr-1" /> Copy
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-2.5">
        {all.map((s, i) => (
          <DebugRow key={`${i}-${s.url}`} label={s.label} url={s.url} />
        ))}
      </div>
    </section>
  );
};

export default AffiliateDebugPanel;
