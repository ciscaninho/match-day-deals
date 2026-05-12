import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, MapPin, Calendar, Ticket } from "lucide-react";

const statusPill = (s: string | null) => {
  if (s === "on_sale") return "bg-emerald-100 text-emerald-700";
  if (s === "sold_out") return "bg-rose-100 text-rose-700";
  if (s === "presale") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

export const AdminMatchesPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-matches-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,home_team,away_team,competition,date,stadium,city,country,ticket_status,home_logo,away_logo,starting_price,featured")
        .gte("date", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
        .order("date", { ascending: true })
        .limit(500);
      return data || [];
    },
  });

  const filtered = data.filter((m) => {
    const s = q.toLowerCase();
    if (s && !`${m.home_team} ${m.away_team} ${m.competition} ${m.stadium} ${m.city}`.toLowerCase().includes(s)) return false;
    if (statusFilter !== "all" && m.ticket_status !== statusFilter) return false;
    return true;
  });

  const counts = {
    all: data.length,
    on_sale: data.filter((m) => m.ticket_status === "on_sale").length,
    presale: data.filter((m) => m.ticket_status === "presale").length,
    sold_out: data.filter((m) => m.ticket_status === "sold_out").length,
    not_released: data.filter((m) => m.ticket_status === "not_released").length,
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.matches")}</h1>
            <p className="text-xs text-muted-foreground">{data.length} · {filtered.length} {t("admin.shown")}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "on_sale", "presale", "sold_out", "not_released"] as const).map((k) => (
            <button key={k} onClick={() => setStatusFilter(k)} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${statusFilter === k ? "bg-[#2C3E50] text-white border-[#2C3E50]" : "bg-white text-[#2C3E50] border-slate-200 hover:border-[#2ECC71]"}`}>
              {k.replace("_", " ")} <span className="opacity-60">· {counts[k]}</span>
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <Link key={m.id} to={`/matches/${m.id}`} className="group bg-white rounded-2xl border border-slate-200 hover:border-[#2ECC71] hover:shadow-md transition p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{m.competition}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusPill(m.ticket_status)}`}>{m.ticket_status?.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 mx-auto mb-1">
                    {m.home_logo ? <img src={m.home_logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-full bg-slate-100" />}
                  </div>
                  <p className="text-xs font-bold text-[#2C3E50] truncate">{m.home_team}</p>
                </div>
                <span className="text-slate-300 text-sm font-bold">vs</span>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 mx-auto mb-1">
                    {m.away_logo ? <img src={m.away_logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-full bg-slate-100" />}
                  </div>
                  <p className="text-xs font-bold text-[#2C3E50] truncate">{m.away_team}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 truncate"><Calendar className="w-3 h-3" /> {new Date(m.date).toLocaleDateString()} · {new Date(m.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                {m.starting_price && <span className="flex items-center gap-1 font-bold text-[#2ECC71]"><Ticket className="w-3 h-3" /> €{Number(m.starting_price).toFixed(0)}</span>}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {m.stadium} · {m.city}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMatchesPage;
