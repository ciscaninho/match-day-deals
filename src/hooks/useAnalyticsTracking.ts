import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackEvent } from "@/lib/analytics";

/**
 * Tracks a page_view on every route change.
 * Mount once inside <BrowserRouter>.
 */
export const usePageViewTracking = () => {
  const { pathname, search } = useLocation();
  const lastRef = useRef<string>("");

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const key = `${pathname}${search}`;
    if (key === lastRef.current) return;
    lastRef.current = key;
    trackEvent("page_view");
  }, [pathname, search]);
};

/**
 * Tracks scroll depth (25/50/75/100) once per page load.
 */
export const useScrollDepthTracking = () => {
  const { pathname } = useLocation();
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();
  }, [pathname]);

  useEffect(() => {
    const handler = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / max) * 100));
      const thresholds = [25, 50, 75, 100] as const;
      thresholds.forEach((t) => {
        if (pct >= t && !firedRef.current.has(t)) {
          firedRef.current.add(t);
          trackEvent(`scroll_${t}` as const);
        }
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [pathname]);
};

export const AnalyticsTracker = () => {
  usePageViewTracking();
  useScrollDepthTracking();
  return null;
};
