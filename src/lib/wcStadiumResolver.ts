// Resolve a WC seed venue → an existing `stadiums` row (must be is_world_cup_host).
//
// Used by:
//  - admin import preview (TS in the browser)
//  - edge functions (mirrored logic in `wc-import-schedule`)
//
// Order:
//   1. exact name / slug
//   2. alias match (accent + transliteration folded)
//   3. city + country (single host)
//   4. coordinates within 5 km (haversine)
import { foldText } from "@/lib/normalize";

export interface HostStadiumCandidate {
  id: string;
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  aliases?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ResolveInput {
  venue: string;
  city: string;
  country: string;
  venueAliases?: string[];
  latitude?: number;
  longitude?: number;
}

export type ResolveStrategy =
  | "name"
  | "slug"
  | "alias"
  | "city-country"
  | "coords"
  | "none";

export interface ResolveResult {
  stadium: HostStadiumCandidate | null;
  strategy: ResolveStrategy;
}

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export const resolveHostStadium = (
  input: ResolveInput,
  hosts: HostStadiumCandidate[],
): ResolveResult => {
  const venueFolded = foldText(input.venue);
  const cityFolded = foldText(input.city);
  const countryFolded = foldText(input.country);
  const aliasFolded = [input.venue, ...(input.venueAliases || [])].map(foldText);

  // 1. exact name match
  let hit = hosts.find((h) => foldText(h.stadium_name) === venueFolded);
  if (hit) return { stadium: hit, strategy: "name" };

  // 2. slug match
  hit = hosts.find((h) => foldText(h.slug) === venueFolded);
  if (hit) return { stadium: hit, strategy: "slug" };

  // 3. alias match (in either direction)
  hit = hosts.find((h) => {
    const hostAliases = (h.aliases || []).map(foldText);
    if (aliasFolded.some((a) => hostAliases.includes(a))) return true;
    if (hostAliases.includes(venueFolded)) return true;
    if (aliasFolded.includes(foldText(h.stadium_name))) return true;
    return false;
  });
  if (hit) return { stadium: hit, strategy: "alias" };

  // 4. city + country (single host)
  const cityMatches = hosts.filter(
    (h) => foldText(h.city || "") === cityFolded && foldText(h.country || "") === countryFolded,
  );
  if (cityMatches.length === 1) return { stadium: cityMatches[0], strategy: "city-country" };

  // 5. coordinates within 5km
  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    const withCoords = hosts.filter(
      (h) => typeof h.latitude === "number" && typeof h.longitude === "number",
    );
    const near = withCoords
      .map((h) => ({
        h,
        d: haversineKm(
          { lat: input.latitude!, lng: input.longitude! },
          { lat: h.latitude!, lng: h.longitude! },
        ),
      }))
      .filter((x) => x.d <= 5)
      .sort((a, b) => a.d - b.d);
    if (near.length) return { stadium: near[0].h, strategy: "coords" };
  }

  return { stadium: null, strategy: "none" };
};
