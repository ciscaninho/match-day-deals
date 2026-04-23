import { useLanguage } from "@/i18n/LanguageContext";
import { Locale } from "@/i18n/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

const languages: Record<Locale, { label: string; short: string; flag: string }> = {
  en: { label: "English", short: "EN", flag: "🇬🇧" },
  fr: { label: "Français", short: "FR", flag: "🇫🇷" },
  nl: { label: "Nederlands", short: "NL", flag: "🇳🇱" },
};

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();
  const current = languages[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#2ECC71] bg-white text-[#2C3E50] text-xs font-bold px-3 py-1.5 hover:bg-[#2ECC71]/10 transition-colors shadow-sm"
          aria-label="Change language"
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span>{current.short}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white min-w-[160px]">
        {(Object.keys(languages) as Locale[]).map((l) => {
          const isActive = locale === l;
          return (
            <DropdownMenuItem
              key={l}
              className={`flex items-center gap-2 cursor-pointer text-[#2C3E50] ${
                isActive ? "bg-[#2ECC71]/10 font-bold" : ""
              }`}
              onClick={() => setLocale(l)}
            >
              <span className="text-lg leading-none">{languages[l].flag}</span>
              <span className="text-xs flex-1">{languages[l].label}</span>
              {isActive && <Check className="w-3.5 h-3.5 text-[#2ECC71]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
