import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Image as ImageIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StadiumDrawer, type StadiumDrawerRow } from "@/components/admin/StadiumDrawer";

type StadiumRow = StadiumDrawerRow & { thumbnail_image_url: string | null };

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
    {label}
  </span>
);

export const AdminStadiumsPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "no-image" | "no-coords" | "no-capacity">("all");
  const [selected, setSelected] = useState<StadiumRow | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-stadiums-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,league,capacity,latitude,longitude,hero_image_url,thumbnail_image_url,clubs,description")
        .order("stadium_name")
        .limit(2000);
      return (data || []) as StadiumRow[];
    },
  });

  const filtered = data.filter((s) => {
    const term = q.toLowerCase();
    if (term && !`${s.stadium_name} ${s.city} ${s.country} ${s.league}`.toLowerCase().includes(term)) return false;
    if (filter === "no-image" && s.hero_image_url) return false;
    if (filter === "no-coords" && s.latitude && s.longitude) return false;
    if (filter === "no-capacity" && s.capacity) return false;
    return true;
  });

  const gapStats = {
    noImage: data.filter((s) => !s.hero_image_url).length,
    noCoords: data.filter((s) => !s.latitude || !s.longitude).length,
    noCapacity: data.filter((s) => !s.capacity).length,
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.stadiums")}</h1>
            <p className="text-xs text-muted-foreground">{data.length} {t("admin.nav.stadiums").toLowerCase()} · {filtered.length} {t("admin.shown")}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {([
            ["all", t("admin.filter.all"), data.length],
            ["no-image", t("admin.filter.no_image"), gapStats.noImage],
            ["no-coords", t("admin.filter.no_coords"), gapStats.noCoords],
            ["no-capacity", t("admin.filter.no_capacity"), gapStats.noCapacity],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${filter === key ? "bg-[#2C3E50] text-white border-[#2C3E50]" : "bg-white text-[#2C3E50] border-slate-200 hover:border-[#2ECC71]"}`}
            >
              {label} <span className="opacity-60">· {count}</span>
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => {
            const img = s.hero_image_url || s.thumbnail_image_url;
            const hasCoords = !!(s.latitude && s.longitude);
            return (
              <button
                key={s.slug}
                onClick={() => setSelected(s)}
                className="group text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#2ECC71] hover:shadow-lg transition"
              >
                <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                  {img ? (
                    <img src={img} alt={s.stadium_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!img && <StatusPill ok={false} label={t("admin.badge.no_image")} />}
                    {!hasCoords && <StatusPill ok={false} label={t("admin.badge.no_coords")} />}
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-extrabold text-[#2C3E50] truncate text-sm">{s.stadium_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {s.city || "—"}, {s.country || "—"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 truncate">{s.league || "—"}</span>
                    <span className="text-[10px] font-bold text-[#2C3E50]">{s.capacity ? s.capacity.toLocaleString() : "—"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <StadiumDrawer stadium={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

const StadiumDrawer = ({ stadium, onClose }: { stadium: StadiumRow | null; onClose: () => void }) => {
  const { t } = useLanguage();
  const slug = stadium?.slug;

  const { data: relations } = useQuery({
    queryKey: ["admin-stadium-relations", slug],
    enabled: !!slug,
    queryFn: async () => {
      const [{ data: clubs }, { data: matches }] = await Promise.all([
        supabase.from("club_ticketing_profiles").select("slug,club_name,short_name,logo_url,league").eq("stadium_slug", slug!),
        supabase
          .from("matches")
          .select("id,home_team,away_team,competition,date,ticket_status,home_logo,away_logo")
          .ilike("stadium", `%${stadium!.stadium_name}%`)
          .gte("date", new Date().toISOString())
          .order("date")
          .limit(8),
      ]);
      return { clubs: clubs || [], matches: matches || [] };
    },
  });

  return (
    <Sheet open={!!stadium} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {stadium && (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg font-extrabold text-[#2C3E50] text-left">{stadium.stadium_name}</SheetTitle>
              <p className="text-xs text-muted-foreground font-mono text-left">{stadium.slug}</p>
            </SheetHeader>

            {stadium.hero_image_url && (
              <div className="mt-4 aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                <img src={stadium.hero_image_url} alt={stadium.stadium_name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Field label={t("admin.table.city")} value={stadium.city} />
              <Field label={t("admin.table.country")} value={stadium.country} />
              <Field label={t("admin.table.league")} value={stadium.league} />
              <Field label={t("admin.table.capacity")} value={stadium.capacity ? stadium.capacity.toLocaleString() : null} />
              <Field label={t("admin.table.coords")} value={stadium.latitude ? `${Number(stadium.latitude).toFixed(3)}, ${Number(stadium.longitude).toFixed(3)}` : null} mono />
            </div>

            {stadium.description && (
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{stadium.description}</p>
            )}

            <div className="mt-5 space-y-4">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> {t("admin.relations.clubs")} · {relations?.clubs.length || 0}</h3>
                <div className="space-y-1">
                  {relations?.clubs.length ? relations.clubs.map((c: any) => (
                    <Link key={c.slug} to={`/clubs/${c.slug}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <div className="w-7 h-7 rounded bg-slate-100 overflow-hidden flex items-center justify-center">
                        {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-contain" /> : <span className="text-[9px] font-bold text-slate-400">{c.short_name}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#2C3E50] truncate">{c.club_name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.league}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  )) : <p className="text-xs text-slate-400 italic">{t("admin.empty")}</p>}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {t("admin.relations.matches")} · {relations?.matches.length || 0}</h3>
                <div className="space-y-1">
                  {relations?.matches.length ? relations.matches.map((m: any) => (
                    <Link key={m.id} to={`/matches/${m.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <div className="text-[10px] text-slate-500 font-mono w-16 shrink-0">{new Date(m.date).toLocaleDateString()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#2C3E50] truncate">{m.home_team} vs {m.away_team}</p>
                        <p className="text-[10px] text-muted-foreground">{m.competition}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px]">{m.ticket_status}</Badge>
                    </Link>
                  )) : <p className="text-xs text-slate-400 italic">{t("admin.empty")}</p>}
                </div>
              </section>
            </div>

            <div className="mt-5 flex gap-2">
              <Button asChild variant="outline" className="flex-1"><Link to={`/stadiums/${stadium.slug}`}>{t("admin.view_public")}</Link></Button>
              <Button asChild className="flex-1 bg-[#2C3E50] hover:bg-[#1F2D3D]"><Link to="/admin/stadium-map-review">{t("admin.edit")}</Link></Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Field = ({ label, value, mono }: { label: string; value: any; mono?: boolean }) => (
  <div className="bg-slate-50 rounded-lg p-2">
    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
    <p className={`text-xs font-bold text-[#2C3E50] truncate ${mono ? "font-mono" : ""}`}>{value || <span className="text-amber-600">—</span>}</p>
  </div>
);

export default AdminStadiumsPage;
