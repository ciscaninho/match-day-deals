import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Calendar, MapPin } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { useLanguage } from "@/i18n/LanguageContext";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const fmt = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

export const ClubUpcomingMatches = ({ clubName }: { clubName: string }) => {
  const { data: matches, isLoading } = useMatches();
  const { t } = useLanguage();

  const filtered = useMemo(() => {
    if (!matches) return [];
    const target = norm(clubName);
    return matches
      .filter((m) => {
        if (m.lifecycleStatus !== "upcoming" && m.lifecycleStatus !== "live") return false;
        const inHome = norm(m.homeTeam).includes(target) || target.includes(norm(m.homeTeam));
        const inAway = norm(m.awayTeam).includes(target) || target.includes(norm(m.awayTeam));
        return inHome || inAway;
      })
      .slice(0, 6);
  }, [matches, clubName]);

  if (isLoading) {
    return <div className="text-sm text-[#2C3E50]/50">…</div>;
  }

  if (!filtered.length) {
    return (
      <p className="text-sm text-[#2C3E50]/60">{t("clubs.section.upcoming.empty")}</p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {filtered.map((m) => {
        const f = fmt(m.date);
        return (
          <li key={m.id}>
            <Link
              to={`/matches/${m.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[#2ECC71]/40 hover:shadow-sm transition-all"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#2ECC71] mb-1.5">
                {m.competition}
              </div>
              <div className="font-semibold text-[#2C3E50] text-sm leading-snug">
                {m.homeTeam} <span className="text-[#2C3E50]/40">vs</span> {m.awayTeam}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#2C3E50]/60">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {f.date} · {f.time}
                </span>
                {m.stadium && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{m.stadium}</span>
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
