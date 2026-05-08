// Curated, editorial-quality football crowd / stadium photos from Unsplash.
// Used as fallback when a stadium has no specific imagery, so cards never feel empty.
const FALLBACKS: string[] = [
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80", // packed stadium night
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80", // floodlit pitch
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80", // crowd flares
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80", // stadium tunnel
  "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80", // green pitch from stand
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80", // stadium aerial
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const stadiumImage = (
  primary: string | null | undefined,
  ...rest: Array<string | null | undefined>
): string => {
  const found = [primary, ...rest].find((u) => typeof u === "string" && u.trim().length > 0);
  if (found) return found as string;
  return FALLBACKS[hash("fallback") % FALLBACKS.length];
};

export const stadiumImageFor = (
  seed: string,
  primary?: string | null,
  ...rest: Array<string | null | undefined>
): string => {
  const found = [primary, ...rest].find((u) => typeof u === "string" && u.trim().length > 0);
  if (found) return found as string;
  return FALLBACKS[hash(seed || "x") % FALLBACKS.length];
};
