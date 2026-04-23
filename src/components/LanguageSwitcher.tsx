import { useLanguage } from "@/i18n/LanguageContext";
import { Locale } from "@/i18n/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

const languages: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  fr: { label: "Français", flag: "🇫🇷" },
  nl: { label: "Nederlands", flag: "🇳🇱" },
};

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
          <Languages className="h-[1.1rem] w-[1.1rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        {(Object.keys(languages) as Locale[]).map((l) => (
          <DropdownMenuItem
            key={l}
            className={`flex items-center gap-2 cursor-pointer ${locale === l ? "bg-slate-50 font-bold" : ""}`}
            onClick={() => setLocale(l)}
          >
            <span className="text-base">{languages[l].flag}</span>
            <span className="text-xs">{languages[l].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
