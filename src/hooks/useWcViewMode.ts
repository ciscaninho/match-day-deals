import { useEffect, useState } from "react";

export type WcViewMode = "preview" | "live";
const KEY = "wc2026.viewMode";

const read = (): WcViewMode => {
  if (typeof window === "undefined") return "live";
  const v = window.localStorage.getItem(KEY);
  return v === "preview" ? "preview" : "live";
};

export function useWcViewMode(): [WcViewMode, (m: WcViewMode) => void] {
  const [mode, setMode] = useState<WcViewMode>(read);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setMode(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const set = (m: WcViewMode) => {
    window.localStorage.setItem(KEY, m);
    setMode(m);
  };
  return [mode, set];
}
