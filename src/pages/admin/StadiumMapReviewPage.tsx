import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft, Check, X, Pencil, MapPin, Crosshair, Layers, Loader2, AlertTriangle,
  Users, Image as ImageIcon, Sparkles, Database, ExternalLink, ShieldCheck, ShieldAlert,
  ShieldQuestion, ChevronLeft, ChevronRight, Maximize2, Keyboard, ArrowRightLeft,
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

interface ProductionStadium {
  id: string;
  stadium_name: string;
  slug: string;
  city: string | null;
  country: string | null;
  league: string | null;
  clubs: string[] | null;
  club_name: string | null;
  hero_image_url: string | null;
  thumbnail_image_url: string | null;
  background_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
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

function makeIcon(color: string, isMulti: boolean, isLive: boolean) {
  const ring = isMulti
    ? `<circle cx="14" cy="14" r="12" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 2"/>`
    : "";
  const liveDot = isLive
    ? `<circle cx="22" cy="6" r="4.5" fill="#22c55e" stroke="white" stroke-width="1.5"/>`
    : "";
  const html = `
    <div style="position:relative;width:28px;height:36px;transform:translate(-14px,-32px);">
      <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        ${ring}
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
        ${liveDot}
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
      const isLive = !!row.production_stadium_id;
      const marker = L.marker([row.latitude, row.longitude], {
        icon: makeIcon(pinColor(row), isMulti, isLive),
      });
      marker.on("click", () => onSelect(row));
      marker.bindTooltip(
        `<strong>${row.canonical_name}</strong>${isLive ? ' <span style="color:#22c55e">●LIVE</span>' : ''}<br/>${row.city ?? ""} ${row.country ? "· " + row.country : ""}`,
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

// Compute all duplicate pair links across visible rows (for map polylines)
function computeDuplicateLinks(rows: StagingRow[]): { a: StagingRow; b: StagingRow }[] {
  const links: { a: StagingRow; b: StagingRow }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    if (a.latitude == null || a.longitude == null) continue;
    for (let j = i + 1; j < rows.length; j++) {
      const b = rows[j];
      if (b.latitude == null || b.longitude == null) continue;
      const d = haversineKm([a.latitude, a.longitude], [b.latitude, b.longitude]);
      if (d > 0.5) continue;
      const sim = nameSimilarity(a.canonical_name, b.canonical_name);
      if (sim < 0.5) continue;
      const key = [a.id, b.id].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ a, b });
    }
  }
  return links;
}

// ---------- Safe-match scoring ----------
type SafeLevel = "safe" | "review" | "conflict";
interface SafetyAssessment {
  level: SafeLevel;
  reasons: string[];
}
function assessSafety(row: StagingRow, prod: ProductionStadium | null, dupCount: number): SafetyAssessment {
  const reasons: string[] = [];
  let level: SafeLevel = "safe";
  if (row.conflict_flags?.length) {
    level = "conflict";
    reasons.push(`${row.conflict_flags.length} conflict flag(s)`);
  }
  if (dupCount > 0) {
    if (level !== "conflict") level = "conflict";
    reasons.push(`${dupCount} possible duplicate(s) nearby`);
  }
  if (prod) {
    if (prod.country && row.country && prod.country.toLowerCase() !== row.country.toLowerCase()) {
      level = "conflict";
      reasons.push("Country mismatch with production");
    }
    if (prod.city && row.city && prod.city.toLowerCase() !== row.city.toLowerCase()) {
      if (level !== "conflict") level = "review";
      reasons.push("City differs from production");
    }
    if (prod.slug && row.slug && prod.slug !== row.slug) {
      if (level !== "conflict") level = "review";
      reasons.push("Slug differs from production");
    }
    const prodClubs = new Set((prod.clubs ?? []).map((c) => c.toLowerCase()));
    const stagingClubs = (row.club_names ?? []).map((c) => c.toLowerCase());
    const clubMatch = stagingClubs.some((c) => prodClubs.has(c));
    if (prodClubs.size > 0 && stagingClubs.length > 0 && !clubMatch) {
      if (level !== "conflict") level = "review";
      reasons.push("No overlapping clubs with production");
    }
  } else if (row.production_stadium_id) {
    level = "review";
    reasons.push("Linked to production but production row not found");
  }
  if (row.has_missing_metadata && level === "safe") {
    level = "review";
    reasons.push("Missing metadata");
  }
  if (reasons.length === 0) reasons.push("No conflicts detected");
  return { level, reasons };
}

const SAFETY_STYLE: Record<SafeLevel, { bg: string; border: string; fg: string; label: string; icon: typeof ShieldCheck }> = {
  safe: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", fg: "text-emerald-700 dark:text-emerald-400", label: "🟢 SAFE MATCH", icon: ShieldCheck },
  review: { bg: "bg-amber-500/10", border: "border-amber-500/40", fg: "text-amber-700 dark:text-amber-400", label: "🟡 REVIEW RECOMMENDED", icon: ShieldQuestion },
  conflict: { bg: "bg-destructive/10", border: "border-destructive/40", fg: "text-destructive", label: "🔴 CONFLICT DETECTED", icon: ShieldAlert },
};

// ---------- Page ----------
const StadiumMapReviewPageInner = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>("pending");
  const [confidence, setConfidence] = useState<string>("all");
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [missingMetaOnly, setMissingMetaOnly] = useState(false);
  const [noHeroOnly, setNoHeroOnly] = useState(false);
  const [prodNoHeroOnly, setProdNoHeroOnly] = useState(false);
  const [multiClubOnly, setMultiClubOnly] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
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

  // Pull production stadiums (small table) for comparison & filters.
  const { data: production = [] } = useQuery({
    queryKey: ["stadium-map-review-production"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stadiums")
        .select(
          "id,stadium_name,slug,city,country,league,clubs,club_name,hero_image_url,thumbnail_image_url,background_image_url,latitude,longitude",
        )
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as ProductionStadium[];
    },
  });

  const productionById = useMemo(() => {
    const m = new Map<string, ProductionStadium>();
    production.forEach((p) => m.set(p.id, p));
    return m;
  }, [production]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (confidence !== "all" && r.confidence !== confidence) return false;
      if (conflictsOnly && !(r.conflict_flags?.length > 0)) return false;
      if (missingMetaOnly && !r.has_missing_metadata) return false;
      if (noHeroOnly && r.hero_image_url) return false;
      if (multiClubOnly && (r.club_names?.length ?? 0) < 2) return false;
      if (liveOnly && !r.production_stadium_id) return false;
      if (prodNoHeroOnly) {
        if (!r.production_stadium_id) return false;
        const p = productionById.get(r.production_stadium_id);
        if (p?.hero_image_url) return false;
        if (!r.hero_image_url) return false; // staging must have something to enrich with
      }
      if (q && !`${r.canonical_name} ${r.city ?? ""} ${r.country ?? ""} ${r.club_names?.join(" ") ?? ""}`
            .toLowerCase()
            .includes(q))
        return false;
      return true;
    });
  }, [rows, status, confidence, conflictsOnly, missingMetaOnly, noHeroOnly, prodNoHeroOnly, multiClubOnly, liveOnly, search, productionById]);

  const withCoords = useMemo(() => filtered.filter((r) => r.latitude != null && r.longitude != null), [filtered]);
  const withoutCoords = filtered.length - withCoords.length;

  const duplicateLinks = useMemo(() => computeDuplicateLinks(withCoords), [withCoords]);

  const counters = useMemo(() => ({
    total: rows.length,
    visible: filtered.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    conflicts: rows.filter((r) => r.conflict_flags?.length).length,
    multiClub: rows.filter((r) => (r.club_names?.length ?? 0) > 1).length,
    live: rows.filter((r) => r.production_stadium_id).length,
    noCoords: rows.filter((r) => r.latitude == null).length,
  }), [rows, filtered]);

  const selected = useMemo(() => filtered.find((r) => r.id === selectedId) ?? rows.find((r) => r.id === selectedId) ?? null, [filtered, rows, selectedId]);
  const selectedIndex = useMemo(() => filtered.findIndex((r) => r.id === selectedId), [filtered, selectedId]);
  const selectedProd = selected?.production_stadium_id ? productionById.get(selected.production_stadium_id) ?? null : null;

  const refresh = () => qc.invalidateQueries({ queryKey: ["stadium-map-review"] });

  const updateRow = useCallback(async (patch: Partial<StagingRow>, id?: string) => {
    const targetId = id ?? selectedId;
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
    refresh();
  }, [selectedId]);

  const goNext = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = selectedIndex < 0 ? 0 : (selectedIndex + 1) % filtered.length;
    setSelectedId(filtered[idx].id);
    setEditing(false);
  }, [filtered, selectedIndex]);
  const goPrev = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = selectedIndex < 0 ? filtered.length - 1 : (selectedIndex - 1 + filtered.length) % filtered.length;
    setSelectedId(filtered[idx].id);
    setEditing(false);
  }, [filtered, selectedIndex]);

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
  const safety = useMemo(
    () => (selected ? assessSafety(selected, selectedProd, duplicates.length) : null),
    [selected, selectedProd, duplicates.length],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editing) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") { setShowShortcuts((v) => !v); return; }
      if (!selected) return;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
      else if (e.key === "a" || e.key === "A") { e.preventDefault(); updateRow({ status: "approved" }); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); updateRow({ status: "rejected" }); }
      else if (e.key === "d" || e.key === "D") { e.preventDefault(); updateRow({ status: "duplicate" }); }
      else if (e.key === "e" || e.key === "E") { e.preventDefault(); setEditing(true); }
      else if (e.key === "Escape") { setSelectedId(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, editing, goNext, goPrev, updateRow]);

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
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              {counters.live} live
            </Badge>
            <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">{counters.conflicts} conflicts</Badge>
            <Badge variant="outline" className="text-[10px]">{counters.multiClub} multi-club</Badge>
            <Badge variant="outline" className="text-[10px]">{counters.noCoords} no coords</Badge>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => setShowShortcuts(true)}>
              <Keyboard className="w-3 h-3" /> ?
            </Button>
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
          <ToggleChip label="No hero (staging)" active={noHeroOnly} onClick={() => setNoHeroOnly((v) => !v)} />
          <ToggleChip label="Prod missing hero" active={prodNoHeroOnly} onClick={() => setProdNoHeroOnly((v) => !v)} />
          <ToggleChip label="Multi-club" active={multiClubOnly} onClick={() => setMultiClubOnly((v) => !v)} />
          <ToggleChip label="🟢 Live only" active={liveOnly} onClick={() => setLiveOnly((v) => !v)} />

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
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white" /> Live production
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-destructive" /> Possible duplicate link
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
          <ClusterLayer rows={withCoords} onSelect={(r) => { setSelectedId(r.id); setEditing(false); }} />
          {duplicateLinks.map(({ a, b }, i) => (
            <Polyline
              key={i}
              positions={[[a.latitude!, a.longitude!], [b.latitude!, b.longitude!]]}
              pathOptions={{ color: "#ef4444", weight: 2, opacity: 0.7, dashArray: "4 4" }}
            />
          ))}
        </MapContainer>
        {duplicateLinks.length > 0 && (
          <div className="absolute bottom-3 left-3 z-[500] rounded-md bg-card/95 border border-destructive/30 px-2.5 py-1.5 text-[11px] text-destructive flex items-center gap-1.5 shadow">
            <AlertTriangle className="w-3.5 h-3.5" />
            {duplicateLinks.length} possible duplicate link{duplicateLinks.length === 1 ? "" : "s"} on map
          </div>
        )}
      </div>

      {/* Review sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelectedId(null); setEditing(false); } }}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto z-[1100] flex flex-col">
          {selected && safety && (
            <ReviewCard
              row={selected}
              prod={selectedProd}
              safety={safety}
              duplicates={duplicates}
              busy={busy}
              editing={editing}
              setEditing={setEditing}
              onUpdate={updateRow}
              onJumpTo={(r) => setSelectedId(r.id)}
              onPrev={goPrev}
              onNext={goNext}
              indexLabel={selectedIndex >= 0 ? `${selectedIndex + 1}/${filtered.length}` : ""}
              onOpenFullscreen={(src) => setFullscreenImg(src)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Fullscreen image */}
      <Dialog open={!!fullscreenImg} onOpenChange={(o) => { if (!o) setFullscreenImg(null); }}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none">
          {fullscreenImg && (
            <img src={fullscreenImg} alt="Stadium" className="w-full h-auto max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>

      {/* Shortcuts dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-sm">
          <div className="space-y-2 text-sm">
            <div className="font-bold flex items-center gap-2"><Keyboard className="w-4 h-4" /> Keyboard shortcuts</div>
            <Shortcut k="J / ↓" v="Next stadium" />
            <Shortcut k="K / ↑" v="Previous stadium" />
            <Shortcut k="A" v="Approve" />
            <Shortcut k="R" v="Reject" />
            <Shortcut k="D" v="Mark as duplicate" />
            <Shortcut k="E" v="Edit metadata" />
            <Shortcut k="Esc" v="Close panel" />
            <Shortcut k="?" v="Toggle this help" />
          </div>
        </DialogContent>
      </Dialog>
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

const Shortcut = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[11px]">{k}</kbd>
    <span className="text-muted-foreground">{v}</span>
  </div>
);

interface ReviewCardProps {
  row: StagingRow;
  prod: ProductionStadium | null;
  safety: SafetyAssessment;
  duplicates: { row: StagingRow; distanceKm: number; similarity: number }[];
  busy: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onUpdate: (patch: Partial<StagingRow>, id?: string) => Promise<void>;
  onJumpTo: (row: StagingRow) => void;
  onPrev: () => void;
  onNext: () => void;
  indexLabel: string;
  onOpenFullscreen: (src: string) => void;
}

const ReviewCard = ({ row, prod, safety, duplicates, busy, editing, setEditing, onUpdate, onJumpTo, onPrev, onNext, indexLabel, onOpenFullscreen }: ReviewCardProps) => {
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
  const isLive = !!row.production_stadium_id;
  const SafetyIcon = SAFETY_STYLE[safety.level].icon;

  // Impact preview
  const impact = useMemo(() => {
    const keep: string[] = [];
    const change: string[] = [];
    const enrich: string[] = [];
    if (prod) {
      keep.push(`Keep production slug: ${prod.slug}`);
      keep.push("Preserve current SEO routes");
      keep.push("Leave match relationships untouched");
      if (row.hero_image_url && row.hero_image_url !== prod.hero_image_url) {
        change.push("Update hero image");
      }
      if (row.thumbnail_image_url && row.thumbnail_image_url !== prod.thumbnail_image_url) {
        change.push("Update thumbnail image");
      }
      if (row.background_image_url && row.background_image_url !== prod.background_image_url) {
        change.push("Update background image");
      }
      if (!prod.city && row.city) enrich.push(`Fill missing city: ${row.city}`);
      if (!prod.country && row.country) enrich.push(`Fill missing country: ${row.country}`);
      if (!prod.league && row.league) enrich.push(`Fill missing league: ${row.league}`);
      if (row.aliases?.length) enrich.push(`Enrich aliases (+${row.aliases.length})`);
    } else {
      change.push("Promote as new production stadium (after final review)");
      if (row.hero_image_url) enrich.push("Set initial hero image");
    }
    return { keep, change, enrich };
  }, [row, prod]);

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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Hero */}
      <div className="relative h-44 bg-muted shrink-0">
        {heroSrc ? (
          <button onClick={() => onOpenFullscreen(heroSrc)} className="w-full h-full block group">
            <img src={heroSrc} alt={row.canonical_name} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </button>
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-3 right-3 pointer-events-none">
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

        {/* Nav arrows */}
        <div className="absolute top-1/2 -translate-y-1/2 left-1">
          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full opacity-80" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-1">
          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full opacity-80" onClick={onNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {indexLabel && (
          <div className="absolute top-2 left-2 text-[10px] bg-background/80 rounded px-1.5 py-0.5 text-muted-foreground">
            {indexLabel}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {/* VERIFIED LIVE / Safety banner */}
        {isLive && (
          <div className="rounded-lg border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 p-3 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500 grid place-items-center shrink-0">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wide">
                ✅ VERIFIED LIVE
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                Linked to production stadium{prod ? `: ${prod.stadium_name}` : ""}
              </div>
            </div>
          </div>
        )}

        <div className={`rounded-md border p-2.5 text-xs flex items-start gap-2 ${SAFETY_STYLE[safety.level].bg} ${SAFETY_STYLE[safety.level].border}`}>
          <SafetyIcon className={`w-4 h-4 mt-0.5 shrink-0 ${SAFETY_STYLE[safety.level].fg}`} />
          <div className="flex-1 min-w-0">
            <div className={`font-bold ${SAFETY_STYLE[safety.level].fg}`}>{SAFETY_STYLE[safety.level].label}</div>
            <ul className="mt-0.5 space-y-0.5 text-muted-foreground">
              {safety.reasons.map((r, i) => <li key={i}>· {r}</li>)}
            </ul>
          </div>
        </div>

        {/* Side-by-side comparison */}
        {prod && (
          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-2 text-[10px] font-bold uppercase tracking-wide bg-muted/60">
              <div className="px-2 py-1.5 border-r border-border flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Staging
              </div>
              <div className="px-2 py-1.5 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" /> Live production
              </div>
            </div>
            <div className="grid grid-cols-2">
              <CompareImage src={row.hero_image_url || row.background_image_url} onClick={onOpenFullscreen} />
              <CompareImage src={prod.hero_image_url || prod.background_image_url} onClick={onOpenFullscreen} className="border-l border-border" />
            </div>
            <CompareRow label="Slug" a={row.slug} b={prod.slug} />
            <CompareRow label="City" a={row.city} b={prod.city} />
            <CompareRow label="Country" a={row.country} b={prod.country} />
            <CompareRow label="League" a={row.league} b={prod.league} />
            <CompareRow label="Clubs" a={row.club_names?.join(", ")} b={(prod.clubs ?? []).join(", ") || prod.club_name} />
          </div>
        )}

        {/* Impact preview */}
        <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Approving will…
          </div>
          {impact.keep.length > 0 && (
            <ul className="space-y-0.5">
              {impact.keep.map((s, i) => <li key={`k${i}`} className="text-muted-foreground">· {s}</li>)}
            </ul>
          )}
          {impact.change.length > 0 && (
            <ul className="space-y-0.5">
              {impact.change.map((s, i) => <li key={`c${i}`} className="text-foreground">↻ {s}</li>)}
            </ul>
          )}
          {impact.enrich.length > 0 && (
            <ul className="space-y-0.5">
              {impact.enrich.map((s, i) => <li key={`e${i}`} className="text-emerald-700 dark:text-emerald-400">+ {s}</li>)}
            </ul>
          )}
          {safety.level === "conflict" && (
            <div className="mt-1 flex items-center gap-1 text-destructive font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Risky change — review carefully before approving.
            </div>
          )}
        </div>

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

        {/* Metadata / edit */}
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
      </div>

      {/* Sticky moderation actions */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur p-3 grid grid-cols-2 gap-2 shrink-0">
        {!editing ? (
          <>
            <Button size="sm" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onUpdate({ status: "approved" })} disabled={busy}>
              <Check className="w-3.5 h-3.5" /> Approve <kbd className="ml-1 text-[9px] opacity-70">A</kbd>
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onUpdate({ status: "rejected" })} disabled={busy}>
              <X className="w-3.5 h-3.5" /> Reject <kbd className="ml-1 text-[9px] opacity-70">R</kbd>
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit <kbd className="ml-1 text-[9px] opacity-70">E</kbd>
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

const CompareImage = ({ src, onClick, className = "" }: { src: string | null | undefined; onClick: (s: string) => void; className?: string }) => (
  <div className={`relative h-24 bg-muted ${className}`}>
    {src ? (
      <button onClick={() => onClick(src)} className="w-full h-full block group">
        <img src={src} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-1 right-1 bg-background/80 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-3 h-3" />
        </div>
      </button>
    ) : (
      <div className="w-full h-full grid place-items-center text-muted-foreground">
        <ImageIcon className="w-5 h-5" />
      </div>
    )}
  </div>
);

const CompareRow = ({ label, a, b }: { label: string; a: string | null | undefined; b: string | null | undefined }) => {
  const differs = (a ?? "") !== (b ?? "") && !!(a || b);
  return (
    <div className="grid grid-cols-[80px_1fr_1fr] text-[11px] border-t border-border">
      <div className="px-2 py-1.5 text-muted-foreground bg-muted/30 font-medium">{label}</div>
      <div className={`px-2 py-1.5 truncate border-l border-border ${differs ? "text-amber-700 dark:text-amber-400 font-medium" : "text-foreground"}`}>
        {a || <span className="text-muted-foreground">—</span>}
      </div>
      <div className={`px-2 py-1.5 truncate border-l border-border ${differs ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-foreground"}`}>
        {b || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
};

const StadiumMapReviewPage = () => (
  <RequireAdmin>
    <StadiumMapReviewPageInner />
  </RequireAdmin>
);

export default StadiumMapReviewPage;
