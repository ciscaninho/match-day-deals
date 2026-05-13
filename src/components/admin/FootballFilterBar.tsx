import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, X, RotateCcw, Globe2, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

// ------- Continent map (kept in sync with AdminLeaguesPage hierarchy) -------
export const CONTINENT_BY_COUNTRY: Record<string, string> = {
  England: "Europe", Scotland: "Europe", Wales: "Europe", "Northern Ireland": "Europe",
  Spain: "Europe", Italy: "Europe", Germany: "Europe", France: "Europe", Portugal: "Europe",
  Netherlands: "Europe", Belgium: "Europe", Turkey: "Europe", Greece: "Europe", Russia: "Europe",
  Ukraine: "Europe", Poland: "Europe", Austria: "Europe", Switzerland: "Europe", Denmark: "Europe",
  Sweden: "Europe", Norway: "Europe", Finland: "Europe", Croatia: "Europe", Serbia: "Europe",
  Romania: "Europe", "Czech Republic": "Europe", Czechia: "Europe", Hungary: "Europe",
  Ireland: "Europe", Bulgaria: "Europe", Slovakia: "Europe", Slovenia: "Europe",
  Brazil: "South America", Argentina: "South America", Uruguay: "South America",
  Chile: "South America", Colombia: "South America", Peru: "South America", Ecuador: "South America",
  Paraguay: "South America", Venezuela: "South America", Bolivia: "South America",
  "United States": "North America", USA: "North America", Mexico: "North America",
  Canada: "North America", "Costa Rica": "North America",
  Japan: "Asia", "South Korea": "Asia", China: "Asia", "Saudi Arabia": "Asia", UAE: "Asia",
  Qatar: "Asia", Iran: "Asia", Iraq: "Asia", India: "Asia", Thailand: "Asia", Vietnam: "Asia",
  Indonesia: "Asia", Malaysia: "Asia", Singapore: "Asia", Israel: "Asia",
  Morocco: "Africa", Egypt: "Africa", Algeria: "Africa", Tunisia: "Africa", Nigeria: "Africa",
  "South Africa": "Africa", Senegal: "Africa", Ghana: "Africa", Cameroon: "Africa", "Ivory Coast": "Africa",
  Australia: "Oceania", "New Zealand": "Oceania",
};
export const continentOf = (country: string | null | undefined) =>
  CONTINENT_BY_COUNTRY[country ?? ""] || "Other";

export type FootballRow = { country?: string | null; league?: string | null };

export type FootballFilterState = {
  continent: string;
  country: string;
  league: string;
  flags: string[];
};

export type FootballFlag = { key: string; labelKey: string; fallback: string };

export const useFootballFilters = (defaults?: Partial<FootballFilterState>) => {
  const [params, setParams] = useSearchParams();

  const state: FootballFilterState = {
    continent: params.get("continent") || defaults?.continent || "all",
    country: params.get("country") || defaults?.country || "all",
    league: params.get("league") || defaults?.league || "all",
    flags: (params.get("flags") || defaults?.flags?.join(",") || "")
      .split(",")
      .filter(Boolean),
  };

  const update = (patch: Partial<FootballFilterState>) => {
    const next = new URLSearchParams(params);
    const merged = { ...state, ...patch };
    // Cascade reset
    if (patch.continent !== undefined && patch.continent !== state.continent) {
      merged.country = "all";
      merged.league = "all";
    }
    if (patch.country !== undefined && patch.country !== state.country) {
      merged.league = "all";
    }
    const apply = (key: keyof FootballFilterState, val: string | string[]) => {
      if (Array.isArray(val)) {
        if (val.length === 0) next.delete(key);
        else next.set(key, val.join(","));
      } else if (!val || val === "all") next.delete(key);
      else next.set(key, val);
    };
    apply("continent", merged.continent);
    apply("country", merged.country);
    apply("league", merged.league);
    apply("flags", merged.flags);
    setParams(next, { replace: true });
  };

  const reset = () => {
    const next = new URLSearchParams(params);
    ["continent", "country", "league", "flags"].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };

  const toggleFlag = (key: string) => {
    const has = state.flags.includes(key);
    update({ flags: has ? state.flags.filter((f) => f !== key) : [...state.flags, key] });
  };

  const apply = <T extends FootballRow>(rows: T[]) =>
    rows.filter((r) => {
      if (state.continent !== "all" && continentOf(r.country) !== state.continent) return false;
      if (state.country !== "all" && (r.country || "").toLowerCase() !== state.country.toLowerCase()) return false;
      if (state.league !== "all" && (r.league || "").toLowerCase() !== state.league.toLowerCase()) return false;
      return true;
    });

  const isActive =
    state.continent !== "all" || state.country !== "all" || state.league !== "all" || state.flags.length > 0;

  return { state, update, reset, toggleFlag, apply, isActive };
};

