/**
 * Marketing analytics — Phase 2.
 *
 * Fire-and-forget event tracking into public.analytics_events.
 * - Visitor id persisted in localStorage (1 year).
 * - Session id persisted in sessionStorage (per tab).
 * - First-touch UTM persisted in localStorage for 30 days, also re-captured
 *   on every landing that has UTM params (last-touch updates).
 *
 * Never throws. Never blocks navigation.
 */
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEventType =
  | "page_view"
  | "scroll_25"
  | "scroll_50"
  | "scroll_75"
  | "scroll_100"
  | "search_used"
  | "filter_used"
  | "match_card_click"
  | "ticket_button_click"
  | "affiliate_redirect"
  | "chatbot_open"
  | "chatbot_message"
  | "chatbot_match_search"
  | "chatbot_match_result_click"
  | "chatbot_no_result"
  | "newsletter_signup";

export interface AnalyticsEventProps {
  competition?: string | null;
  match_id?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  stadium?: string | null;
  host_city?: string | null;
  host_country?: string | null;
  campaign_id?: string | null;
  // Free-form extras
  [key: string]: unknown;
}

const VISITOR_KEY = "ftf_visitor_id";
const SESSION_KEY = "ftf_session_id";
const UTM_KEY = "ftf_utm";
const UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredUtm {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ts: number;
}

const safeUuid = (): string => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const getVisitorId = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = safeUuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
};

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = safeUuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
};

const captureUtmFromUrl = (): StoredUtm | null => {
  if (typeof window === "undefined") return null;
  try {
    const sp = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
    const found: Partial<StoredUtm> = {};
    let any = false;
    keys.forEach((k) => {
      const v = sp.get(k);
      if (v) {
        (found as Record<string, string>)[k] = v;
        any = true;
      }
    });
    if (!any) return null;
    const stored: StoredUtm = { ...found, ts: Date.now() };
    localStorage.setItem(UTM_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    return null;
  }
};

const getStoredUtm = (): StoredUtm | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUtm;
    if (Date.now() - parsed.ts > UTM_TTL_MS) {
      localStorage.removeItem(UTM_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const detectDevice = (): { browser: string; device: string; os: string } => {
  if (typeof navigator === "undefined") return { browser: "unknown", device: "unknown", os: "unknown" };
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "other";
  if (/Edg\//i.test(ua)) browser = "edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "safari";
  else if (/Firefox\//i.test(ua)) browser = "firefox";

  let os = "other";
  if (/Windows/i.test(ua)) os = "windows";
  else if (/Mac OS X/i.test(ua)) os = "macos";
  else if (/Android/i.test(ua)) os = "android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "ios";
  else if (/Linux/i.test(ua)) os = "linux";

  return { browser, device, os };
};

const getLanguage = (): string => {
  if (typeof navigator === "undefined") return "en";
  return (navigator.language || "en").slice(0, 5);
};

let initialized = false;
export const initAnalytics = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  // Capture fresh UTM on landing.
  captureUtmFromUrl();
  // Warm visitor/session.
  getVisitorId();
  getSessionId();
};

/**
 * Fire an analytics event. Never awaits, never throws.
 */
export const trackEvent = (event: AnalyticsEventType, props: AnalyticsEventProps = {}): void => {
  try {
    if (typeof window === "undefined") return;
    initAnalytics();

    const utm = getStoredUtm();
    const { browser, device, os } = detectDevice();
    const page_url = window.location.href;
    const page_path = window.location.pathname + window.location.search;

    const {
      competition = null,
      match_id = null,
      home_team = null,
      away_team = null,
      stadium = null,
      host_city = null,
      host_country = null,
      campaign_id = null,
      ...extras
    } = props;

    const row = {
      event_type: event,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      page_url,
      page_path,
      referrer: document.referrer || null,
      utm_source: utm?.utm_source ?? null,
      utm_medium: utm?.utm_medium ?? null,
      utm_campaign: utm?.utm_campaign ?? null,
      utm_content: utm?.utm_content ?? null,
      utm_term: utm?.utm_term ?? null,
      campaign_id,
      competition,
      match_id,
      home_team,
      away_team,
      stadium,
      host_city,
      host_country,
      browser,
      device,
      os,
      language: getLanguage(),
      props: extras as Record<string, unknown>,
    };

    void supabase.from("analytics_events" as never).insert(row as never).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    /* swallow */
  }
};
