import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, Calendar, ArrowRight, Filter } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useMatches } from "@/hooks/useMatches";
import { useSEO } from "@/lib/seo";

const WebsiteMatchesPage = () => {
  const { data: matches = [], isLoading } = useMatches();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialLeague = params.get("league") ?? "";
  const [q, setQ] = useState(initialQ);
  const [league, setLeague] = useState(initialLeague);

  useSEO({
    title: "Browse all football matches & ticket prices | Foot Ticket Finder",
    description:
      "Browse upcoming football matches and compare ticket prices across official providers. Filter by league, team or city.",
    canonical: "https://footticketfinder.com/matches",
  });

  const leagues = useMemo(() => {
    const s = new Set<string>();
    matches.forEach((m) => s.add(m.competition));
    return Array.from(s).sort();
  }, [matches]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return matches
      .filter((m) => new Date(m.date).getTime() >= Date.now() - 24 * 3600 * 1000)
      .filter((m) => !league || m.competition === league)
      .filter((m) => {
        if (!term) return true;
        return [m.homeTeam, m.awayTeam, m.competition, m.city, m.stadium]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(term));
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, q, league]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (league) next.set("league", league);
    setParams(next);
  };

  return (
    <WebsiteLayout>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50]">Browse football matches</h1>
          <p className="mt-2 text-[#2C3E50]/65 max-w-2xl">
            Compare ticket prices for upcoming matches across official providers.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid sm:grid-cols-[1fr_auto_auto] gap-2 bg-white rounded-2xl p-2 shadow-md border border-slate-200">
            <div className="flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-[#2C3E50]/40" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Team, city, stadium…"
                className="flex-1 py-3 outline-none text-sm"
                aria-label="Search matches"
              />
            </div>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="px-3 py-3 text-sm border-l border-slate-100 outline-none bg-white"
              aria-label="Filter by league"
            >
              <option value="">All leagues</option>
              {leagues.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-3 font-bold text-sm transition inline-flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-10">
        {isLoading ? (
          <p className="text-center text-sm text-[#2C3E50]/60">Loading matches…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-[#2C3E50]/60">No matches found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((m) => (
              <Link
                key={m.id}
                to={`/matches/${m.id}`}
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#2ECC71]/40 hover:shadow-xl transition group"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C3E50]/50">{m.competition}</span>
                <p className="mt-2 font-extrabold text-[#2C3E50]">{m.homeTeam} <span className="text-[#2C3E50]/40">vs</span> {m.awayTeam}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-[#2C3E50]/60 flex-wrap">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
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

export default WebsiteMatchesPage;