// ---------- UI ----------
type Props = {
  rows: FootballRow[];
  state: FootballFilterState;
  onChange: (patch: Partial<FootballFilterState>) => void;
  onReset: () => void;
  onToggleFlag: (key: string) => void;
  flags?: FootballFlag[];
  flagCounts?: Record<string, number>;
};

export const FootballFilterBar = ({
  rows, state, onChange, onReset, onToggleFlag, flags = [], flagCounts = {},
}: Props) => {
  const { t } = useLanguage();

  const continents = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(continentOf(r.country)));
    return [...set].sort();
  }, [rows]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (!r.country) return;
      if (state.continent !== "all" && continentOf(r.country) !== state.continent) return;
      set.add(r.country);
    });
    return [...set].sort();
  }, [rows, state.continent]);

  const leagues = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (!r.league) return;
      if (state.continent !== "all" && continentOf(r.country) !== state.continent) return;
      if (state.country !== "all" && (r.country || "").toLowerCase() !== state.country.toLowerCase()) return;
      set.add(r.league);
    });
    return [...set].sort();
  }, [rows, state.continent, state.country]);

  const isActive =
    state.continent !== "all" || state.country !== "all" || state.league !== "all" || state.flags.length > 0;

  // Auto-correct stale selections if list shrinks
  useEffect(() => {
    if (state.country !== "all" && !countries.includes(state.country)) onChange({ country: "all" });
  }, [countries, state.country]); // eslint-disable-line
  useEffect(() => {
    if (state.league !== "all" && !leagues.includes(state.league)) onChange({ league: "all" });
  }, [leagues, state.league]); // eslint-disable-line

  const Select = ({
    icon: Icon, value, onChange: setVal, options, placeholder,
  }: {
    icon: any; value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
  }) => (
    <div className="relative">
      <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => setVal(e.target.value)}
        className="h-9 pl-8 pr-7 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#2C3E50] hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition appearance-none cursor-pointer"
      >
        <option value="all">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-slate-200/70">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
          <Filter className="w-3.5 h-3.5" /> {t("admin.filter.label") || "Filter"}
        </div>

        <Select icon={Globe2} value={state.continent}
          onChange={(v) => onChange({ continent: v })}
          options={continents}
          placeholder={t("admin.filter.continent") || "All continents"} />

        <Select icon={MapPin} value={state.country}
          onChange={(v) => onChange({ country: v })}
          options={countries}
          placeholder={t("admin.filter.country") || "All countries"} />

        <Select icon={Trophy} value={state.league}
          onChange={(v) => onChange({ league: v })}
          options={leagues}
          placeholder={t("admin.filter.league") || "All leagues"} />

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {flags.map((f) => {
          const active = state.flags.includes(f.key);
          const count = flagCounts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => onToggleFlag(f.key)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition ${
                active
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-[#2C3E50] border-slate-200 hover:border-amber-400"
              }`}
            >
              {t(f.labelKey) || f.fallback}
              {typeof count === "number" && <span className="opacity-70 ml-1">· {count}</span>}
            </button>
          );
        })}

        {isActive && (
          <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto h-8 gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> {t("admin.filter.reset") || "Reset"}
          </Button>
        )}
      </div>

      {isActive && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {state.continent !== "all" && (
            <Chip label={state.continent} onRemove={() => onChange({ continent: "all" })} />
          )}
          {state.country !== "all" && (
            <Chip label={state.country} onRemove={() => onChange({ country: "all" })} />
          )}
          {state.league !== "all" && (
            <Chip label={state.league} onRemove={() => onChange({ league: "all" })} />
          )}
          {state.flags.map((fk) => {
            const f = flags.find((x) => x.key === fk);
            return (
              <Chip key={fk} label={(f && (t(f.labelKey) || f.fallback)) || fk} onRemove={() => onToggleFlag(fk)} />
            );
          })}
        </div>
      )}
    </div>
  );
};

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
    {label}
    <button onClick={onRemove} className="rounded-full hover:bg-emerald-100 p-0.5" aria-label="Remove filter">
      <X className="w-3 h-3" />
    </button>
  </span>
);
