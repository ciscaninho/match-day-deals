import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Trophy, Users, Building2, X, Loader2 } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { buildSuggestions, type Suggestion } from "@/lib/smartSearch";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  placeholder?: string;
  variant?: "hero" | "inline";
  autoFocus?: boolean;
  onSubmit?: (q: string) => void;
}

const KIND_ICON: Record<Suggestion["kind"], typeof Search> = {
  match: Calendar,
  team: Users,
  city: MapPin,
  competition: Trophy,
  stadium: Building2,
};

export const SmartSearch = ({ placeholder, variant = "inline", autoFocus, onSubmit }: Props) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const ph = placeholder ?? t("smart_search.placeholder");
  const { data: matches = [], isLoading } = useMatches();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 120);
    return () => clearTimeout(t);
  }, [q]);

  // Click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(
    () => (debounced.trim().length >= 1 ? buildSuggestions(matches, debounced, 10) : []),
    [matches, debounced],
  );

  useEffect(() => {
    setActive(0);
  }, [suggestions]);

  const submit = (raw?: string) => {
    const text = (raw ?? q).trim();
    setOpen(false);
    if (onSubmit) return onSubmit(text);
    navigate(text ? `/matches?q=${encodeURIComponent(text)}` : "/matches");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") submit();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = suggestions[active];
      if (s) {
        setOpen(false);
        navigate(s.href);
      } else submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isHero = variant === "hero";

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 bg-white rounded-2xl px-3 ${isHero ? "shadow-2xl shadow-black/30 p-2" : "border border-slate-200 shadow-sm"}`}
      >
        <Search className="w-5 h-5 text-[#2C3E50]/40 ms-2" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={ph}
          aria-label={t("smart_search.placeholder")}
          aria-autocomplete="list"
          aria-expanded={open}
          className="flex-1 py-3 text-[#2C3E50] placeholder:text-[#2C3E50]/40 outline-none text-sm bg-transparent"
        />
        {q && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label={t("smart_search.clear")}
            className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#2C3E50]/50"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => submit()}
          aria-label={t("smart_search.button")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-3 sm:px-4 py-2.5 font-bold text-sm transition-colors shrink-0"
        >
          <Search className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">{t("smart_search.button")}</span>
        </button>
      </div>

      {open && (suggestions.length > 0 || isLoading) && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {isLoading && suggestions.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-[#2C3E50]/60">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("smart_search.searching")}
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {suggestions.map((s, i) => {
                const Icon = KIND_ICON[s.kind];
                const isActive = i === active;
                return (
                  <li key={`${s.kind}-${s.label}-${i}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        navigate(s.href);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isActive ? "bg-[#2ECC71]/10" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                          s.kind === "match" ? "bg-[#2ECC71]/15 text-[#27ae60]" : "bg-slate-100 text-[#2C3E50]/70"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-sm text-[#2C3E50] truncate">{s.label}</span>
                        {s.sublabel && (
                          <span className="block text-xs text-[#2C3E50]/55 truncate">{s.sublabel}</span>
                        )}
                      </span>
                      {s.match?.startingPrice != null && (
                        <span className="text-xs font-extrabold text-[#27ae60] whitespace-nowrap">
                          from €{s.match.startingPrice}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-[#2C3E50]/50 flex items-center justify-between">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">↑↓</kbd> {t("smart_search.navigate")} ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">↵</kbd> {t("smart_search.open")}
            </span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                submit();
              }}
              className="font-bold text-[#2ECC71] hover:underline"
            >
              {t("smart_search.see_all")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
