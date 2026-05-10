import { useState } from "react";
import { cn } from "@/lib/utils";
import { isCuratedStadiumImage, stadiumImageFor } from "@/lib/stadiumImages";

type Props = {
  src: string;
  alt: string;
  seed: string;
  className?: string;
  imgClassName?: string;
  /** Show the Foot Ticket Finder branding overlay when the image is from our curated dataset. */
  branded?: boolean;
  /** Where to place the branded logo (default: bottom-right). */
  brandPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Optional overlay (e.g. dark gradient). Provided by parent. */
  overlay?: React.ReactNode;
  /** Optional children rendered on top of the image (badges, text). */
  children?: React.ReactNode;
  loading?: "lazy" | "eager";
};

const POSITION_CLS: Record<NonNullable<Props["brandPosition"]>, string> = {
  "bottom-right": "bottom-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "top-right": "top-2 right-2",
  "top-left": "top-2 left-2",
};

/**
 * Renders a stadium image with:
 *  - automatic fallback on load error (uses curated → curated → seeded Unsplash)
 *  - a discrete Foot Ticket Finder watermark on curated visuals (premium feel,
 *    never destructive: pure CSS overlay)
 *  - the standard dark gradient overlay parents can opt into
 */
export const BrandedStadiumImage = ({
  src,
  alt,
  seed,
  className,
  imgClassName,
  branded = true,
  brandPosition = "bottom-right",
  overlay,
  children,
  loading = "lazy",
}: Props) => {
  const [current, setCurrent] = useState(src);
  const [errored, setErrored] = useState(false);
  const showBrand = branded && !errored && isCuratedStadiumImage(current);

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
        <div
          className={cn(
            "pointer-events-none absolute z-10 flex items-center gap-1 rounded-full",
            "bg-black/45 backdrop-blur-sm px-1.5 py-1 shadow-sm",
            POSITION_CLS[brandPosition],
          )}
          aria-hidden="true"
        >
          <img
            src="/logo.png"
            alt=""
            className="w-3.5 h-3.5 opacity-90"
            loading="lazy"
          />
          <span className="text-[8px] font-bold tracking-wide text-white/85 uppercase leading-none">
            Foot Ticket Finder
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

export default BrandedStadiumImage;
