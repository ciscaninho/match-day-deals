import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Users, ExternalLink, Trophy } from "lucide-react";
import { StadiumDrawer, type StadiumDrawerRow } from "@/components/admin/StadiumDrawer";

type HostRow = StadiumDrawerRow & {
  capacity: number | null;
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  world_cup_role: string | null;
  official_ticket_provider: string | null;
};

const WC_COMPETITION = "FIFA World Cup 2026";

export default function StadiumsTab() {
  const [selected, setSelected] = useState<HostRow | null>(null);

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ["admin-wc-host-stadiums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,league,capacity,latitude,longitude,hero_image_url,thumbnail_image_url,clubs,description,archived_at,archived_into_slug,publication_status,aliases,is_world_cup_host,enrichment_status,world_cup_role,official_ticket_provider")
        .eq("is_world_cup_host", true)
        .is("archived_at", null)
        .order("country")
        .order("city");
      if (error) throw error;
      return (data ?? []) as HostRow[];
    },
  });

  const { data: stats = {} } = useQuery({
    queryKey: ["admin-wc-host-stadium-stats"],
    enabled: hosts.length > 0,
    queryFn: async () => {
      const names = hosts.map((h) => h.stadium_name);
      const [matchesRes, coverageRes] = await Promise.all([
        supabase
          .from("matches")
          .select("stadium,starting_price")
          .eq("competition", WC_COMPETITION)
          .in("stadium", names),
        supabase
          .from("wc_ticket_coverage" as never)
          .select("stadium_name,match_id,starting_price,is_available")
          .in("stadium_name", names),
      ]);
      const out: Record<string, { matches: number; minPrice: number | null; tickets: number; coverage: number }> = {};
      for (const n of names) out[n] = { matches: 0, minPrice: null, tickets: 0, coverage: 0 };
      for (const m of (matchesRes.data ?? []) as any[]) {
        const k = m.stadium as string;
        if (!out[k]) continue;
        out[k].matches += 1;
        const p = m.starting_price as number | null;
        if (p != null && (out[k].minPrice == null || p < out[k].minPrice!)) out[k].minPrice = p;
      }
      for (const c of (coverageRes.data ?? []) as any[]) {
        const k = c.stadium_name as string;
        if (!out[k]) continue;
        if (c.match_id && c.is_available !== false) out[k].tickets += 1;
        out[k].coverage += 1;
      }
      return out;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading host stadiums…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        <Trophy className="w-4 h-4 inline -mt-0.5 mr-1" />
        <strong>{hosts.length} host stadiums</strong> — managed exclusively here. Click any row to open the edit drawer (shared with the global stadium editor).
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-bold">Stadium</th>
                <th className="text-left px-3 py-2 font-bold">Host city</th>
                <th className="text-right px-3 py-2 font-bold">Capacity</th>
                <th className="text-right px-3 py-2 font-bold">Matches</th>
                <th className="text-right px-3 py-2 font-bold">Tickets</th>
                <th className="text-right px-3 py-2 font-bold">Lowest €</th>
                <th className="text-right px-3 py-2 font-bold">Coverage</th>
                <th className="text-left px-3 py-2 font-bold">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hosts.map((h) => {
                const s = stats[h.stadium_name] ?? { matches: 0, minPrice: null, tickets: 0, coverage: 0 };
                const pct = s.matches > 0 ? Math.round((s.tickets / s.matches) * 100) : 0;
                return (
                  <tr
                    key={h.slug}
                    onClick={() => setSelected(h)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {h.thumbnail_image_url || h.hero_image_url ? (
                          <img src={h.thumbnail_image_url || h.hero_image_url!} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100" />
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{h.stadium_name}</p>
                          {h.world_cup_role && <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{h.world_cup_role}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{h.city}, {h.country}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900 font-bold">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" />{h.capacity ? h.capacity.toLocaleString() : "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900 font-bold">{s.matches}</td>
                    <td className="px-3 py-2 text-right text-slate-900 font-bold">{s.tickets}</td>
                    <td className="px-3 py-2 text-right text-slate-900 font-bold">{s.minPrice != null ? `€${s.minPrice}` : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pct >= 80 ? "bg-emerald-100 text-emerald-700" : pct >= 40 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{pct}%</span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {h.official_ticket_provider ? (
                        <span className="inline-flex items-center gap-1 text-xs">{h.official_ticket_provider}<ExternalLink className="w-3 h-3 text-emerald-600" /></span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StadiumDrawer stadium={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
