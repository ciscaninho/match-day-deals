import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, ShieldCheck, Zap, BellRing, Trophy, MapPin, Calendar } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useMatches } from "@/hooks/useMatches";
import { useSEO, slugify } from "@/lib/seo";

const WebsiteHomePage = () => {
  const { data: matches = [] } = useMatches();
  const [q, setQ] = useState("");

  useSEO({
    title: "Compare football ticket prices instantly | Foot Ticket Finder",
    description:
      "Compare football ticket prices across official providers. Find the best deals for Premier League, La Liga, Champions League and more.",
    canonical: "https://footticketfinder.com/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Foot Ticket Finder",
      url: "https://footticketfinder.com/",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://footticketfinder.com/matches?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  });

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      matches
        .filter((m) => new Date(m.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6),
    [matches, now],
  );

  const leagues = useMemo(() => {
    const set = new Map<string, number>();
    matches.forEach((m) => set.set(m.competition, (set.get(m.competition) ?? 0) + 1));
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [matches]);

  return (
    <WebsiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #2ECC71 1px, transparent 1px), linear-gradient(#2ECC71 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#2ECC71]/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            Trusted comparison · Official providers only
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Compare football ticket prices <span className="text-[#2ECC71]">instantly</span>.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-white/70">
            One search, every official provider. Find the best deal for the next match — no signup required.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const url = q.trim() ? `/matches?q=${encodeURIComponent(q.trim())}` : "/matches";
              window.location.href = url;
            }}
            className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-xl shadow-black/20"
          >
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-[#2C3E50]/40" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search teams, leagues, cities…"
                className="flex-1 py-3 text-[#2C3E50] placeholder:text-[#2C3E50]/40 outline-none text-sm"
                aria-label="Search matches"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3 font-bold text-sm transition-colors"
            >
              Find tickets <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ECC71]" /> Official sources</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#2ECC71]" /> Real-time prices</span>
            <span className="flex items-center gap-1.5"><BellRing className="w-4 h-4 text-[#2ECC71]" /> Free to use</span>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-3 gap-5">
          {[
            { icon: Search, title: "Find any match", desc: "Search by team, league, city or date. We cover the biggest European competitions." },
            { icon: Trophy, title: "Compare every provider", desc: "See prices from official platforms side by side. No hidden fees, no resale traps." },
            { icon: ShieldCheck, title: "Buy with confidence", desc: "Direct links to verified ticket platforms. We never charge a markup — buy at source." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 p-7 hover:border-[#2ECC71]/40 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="font-extrabold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-[#2C3E50]/65 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UPCOMING MATCHES */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Upcoming</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold">Popular matches right now</h2>
            </div>
            <Link to="/matches" className="text-sm font-bold text-[#2C3E50] hover:text-[#2ECC71] inline-flex items-center gap-1.5">
              View all matches <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-[#2C3E50]/60">
              No upcoming matches yet. Check back soon.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map((m) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#2ECC71]/40 hover:shadow-xl transition group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C3E50]/50">{m.competition}</span>
                  <p className="mt-2 font-extrabold text-[#2C3E50]">{m.homeTeam} <span className="text-[#2C3E50]/40">vs</span> {m.awayTeam}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#2C3E50]/60">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    {m.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{m.city}</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {m.startingPrice != null ? (
                      <span className="text-sm font-extrabold text-[#27ae60]">From €{m.startingPrice}</span>
                    ) : (
                      <span className="text-xs text-[#2C3E50]/50">Tickets coming soon</span>
                    )}
                    <span className="text-xs font-bold text-[#2ECC71] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      View tickets <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LEAGUES */}
      {leagues.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Browse</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold">Top leagues</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {leagues.map(([name, count]) => (
                <Link
                  key={name}
                  to={`/leagues/${slugify(name)}`}
                  className="rounded-xl border border-slate-200 p-5 hover:border-[#2ECC71]/40 hover:bg-[#2ECC71]/5 transition"
                >
                  <p className="font-extrabold text-[#2C3E50]">{name}</p>
                  <p className="text-xs text-[#2C3E50]/55 mt-1">{count} match{count > 1 ? "es" : ""}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* APP CTA */}
      <section className="py-16 md:py-20 bg-[#2C3E50] text-white">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Companion app</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold">Never miss a ticket drop.</h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              Save favorite matches, set price alerts, and get notified the moment tickets go on sale. Free to use.
            </p>
            <Link to="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold transition">
              Get the app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
            <ul className="space-y-4 text-sm">
              {["Save your favorite teams and matches", "Get price drop alerts", "Track ticket release dates", "Works on iPhone & Android"].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71]/20 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  </div>
                  <span className="text-white/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default WebsiteHomePage;
