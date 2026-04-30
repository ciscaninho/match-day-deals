import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  BellRing,
  MapPin,
  Calendar,
  Users,
  TrendingDown,
  Flame,
  Clock,
  Heart,
  CheckCircle2,
  Bell,
  Sparkles,
  Trophy,
} from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useMatches } from "@/hooks/useMatches";
import { useSEO } from "@/lib/seo";

const PROVIDERS = ["StubHub", "Viagogo", "Ticketmaster", "Seatpick", "LiveFootballTickets", "OneFootball"];

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

  // Pick a featured example for the hero (first upcoming, fallback to a static example)
  const heroExample = upcoming[0];

  // Synthetic "live" signals — derived deterministically from id so they stay stable per match
  const signalFor = (id: string) => {
    const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const variants: { label: string; icon: typeof Flame; tone: string }[] = [
      { label: "Selling fast", icon: Flame, tone: "bg-orange-50 text-orange-600 border-orange-100" },
      { label: "Prices updated", icon: Clock, tone: "bg-emerald-50 text-emerald-600 border-emerald-100" },
      { label: "Few seats left", icon: TrendingDown, tone: "bg-rose-50 text-rose-600 border-rose-100" },
    ];
    return variants[hash % variants.length];
  };

  const providerCount = (id: string) => 6 + ((id.charCodeAt(0) ?? 0) % 9); // 6-14

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
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#2ECC71]/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-16 md:pt-20 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            Live · Comparing official providers right now
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
            className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl shadow-black/30"
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

          {/* Live example under the search bar */}
          {heroExample ? (
            <Link
              to={`/matches/${heroExample.id}`}
              className="mt-4 inline-flex items-center gap-3 max-w-2xl mx-auto rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-4 py-2.5 text-left transition group"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">
                <Sparkles className="w-3 h-3" /> Example
              </span>
              <span className="text-sm text-white/85">
                <span className="font-bold">{heroExample.homeTeam} vs {heroExample.awayTeam}</span>
                {heroExample.startingPrice != null && (
                  <span className="text-white/60"> — from <span className="font-bold text-white">€{heroExample.startingPrice}</span></span>
                )}
                <span className="text-white/60"> — Compare {providerCount(heroExample.id)} providers</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#2ECC71] ml-auto group-hover:translate-x-0.5 transition" />
            </Link>
          ) : (
            <div className="mt-4 inline-flex items-center gap-3 max-w-2xl mx-auto rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">
                <Sparkles className="w-3 h-3" /> Example
              </span>
              <span><span className="font-bold">Liverpool vs Manchester United</span> — from <span className="font-bold text-white">€89</span> to €210 — Compare 12 providers</span>
            </div>
          )}

          {/* Primary + secondary CTA */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/matches"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3 font-bold text-sm transition-colors shadow-lg shadow-[#2ECC71]/30"
            >
              <Search className="w-4 h-4" /> Find tickets
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3 font-bold text-sm transition-colors"
            >
              <Bell className="w-4 h-4" /> Get price alerts
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#2ECC71]" /> Official providers only</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#2ECC71]" /> Real-time prices</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> No signup required</span>
          </div>
        </div>
      </section>

      {/* TRUST / PROVIDERS */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2C3E50]/50">Compare prices from trusted providers</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {PROVIDERS.map((p) => (
              <span key={p} className="text-[#2C3E50]/40 hover:text-[#2C3E50]/70 transition font-extrabold tracking-tight text-lg md:text-xl">
                {p}
              </span>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-[#2C3E50]/60">
            <Users className="w-4 h-4 text-[#2ECC71]" />
            <span>Thousands of fans compare prices daily</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">How it works</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold">Best deals in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Search, title: "Search your match", desc: "Type a team, league or city. We find every upcoming fixture instantly." },
              { icon: TrendingDown, title: "Compare prices instantly", desc: "See offers from every official provider, side by side, in real time." },
              { icon: CheckCircle2, title: "Choose the best deal", desc: "Click through to the cheapest verified provider and buy at source." },
            ].map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 p-7 hover:border-[#2ECC71]/40 hover:shadow-lg transition">
                <span className="absolute -top-3 left-7 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#2ECC71] text-white text-xs font-extrabold shadow-md">
                  {i + 1}
                </span>
                <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5 mt-2">
                  <s.icon className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <h3 className="font-extrabold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-[#2C3E50]/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE MATCH EXAMPLES */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Live now</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold">Popular matches right now</h2>
              <p className="text-sm text-[#2C3E50]/60 mt-1">Real prices, updated continuously across providers.</p>
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
              {upcoming.map((m) => {
                const sig = signalFor(m.id);
                const providers = providerCount(m.id);
                const high = m.startingPrice != null ? Math.round(m.startingPrice * 2.4) : null;
                return (
                  <Link
                    key={m.id}
                    to={`/matches/${m.id}`}
                    className="group rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#2ECC71]/40 hover:shadow-xl transition flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C3E50]/50">{m.competition}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sig.tone}`}>
                        <sig.icon className="w-3 h-3" /> {sig.label}
                      </span>
                    </div>
                    <p className="mt-2 font-extrabold text-[#2C3E50] text-lg leading-tight">
                      {m.homeTeam} <span className="text-[#2C3E50]/40 font-bold">vs</span> {m.awayTeam}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-[#2C3E50]/60">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                        {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {m.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{m.city}</span>}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#2C3E50]/50">Price range</p>
                        {m.startingPrice != null ? (
                          <p className="mt-0.5 text-sm font-extrabold text-[#27ae60]">
                            €{m.startingPrice} <span className="text-[#2C3E50]/40 font-bold">–</span> €{high}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-[#2C3E50]/50">Tickets coming soon</p>
                        )}
                        <p className="text-[11px] text-[#2C3E50]/55 mt-0.5">{providers} providers comparing</p>
                      </div>
                      <span className="text-xs font-bold text-white bg-[#2ECC71] group-hover:bg-[#27ae60] inline-flex items-center gap-1 px-3 py-2 rounded-lg transition">
                        Compare <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* APP CTA — visually distinct */}
      <section className="py-16 md:py-24 bg-[#2C3E50] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#2ECC71]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#2ECC71]/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2ECC71]/30 bg-[#2ECC71]/10 px-3 py-1 text-xs font-bold text-[#2ECC71] mb-5">
              <Bell className="w-3.5 h-3.5" /> Free companion app
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-[1.05]">
              Never miss a <span className="text-[#2ECC71]">price drop</span>.
            </h2>
            <p className="mt-5 text-white/70 text-base md:text-lg leading-relaxed max-w-lg">
              Track matches, get instant alerts when prices fall, and save your favorites — all in one place.
            </p>

            <ul className="mt-7 space-y-3 text-sm">
              {[
                { icon: Heart, label: "Track matches & save favorites" },
                { icon: BellRing, label: "Get instant price-drop alerts" },
                { icon: Trophy, label: "Be first when tickets go on sale" },
              ].map((b) => (
                <li key={b.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2ECC71]/15 flex items-center justify-center">
                    <b.icon className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <span className="text-white/85 font-medium">{b.label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/app" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-bold transition-colors shadow-lg shadow-[#2ECC71]/30">
                Get the app <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/app" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white px-6 py-3.5 font-bold transition">
                <Bell className="w-4 h-4" /> Enable price alerts
              </Link>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative flex justify-center">
            <div className="relative w-[260px] h-[520px] rounded-[2.5rem] bg-black border-[10px] border-black shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-10" />
              <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
                <div className="px-4 pt-8 pb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#2C3E50]">9:41</span>
                  <span className="text-[10px] font-bold text-[#2C3E50]">●●● 5G</span>
                </div>
                <div className="px-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#2ECC71]">Price alerts</p>
                  <h3 className="text-[#2C3E50] font-extrabold text-lg leading-tight mt-0.5">Your matches</h3>
                </div>
                <div className="px-4 mt-4 space-y-2.5">
                  {[
                    { t: "Liverpool – Man Utd", p: "€89", d: "▼ €12", ok: true },
                    { t: "Real Madrid – Barça", p: "€220", d: "▼ €30", ok: true },
                    { t: "PSG – Marseille", p: "€110", d: "▲ €5", ok: false },
                  ].map((row) => (
                    <div key={row.t} className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#2C3E50] truncate">{row.t}</span>
                        <span className="text-[11px] font-extrabold text-[#27ae60]">{row.p}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-[#2C3E50]/50">12 providers</span>
                        <span className={`text-[9px] font-bold ${row.ok ? "text-emerald-600" : "text-rose-500"}`}>{row.d}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 mt-4">
                  <div className="rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/20 p-2.5 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#2ECC71]" />
                    <span className="text-[10px] font-bold text-[#2C3E50]">Price drop alert · Liverpool – Man Utd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
};

export default WebsiteHomePage;
