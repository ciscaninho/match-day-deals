import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, MapPin, ArrowRight } from "lucide-react";

/**
 * Public World Cup hosts block. Only renders verified, published, approved-enrichment
 * stadiums marked as World Cup hosts. Raw imported data never surfaces here.
 */
export function WorldCupHostsBlock() {
  const { data = [] } = useQuery({
    queryKey: ["public-wc-hosts"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,hero_image_url,host_city_context,fan_zones,ticket_guidance,world_cup_role")
        .is("archived_at", null)
        .eq("is_world_cup_host", true)
        .eq("publication_status", "published")
        .order("stadium_name")
        .limit(24);
      return data || [];
    },
  });

  if (!data.length) return null;

  return (
    <section className="bg-gradient-to-b from-[#0F1A2E] to-[#0a1220] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">World Cup 2026 Hosts</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl text-white mb-4 max-w-3xl leading-tight">
          Where the world will play
        </h2>
        <p className="text-slate-300 max-w-2xl mb-10 font-body">
          Verified host stadiums. Curated travel notes, fan zones, transport and ticket guidance — written by editors, not bots.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((s) => (
            <Link
              key={s.slug}
              to={`/destinations/${s.slug}`}
              className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-all"
            >
              <div className="aspect-[16/10] bg-slate-800 overflow-hidden relative">
                {s.hero_image_url ? (
                  <img src={s.hero_image_url} alt={s.stadium_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                    loading="lazy" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                {s.world_cup_role && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/90 text-white">
                    {s.world_cup_role}
                  </span>
                )}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-display text-xl text-white">{s.stadium_name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {s.city}, {s.country}
                </p>
                {s.host_city_context && (
                  <p className="text-sm text-slate-300 line-clamp-3 font-body">{s.host_city_context}</p>
                )}
                <div className="pt-2 flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  Explore destination <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WorldCupHostsBlock;
