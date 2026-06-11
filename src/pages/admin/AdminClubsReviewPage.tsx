import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Check, Clock, Eye, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

type Candidate = {
  id: string;
  club_a_id: string;
  club_b_id: string;
  confidence: "high" | "medium" | "low";
  signals: { same_stadium?: boolean; same_country?: boolean; same_league?: boolean; name_similarity?: number };
  recommended_canonical_id: string | null;
  name_similarity: number | null;
  status: string;
  notes: string | null;
};
type Club = {
  id: string;
  slug: string;
  club_name: string;
  short_name: string | null;
  club_type: string;
  publication_status: string;
  crest_url: string | null;
  country_id: string | null;
  primary_league_id: string | null;
  home_stadium_id: string | null;
  seo_title: string | null;
};
type Country = { id: string; name: string };
type League = { id: string; league_name: string };
type Stadium = { id: string; stadium_name: string };

const AdminClubsReviewPage = () => {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all" | "merged" | "ignored" | "later">("pending");
  const [confFilter, setConfFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clubs-review", filter, confFilter],
    queryFn: async () => {
      let q = supabase.from("club_merge_candidates" as never).select("*").order("confidence").order("name_similarity", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      if (confFilter !== "all") q = q.eq("confidence", confFilter);
      const { data: cand, error } = await q;
      if (error) throw error;
      const candidates = (cand ?? []) as unknown as Candidate[];
      const ids = Array.from(new Set(candidates.flatMap(c => [c.club_a_id, c.club_b_id])));
      const [clubs, countries, leagues, stadiums] = await Promise.all([
        ids.length
          ? supabase.from("clubs" as never).select("id,slug,club_name,short_name,club_type,publication_status,crest_url,country_id,primary_league_id,home_stadium_id,seo_title").in("id", ids)
          : Promise.resolve({ data: [] }),
        supabase.from("countries" as never).select("id,name"),
        supabase.from("league_publication").select("id,league_name"),
        supabase.from("stadiums").select("id,stadium_name"),
      ]);
      return {
        candidates,
        clubMap: new Map(((clubs.data ?? []) as unknown as Club[]).map(c => [c.id, c])),
        countryMap: new Map(((countries.data ?? []) as unknown as Country[]).map(c => [c.id, c.name])),
        leagueMap: new Map(((leagues.data ?? []) as unknown as League[]).map(c => [c.id, c.league_name])),
        stadiumMap: new Map(((stadiums.data ?? []) as unknown as Stadium[]).map(c => [c.id, c.stadium_name])),
      };
    },
  });

  const counts = useMemo(() => {
    const c = data?.candidates ?? [];
    return {
      total: c.length,
      high: c.filter(x => x.confidence === "high").length,
      medium: c.filter(x => x.confidence === "medium").length,
      low: c.filter(x => x.confidence === "low").length,
    };
  }, [data]);

  const rescan = async () => {
    setBusy("rescan");
    const { error } = await (supabase.rpc as any)("detect_club_duplicates");
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.clubsReview.rescanned"));
    qc.invalidateQueries({ queryKey: ["admin-clubs-review"] });
    qc.invalidateQueries({ queryKey: ["admin-clubs-master"] });
  };

  const autoHigh = async () => {
    setBusy("auto");
    const { data: res, error } = await (supabase.rpc as any)("auto_merge_high_confidence_clubs");
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${t("admin.clubsReview.autoMerged")}: ${res?.merged ?? 0}`);
    qc.invalidateQueries({ queryKey: ["admin-clubs-review"] });
    qc.invalidateQueries({ queryKey: ["admin-clubs-master"] });
  };

  const merge = async (cand: Candidate, canonicalId: string) => {
    const dupId = canonicalId === cand.club_a_id ? cand.club_b_id : cand.club_a_id;
    setBusy(cand.id);
    const { error } = await (supabase.rpc as any)("merge_clubs_master", {
      p_canonical_id: canonicalId, p_duplicate_id: dupId, p_reason: "manual_review",
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.clubsReview.merged"));
    qc.invalidateQueries({ queryKey: ["admin-clubs-review"] });
    qc.invalidateQueries({ queryKey: ["admin-clubs-master"] });
  };

  const mark = async (cand: Candidate, status: "ignored" | "later" | "pending") => {
    setBusy(cand.id);
    const { error } = await (supabase.from("club_merge_candidates" as never) as any)
      .update({ status, reviewed_at: status === "pending" ? null : new Date().toISOString() })
      .eq("id", cand.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-clubs-review"] });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{t("admin.clubsReview.title")}</h1>
          <p className="text-sm text-slate-500 truncate">{t("admin.clubsReview.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link to="/admin/clubs-master">
            <Button variant="outline" size="sm">{t("admin.clubsReview.backToMaster")}</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={rescan} disabled={!!busy}>
            {busy === "rescan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">{t("admin.clubsReview.rescan")}</span>
          </Button>
          <Button size="sm" onClick={autoHigh} disabled={!!busy}>
            {busy === "auto" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span className="ml-1">{t("admin.clubsReview.autoHigh")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label={t("admin.clubsReview.kpi.total")} value={counts.total} tone="default" />
        <Kpi label={t("admin.clubsReview.kpi.high")} value={counts.high} tone="rose" />
        <Kpi label={t("admin.clubsReview.kpi.medium")} value={counts.medium} tone="amber" />
        <Kpi label={t("admin.clubsReview.kpi.low")} value={counts.low} tone="sky" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "merged", "ignored", "later", "all"] as const).map(s => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {t(`admin.clubsReview.status.${s}`)}
          </Button>
        ))}
        <span className="mx-2 h-6 w-px bg-slate-200" />
        {(["all", "high", "medium", "low"] as const).map(c => (
          <Button key={c} size="sm" variant={confFilter === c ? "default" : "outline"} onClick={() => setConfFilter(c)}>
            {t(`admin.clubsReview.conf.${c}`)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.clubsReview.loading")}
        </div>
      ) : !data || data.candidates.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-slate-500">{t("admin.clubsReview.empty")}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.candidates.map(cand => {
            const a = data.clubMap.get(cand.club_a_id);
            const b = data.clubMap.get(cand.club_b_id);
            if (!a || !b) return null;
            const reco = cand.recommended_canonical_id ?? a.id;
            return (
              <Card key={cand.id} className="border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={
                      cand.confidence === "high" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                      cand.confidence === "medium" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                      "bg-sky-100 text-sky-800 border border-sky-200"
                    }>{t(`admin.clubsReview.conf.${cand.confidence}`)}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      sim {cand.name_similarity != null ? Number(cand.name_similarity).toFixed(2) : "—"}
                    </Badge>
                    {cand.signals.same_stadium && <Badge variant="outline" className="text-[10px]">{t("admin.clubsReview.sig.stadium")}</Badge>}
                    {cand.signals.same_country && <Badge variant="outline" className="text-[10px]">{t("admin.clubsReview.sig.country")}</Badge>}
                    {cand.signals.same_league && <Badge variant="outline" className="text-[10px]">{t("admin.clubsReview.sig.league")}</Badge>}
                    {cand.status !== "pending" && <Badge variant="secondary" className="text-[10px] ml-auto">{cand.status}</Badge>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                    <ClubCard
                      club={a}
                      isRecommended={reco === a.id}
                      countryName={a.country_id ? data.countryMap.get(a.country_id) : null}
                      leagueName={a.primary_league_id ? data.leagueMap.get(a.primary_league_id) : null}
                      stadiumName={a.home_stadium_id ? data.stadiumMap.get(a.home_stadium_id) : null}
                    />
                    <div className="flex md:flex-col items-center justify-center text-slate-400">
                      <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <ClubCard
                      club={b}
                      isRecommended={reco === b.id}
                      countryName={b.country_id ? data.countryMap.get(b.country_id) : null}
                      leagueName={b.primary_league_id ? data.leagueMap.get(b.primary_league_id) : null}
                      stadiumName={b.home_stadium_id ? data.stadiumMap.get(b.home_stadium_id) : null}
                    />
                  </div>

                  {cand.status === "pending" && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-500">{t("admin.clubsReview.canonical")}:</span>
                      <Button size="sm" variant={reco === a.id ? "default" : "outline"} onClick={() => merge(cand, a.id)} disabled={busy === cand.id}>
                        {busy === cand.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        <span className="ml-1 truncate max-w-[160px]">{t("admin.clubsReview.keep")} {a.club_name}</span>
                      </Button>
                      <Button size="sm" variant={reco === b.id ? "default" : "outline"} onClick={() => merge(cand, b.id)} disabled={busy === cand.id}>
                        {busy === cand.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        <span className="ml-1 truncate max-w-[160px]">{t("admin.clubsReview.keep")} {b.club_name}</span>
                      </Button>
                      <span className="mx-1 h-5 w-px bg-slate-200" />
                      <Button size="sm" variant="ghost" onClick={() => mark(cand, "later")} disabled={busy === cand.id}>
                        <Clock className="h-3 w-3" /><span className="ml-1">{t("admin.clubsReview.later")}</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => mark(cand, "ignored")} disabled={busy === cand.id}>
                        <X className="h-3 w-3" /><span className="ml-1">{t("admin.clubsReview.ignore")}</span>
                      </Button>
                    </div>
                  )}
                  {cand.status !== "pending" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <Button size="sm" variant="ghost" onClick={() => mark(cand, "pending")} disabled={busy === cand.id}>
                        <Eye className="h-3 w-3" /><span className="ml-1">{t("admin.clubsReview.reopen")}</span>
                      </Button>
                      {cand.notes && <span className="text-[11px] text-slate-500 truncate">{cand.notes}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Kpi = ({ label, value, tone }: { label: string; value: number; tone: "default" | "rose" | "amber" | "sky" }) => {
  const cls = tone === "rose" ? "bg-rose-50 text-rose-800 border-rose-200"
    : tone === "amber" ? "bg-amber-50 text-amber-800 border-amber-200"
    : tone === "sky" ? "bg-sky-50 text-sky-800 border-sky-200"
    : "bg-slate-50 text-slate-800 border-slate-200";
  return (
    <Card className={`border ${cls}`}>
      <CardContent className="p-3">
        <p className="text-[11px] uppercase tracking-wide opacity-70 truncate">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </CardContent>
    </Card>
  );
};

const ClubCard = ({ club, isRecommended, countryName, leagueName, stadiumName }: {
  club: Club; isRecommended: boolean;
  countryName?: string | null; leagueName?: string | null; stadiumName?: string | null;
}) => {
  const { t } = useLanguage();
  return (
    <div className={`rounded-lg border p-3 ${isRecommended ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2 mb-2">
        {club.crest_url ? <img src={club.crest_url} alt="" className="h-6 w-6 object-contain shrink-0" /> : <div className="h-6 w-6 rounded bg-slate-200 shrink-0" />}
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{club.club_name}</p>
          <p className="text-[11px] text-slate-500 truncate">{club.slug}</p>
        </div>
        {isRecommended && <Badge className="ml-auto bg-emerald-600 text-white text-[10px] shrink-0">{t("admin.clubsReview.recommended")}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
        <div className="truncate"><span className="text-slate-400">{t("admin.clubsMaster.field.country")}:</span> {countryName ?? "—"}</div>
        <div className="truncate"><span className="text-slate-400">{t("admin.clubsMaster.field.league")}:</span> {leagueName ?? "—"}</div>
        <div className="truncate col-span-2"><span className="text-slate-400">{t("admin.clubsMaster.field.stadium")}:</span> {stadiumName ?? "—"}</div>
        <div className="truncate"><span className="text-slate-400">{t("admin.clubsMaster.field.type")}:</span> {club.club_type}</div>
        <div className="truncate"><span className="text-slate-400">status:</span> {club.publication_status}</div>
      </div>
    </div>
  );
};

export default AdminClubsReviewPage;
