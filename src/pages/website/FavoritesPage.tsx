import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ArrowRight, Loader2 } from "lucide-react";

interface Row { id: string; match_id: string; created_at: string }

const FavoritesPage = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("saved_matches").select("id,match_id,created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setRows((data as Row[]) || []); setLoading(false); });
  }, [user]);

  const remove = async (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    await supabase.from("saved_matches").delete().eq("id", id);
  };

  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-br from-[#1B2A3A] to-[#2C3E50] text-white">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3"><Heart className="w-7 h-7 text-rose-400" /> {t("page.favorites.title")}</h1>
          <p className="text-white/70 text-sm mt-2">{rows.length} saved matches</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-5 py-10">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />{t("admin.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
            <Heart className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-[#2C3E50]">{t("admin.empty")}</p>
            <Link to="/matches" className="mt-4 inline-flex items-center gap-1 font-bold text-[#2ECC71]">
              {t("page.empty.cta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id} className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/matches/${r.match_id}`} className="font-bold text-[#2C3E50] hover:text-[#2ECC71] truncate block">
                      Match #{r.match_id}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </WebsiteLayout>
  );
};

export default FavoritesPage;
