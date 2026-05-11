import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ArrowLeft, Check, X, Pencil, MapPin, Crosshair, Layers, Loader2, AlertTriangle,
  Users, Image as ImageIcon, Sparkles, Database, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/RequireAdmin";

// ---------- Types ----------
interface StagingRow {
  id: string;
  canonical_name: string;
  slug: string;
  normalized_slug: string;
  normalized_name: string;
  aliases: string[];
  city: string | null;
  country: string | null;
  league: string | null;
  club_names: string[];
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  background_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  year_opened: number | null;
  official_website: string | null;
  production_stadium_id: string | null;
  conflict_flags: string[];
  has_missing_metadata: boolean;
  confidence: "high" | "medium" | "low";
  status: string;
  review_notes: string | null;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#94a3b8",
};
const STATUS_COLOR: Record<string, string> = {
  approved: "#3b82f6",
  rejected: "#ef4444",
  duplicate: "#a855f7",
};

function pinColor(row: StagingRow): string {
  if (STATUS_COLOR[row.status]) return STATUS_COLOR[row.status];
  if (row.conflict_flags?.length) return "#ef4444";
  return CONFIDENCE_COLOR[row.confidence] ?? "#94a3b8";
}

function makeIcon(color: string, isMulti: boolean) {
  const ring = isMulti
    ? `<circle cx="14" cy="14" r="12" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 2"/>`
    : "";
  const html = `
    <div style="position:relative;width:28px;height:36px;transform:translate(-14px,-32px);">
      <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        ${ring}
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
      </svg>
    </div>`;
  return L.divIcon({
    html,
    className: "stadium-pin",
    iconSize: [28, 36],
    iconAnchor: [14, 32],
  });
}

// ---------- Cluster layer ----------
interface ClusterProps {
  rows: StagingRow[];
  onSelect: (row: StagingRow) => void;
}
const ClusterLayer = ({ rows, onSelect }: ClusterProps) => {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group: L.MarkerClusterGroup = (L as unknown as { markerClusterGroup: (o: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup }).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
    });
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();
    rows.forEach((row) => {
      if (row.latitude == null || row.longitude == null) return;
      const isMulti = (row.club_names?.length ?? 0) > 1;
      const marker = L.marker([row.latitude, row.longitude], {
        icon: makeIcon(pinColor(row), isMulti),
      });
      marker.on("click", () => onSelect(row));
      marker.bindTooltip(
        `<strong>${row.canonical_name}</strong><br/>${row.city ?? ""} ${row.country ? "· " + row.country : ""}`,
        { direction: "top", offset: [0, -28] },
      );
      group.addLayer(marker);
    });
  }, [rows, onSelect]);

  return null;
};

