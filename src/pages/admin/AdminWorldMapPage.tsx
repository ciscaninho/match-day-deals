import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import "leaflet/dist/leaflet.css";

export const AdminWorldMapPage = () => {
  const { t } = useLanguage();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-world-map"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stadiums")
        .select("slug,stadium_name,city,country,capacity,latitude,longitude,hero_image_url")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(3000);
      return data || [];
    },
  });

  const stats = useMemo(() => {
    let complete = 0, gaps = 0;
    for (const s of data) {
      const hasGaps = !s.hero_image_url || !s.capacity;
      if (hasGaps) gaps++; else complete++;
    }
    return { complete, gaps, total: data.length };
  }, [data]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-[#2C3E50]">{t("admin.map.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("admin.map.subtitle")}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Stat dot="bg-emerald-500" label={t("admin.map.complete")} value={stats.complete} />
          <Stat dot="bg-amber-500" label={t("admin.map.gaps")} value={stats.gaps} />
          <Stat dot="bg-slate-300" label={t("admin.map.no_coords")} value={"—"} />
        </div>
      </header>

      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white" style={{ height: "calc(100vh - 14rem)", minHeight: 480 }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{t("admin.loading")}</div>
        ) : (
          <MapContainer center={[40, 5]} zoom={3} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />
            {data.map((s) => {
              const hasGaps = !s.hero_image_url || !s.capacity;
              return (
                <CircleMarker
                  key={s.slug}
                  center={[Number(s.latitude), Number(s.longitude)]}
                  radius={hasGaps ? 5 : 6}
                  pathOptions={{ color: hasGaps ? "#F59E0B" : "#2ECC71", fillColor: hasGaps ? "#F59E0B" : "#2ECC71", fillOpacity: 0.75, weight: 1 }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-extrabold text-[#2C3E50] mb-0.5">{s.stadium_name}</p>
                      <p className="text-slate-500">{s.city}, {s.country}</p>
                      {s.capacity && <p className="text-slate-500">{s.capacity.toLocaleString()} seats</p>}
                      <Link to={`/stadiums/${s.slug}`} className="inline-block mt-1 text-[#2ECC71] font-bold">Open →</Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

const Stat = ({ dot, label, value }: { dot: string; label: string; value: number | string }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs">
    <span className={`w-2 h-2 rounded-full ${dot}`} />
    <span className="font-medium text-[#2C3E50]">{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

export default AdminWorldMapPage;
