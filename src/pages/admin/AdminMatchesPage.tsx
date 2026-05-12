import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";

export const AdminMatchesPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,home_team,away_team,competition,date,stadium,city,ticket_status,home_logo,away_logo")
        .order("date", { ascending: true }).limit(500);
      return data || [];
    },
  });

  const filtered = data.filter((m) => {
    const s = q.toLowerCase();
    return !s || `${m.home_team} ${m.away_team} ${m.competition} ${m.stadium}`.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.matches")}</h1>
          <p className="text-xs text-muted-foreground">{data.length}</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-3">{t("admin.table.date")}</th>
                <th className="text-left p-3">{t("admin.table.name")}</th>
                <th className="text-left p-3 hidden md:table-cell">{t("admin.table.league")}</th>
                <th className="text-left p-3 hidden md:table-cell">{t("admin.table.stadium")}</th>
                <th className="text-left p-3">{t("admin.table.status")}</th>
                <th className="text-left p-3">{t("admin.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(m.date).toLocaleDateString()}<div className="text-[10px] text-slate-400">{new Date(m.date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {m.home_logo && <img src={m.home_logo} alt="" className="w-5 h-5 object-contain" />}
                      <span className="font-bold text-[#2C3E50]">{m.home_team}</span>
                      <span className="text-slate-400">vs</span>
                      {m.away_logo && <img src={m.away_logo} alt="" className="w-5 h-5 object-contain" />}
                      <span className="font-bold text-[#2C3E50]">{m.away_team}</span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">{m.competition}</td>
                  <td className="p-3 hidden md:table-cell">{m.stadium}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.ticket_status === 'on_sale' ? 'bg-emerald-100 text-emerald-700' : m.ticket_status === 'sold_out' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{m.ticket_status}</span></td>
                  <td className="p-3"><Link to={`/matches/${m.id}`} className="text-[#2ECC71] font-bold inline-flex items-center gap-1 text-xs"><ExternalLink className="w-3 h-3" /> {t("admin.view_public")}</Link></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">{t("admin.empty")}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMatchesPage;
