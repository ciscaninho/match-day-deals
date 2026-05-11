import { useState } from "react";
import { cn } from "@/lib/utils";
import { isCuratedStadiumImage, stadiumImageFor } from "@/lib/stadiumImages";

/**
 * Visual intensity of the Foot Ticket Finder branded overlay.
 *
 *  - `hero`    → full lockup (logo + wordmark) on a soft glass pill. Used on
 *                large hero/background images where the brand can breathe.
 *  - `card`    → smaller pill, lighter blur, used on grid/rail cards.
 *  - `minimal` → tiny logo dot only — for very small thumbnails.
 *  - `share`   → strong cinematic lockup with domain — for OG / social cards.
 *  - `none`    → disable overlay entirely (admin/review screens, internal UI).
 */
export type BrandingIntensity = "hero" | "card" | "minimal" | "share" | "none";

type Props = {
  src: string;
  alt: string;
  seed: string;
  className?: string;
  imgClassName?: string;
  /** Show the Foot Ticket Finder branding overlay when the image is from our curated dataset. */
  branded?: boolean;
  /** How prominent the overlay should be. Defaults to `card`. */
  intensity?: BrandingIntensity;
  /** Where to place the branded logo (default: bottom-right). */
  brandPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Optional overlay (e.g. dark gradient). Provided by parent. */
  overlay?: React.ReactNode;
  /** Optional children rendered on top of the image (badges, text). */
  children?: React.ReactNode;
  loading?: "lazy" | "eager";
};

const POSITION_CLS: Record<NonNullable<Props["brandPosition"]>, string> = {
  "bottom-right": "bottom-2 right-2 sm:bottom-3 sm:right-3",
  "bottom-left": "bottom-2 left-2 sm:bottom-3 sm:left-3",
  "top-right": "top-2 right-2 sm:top-3 sm:right-3",
  "top-left": "top-2 left-2 sm:top-3 sm:left-3",
};

/**
 * Renders a stadium image with:
 *  - automatic fallback on load error (seeded Unsplash from a wide pool)
 *  - a discrete, dynamic Foot Ticket Finder watermark on curated visuals
 *    (CSS-only, never destructive on the original file)
 *  - the standard dark gradient overlay parents can opt into
 *
 * The watermark only renders on images that come from our curated CDN /
 * Supabase storage bucket — generic Unsplash fallbacks are never branded.
 */
export const BrandedStadiumImage = ({
  src,
  alt,
  seed,
  className,
  imgClassName,
  branded = true,
  intensity = "card",
  brandPosition = "bottom-right",
  overlay,
  children,
  loading = "lazy",
}: Props) => {
  const [current, setCurrent] = useState(src);
  const [errored, setErrored] = useState(false);
  const showBrand =
    branded &&
    intensity !== "none" &&
    !errored &&
    isCuratedStadiumImage(current);

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      <img
        src={current}
        alt={alt}
        loading={loading}
        decoding="async"
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          imgClassName,
        )}
        onError={() => {
          if (!errored) {
            setErrored(true);
            setCurrent(stadiumImageFor(`fb-${seed}`));
          }
        }}
      />
      {overlay}
      {showBrand && (
        <BrandLockup
          intensity={intensity}
          className={POSITION_CLS[brandPosition]}
        />
      )}
      {children}
    </div>
  );
};

/**
 * Pure-CSS Foot Ticket Finder lockup. Sized/styled by intensity.
 * Kept here so any surface (hero / card / share preview) can render it
 * over an arbitrary background without a destructive watermark on the file.
 */
export const BrandLockup = ({
  intensity = "card",
  className,
}: {
  intensity?: BrandingIntensity;
  className?: string;
}) => {
  if (intensity === "none") return null;

  // Minimal: tiny logo dot only — for very small thumbs.
  if (intensity === "minimal") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute z-10 rounded-full bg-black/45 backdrop-blur-sm p-1 shadow-sm",
          className,
        )}
        aria-hidden="true"
      >
        <img src="/logo.png" alt="" className="w-3 h-3 opacity-90" loading="lazy" />
      </div>
    );
  }

  // Share / OG cinematic lockup — stronger, includes domain.
  if (intensity === "share") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute z-10 flex items-center gap-2 rounded-full",
          "bg-black/55 backdrop-blur-md ring-1 ring-white/10 px-3 py-1.5 shadow-lg",
          className,
        )}
        aria-hidden="true"
      >
        <img src="/logo.png" alt="" className="w-5 h-5 opacity-95" loading="lazy" />
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-extrabold tracking-wide text-white uppercase">
            Foot Ticket Finder
          </span>
          <span className="text-[9px] tracking-[0.14em] text-[#2ECC71] uppercase mt-0.5">
            footticketfinder.com
          </span>
        </div>
      </div>
    );
  }

  // Hero: full lockup, breathable.
  // Card: same lockup but smaller/lighter.
  const isHero = intensity === "hero";
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 flex items-center rounded-full shadow-sm",
        isHero
          ? "gap-1.5 bg-black/45 backdrop-blur-md ring-1 ring-white/10 px-2.5 py-1"
          : "gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-1",
        className,
      )}
      aria-hidden="true"
    >
      <img
        src="/logo.png"
        alt=""
        className={cn(isHero ? "w-4 h-4" : "w-3.5 h-3.5", "opacity-90")}
        loading="lazy"
      />
      <span
        className={cn(
          "font-bold tracking-wide text-white/90 uppercase leading-none",
          isHero ? "text-[10px]" : "text-[8px] hidden sm:inline",
        )}
      >
        Foot Ticket Finder
      </span>
    </div>
  );
};

export default BrandedStadiumImage;
