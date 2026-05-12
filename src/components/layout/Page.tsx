import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ============================================================
 * Unified Page Rhythm primitives.
 * Goal: every public/marketing page shares the same cinematic
 * spacing scale, hero treatment and section rhythm so the entire
 * platform feels like one premium ecosystem.
 *
 * Spacing scale (do not deviate without reason):
 *   Hero        : py-20 sm:py-24 md:py-28
 *   Section     : py-16 sm:py-20
 *   Section tight: py-12 sm:py-14
 *   Container   : max-w-5xl mx-auto px-5 sm:px-8
 *   Wide container: max-w-6xl mx-auto px-5 sm:px-8
 * ========================================================== */

export const containerCls = "max-w-5xl mx-auto px-5 sm:px-8";
export const wideContainerCls = "max-w-6xl mx-auto px-5 sm:px-8";
export const narrowContainerCls = "max-w-3xl mx-auto px-5 sm:px-8";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Tone: cinematic dark (default) or soft light */
  tone?: "dark" | "light";
  /** Container width */
  width?: "narrow" | "default" | "wide";
  /** Center text (default true) */
  center?: boolean;
  /** Optional element rendered below the subtitle (CTAs, search, etc.) */
  children?: ReactNode;
  /** Optional meta text shown below children (e.g. "Last updated…") */
  meta?: ReactNode;
  /** Disable the soft fade-to-white at the bottom (e.g. when next section is dark) */
  noFade?: boolean;
}

/**
 * Cinematic page hero. Dark gradient by default with radial accent glows
 * and a subtle gradient fade into the next (white) section so the
 * dark→light transition feels editorial, never abrupt.
 */
export const PageHero = ({
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  tone = "dark",
  width = "default",
  center = true,
  children,
  meta,
  noFade = false,
}: PageHeroProps) => {
  const containerWidth =
    width === "narrow"
      ? narrowContainerCls
      : width === "wide"
      ? wideContainerCls
      : containerCls;

  const isDark = tone === "dark";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        isDark ? "bg-[#0F1A2E] text-white" : "bg-slate-50 text-[#2C3E50]"
      )}
    >
      {isDark && (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(46,204,113,0.45), transparent 60%), radial-gradient(ellipse at bottom right, rgba(52,152,219,0.32), transparent 55%)",
          }}
        />
      )}

      <div
        className={cn(
          "relative",
          containerWidth,
          "py-20 sm:py-24 md:py-28",
          center && "text-center"
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className={cn(
              "flex items-center gap-1.5 text-xs mb-6",
              isDark ? "text-white/65" : "text-[#2C3E50]/65",
              center ? "justify-center" : ""
            )}
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {b.to ? (
                  <Link
                    to={b.to}
                    className={cn(
                      "transition-colors",
                      isDark ? "hover:text-[#2ECC71]" : "hover:text-[#2ECC71]"
                    )}
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isDark ? "text-white/90 font-medium" : "text-[#2C3E50] font-medium"
                    }
                  >
                    {b.label}
                  </span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <div className={center ? "flex justify-center" : ""}>
            <span
              className={cn(
                "inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest rounded-full px-3 py-1 mb-5",
                isDark
                  ? "text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30"
                  : "text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/25"
              )}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <h1
          className={cn(
            "font-extrabold tracking-tight leading-[1.08]",
            "text-3xl sm:text-4xl md:text-5xl"
          )}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className={cn(
              "mt-5 text-base sm:text-lg leading-relaxed",
              isDark ? "text-white/75" : "text-[#2C3E50]/70",
              center ? "max-w-2xl mx-auto" : "max-w-3xl"
            )}
          >
            {subtitle}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}

        {meta && (
          <div
            className={cn(
              "mt-6 text-xs",
              isDark ? "text-white/50" : "text-[#2C3E50]/55"
            )}
          >
            {meta}
          </div>
        )}
      </div>

      {/* Cinematic fade into next (light) section */}
      {isDark && !noFade && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white/[0.04]"
        />
      )}
    </section>
  );
};

interface PageSectionProps {
  children: ReactNode;
  /** Background tone */
  tone?: "white" | "slate" | "dark";
  /** Vertical rhythm */
  size?: "default" | "tight" | "relaxed";
  /** Container width */
  width?: "narrow" | "default" | "wide";
  className?: string;
  id?: string;
  /** Top divider line for editorial rhythm */
  divider?: boolean;
}

export const PageSection = ({
  children,
  tone = "white",
  size = "default",
  width = "default",
  className,
  id,
  divider = false,
}: PageSectionProps) => {
  const padY =
    size === "tight"
      ? "py-12 sm:py-14"
      : size === "relaxed"
      ? "py-20 sm:py-24"
      : "py-16 sm:py-20";

  const bg =
    tone === "slate"
      ? "bg-slate-50"
      : tone === "dark"
      ? "bg-[#0F1A2E] text-white"
      : "bg-white";

  const containerWidth =
    width === "narrow"
      ? narrowContainerCls
      : width === "wide"
      ? wideContainerCls
      : containerCls;

  return (
    <section
      id={id}
      className={cn(
        bg,
        divider && "border-t border-slate-100",
        className
      )}
    >
      <div className={cn(containerWidth, padY)}>{children}</div>
    </section>
  );
};

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}

export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "light",
  className,
}: SectionHeadingProps) => {
  const isDark = tone === "dark";
  return (
    <div
      className={cn(
        align === "center" ? "text-center mx-auto max-w-2xl" : "text-left max-w-3xl",
        "mb-10 sm:mb-12",
        className
      )}
    >
      {eyebrow && (
        <div className={align === "center" ? "flex justify-center" : ""}>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 mb-3",
              isDark
                ? "text-[#2ECC71] bg-[#2ECC71]/10 border border-[#2ECC71]/30"
                : "text-[#27ae60] bg-[#2ECC71]/10 border border-[#2ECC71]/25"
            )}
          >
            {eyebrow}
          </span>
        </div>
      )}
      <h2
        className={cn(
          "text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight",
          isDark ? "text-white" : "text-[#2C3E50]"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 text-sm sm:text-base leading-relaxed",
            isDark ? "text-white/70" : "text-[#2C3E50]/65"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
