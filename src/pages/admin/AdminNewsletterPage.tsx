import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle2, Clock, XCircle, Download } from "lucide-react";

interface Row {
  id: string;
  email: string;
  favourite_team: string | null;
  source: string | null;
  status: string;
  utm_source: string | null;
  utm_campaign: string | null;
  language: string | null;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    unsubscribed: "bg-slate-100 text-slate-600 border-slate-200",
    bounced: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${map[status] ?? "bg-slate-50 text-slate-600"}`}>
      {status}
    </span>
  );
};

const Stat = ({ label, value, icon: Icon, tone = "slate" }: { label: string; value: number | string; icon: any; tone?: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <Icon className={`w-4 h-4 text-${tone}-500`} />
    </div>
    <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
  </div>
);

const AdminNewsletterPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin_newsletter_signups"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("newsletter_signups" as never)
        .select("id,email,favourite_team,source,status,utm_source,utm_campaign,language,created_at,confirmed_at,unsubscribed_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = data ?? [];

  const stats = useMemo(() => {
    const byEmail = new Map<string, Row>();
    rows.forEach((r) => { if (!byEmail.has(r.email)) byEmail.set(r.email, r); });
    const unique = Array.from(byEmail.values());
    const now = Date.now();
    const last7 = unique.filter((r) => now - new Date(r.created_at).getTime() < 7 * 864e5).length;
    const last30 = unique.filter((r) => now - new Date(r.created_at).getTime() < 30 * 864e5).length;
    return {
      total: unique.length,
      confirmed: unique.filter((r) => r.status === "confirmed").length,
      pending: unique.filter((r) => r.status === "pending").length,
      unsubscribed: unique.filter((r) => r.status === "unsubscribed").length,
      bounced: unique.filter((r) => r.status === "bounced").length,
      last7, last30,
    };
  }, [rows]);

  const sourceBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.source ?? "unknown", (m.get(r.source ?? "unknown") ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const teamBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => { if (r.favourite_team) m.set(r.favourite_team, (m.get(r.favourite_team) ?? 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [rows]);

  const utmBreakdown = useMemo(() => {
    const src = new Map<string, number>();
    const camp = new Map<string, number>();
    rows.forEach((r) => {
      if (r.utm_source) src.set(r.utm_source, (src.get(r.utm_source) ?? 0) + 1);
      if (r.utm_campaign) camp.set(r.utm_campaign, (camp.get(r.utm_campaign) ?? 0) + 1);
    });
    return {
      sources: Array.from(src.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      campaigns: Array.from(camp.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !(r.email.toLowerCase().includes(q) || (r.favourite_team ?? "").toLowerCase().includes(q) || (r.source ?? "").toLowerCase().includes(q))) return false;
      return true;
    }).slice(0, 200);
  }, [rows, search, statusFilter]);

  const exportCsv = () => {
    const headers = ["email","status","source","favourite_team","utm_source","utm_campaign","language","created_at","confirmed_at","unsubscribed_at"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      lines.push(headers.map((h) => {
        const v = (r as any)[h] ?? "";
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const conversion = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Marketing Hub</p>
        <h1 className="text-xl font-extrabold text-slate-900">Newsletter</h1>
        <p className="text-xs text-slate-500">Subscribers, opt-in funnel and source attribution.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Subscribers" value={stats.total} icon={Mail} tone="violet" />
        <Stat label="Confirmed" value={`${stats.confirmed} (${conversion}%)`} icon={CheckCircle2} tone="emerald" />
        <Stat label="Pending" value={stats.pending} icon={Clock} tone="amber" />
        <Stat label="Unsubscribed" value={stats.unsubscribed} icon={XCircle} tone="rose" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Last 7 days" value={stats.last7} icon={Clock} />
        <Stat label="Last 30 days" value={stats.last30} icon={Clock} />
        <Stat label="Bounced" value={stats.bounced} icon={XCircle} tone="rose" />
        <Stat label="Conversion" value={`${conversion}%`} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">By source</h3>
          <ul className="space-y-1.5 text-sm">
            {sourceBreakdown.map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="text-slate-700">{k}</span><span className="font-bold">{v}</span></li>
            ))}
            {sourceBreakdown.length === 0 && <li className="text-xs text-slate-400">No data</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Top favourite teams</h3>
          <ul className="space-y-1.5 text-sm">
            {teamBreakdown.map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="text-slate-700 truncate">{k}</span><span className="font-bold">{v}</span></li>
            ))}
            {teamBreakdown.length === 0 && <li className="text-xs text-slate-400">No data</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Top UTMs</h3>
          <div className="text-[11px] font-bold text-slate-500 mb-1">Sources</div>
          <ul className="space-y-1 text-sm mb-2">
            {utmBreakdown.sources.map(([k, v]) => <li key={k} className="flex justify-between"><span className="truncate">{k}</span><span className="font-bold">{v}</span></li>)}
            {utmBreakdown.sources.length === 0 && <li className="text-xs text-slate-400">No data</li>}
          </ul>
          <div className="text-[11px] font-bold text-slate-500 mb-1">Campaigns</div>
          <ul className="space-y-1 text-sm">
            {utmBreakdown.campaigns.map(([k, v]) => <li key={k} className="flex justify-between"><span className="truncate">{k}</span><span className="font-bold">{v}</span></li>)}
            {utmBreakdown.campaigns.length === 0 && <li className="text-xs text-slate-400">No data</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-slate-100">
          <input
            placeholder="Search email / team / source…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-md border border-slate-200 px-3 py-1.5 text-sm"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 hover:bg-slate-700 text-white px-3 py-1.5 text-xs font-bold">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Source</th>
                <th className="text-left px-4 py-2">Team</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">No signups</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{r.email}</td>
                  <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2 text-slate-600">{r.source ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{r.favourite_team ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{r.confirmed_at ? new Date(r.confirmed_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-[11px] text-slate-400 text-center">Showing {filtered.length} of {rows.length}</div>
      </div>
    </div>
  );
};

export default AdminNewsletterPage;
