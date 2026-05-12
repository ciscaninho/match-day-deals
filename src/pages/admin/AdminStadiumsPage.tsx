import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, MapPin as MapPinIcon } from "lucide-react";

export const AdminStadiumsPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-stadiums"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,league,capacity,latitude,longitude,hero_image_url,thumbnail_image_url,clubs")
        .order("stadium_name").limit(1000);
      return data || [];
    },
  });

  const filtered = data.filter((s) => {
    const term = q.toLowerCase();
    return !term || s.stadium_name?.toLowerCase().includes(term) || s.city?.toLowerCase().includes(term) || s.country?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.stadiums")}</h1>
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
                <th className="text-left p-3">{t("admin.table.image")}</th>
                <th className="text-left p-3">{t("admin.table.name")}</th>
                <th className="text-left p-3 hidden md:table-cell">{t("admin.table.city")}</th>
                <th className="text-left p-3 hidden md:table-cell">{t("admin.table.country")}</th>
                <th className="text-left p-3 hidden lg:table-cell">{t("admin.table.league")}</th>
                <th className="text-left p-3 hidden lg:table-cell">{t("admin.table.capacity")}</th>
                <th className="text-left p-3 hidden xl:table-cell">{t("admin.table.coords")}</th>
                <th className="text-left p-3">{t("admin.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.slug} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="p-2">
                    <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden">
                      {s.thumbnail_image_url || s.hero_image_url ? <img src={s.thumbnail_image_url || s.hero_image_url!} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-[#2C3E50]">{s.stadium_name}<div className="text-[10px] text-slate-400 font-mono">{s.slug}</div></td>
                  <td className="p-3 hidden md:table-cell">{s.city}</td>
                  <td className="p-3 hidden md:table-cell">{s.country}</td>
                  <td className="p-3 hidden lg:table-cell">{s.league}</td>
                  <td className="p-3 hidden lg:table-cell">{s.capacity?.toLocaleString() || "—"}</td>
                  <td className="p-3 hidden xl:table-cell font-mono text-xs">{s.latitude ? `${Number(s.latitude).toFixed(2)}, ${Number(s.longitude).toFixed(2)}` : <span className="text-rose-500">⚠ missing</span>}</td>
                  <td className="p-3">
                    <Link to={`/stadiums/${s.slug}`} className="text-[#2ECC71] font-bold inline-flex items-center gap-1 text-xs">
                      <ExternalLink className="w-3 h-3" /> {t("admin.view_public")}
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">{t("admin.empty")}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminStadiumsPage;
