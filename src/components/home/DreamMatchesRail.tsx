import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight, Calendar, Crown, Flame, MapPin, Trophy } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { useLanguage } from "@/i18n/LanguageContext";

const DERBIES: string[][] = [
  ["Real Madrid", "Barcelona"], ["Real Madrid", "Atletico"], ["Real Madrid", "Atlético"],
  ["Inter", "Milan"], ["AC Milan", "Inter"], ["Roma", "Lazio"],
  ["Arsenal", "Tottenham"], ["Liverpool", "Everton"], ["Manchester United", "Manchester City"],
  ["Bayern", "Dortmund"], ["PSG", "Marseille"], ["PSG", "Olympique"],
  ["Boca", "River"], ["Celtic", "Rangers"], ["Galatasaray", "Fenerbahçe"],
  ["Ajax", "Feyenoord"], ["Porto", "Benfica"], ["Sporting", "Benfica"],
];

const isDerby = (h: string, a: string) => {
  const H = h.toLowerCase(), A = a.toLowerCase();
  return DERBIES.some(([x, y]) => {
    const X = x.toLowerCase(), Y = y.toLowerCase();
    return (H.includes(X) && A.includes(Y)) || (H.includes(Y) && A.includes(X));
  });
};

const matchTone = (competition: string, derby: boolean) => {
  if (derby) return { label: "home.dream.derby", icon: Crown, tone: "from-amber-500/30 to-orange-500/20", chip: "bg-amber-500/20 text-amber-200 border-amber-400/40" };
  if (/champions|uefa/i.test(competition)) return { label: "home.dream.european", icon: Trophy, tone: "from-indigo-500/30 to-violet-500/20", chip: "bg-indigo-500/20 text-indigo-200 border-indigo-400/40" };
  if (/final|cup/i.test(competition)) return { label: "home.dream.final", icon: Crown, tone: "from-rose-500/30 to-red-500/20", chip: "bg-rose-500/20 text-rose-200 border-rose-400/40" };
  return { label: "home.dream.bigmatch", icon: Flame, tone: "from-[#2ECC71]/30 to-emerald-500/20", chip: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40" };
};

export const DreamMatchesRail = () => {
  const { t, locale } = useLanguage();
  const { data: matches = [] } = useMatches();

  const list = useMemo(() => {
    const now = Date.now();
    const upcoming = matches.filter((m) => new Date(m.date).getTime() > now);
    const featured = upcoming.filter((m) => m.featured || m.priority);
    const derbies = upcoming.filter((m) => isDerby(m.homeTeam, m.awayTeam));
    const seen = new Set<string>();
    return [...featured, ...derbies, ...upcoming]
      .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
      .slice(0, 6);
  }, [matches]);

  if (!list.length) return null;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#0b1220] via-[#111a2c] to-[#0b1220] text-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">{t("home.dream.eyebrow")}</span>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold">{t("home.dream.title")}</h2>
            <p className="text-sm text-white/65 mt-1 max-w-xl">{t("home.dream.subtitle")}</p>
          </div>
          <Link to="/matches" className="text-sm font-bold text-white/85 hover:text-[#2ECC71] inline-flex items-center gap-1.5">
            {t("home.dream.view_all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((m) => {
            const derby = isDerby(m.homeTeam, m.awayTeam);
            const tone = matchTone(m.competition, derby);
            return (
              <Link
                key={m.id}
                to={`/matches/${m.id}`}
                className={`group relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br ${tone.tone} p-5 hover:-translate-y-0.5 hover:border-[#2ECC71]/40 transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">{m.competition}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tone.chip}`}>
                    <tone.icon className="w-3 h-3" /> {t(tone.label)}
                  </span>
                </div>
                <p className="font-extrabold text-lg leading-tight">
                  {m.homeTeam} <span className="text-white/40 font-bold">vs</span> {m.awayTeam}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(m.date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {m.city && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{m.city}</span>
                    </span>
                  )}
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#2ECC71]">
                  {t("home.dream.cta")} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
