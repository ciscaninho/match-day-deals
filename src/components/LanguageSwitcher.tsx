import { useLanguage } from "@/i18n/LanguageContext";
import { Locale } from "@/i18n/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

// SVG flag components — emoji flags do not render on Windows.
const FlagFR = () => (
  <svg viewBox="0 0 3 2" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <rect width="1" height="2" x="0" fill="#0055A4" />
    <rect width="1" height="2" x="1" fill="#FFFFFF" />
    <rect width="1" height="2" x="2" fill="#EF4135" />
  </svg>
);
const FlagGB = () => (
  <svg viewBox="0 0 60 30" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <clipPath id="t"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);
const FlagNL = () => (
  <svg viewBox="0 0 9 6" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <rect width="9" height="2" y="0" fill="#AE1C28" />
    <rect width="9" height="2" y="2" fill="#FFFFFF" />
    <rect width="9" height="2" y="4" fill="#21468B" />
  </svg>
);
const FlagES = () => (
  <svg viewBox="0 0 3 2" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <rect width="3" height="2" fill="#AA151B" />
    <rect width="3" height="1" y="0.5" fill="#F1BF00" />
  </svg>
);
const FlagDE = () => (
  <svg viewBox="0 0 5 3" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <rect width="5" height="1" y="0" fill="#000" />
    <rect width="5" height="1" y="1" fill="#DD0000" />
    <rect width="5" height="1" y="2" fill="#FFCE00" />
  </svg>
);
const FlagIT = () => (
  <svg viewBox="0 0 3 2" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <rect width="1" x="0" height="2" fill="#009246" />
    <rect width="1" x="1" height="2" fill="#FFFFFF" />
    <rect width="1" x="2" height="2" fill="#CE2B37" />
  </svg>
);
const FlagPT = () => (
  <svg viewBox="0 0 5 3" className="w-5 h-3.5 rounded-sm shadow-sm shrink-0">
    <rect width="2" height="3" fill="#006600" />
    <rect width="3" x="2" height="3" fill="#FF0000" />
  </svg>
);

const languages: Record<Locale, { label: string; short: string; Flag: () => JSX.Element }> = {
  fr: { label: "Français", short: "FR", Flag: FlagFR },
  en: { label: "English", short: "EN", Flag: FlagGB },
  nl: { label: "Nederlands", short: "NL", Flag: FlagNL },
  es: { label: "Español", short: "ES", Flag: FlagES },
  de: { label: "Deutsch", short: "DE", Flag: FlagDE },
  it: { label: "Italiano", short: "IT", Flag: FlagIT },
  pt: { label: "Português", short: "PT", Flag: FlagPT },
};

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();
  const current = languages[locale];
  const CurrentFlag = current.Flag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#2ECC71] bg-white text-[#2C3E50] text-xs font-bold px-3 py-1.5 hover:bg-[#2ECC71]/10 transition-colors shadow-sm"
          aria-label="Change language"
        >
          <CurrentFlag />
          <span>{current.short}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white min-w-[180px] z-50">
        {(Object.keys(languages) as Locale[]).map((l) => {
          const isActive = locale === l;
          const Flag = languages[l].Flag;
          return (
            <DropdownMenuItem
              key={l}
              className={`flex items-center gap-2.5 cursor-pointer text-[#2C3E50] py-2 ${
                isActive ? "bg-[#2ECC71]/10 font-bold" : ""
              }`}
              onClick={() => setLocale(l)}
            >
              <Flag />
              <span className="text-sm flex-1">{languages[l].label}</span>
              {isActive && <Check className="w-4 h-4 text-[#2ECC71]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