// ---------- Proximity duplicate detection ----------
function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
function nameSimilarity(a: string, b: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;
  // token overlap
  const ta = new Set(a.toLowerCase().split(/\s+/));
  const tb = new Set(b.toLowerCase().split(/\s+/));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  return inter / Math.max(ta.size, tb.size);
}
function findNearbyDuplicates(target: StagingRow, all: StagingRow[]) {
  if (target.latitude == null || target.longitude == null) return [];
  const out: { row: StagingRow; distanceKm: number; similarity: number }[] = [];
  for (const r of all) {
    if (r.id === target.id) continue;
    if (r.latitude == null || r.longitude == null) continue;
    const d = haversineKm(
      [target.latitude, target.longitude],
      [r.latitude, r.longitude],
    );
    if (d > 0.5) continue;
    const sim = nameSimilarity(target.canonical_name, r.canonical_name);
    if (sim < 0.4) continue;
    out.push({ row: r, distanceKm: d, similarity: sim });
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
}

// ---------- Page ----------
const StadiumMapReviewPageInner = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<StagingRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>("pending");
  const [confidence, setConfidence] = useState<string>("all");
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [missingMetaOnly, setMissingMetaOnly] = useState(false);
  const [noHeroOnly, setNoHeroOnly] = useState(false);
  const [multiClubOnly, setMultiClubOnly] = useState(false);
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["stadium-map-review"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadiums_master_staging")
        .select(
          "id,canonical_name,slug,normalized_slug,normalized_name,aliases,city,country,league,club_names,hero_image_url,thumbnail_image_url,background_image_url,latitude,longitude,capacity,year_opened,official_website,production_stadium_id,conflict_flags,has_missing_metadata,confidence,status,review_notes",
        )
        .order("confidence", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as StagingRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (confidence !== "all" && r.confidence !== confidence) return false;
      if (conflictsOnly && !(r.conflict_flags?.length > 0)) return false;
      if (missingMetaOnly && !r.has_missing_metadata) return false;
      if (noHeroOnly && r.hero_image_url) return false;
      if (multiClubOnly && (r.club_names?.length ?? 0) < 2) return false;
      if (q && !`${r.canonical_name} ${r.city ?? ""} ${r.country ?? ""} ${r.club_names?.join(" ") ?? ""}`
            .toLowerCase()
            .includes(q))
        return false;
      return true;
    });
  }, [rows, status, confidence, conflictsOnly, missingMetaOnly, noHeroOnly, multiClubOnly, search]);

  const withCoords = useMemo(() => filtered.filter((r) => r.latitude != null && r.longitude != null), [filtered]);
  const withoutCoords = filtered.length - withCoords.length;

  const counters = useMemo(() => ({
    total: rows.length,
    visible: filtered.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    conflicts: rows.filter((r) => r.conflict_flags?.length).length,
    multiClub: rows.filter((r) => (r.club_names?.length ?? 0) > 1).length,
    noCoords: rows.filter((r) => r.latitude == null).length,
  }), [rows, filtered]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["stadium-map-review"] });

  const updateRow = async (patch: Partial<StagingRow>, id?: string) => {
    const targetId = id ?? selected?.id;
    if (!targetId) return;
    setBusy(true);
    const { error } = await supabase
      .from("stadiums_master_staging")
      .update(patch)
      .eq("id", targetId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Updated");
    if (selected?.id === targetId) {
      setSelected({ ...selected, ...patch } as StagingRow);
    }
    refresh();
  };

  const runGeocoder = async () => {
    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-staging-stadiums", {
        body: { limit: 10 },
      });
      if (error) throw error;
      toast.success(`Geocoded ${data?.geocoded ?? 0} of ${data?.processed ?? 0} stadiums`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGeocoding(false);
    }
  };

  const duplicates = useMemo(
    () => (selected ? findNearbyDuplicates(selected, rows) : []),
    [selected, rows],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-[1000]">
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/admin")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Button>
          <h1 className="text-base font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Stadium Map Review
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-auto flex-wrap">
            <Badge variant="secondary" className="text-[10px]">{counters.visible}/{counters.total} shown</Badge>
            <Badge variant="outline" className="text-[10px]">{counters.pending} pending</Badge>
            <Badge variant="outline" className="text-[10px]">{counters.approved} approved</Badge>
            <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">{counters.conflicts} conflicts</Badge>
            <Badge variant="outline" className="text-[10px]">{counters.multiClub} multi-club</Badge>
            <Badge variant="outline" className="text-[10px]">{counters.noCoords} no coords</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search name, city, club…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs w-56"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="duplicate">Duplicate</SelectItem>
            </SelectContent>
          </Select>
          <Select value={confidence} onValueChange={setConfidence}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All confidence</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <ToggleChip label="Conflicts" active={conflictsOnly} onClick={() => setConflictsOnly((v) => !v)} />
          <ToggleChip label="Missing metadata" active={missingMetaOnly} onClick={() => setMissingMetaOnly((v) => !v)} />
          <ToggleChip label="No hero image" active={noHeroOnly} onClick={() => setNoHeroOnly((v) => !v)} />
          <ToggleChip label="Multi-club" active={multiClubOnly} onClick={() => setMultiClubOnly((v) => !v)} />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{withoutCoords} hidden (no coords)</span>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={runGeocoder} disabled={geocoding}>
              {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              Auto-geocode 10
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-2 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <Layers className="w-3 h-3" />
          <LegendDot color={CONFIDENCE_COLOR.high} label="High" />
          <LegendDot color={CONFIDENCE_COLOR.medium} label="Medium" />
          <LegendDot color={CONFIDENCE_COLOR.low} label="Low" />
          <LegendDot color={STATUS_COLOR.approved} label="Approved" />
          <LegendDot color={STATUS_COLOR.rejected} label="Rejected" />
          <LegendDot color="#ef4444" label="Conflict" />
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-foreground/60" /> Multi-club
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 grid place-items-center z-[400] bg-background/60">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <MapContainer
          center={[45, 10]}
          zoom={4}
          minZoom={2}
          worldCopyJump
          className="w-full h-[calc(100vh-180px)]"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClusterLayer rows={withCoords} onSelect={setSelected} />
        </MapContainer>
      </div>

      {/* Review sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setEditing(false); } }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto z-[1100]">
          {selected && (
            <ReviewCard
              row={selected}
              duplicates={duplicates}
              busy={busy}
              editing={editing}
              setEditing={setEditing}
              onUpdate={updateRow}
              onJumpTo={(r) => setSelected(r)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ---------- Subcomponents ----------
const ToggleChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`text-[11px] px-2.5 h-8 rounded-md border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background border-border text-muted-foreground hover:text-foreground"
    }`}
  >
    {label}
  </button>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1">
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} /> {label}
  </span>
);

interface ReviewCardProps {
  row: StagingRow;
  duplicates: { row: StagingRow; distanceKm: number; similarity: number }[];
  busy: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onUpdate: (patch: Partial<StagingRow>, id?: string) => Promise<void>;
  onJumpTo: (row: StagingRow) => void;
}

const ReviewCard = ({ row, duplicates, busy, editing, setEditing, onUpdate, onJumpTo }: ReviewCardProps) => {
  const [form, setForm] = useState({
    canonical_name: row.canonical_name,
    city: row.city ?? "",
    country: row.country ?? "",
    league: row.league ?? "",
    hero_image_url: row.hero_image_url ?? "",
    latitude: row.latitude?.toString() ?? "",
    longitude: row.longitude?.toString() ?? "",
    review_notes: row.review_notes ?? "",
  });

  useEffect(() => {
    setForm({
      canonical_name: row.canonical_name,
      city: row.city ?? "",
      country: row.country ?? "",
      league: row.league ?? "",
      hero_image_url: row.hero_image_url ?? "",
      latitude: row.latitude?.toString() ?? "",
      longitude: row.longitude?.toString() ?? "",
      review_notes: row.review_notes ?? "",
    });
  }, [row.id]);

  const isMulti = (row.club_names?.length ?? 0) > 1;
  const heroSrc = row.hero_image_url || row.background_image_url || row.thumbnail_image_url;

  const saveEdits = async () => {
    const lat = form.latitude ? parseFloat(form.latitude) : null;
    const lon = form.longitude ? parseFloat(form.longitude) : null;
    await onUpdate({
      canonical_name: form.canonical_name,
      city: form.city || null,
      country: form.country || null,
      league: form.league || null,
      hero_image_url: form.hero_image_url || null,
      latitude: lat as never,
      longitude: lon as never,
      review_notes: form.review_notes || null,
    });
    setEditing(false);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="relative h-44 bg-muted">
        {heroSrc ? (
          <img src={heroSrc} alt={row.canonical_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <h2 className="text-lg font-bold text-foreground drop-shadow">{row.canonical_name}</h2>
          <p className="text-xs text-muted-foreground">
            {[row.city, row.country].filter(Boolean).join(" · ") || "Unknown location"}
          </p>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge style={{ background: pinColor(row), color: "white" }} className="text-[10px] capitalize">
            {row.status === "pending" ? row.confidence : row.status}
          </Badge>
          {isMulti && (
            <Badge variant="outline" className="text-[10px] bg-background/80 gap-1">
              <Users className="w-3 h-3" /> Multi-club
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Conflicts */}
        {row.conflict_flags?.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" /> Conflict flags
            </div>
            <div className="flex flex-wrap gap-1">
              {row.conflict_flags.map((f) => (
                <Badge key={f} variant="outline" className="text-[10px] border-destructive/40 text-destructive">{f}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Nearby duplicates */}
        {duplicates.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Possible duplicates nearby
            </div>
            <ul className="space-y-1.5">
              {duplicates.map(({ row: d, distanceKm, similarity }) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onJumpTo(d)}
                    className="text-left flex-1 hover:underline"
                  >
                    <div className="font-medium text-foreground truncate">{d.canonical_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {(distanceKm * 1000).toFixed(0)}m · {(similarity * 100).toFixed(0)}% name match
                    </div>
                  </button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]"
                    onClick={() => onUpdate({ status: "duplicate", review_notes: `Duplicate of ${d.canonical_name}` })}
                    disabled={busy}
                  >
                    Mark dup
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        {!editing ? (
          <div className="space-y-2 text-xs">
            <Row k="Slug" v={row.slug} />
            <Row k="League" v={row.league ?? "—"} />
            <Row k="Capacity" v={row.capacity?.toLocaleString() ?? "—"} />
            <Row k="Year opened" v={row.year_opened?.toString() ?? "—"} />
            <Row k="Coordinates" v={row.latitude != null ? `${row.latitude.toFixed(4)}, ${row.longitude!.toFixed(4)}` : "—"} />
            {row.aliases?.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">Aliases</div>
                <div className="flex flex-wrap gap-1">
                  {row.aliases.map((a) => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}
                </div>
              </div>
            )}
            {row.club_names?.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1">Clubs</div>
                <div className="flex flex-wrap gap-1">
                  {row.club_names.map((c) => <Badge key={c} className="text-[10px]">{c}</Badge>)}
                </div>
              </div>
            )}
            {row.production_stadium_id && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Database className="w-3.5 h-3.5" />
                Linked to production stadium
              </div>
            )}
            {row.official_website && (
              <a href={row.official_website} target="_blank" rel="noreferrer"
                 className="flex items-center gap-1.5 text-primary hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Official site
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <Field label="Canonical name" value={form.canonical_name} onChange={(v) => setForm({ ...form, canonical_name: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            </div>
            <Field label="League" value={form.league} onChange={(v) => setForm({ ...form, league: v })} />
            <Field label="Hero image URL" value={form.hero_image_url} onChange={(v) => setForm({ ...form, hero_image_url: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} />
              <Field label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} />
            </div>
            <Field label="Review notes" value={form.review_notes} onChange={(v) => setForm({ ...form, review_notes: v })} />
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {!editing ? (
            <>
              <Button size="sm" className="text-xs gap-1" onClick={() => onUpdate({ status: "approved" })} disabled={busy}>
                <Check className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onUpdate({ status: "rejected" })} disabled={busy}>
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs gap-1"
                onClick={() => onUpdate({ confidence: "high", review_notes: (row.review_notes ?? "") + " [verified]" })}
                disabled={busy}
              >
                <Sparkles className="w-3.5 h-3.5" /> Mark verified
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="text-xs" onClick={saveEdits} disabled={busy}>
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium text-foreground text-right truncate max-w-[60%]">{v}</span>
  </div>
);

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
  </div>
);

const StadiumMapReviewPage = () => (
  <RequireAdmin>
    <StadiumMapReviewPageInner />
  </RequireAdmin>
);

export default StadiumMapReviewPage;
