/**
 * GDPR-compliant consent store.
 *
 * - Persists user choice in localStorage (`ftf_consent`, v1).
 * - Three categories: essential (always on), analytics, marketing.
 * - No analytics/marketing call sites may run unless `hasConsent(category)` is true.
 * - Dispatches a `ftf:consent-changed` window event so reactive consumers
 *   (banner, analytics init) can respond without prop drilling.
 */

export type ConsentCategory = "essential" | "analytics" | "marketing";

export interface ConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp when the user made the choice. */
  decidedAt: string | null;
  /** Schema version, lets us re-prompt on policy changes. */
  v: 1;
}

const KEY = "ftf_consent";
const VERSION = 1 as const;
const EVENT = "ftf:consent-changed";
const OPEN_EVENT = "ftf:open-cookie-preferences";

const defaultState = (): ConsentState => ({
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
  v: VERSION,
});

export const getConsent = (): ConsentState => {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed?.v !== VERSION) return defaultState();
    return {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: parsed.decidedAt ?? null,
      v: VERSION,
    };
  } catch {
    return defaultState();
  }
};

export const hasDecided = (): boolean => getConsent().decidedAt !== null;

export const hasConsent = (cat: ConsentCategory): boolean => {
  if (cat === "essential") return true;
  return !!getConsent()[cat];
};

export const setConsent = (partial: { analytics: boolean; marketing: boolean }): ConsentState => {
  const next: ConsentState = {
    essential: true,
    analytics: !!partial.analytics,
    marketing: !!partial.marketing,
    decidedAt: new Date().toISOString(),
    v: VERSION,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* swallow */
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  } catch {
    /* swallow */
  }
  return next;
};

export const acceptAll = () => setConsent({ analytics: true, marketing: true });
export const rejectNonEssential = () => setConsent({ analytics: false, marketing: false });

export const openCookiePreferences = () => {
  try {
    window.dispatchEvent(new Event(OPEN_EVENT));
  } catch {
    /* swallow */
  }
};

export const onConsentChanged = (cb: (s: ConsentState) => void): (() => void) => {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail ?? getConsent());
  window.addEventListener(EVENT, handler as EventListener);
  return () => window.removeEventListener(EVENT, handler as EventListener);
};

export const onOpenPreferences = (cb: () => void): (() => void) => {
  const handler = () => cb();
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
};

export const CONSENT_EVENT = EVENT;
export const OPEN_PREFERENCES_EVENT = OPEN_EVENT;
