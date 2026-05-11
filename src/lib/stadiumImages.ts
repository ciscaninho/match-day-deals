// Stadium image resolution + curated dataset detection.
//
// Priority:
//   1. Curated CDN image from the imported dataset (static.prod-images.emergentagent.com)
//   2. Any explicit URL provided on the stadium row (hero / background / image)
//   3. Deterministic Unsplash fallback from a wide pool so cards never repeat
//
// We expanded the fallback pool well past 6 to avoid the "same generic stadium
// everywhere" effect that made the homepage feel cheap.

// Hosts we consider "curated" — i.e. authentic stadium photography from our
// own dataset or imported from the curated Google Drive source via the
// Supabase storage bucket `stadium-media`. These are the only images that
// receive the Foot Ticket Finder branded overlay (never stock/Unsplash).
const CURATED_HOSTS = [
  "static.prod-images.emergentagent.com",
  // Supabase storage (curated bucket) — covers all imports from the Drive sync.
  "supabase.co/storage/v1/object/public/stadium-media",
  "supabase.in/storage/v1/object/public/stadium-media",
];

const FALLBACKS: string[] = [
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540552103450-1ce63b3eaaee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493673272479-a20888bcee10?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551279880-03041531948f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1592231487929-eb45ab1cb0e3?auto=format&fit=crop&w=1200&q=80",
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const firstNonEmpty = (...urls: Array<string | null | undefined>) =>
  urls.find((u) => typeof u === "string" && u.trim().length > 0) as string | undefined;

/**
 * Returns true when the provided URL is from our curated stadium dataset.
 * Used to decide whether to overlay the Foot Ticket Finder watermark
 * (we only stamp authentic curated visuals, never generic fallbacks).
 */
export const isCuratedStadiumImage = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return CURATED_HOSTS.some((h) => url.includes(h));
};

export const stadiumImage = (
  primary: string | null | undefined,
  ...rest: Array<string | null | undefined>
): string => {
  const found = firstNonEmpty(primary, ...rest);
  if (found) return found;
  return FALLBACKS[hash("fallback") % FALLBACKS.length];
};

/**
 * Pick the best stadium image for a card / hero.
 * Prefers any explicit URL (curated CDN ranks higher implicitly because we
 * always pass `hero_image_url` first). Falls back to a deterministic Unsplash
 * photo seeded by `seed` so each stadium consistently gets its own visual.
 */
export const stadiumImageFor = (
  seed: string,
  primary?: string | null,
  ...rest: Array<string | null | undefined>
): string => {
  const found = firstNonEmpty(primary, ...rest);
  if (found) return found;
  return FALLBACKS[hash(seed || "x") % FALLBACKS.length];
};
