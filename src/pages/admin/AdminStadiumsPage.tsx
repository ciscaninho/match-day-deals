import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Image as ImageIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StadiumDrawer, type StadiumDrawerRow } from "@/components/admin/StadiumDrawer";
import { FootballFilterBar, useFootballFilters } from "@/components/admin/FootballFilterBar";
import { PublicationStatusControl } from "@/components/admin/PublicationStatusControl";

type StadiumRow = StadiumDrawerRow & { thumbnail_image_url: string | null; archived_at?: string | null; archived_into_slug?: string | null; publication_status?: string | null };

const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
    {label}
  </span>
);

export const AdminStadiumsPage = () => {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<StadiumRow | null>(null);
  const filters = useFootballFilters();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-stadiums-v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,league,capacity,latitude,longitude,hero_image_url,thumbnail_image_url,clubs,description,archived_at,archived_into_slug")
        .order("stadium_name")
        .limit(2000);
      return (data || []) as StadiumRow[];
    },
  });

  const active = useMemo(() => data.filter((s) => !s.archived_at), [data]);
  const archived = useMemo(() => data.filter((s) => !!s.archived_at), [data]);
  const baseList = showArchived ? archived : active;

  // Apply hierarchical filters first
  const hierarchyFiltered = useMemo(() => filters.apply(baseList), [filters, baseList]);

  const flagCounts = useMemo(() => ({
    no_image: hierarchyFiltered.filter((s) => !s.hero_image_url).length,
    no_coords: hierarchyFiltered.filter((s) => !s.latitude || !s.longitude).length,
    incomplete: hierarchyFiltered.filter((s) => !s.hero_image_url || !s.latitude || !s.capacity).length,
  }), [hierarchyFiltered]);

  const filtered = useMemo(() => hierarchyFiltered.filter((s) => {
    const term = q.toLowerCase();
    if (term && !`${s.stadium_name} ${s.city} ${s.country} ${s.league}`.toLowerCase().includes(term)) return false;
    if (filters.state.flags.includes("no_image") && s.hero_image_url) return false;
    if (filters.state.flags.includes("no_coords") && s.latitude && s.longitude) return false;
    if (filters.state.flags.includes("incomplete") && s.hero_image_url && s.latitude && s.capacity) return false;
    return true;
  }), [hierarchyFiltered, q, filters.state.flags]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.nav.stadiums")}</h1>
            <p className="text-xs text-muted-foreground">{active.length} active · {archived.length} archived · {filtered.length} {t("admin.shown")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${showArchived ? "bg-slate-700 text-white border-slate-700" : "bg-white text-[#2C3E50] border-slate-200 hover:border-emerald-500"}`}
            >
              {showArchived ? "Archived" : "Active"} <span className="opacity-60">· {showArchived ? archived.length : active.length}</span>
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.search.placeholder")} className="pl-9" />
            </div>
          </div>
        </div>

        <FootballFilterBar
          rows={baseList}
          state={filters.state}
          onChange={filters.update}
          onReset={filters.reset}
          onToggleFlag={filters.toggleFlag}
          flags={[
            { key: "no_image", labelKey: "admin.filter.flag.no_image", fallback: "Only missing images" },
            { key: "no_coords", labelKey: "admin.filter.flag.no_coords", fallback: "Only missing coords" },
            { key: "incomplete", labelKey: "admin.filter.flag.incomplete", fallback: "Only incomplete" },
          ]}
          flagCounts={flagCounts}
        />
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
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-[#2C3E50] truncate text-sm flex-1">{s.stadium_name}</p>
                    {s.archived_at && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">ARCHIVED</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {s.city || "—"}, {s.country || "—"}
                  </p>
                  {s.archived_at && s.archived_into_slug && (
                    <p className="text-[10px] text-emerald-700 truncate">→ {s.archived_into_slug}</p>
                  )}
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

export default AdminStadiumsPage;
