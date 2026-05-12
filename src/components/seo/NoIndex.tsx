import { useEffect } from "react";

/**
 * Adds <meta name="robots" content="noindex, nofollow"> to the document head
 * for the lifetime of the mounted component. Used to hide pages that are not
 * yet polished enough for public/SEO exposure while keeping the route alive.
 */
export const NoIndex = () => {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      try { document.head.removeChild(meta); } catch { /* ignore */ }
    };
  }, []);
  return null;
};

export default NoIndex;
