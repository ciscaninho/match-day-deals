import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";

export const AdminClubsPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("club_ticketing_profiles")
        .select("slug,club_name,short_name,league,country,city,stadium_name,stadium_slug,logo_url,official_ticketing_url,membership_required")
        .order("club_name");
      return data || [];
    },
  });

  const filtered = data.filter((c) => {
    const s = q.toLowerCase();
    return !s || (c.club_name?.toLowerCase().includes(s) || c.slug?.toLowerCase().includes(s) || c.country?.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.clubs")}</h1>
          <p className="text-xs text-muted-foreground">{data.length} {t("admin.nav.clubs").toLowerCase()}</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.slug} className="hover:border-[#2ECC71] transition">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {c.logo_url ? <img src={c.logo_url} alt={c.club_name} className="w-full h-full object-contain" /> : <span className="text-xs font-bold text-slate-400">{c.short_name || "?"}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2C3E50] truncate">{c.club_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.league} · {c.country}</p>
                  {c.stadium_name && <p className="text-[11px] text-muted-foreground truncate mt-0.5">🏟 {c.stadium_name}</p>}
                  <div className="flex gap-2 mt-2 text-[11px]">
                    <Link to={`/clubs/${c.slug}`} className="text-[#2ECC71] font-bold inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {t("admin.view_public")}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClubsPage;
