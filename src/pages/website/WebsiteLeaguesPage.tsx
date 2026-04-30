import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy, ArrowRight, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useMatches } from "@/hooks/useMatches";
import { useSEO, slugify } from "@/lib/seo";

const WebsiteLeaguesPage = () => {
  const { data: matches = [] } = useMatches();
  useSEO({
    title: "Football leagues — Compare ticket prices | Foot Ticket Finder",
    description: "Browse upcoming football matches by league. Compare ticket prices across the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League and more.",
    canonical: "https://footticketfinder.com/leagues",
  });

  const leagues = useMemo(() => {
    const map = new Map<string, number>();
    matches.forEach((m) => {
      if (new Date(m.date).getTime() >= Date.now() - 24 * 3600 * 1000) {
        map.set(m.competition, (map.get(m.competition) ?? 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [matches]);

  return (
    <WebsiteLayout>
      <section className="max-w-6xl mx-auto px-5 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50]">Browse by league</h1>
        <p className="mt-2 text-[#2C3E50]/65 max-w-2xl">Compare ticket prices for matches in your favorite competitions.</p>
        {leagues.length === 0 ? (
          <p className="mt-10 text-sm text-[#2C3E50]/60">No leagues available yet.</p>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {leagues.map(([name, count]) => (
              <Link
                key={name}
                to={`/leagues/${slugify(name)}`}
                className="rounded-2xl border border-slate-200 p-6 bg-white hover:border-[#2ECC71]/40 hover:shadow-lg transition group"
              >
                <Trophy className="w-6 h-6 text-[#2ECC71]" />
                <p className="mt-3 font-extrabold text-[#2C3E50]">{name}</p>
                <p className="text-xs text-[#2C3E50]/55 mt-1">{count} upcoming match{count > 1 ? "es" : ""}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#2ECC71] group-hover:gap-2 transition-all">
                  View matches <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </WebsiteLayout>
  );
};

export const WebsiteLeaguePage = () => {
  const { slug } = useParams();
  const { data: matches = [] } = useMatches();

  const leagueName = useMemo(() => {
    return matches.find((m) => slugify(m.competition) === slug)?.competition ?? slug?.replace(/-/g, " ") ?? "League";
  }, [matches, slug]);

  const list = useMemo(
    () =>
      matches
        .filter((m) => slugify(m.competition) === slug)
        .filter((m) => new Date(m.date).getTime() >= Date.now() - 24 * 3600 * 1000)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [matches, slug],
  );

  useSEO({
    title: `${leagueName} tickets — Compare prices | Foot Ticket Finder`,
    description: `Compare ticket prices for upcoming ${leagueName} matches across official providers.`,
    canonical: `https://footticketfinder.com/leagues/${slug}`,
  });

  return (
    <WebsiteLayout>
      <section className="max-w-6xl mx-auto px-5 py-10">
        <Link to="/leagues" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C3E50]/60 hover:text-[#2ECC71]">
          <ArrowLeft className="w-3.5 h-3.5" /> All leagues
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#2C3E50] capitalize">{leagueName} tickets</h1>
        <p className="mt-2 text-[#2C3E50]/65">Upcoming matches and ticket prices.</p>

        {list.length === 0 ? (
          <p className="mt-10 text-sm text-[#2C3E50]/60">No upcoming matches in this league.</p>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((m) => (
              <Link
                key={m.id}
                to={`/matches/${m.id}`}
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#2ECC71]/40 hover:shadow-xl transition group"
              >
                <p className="font-extrabold text-[#2C3E50]">{m.homeTeam} <span className="text-[#2C3E50]/40">vs</span> {m.awayTeam}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-[#2C3E50]/60 flex-wrap">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  {m.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{m.city}</span>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {m.startingPrice != null ? (
                    <span className="text-sm font-extrabold text-[#27ae60]">From €{m.startingPrice}</span>
                  ) : (
                    <span className="text-xs text-[#2C3E50]/50">Coming soon</span>
                  )}
                  <span className="text-xs font-bold text-[#2ECC71] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    View tickets <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </WebsiteLayout>
  );
};

export default WebsiteLeaguesPage;
