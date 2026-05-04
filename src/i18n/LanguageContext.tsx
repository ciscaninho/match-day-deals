import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, type Locale } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const RTL_LOCALES: Locale[] = ["ar"];
const STORAGE_KEY = "ftf_locale";
const SUPPORTED: Locale[] = ["en", "fr", "ar", "ru", "nl", "es", "de", "it", "pt"];

const detectInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // ignore
  }
  const browser = (navigator.language || "en").slice(0, 2).toLowerCase() as Locale;
  return SUPPORTED.includes(browser) ? browser : "en";
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    console.log("[i18n] switching language ->", next);
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  // Apply <html lang> and dir for RTL languages, instantly on change.
  useEffect(() => {
    const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    console.log("[i18n] applied", { locale, dir });
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[locale] || translations.en;
      let text = dict[key] || translations.en[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [locale]
  );

  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
