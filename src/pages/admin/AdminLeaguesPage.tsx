import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const AdminLeaguesPage = () => {
  const { t } = useLanguage();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-leagues"],
    queryFn: async () => {
      const [stadiumsRes, clubsRes, matchesRes] = await Promise.all([
        supabase.from("stadiums").select("league").is("archived_at", null).not("league", "is", null),
        supabase.from("club_ticketing_profiles").select("league").is("archived_at", null).not("league", "is", null),
        supabase.from("matches").select("competition").not("competition", "is", null),
      ]);
      const map = new Map<string, { league: string; stadiums: number; clubs: number; matches: number }>();
      const bump = (key: keyof { stadiums: number; clubs: number; matches: number }, league: string | null) => {
        if (!league) return;
        const m = map.get(league) || { league, stadiums: 0, clubs: 0, matches: 0 };
        (m as any)[key]++;
        map.set(league, m);
      };
      (stadiumsRes.data || []).forEach((r) => bump("stadiums", r.league));
      (clubsRes.data || []).forEach((r) => bump("clubs", r.league));
      (matchesRes.data || []).forEach((r) => bump("matches", r.competition));
      return Array.from(map.values()).sort((a, b) => b.clubs + b.stadiums - (a.clubs + a.stadiums));
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.leagues")}</h1>
        <p className="text-xs text-muted-foreground">{data.length}</p>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">{t("admin.loading")}</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((l) => (
            <Card key={l.league} className="hover:border-[#2ECC71] transition">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-amber-500" /><p className="font-bold text-[#2C3E50] truncate">{l.league}</p></div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span><strong className="text-[#2C3E50]">{l.clubs}</strong> {t("admin.table.clubs").toLowerCase()}</span>
                  <span><strong className="text-[#2C3E50]">{l.stadiums}</strong> {t("admin.nav.stadiums").toLowerCase()}</span>
                  <span><strong className="text-[#2C3E50]">{l.matches}</strong> {t("admin.nav.matches").toLowerCase()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeaguesPage;
