import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMatches } from "@/hooks/useMatches";
import {
  Ticket,
  ShieldCheck,
  BellRing,
  Globe2,
  Apple,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Mail,
  Trophy,
  Flame,
  Calendar as CalendarIcon,
  Gamepad2,
} from "lucide-react";

/**
 * LandingPage — Marketing site for "Foot Ticket Finder"
 * Self-contained: uses inline brand colors (pitch green #2ECC71, midnight #2C3E50)
 * to keep the marketing identity separate from the in-app design system.
 */

const TeamCrest = ({ short }: { short: string }) => (
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-100 border-2 border-[#2C3E50]/10 flex items-center justify-center text-[11px] font-extrabold text-[#2C3E50] shadow-sm">
    {short}
  </div>
);


const LandingPage = () => {
  const { t } = useLanguage();
  const { data: matches = [] } = useMatches();
  const [year, setYear] = useState(2025);
  useEffect(() => setYear(new Date().getFullYear()), []);

  // Pre-filled support email
  const supportMail =
    "mailto:support@footticketfinder.com" +
    "?subject=" + encodeURIComponent("Demande d'information — Foot Ticket Finder") +
    "&body=" + encodeURIComponent("Bonjour,\n\nJ'aimerais avoir plus d'informations sur :\n\n");

  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    toast.success(t("landing.newsletter.toast.title"), {
      description: t("landing.newsletter.toast.desc", { email }),
    });
    setEmail("");
  };

  // Translated dynamic data (inside component to react to locale)
  const tickerItems = [
    { tag: "🔥", text: t("landing.ticker.item1") },
    { tag: "⚪", text: t("landing.ticker.item2") },
    { tag: "🎟️", text: t("landing.ticker.item3") },
    { tag: "📅", text: t("landing.ticker.item4") },
    { tag: "⚡", text: t("landing.ticker.item5") },
    { tag: "🏆", text: t("landing.ticker.item6") },
  ];

  // Tickets available in the next 30 days
  const now = Date.now();
  const in30Days = now + 30 * 24 * 60 * 60 * 1000;
  const upcomingMatches = matches
    .filter((m) => {
      const t = new Date(m.date).getTime();
      return t >= now && t <= in30Days;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  const hotMatches = upcomingMatches.map((m) => ({
    id: m.id,
    home: m.homeTeam,
    away: m.awayTeam,
    homeShort: m.homeShort,
    awayShort: m.awayShort,
    competition: m.competition,
    startingPrice: m.startingPrice,
    sources: m.ticketSources?.length ?? 0,
    date: new Date(m.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: new Date(m.date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    venue: [m.stadium, m.city].filter(Boolean).join(", "),
    status:
      m.ticketStatus === "sold_out"
        ? t("landing.matches.status.sold_out")
        : m.ticketStatus === "on_sale"
          ? t("landing.matches.status.on_sale")
          : t("landing.matches.status.coming_soon"),
    statusColor:
      m.ticketStatus === "sold_out"
        ? "red"
        : m.ticketStatus === "on_sale"
          ? "green"
          : "amber",
  }));

  const StatusBadge = ({ status, color }: { status: string; color: string }) => {
    const map: Record<string, string> = {
      green: "bg-[#2ECC71] text-white",
      amber: "bg-amber-400 text-[#2C3E50]",
      red: "bg-red-500 text-white",
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${map[color]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#2C3E50] font-sans antialiased">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-md shadow-[#2ECC71]/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-[#2C3E50] tracking-tight">Foot Ticket Finder</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#2C3E50]/70">
            <a href="#why" className="hover:text-[#2ECC71]">{t("landing.nav.benefits")}</a>
            <a href="#matches" className="hover:text-[#2ECC71]">{t("landing.nav.matches")}</a>
            <a href="#app" className="hover:text-[#2ECC71]">{t("landing.nav.app")}</a>
            <a href="#contact" className="hover:text-[#2ECC71]">{t("landing.nav.contact")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2C3E50] text-white text-xs font-bold px-4 py-2 hover:bg-[#1f2d3a] transition-colors"
            >
              {t("landing.nav.launch")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
        {/* pitch lines */}
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

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            {t("landing.hero.badge")}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-3xl">
            {t("landing.hero.title_1")}{" "}
            <span className="text-[#2ECC71]">{t("landing.hero.title_2")}</span>
          </h1>

          <p
            className="mt-5 max-w-xl text-base md:text-lg text-white/70 leading-relaxed [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: t("landing.hero.subtitle") }}
          />

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold transition-colors shadow-lg shadow-[#2ECC71]/30"
            >
              {t("landing.hero.cta_primary")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#app"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-semibold transition-colors border border-white/15"
            >
              {t("landing.hero.cta_secondary")}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> {t("landing.hero.point_1")}</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> {t("landing.hero.point_2")}</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> {t("landing.hero.point_3")}</div>
          </div>
        </div>
      </section>

      {/* ============ LIVE TICKER ============ */}
      <section aria-label="Annonces en direct" className="bg-[#2ECC71] text-white border-y border-[#27ae60]">
        <div className="flex items-center">
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-[#27ae60] font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {t("landing.ticker.live")}
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="flex gap-10 animate-ticker whitespace-nowrap py-3 text-sm font-medium">
              {[...tickerItems, ...tickerItems].map((it, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <span>{it.tag}</span>
                  <span>{it.text}</span>
                  <span className="text-white/50">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section id="why" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">{t("landing.why.eyebrow")}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              {t("landing.why.title")}
            </h2>
            <p className="mt-4 text-[#2C3E50]/65">
              {t("landing.why.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: t("landing.why.card1.title"),
                desc: t("landing.why.card1.desc"),
                href: "#matches",
                cta: t("landing.why.card1.cta"),
              },
              {
                icon: BellRing,
                title: t("landing.why.card2.title"),
                desc: t("landing.why.card2.desc"),
                href: "/notifications",
                cta: t("landing.why.card2.cta"),
              },
              {
                icon: Globe2,
                title: t("landing.why.card3.title"),
                desc: t("landing.why.card3.desc"),
                href: "/matches",
                cta: t("landing.why.card3.cta"),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#2ECC71]/40 hover:shadow-lg hover:shadow-[#2ECC71]/5 transition-all flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5 group-hover:bg-[#2ECC71] transition-colors">
                  <f.icon className="w-6 h-6 text-[#2ECC71] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-extrabold text-lg text-[#2C3E50]">{f.title}</h3>
                <p className="mt-2 text-sm text-[#2C3E50]/65 leading-relaxed flex-1">{f.desc}</p>
                {f.href.startsWith("/") ? (
                  <Link
                    to={f.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#2ECC71] hover:gap-2.5 transition-all"
                  >
                    {f.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <a
                    href={f.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#2ECC71] hover:gap-2.5 transition-all"
                  >
                    {f.cta} <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOT MATCHES ============ */}
      <section id="matches" className="py-20 md:py-28 bg-slate-50 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #2C3E50 1px, transparent 1px), linear-gradient(#2C3E50 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Next 30 days
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
                Tickets available in the next 30 days
              </h2>
              <p className="mt-3 text-[#2C3E50]/65 max-w-2xl">
                A preview of upcoming football matches with confirmed or imminent ticket releases. Open the app for the full list, alerts and official ticket sources.
              </p>
            </div>
            <Link
              to="/app/matches"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2C3E50] hover:text-[#2ECC71]"
            >
              {t("landing.matches.view_all")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {hotMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-[#2C3E50]/60">
              No upcoming matches in the next 30 days yet. Check back soon — or open the app to see the full schedule.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/app/matches/${m.id}`}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-[#2ECC71]/40 hover:shadow-xl hover:shadow-[#2C3E50]/5 transition-all group block flex flex-col"
                >
                  <div className="px-5 py-3 bg-[#2C3E50] text-white flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      {m.competition}
                    </span>
                    <Trophy className="w-3.5 h-3.5 text-[#2ECC71]" />
                  </div>

                  <div className="px-5 py-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <TeamCrest short={m.homeShort} />
                        <p className="text-xs font-bold text-[#2C3E50] text-center leading-tight truncate w-full">{m.home}</p>
                      </div>
                      <span className="text-xs font-extrabold text-[#2C3E50]/40">VS</span>
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <TeamCrest short={m.awayShort} />
                        <p className="text-xs font-bold text-[#2C3E50] text-center leading-tight truncate w-full">{m.away}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-1.5">
                      <p className="text-sm font-bold text-[#2C3E50]">
                        {m.date} · {m.time}
                      </p>
                      {m.venue && <p className="text-xs text-[#2C3E50]/60">{m.venue}</p>}
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-[11px] text-[#2C3E50]/70">
                      {m.startingPrice != null && (
                        <span className="font-bold text-[#2ECC71]">From €{m.startingPrice}</span>
                      )}
                      {m.sources > 0 && (
                        <span>{m.sources} official source{m.sources > 1 ? "s" : ""}</span>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <StatusBadge status={m.status} color={m.statusColor} />
                      <span className="text-xs font-bold text-[#2ECC71] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        View in app <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ DISCOVER THE APP ============ */}
      <section id="app" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">{t("landing.app.eyebrow")}</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              {t("landing.app.title")}
            </h2>
            <p className="mt-4 text-[#2C3E50]/65">
              {t("landing.app.subtitle")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { to: "/app/matches", icon: Trophy, title: t("landing.app.card1.title"), desc: t("landing.app.card1.desc") },
              { to: "/app/calendar", icon: CalendarIcon, title: t("landing.app.card2.title"), desc: t("landing.app.card2.desc") },
              { to: "/app/notifications", icon: BellRing, title: t("landing.app.card3.title"), desc: t("landing.app.card3.desc") },
              { to: "/app/daily-game", icon: Gamepad2, title: t("landing.app.card4.title"), desc: t("landing.app.card4.desc") },
            ].map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#2ECC71]/40 hover:shadow-lg hover:shadow-[#2ECC71]/5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-4 group-hover:bg-[#2ECC71] transition-colors">
                  <card.icon className="w-5 h-5 text-[#2ECC71] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-extrabold text-base text-[#2C3E50]">{card.title}</h3>
                <p className="mt-1.5 text-sm text-[#2C3E50]/65 leading-relaxed">{card.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#2ECC71] group-hover:gap-2 transition-all">
                  {t("landing.app.open")} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA DOWNLOAD ============ */}
      <section id="download" className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2C3E50] to-[#1a2530] text-white p-10 md:p-14 text-center">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#2ECC71]/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {t("landing.cta.title")}
              </h2>
              <p className="mt-3 text-white/70 max-w-md mx-auto">
                {t("landing.cta.desc")}
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold shadow-lg shadow-[#2ECC71]/30"
                >
                  {t("landing.cta.launch")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/app/premium"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-semibold border border-white/15"
                >
                  {t("landing.cta.premium")}
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/50">
                {t("landing.cta.soon")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ NEWSLETTER / EMAIL COLLECT ============ */}
      <section id="newsletter" className="py-20 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">
            {t("landing.newsletter.eyebrow")}
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C3E50]">
            {t("landing.newsletter.title")}
          </h2>
          <p className="mt-4 text-[#2C3E50]/65">
            {t("landing.newsletter.desc")}
          </p>

          <form
            onSubmit={handleSubscribe}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder={t("landing.newsletter.placeholder")}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/20 focus:border-[#2ECC71] transition-all text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3 font-semibold transition-colors shadow-lg shadow-[#2ECC71]/30 text-sm whitespace-nowrap"
            >
              {t("landing.newsletter.cta")}
            </button>
          </form>

          <p className="mt-4 text-xs text-[#2C3E50]/50">
            {t("landing.newsletter.disclaimer")}
          </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-[#2C3E50] text-white/80">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-white tracking-tight">Foot Ticket Finder</span>
              </Link>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                {t("landing.footer.tagline")}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/30 px-3.5 py-1.5 text-xs font-bold text-[#2ECC71]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("landing.footer.badge")}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{t("landing.footer.nav")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/app" className="hover:text-[#2ECC71]">{t("landing.footer.nav.home")}</Link></li>
                <li><Link to="/app/matches" className="hover:text-[#2ECC71]">{t("landing.footer.nav.matches")}</Link></li>
                <li><Link to="/app/calendar" className="hover:text-[#2ECC71]">{t("landing.footer.nav.calendar")}</Link></li>
                <li><Link to="/app/notifications" className="hover:text-[#2ECC71]">{t("landing.footer.nav.notifications")}</Link></li>
                <li><Link to="/app/premium" className="hover:text-[#2ECC71]">{t("landing.footer.nav.premium")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{t("landing.footer.help")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href={supportMail} className="inline-flex items-center gap-1.5 hover:text-[#2ECC71]">
                    <Mail className="w-3.5 h-3.5" /> support@footticketfinder.com
                  </a>
                </li>
                <li><a href={supportMail} className="hover:text-[#2ECC71]">{t("landing.footer.contact_us")}</a></li>
                <li><Link to="/app/profile" className="hover:text-[#2ECC71]">{t("landing.footer.profile")}</Link></li>
              </ul>

              <h4 className="text-xs font-bold uppercase tracking-wider text-white mt-6 mb-3">{t("landing.footer.info")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href={supportMail} className="hover:text-[#2ECC71]">{t("landing.footer.terms")}</a></li>
                <li><a href={supportMail} className="hover:text-[#2ECC71]">{t("landing.footer.privacy")}</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>{t("landing.footer.rights", { year })}</p>
            <p>{t("landing.footer.disclaimer")}</p>
          </div>
        </div>
      </footer>

      {/* Local styles for the live ticker animation */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
