import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, Ticket, Trophy, ExternalLink, ChevronRight } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";

type HostRow = {
  slug: string;
  stadium_name: string;
  city: string;
  country: string;
  capacity: number | null;
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  background_image_url: string | null;
  official_ticket_provider: string | null;
  world_cup_role: string | null;
};

const WC_COMPETITION = "FIFA World Cup 2026";

export default function WorldCupStadiumsPage() {
  const { t } = useLanguage();

  useSEO({
    title: "World Cup 2026 Host Stadiums | Foot Ticket Finder",
    description: "All 16 official FIFA World Cup 2026 host stadiums — capacity, host city, fixtures and ticket availability.",
  });

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ["wc-host-stadiums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,capacity,hero_image_url,thumbnail_image_url,background_image_url,official_ticket_provider,world_cup_role")
        .eq("is_world_cup_host", true)
        .is("archived_at", null)
        .order("country")
        .order("city");
      if (error) throw error;
      return (data ?? []) as HostRow[];
    },
  });

  // Per-stadium fixture + coverage stats.
  const { data: stats = {} } = useQuery({
    queryKey: ["wc-host-stadium-stats"],
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
      const out: Record<string, { matches: number; minPrice: number | null; tickets: number; coverageTotal: number }> = {};
      for (const n of names) out[n] = { matches: 0, minPrice: null, tickets: 0, coverageTotal: 0 };
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
        out[k].coverageTotal += 1;
        if (c.match_id && c.is_available !== false) out[k].tickets += 1;
        const p = c.starting_price as number | null;
        if (p != null && (out[k].minPrice == null || p < out[k].minPrice!)) out[k].minPrice = p;
      }
      return out;
    },
  });

  return (
    <WebsiteLayout>
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold uppercase tracking-widest mb-2">
          <Trophy className="w-4 h-4" />
          <Link to="/world-cup-2026" className="hover:underline">FIFA World Cup 2026</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Host stadiums</span>
        </div>
        <h1 className="font-display text-3xl text-slate-900">Host Stadiums</h1>
        <p className="text-sm text-slate-600 mt-1">All 16 official venues across Canada, Mexico and the United States.</p>

        {isLoading ? (
          <p className="mt-10 text-sm text-slate-500">Loading…</p>
        ) : hosts.length === 0 ? (
          <p className="mt-10 text-sm text-slate-500">No host stadiums published yet.</p>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hosts.map((h) => {
              const img = h.hero_image_url || h.background_image_url || h.thumbnail_image_url;
              const s = stats[h.stadium_name] ?? { matches: 0, minPrice: null, tickets: 0, coverageTotal: 0 };
              const coveragePct = s.matches > 0 ? Math.round((s.tickets / s.matches) * 100) : 0;
              return (
                <Link
                  key={h.slug}
                  to={`/world-cup-2026/stadiums/${h.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-500 hover:shadow-lg transition"
                >
                  <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    {img ? (
                      <img src={img} alt={h.stadium_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Trophy className="w-8 h-8" /></div>
                    )}
                    {h.world_cup_role && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">{h.world_cup_role}</span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h2 className="font-bold text-slate-900 truncate">{h.stadium_name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{h.city}, {h.country}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Capacity</p>
                        <p className="text-slate-900 font-bold flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" />{h.capacity ? h.capacity.toLocaleString() : "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Matches</p>
                        <p className="text-slate-900 font-bold mt-0.5">{s.matches}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Lowest price</p>
                        <p className="text-slate-900 font-bold mt-0.5">{s.minPrice != null ? `€${s.minPrice}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase tracking-wider font-bold">Coverage</p>
                        <p className={`font-bold mt-0.5 ${coveragePct >= 80 ? "text-emerald-700" : coveragePct >= 40 ? "text-amber-700" : "text-slate-500"}`}>{coveragePct}%</p>
                      </div>
                    </div>
                    {h.official_ticket_provider && (
                      <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> {h.official_ticket_provider}
                        <ExternalLink className="w-3 h-3 ml-auto text-emerald-600" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </WebsiteLayout>
  );
}
