import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Calendar, ChevronRight, Ticket } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { useLanguage } from "@/i18n/LanguageContext";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export const StadiumUpcomingMatches = ({ stadiumName }: { stadiumName: string }) => {
  const { data: matches = [] } = useMatches();
  const { t, locale } = useLanguage();

  const list = useMemo(() => {
    const target = norm(stadiumName);
    const now = Date.now();
    return matches
      .filter((m) => m.stadium && norm(m.stadium).includes(target))
      .filter((m) => new Date(m.date).getTime() > now)
      .slice(0, 6);
  }, [matches, stadiumName]);

  if (!list.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-5 py-6">
      <div className="text-xs uppercase tracking-wider text-white/55 font-bold mb-3 flex items-center gap-1.5">
        <Ticket className="w-3.5 h-3.5" /> {t("stadium.upcoming_matches")}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {list.map((m) => (
          <Link
            key={m.id}
            to={`/matches/${m.id}`}
            className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-[#2ECC71]/40 transition flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold truncate">
                {m.competition}
              </div>
              <div className="font-extrabold text-sm text-white truncate">
                {m.homeTeam} <span className="text-white/40">vs</span> {m.awayTeam}
              </div>
              <div className="text-[11px] text-white/55 mt-0.5 inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(m.date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};
