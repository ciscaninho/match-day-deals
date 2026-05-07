import { useEffect, useRef, useState } from "react";

interface Props {
  logo?: string | null;
  name: string;
  short: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-12 h-12 md:w-14 md:h-14",
  md: "w-20 h-20 md:w-28 md:h-28",
  lg: "w-24 h-24 md:w-32 md:h-32",
};

/**
 * Detects whether a logo is dark/monochrome by sampling pixel luminance.
 * If the logo is overall dark, applies a soft glass background + glow so it
 * stays highly visible on dark themes (Juventus, Newcastle, etc.).
 */
export const ClubLogo = ({ logo, name, short, size = "md" }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!logo) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = (canvas.width = 32);
        const h = (canvas.height = 32);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let lumSum = 0;
        let opaque = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 40) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          lumSum += 0.299 * r + 0.587 * g + 0.114 * b;
          opaque++;
        }
        if (opaque > 0) {
          const avg = lumSum / opaque;
          setIsDark(avg < 90); // mostly dark logo
        }
        setLoaded(true);
      } catch {
        // CORS-tainted: fall back to neutral light bg
        setIsDark(true);
        setLoaded(true);
      }
    };
    img.onerror = () => setLoaded(true);
    img.src = logo;
  }, [logo]);

  const base =
    "group relative rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300";
  const dark =
    "bg-white/95 border border-white/40 shadow-[0_0_24px_-6px_rgba(255,255,255,0.35)] hover:shadow-[0_0_32px_-4px_rgba(255,255,255,0.55)]";
  const light =
    "bg-white/10 border border-white/15 hover:bg-white/15 hover:shadow-[0_0_28px_-6px_rgba(46,204,113,0.45)]";

  return (
    <div className={`${base} ${sizeMap[size]} ${isDark ? dark : light}`}>
      {logo ? (
        <img
          ref={imgRef}
          src={logo}
          alt={name}
          loading="lazy"
          className={`w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <span className={`text-2xl font-extrabold ${isDark ? "text-[#0b1220]" : "text-white"}`}>
          {short}
        </span>
      )}
    </div>
  );
};
