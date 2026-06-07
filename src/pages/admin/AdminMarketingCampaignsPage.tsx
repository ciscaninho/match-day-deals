import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "tiktok", source: "tiktok", medium: "organic", label: "TikTok" },
  { id: "instagram", source: "instagram", medium: "organic", label: "Instagram" },
  { id: "facebook", source: "facebook", medium: "social", label: "Facebook" },
  { id: "youtube", source: "youtube", medium: "video", label: "YouTube" },
  { id: "newsletter", source: "newsletter", medium: "email", label: "Newsletter" },
] as const;

type Platform = (typeof PLATFORMS)[number]["id"];

interface Campaign {
  id: string;
  name: string;
  platform: string;
  creator_name: string | null;
  competition: string | null;
  match_id: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string | null;
  target_path: string;
  short_id: string;
  archived_at: string | null;
  created_at: string;
}

interface CampaignStats {
  visits: number;
  match_clicks: number;
  ticket_clicks: number;
  redirects: number;
}

const slugify = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);

const randomShortId = (len = 7) => {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

const AdminMarketingCampaignsPage = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    platform: "tiktok" as Platform,
    creator_name: "",
    competition: "FIFA World Cup 2026",
    match_id: "",
    utm_content: "video1",
    target_path: "/world-cup-2026",
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["marketing_campaigns_list"],
    staleTime: 30_000,
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("marketing_campaigns" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Campaign[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["marketing_campaigns_events"],
    staleTime: 30_000,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("analytics_events" as never)
        .select("event_type,utm_campaign")
        .gte("created_at", since.toISOString())
        .not("utm_campaign", "is", null)
        .limit(10000);
      return (data ?? []) as Array<{ event_type: string; utm_campaign: string | null }>;
    },
  });

  const statsByCampaign = useMemo(() => {
    const map = new Map<string, CampaignStats>();
    events.forEach((e) => {
      if (!e.utm_campaign) return;
      const r = map.get(e.utm_campaign) ?? { visits: 0, match_clicks: 0, ticket_clicks: 0, redirects: 0 };
      if (e.event_type === "page_view") r.visits++;
      else if (e.event_type === "match_card_click") r.match_clicks++;
      else if (e.event_type === "ticket_button_click") r.ticket_clicks++;
      else if (e.event_type === "affiliate_redirect") r.redirects++;
      map.set(e.utm_campaign, r);
    });
    return map;
  }, [events]);

  const handleCreate = async (override?: Partial<typeof form>) => {
    const data = { ...form, ...(override ?? {}) };
    if (!data.name.trim()) {
      toast.error("Campaign name required");
      return;
    }
    const platform = PLATFORMS.find((p) => p.id === data.platform) ?? PLATFORMS[0];
    const utm_campaign = slugify(data.name);
    const short_id = randomShortId();

    const { error } = await supabase.from("marketing_campaigns" as never).insert({
      name: data.name.trim(),
      platform: platform.id,
      creator_name: data.creator_name.trim() || null,
      competition: data.competition.trim() || null,
      match_id: data.match_id.trim() || null,
      utm_source: platform.source,
      utm_medium: platform.medium,
      utm_campaign,
      utm_content: data.utm_content.trim() || null,
      target_path: data.target_path.trim() || "/",
      short_id,
    } as never);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Campaign created");
    qc.invalidateQueries({ queryKey: ["marketing_campaigns_list"] });
    setForm((f) => ({ ...f, name: "" }));
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from("marketing_campaigns" as never)
      .update({ archived_at: new Date().toISOString() } as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign archived");
    qc.invalidateQueries({ queryKey: ["marketing_campaigns_list"] });
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const buildFullUrl = (c: Campaign) => {
    const join = c.target_path.includes("?") ? "&" : "?";
    const qs = new URLSearchParams({
      utm_source: c.utm_source,
      utm_medium: c.utm_medium,
      utm_campaign: c.utm_campaign,
      ...(c.utm_content ? { utm_content: c.utm_content } : {}),
    }).toString();
    return `${origin}${c.target_path}${join}${qs}`;
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2"><Plus className="w-4 h-4" /> Create campaign</h2>

        <div className="grid md:grid-cols-2 gap-2">
          <Field label="Campaign name">
            <input className={inputCls} value={form.name} placeholder="france_senegal_tiktok"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Creator (optional)">
            <input className={inputCls} value={form.creator_name} placeholder="@creator"
              onChange={(e) => setForm({ ...form, creator_name: e.target.value })} />
          </Field>
          <Field label="Competition">
            <input className={inputCls} value={form.competition}
              onChange={(e) => setForm({ ...form, competition: e.target.value })} />
          </Field>
          <Field label="Match ID (optional)">
            <input className={inputCls} value={form.match_id}
              onChange={(e) => setForm({ ...form, match_id: e.target.value })} />
          </Field>
          <Field label="UTM content">
            <input className={inputCls} value={form.utm_content}
              onChange={(e) => setForm({ ...form, utm_content: e.target.value })} />
          </Field>
          <Field label="Target path">
            <input className={inputCls} value={form.target_path}
              onChange={(e) => setForm({ ...form, target_path: e.target.value })} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {PLATFORMS.map((p) => (
            <button key={p.id}
              onClick={() => handleCreate({ platform: p.id })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 transition">
              <Plus className="w-3 h-3" /> {p.label} link
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Campaigns {isLoading ? "(loading…)" : `(${campaigns.length})`}
        </div>
        <div className="divide-y divide-slate-100">
          {campaigns.length === 0 && !isLoading && (
            <div className="p-3 text-xs text-slate-500">No campaigns yet — create one above.</div>
          )}
          {campaigns.map((c) => {
            const fullUrl = buildFullUrl(c);
            const shortUrl = `${origin}/go/${c.short_id}`;
            const s = statsByCampaign.get(c.utm_campaign) ?? { visits: 0, match_clicks: 0, ticket_clicks: 0, redirects: 0 };
            const ctr = s.visits ? Math.round((s.ticket_clicks / s.visits) * 1000) / 10 : 0;
            const conv = s.visits ? Math.round((s.redirects / s.visits) * 1000) / 10 : 0;
            return (
              <div key={c.id} className={`p-3 text-xs ${c.archived_at ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">{c.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      {c.platform}{c.creator_name ? ` · ${c.creator_name}` : ""}{c.competition ? ` · ${c.competition}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copy(shortUrl)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                      <Copy className="w-3 h-3" /> Short
                    </button>
                    <button onClick={() => copy(fullUrl)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                      <Copy className="w-3 h-3" /> Full
                    </button>
                    <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                    {!c.archived_at && (
                      <button onClick={() => handleArchive(c.id)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 text-rose-700 px-2 py-1 hover:bg-rose-50">
                        <Trash2 className="w-3 h-3" /> Archive
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px]">
                  <Stat label="Visits" value={s.visits} />
                  <Stat label="Match clicks" value={s.match_clicks} />
                  <Stat label="Ticket clicks" value={s.ticket_clicks} />
                  <Stat label="Affiliate" value={s.redirects} accent />
                  <Stat label="CTR" value={`${ctr}%`} />
                  <Stat label="Conv." value={`${conv}%`} />
                </div>
                <div className="mt-2 text-[10px] text-slate-500 break-all">
                  <div><span className="font-bold text-slate-700">Short:</span> {shortUrl}</div>
                  <div><span className="font-bold text-slate-700">Full:</span> {fullUrl}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const inputCls = "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1">
    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
    {children}
  </label>
);

const Stat = ({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) => (
  <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{label}</div>
    <div className={`text-sm font-extrabold ${accent ? "text-violet-700" : "text-slate-900"}`}>{value}</div>
  </div>
);

export default AdminMarketingCampaignsPage;
