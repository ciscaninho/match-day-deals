import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { MapPin, Building2, Users, ChevronRight, Search, Trophy, Flame } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useStadiums } from "@/hooks/useStadium";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";

const StadiumsPage = () => {
  const { t } = useLanguage();
  const { data: stadiums = [], isLoading } = useStadiums();
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState<string>("all");

  useSEO({
    title: "Stadium Intelligence — Football Stadiums | Foot Ticket Finder",
    description: "Explore football stadium guides: capacity, atmosphere, accessibility, best sections and ticket intelligence.",
  });

  const leagues = useMemo(() => Array.from(new Set(stadiums.map((s) => s.league))), [stadiums]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stadiums.filter((s) => {
      if (league !== "all" && s.league !== league) return false;
      if (!q) return true;
      return [s.stadium_name, s.city, s.club_name ?? "", ...s.clubs].some((v) => v?.toLowerCase().includes(q));
    });
  }, [stadiums, query, league]);

  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-br from-[#0b1220] via-[#111a2c] to-[#0b1220] text-white">
        <div className="max-w-6xl mx-auto px-5 pt-8 pb-6">
          <div className="text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> {t("stadium.directory_title")}
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-black">{t("stadium.directory_title")}</h1>
          <p className="mt-2 text-white/70 text-sm md:text-base max-w-2xl">{t("stadium.directory_subtitle")}</p>

          <div className="mt-5 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stadium, city, club…"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-white/40 focus:outline-none focus:border-[#2ECC71]/60"
              />
            </div>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="all">{t("stadium.all_leagues")}</option>
              {leagues.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="bg-[#0b1220] text-white min-h-[60vh]">
        <section className="max-w-6xl mx-auto px-5 py-8">
          {isLoading ? (
            <div className="text-center text-white/60 text-sm py-20">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/60 text-sm py-20">{t("stadium.no_stadiums")}</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => {
                const bg = s.background_image_url || s.image_url;
                return (
                  <Link
                    key={s.id}
                    to={`/stadiums/${s.slug}`}
                    className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-[#2ECC71]/40 transition"
                  >
                    <div
                      className="h-32 bg-cover bg-center"
                      style={bg
                        ? { backgroundImage: `url(${bg})` }
                        : { background: "linear-gradient(135deg, rgba(46,204,113,0.25), rgba(99,102,241,0.25))" }}
                    />
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <Flame className="w-3 h-3 text-red-300" />
                      {s.atmosphere_score != null ? s.atmosphere_score.toFixed(1) : "—"}
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] uppercase tracking-wider text-[#2ECC71] font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />{s.league}
                      </div>
                      <div className="mt-1 text-base font-extrabold leading-tight">{s.stadium_name}</div>
                      <div className="mt-1 text-xs text-white/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{s.city}
                        {s.club_name && <><span className="mx-1">·</span><Users className="w-3 h-3" />{s.club_name}</>}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-white/55">{s.capacity ? `${s.capacity.toLocaleString()} ${t("stadium.capacity").toLowerCase()}` : ""}</span>
                        <span className="inline-flex items-center gap-1 text-[#2ECC71] font-bold">
                          {t("stadium.view_guide")} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </WebsiteLayout>
  );
};

export default StadiumsPage;
