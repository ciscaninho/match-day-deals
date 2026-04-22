import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const tickerItems = [
  { tag: "🔥", text: "PSG vs Barça : ouverture de la billetterie demain à 10h" },
  { tag: "⚪", text: "Real Madrid vs Bayern : complet" },
  { tag: "🎟️", text: "Liverpool vs Inter : tirage au sort ouvert" },
  { tag: "📅", text: "France vs Brésil : mise en vente officielle le 28/04" },
  { tag: "⚡", text: "Man City vs Arsenal : nouvelles places disponibles" },
  { tag: "🏆", text: "Finale Ligue des Champions à Munich : inscription en cours" },
];

const hotMatches = [
  {
    home: "PSG",
    away: "FC Barcelona",
    homeShort: "PSG",
    awayShort: "BAR",
    competition: "UEFA Champions League",
    date: "Mer. 24 Avr · 21:00",
    venue: "Parc des Princes, Paris",
    status: "Bientôt en vente",
    statusColor: "amber",
  },
  {
    home: "Real Madrid",
    away: "Bayern München",
    homeShort: "RMA",
    awayShort: "BAY",
    competition: "UEFA Champions League",
    date: "Mar. 30 Avr · 21:00",
    venue: "Santiago Bernabéu, Madrid",
    status: "Complet",
    statusColor: "red",
  },
  {
    home: "France",
    away: "Brésil",
    homeShort: "FRA",
    awayShort: "BRA",
    competition: "Match International",
    date: "Sam. 08 Juin · 21:00",
    venue: "Stade de France, Paris",
    status: "En vente",
    statusColor: "green",
  },
];

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

const TeamCrest = ({ short }: { short: string }) => (
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-100 border-2 border-[#2C3E50]/10 flex items-center justify-center text-[11px] font-extrabold text-[#2C3E50] shadow-sm">
    {short}
  </div>
);

const LandingPage = () => {
  const [year, setYear] = useState(2025);
  useEffect(() => setYear(new Date().getFullYear()), []);

  // Pre-filled support email
  const supportMail =
    "mailto:support@foottickfinder.app" +
    "?subject=" + encodeURIComponent("Demande d'information — Foot Ticket Finder") +
    "&body=" + encodeURIComponent("Bonjour,\n\nJ'aimerais avoir plus d'informations sur :\n\n");

  return (
    <div className="min-h-screen bg-white text-[#2C3E50] font-sans antialiased">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-md shadow-[#2ECC71]/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-[#2C3E50] tracking-tight">Foot Ticket Finder</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#2C3E50]/70">
            <a href="#why" className="hover:text-[#2ECC71]">Avantages</a>
            <a href="#matches" className="hover:text-[#2ECC71]">Matchs à la une</a>
            <a href="#app" className="hover:text-[#2ECC71]">L'application</a>
            <a href="#contact" className="hover:text-[#2ECC71]">Contact</a>
          </nav>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2C3E50] text-white text-xs font-bold px-4 py-2 hover:bg-[#1f2d3a] transition-colors"
          >
            Lancer l'app <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
            Uniquement des sources officielles · UEFA · FIFA · Clubs
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-3xl">
            Trouvez vos billets de foot{" "}
            <span className="text-[#2ECC71]">au bon moment, au bon prix.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base md:text-lg text-white/70 leading-relaxed">
            Foot Ticket Finder vous indique <strong className="text-white">quand et où</strong> acheter vos places pour les plus grands matchs européens et internationaux. Vous êtes prévenu dès l'ouverture de la billetterie officielle, directement sur votre téléphone.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold transition-colors shadow-lg shadow-[#2ECC71]/30"
            >
              Découvrir l'app maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#app"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-semibold transition-colors border border-white/15"
            >
              Voir comment ça marche
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Gratuit</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Sans inscription</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Sources 100% officielles</div>
          </div>
        </div>
      </section>

      {/* ============ LIVE TICKER ============ */}
      <section aria-label="Annonces en direct" className="bg-[#2ECC71] text-white border-y border-[#27ae60]">
        <div className="flex items-center">
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-[#27ae60] font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            En direct
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Pourquoi Foot Ticket Finder</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              L'outil pensé pour les vrais fans de football
            </h2>
            <p className="mt-4 text-[#2C3E50]/65">
              Nous ne vendons pas de billets. Nous vous guidons vers les bons sites, au bon moment, pour acheter vos places en toute confiance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "Uniquement des sources officielles",
                desc: "Nous référençons exclusivement les billetteries officielles : UEFA, FIFA, fédérations et sites des clubs. Pas de revente sauvage, pas de mauvaises surprises.",
                href: "#matches",
                cta: "Voir les matchs vérifiés",
              },
              {
                icon: BellRing,
                title: "Alertes en temps réel",
                desc: "Recevez une notification dès qu'une billetterie ouvre. Vous êtes prévenu avant la majorité des fans, pour avoir une vraie chance d'obtenir une place.",
                href: "/notifications",
                cta: "Voir les alertes",
              },
              {
                icon: Globe2,
                title: "Tous les grands matchs",
                desc: "Ligue des Champions, Premier League, Liga, Serie A, Bundesliga, équipes nationales et grandes finales internationales : tout est centralisé.",
                href: "/matches",
                cta: "Parcourir les matchs",
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
                <Flame className="w-3.5 h-3.5" /> Matchs à la une
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
                Les billets les plus attendus du moment
              </h2>
            </div>
            <Link
              to="/matches"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2C3E50] hover:text-[#2ECC71]"
            >
              Voir tous les matchs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {hotMatches.map((m) => (
              <Link
                key={`${m.home}-${m.away}`}
                to="/matches"
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-[#2ECC71]/40 hover:shadow-xl hover:shadow-[#2C3E50]/5 transition-all group block"
              >
                <div className="px-5 py-3 bg-[#2C3E50] text-white flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                    {m.competition}
                  </span>
                  <Trophy className="w-3.5 h-3.5 text-[#2ECC71]" />
                </div>

                <div className="px-5 py-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <TeamCrest short={m.homeShort} />
                      <p className="text-xs font-bold text-[#2C3E50] text-center leading-tight">{m.home}</p>
                    </div>
                    <span className="text-xs font-extrabold text-[#2C3E50]/40">VS</span>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <TeamCrest short={m.awayShort} />
                      <p className="text-xs font-bold text-[#2C3E50] text-center leading-tight">{m.away}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-1.5">
                    <p className="text-sm font-bold text-[#2C3E50]">{m.date}</p>
                    <p className="text-xs text-[#2C3E50]/60">{m.venue}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <StatusBadge status={m.status} color={m.statusColor} />
                    <span className="text-xs font-bold text-[#2ECC71] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Voir le match <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DISCOVER THE APP ============ */}
      <section id="app" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Explorez l'application</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              Tout ce dont un fan a besoin, en un seul endroit
            </h2>
            <p className="mt-4 text-[#2C3E50]/65">
              Cliquez sur une rubrique pour découvrir directement la fonctionnalité dans l'app.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { to: "/matches", icon: Trophy, title: "Tous les matchs", desc: "Parcourez les matchs par compétition et par pays." },
              { to: "/calendar", icon: CalendarIcon, title: "Calendrier", desc: "Visualisez les matchs à venir mois par mois." },
              { to: "/notifications", icon: BellRing, title: "Mes alertes", desc: "Suivez vos matchs et recevez les bonnes infos." },
              { to: "/quiz", icon: Gamepad2, title: "Quiz quotidien", desc: "Testez vos connaissances et gagnez des points." },
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
                  Ouvrir <ArrowRight className="w-3.5 h-3.5" />
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
                Prêt à ne plus rater un seul match ?
              </h2>
              <p className="mt-3 text-white/70 max-w-md mx-auto">
                Lancez l'application gratuitement et soyez prévenu dès l'ouverture des prochaines billetteries officielles.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3.5 font-semibold shadow-lg shadow-[#2ECC71]/30"
                >
                  Lancer l'application
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/premium"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 font-semibold border border-white/15"
                >
                  Découvrir Premium
                </Link>
              </div>
              <p className="mt-5 text-xs text-white/50">
                Bientôt disponible sur iOS et Android.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-[#2C3E50] text-white/80">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <Link to="/landing" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-white tracking-tight">Foot Ticket Finder</span>
              </Link>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                Le compagnon billetterie des fans de football. Officiel, transparent, sans intermédiaire douteux.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/30 px-3.5 py-1.5 text-xs font-bold text-[#2ECC71]">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% sources officielles, pour un accès juste au football
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Navigation</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/" className="hover:text-[#2ECC71]">Accueil de l'app</Link></li>
                <li><Link to="/matches" className="hover:text-[#2ECC71]">Matchs</Link></li>
                <li><Link to="/calendar" className="hover:text-[#2ECC71]">Calendrier</Link></li>
                <li><Link to="/notifications" className="hover:text-[#2ECC71]">Notifications</Link></li>
                <li><Link to="/premium" className="hover:text-[#2ECC71]">Premium</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Aide & contact</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href={supportMail} className="inline-flex items-center gap-1.5 hover:text-[#2ECC71]">
                    <Mail className="w-3.5 h-3.5" /> support@foottickfinder.app
                  </a>
                </li>
                <li><a href={supportMail} className="hover:text-[#2ECC71]">Nous contacter</a></li>
                <li><Link to="/profile" className="hover:text-[#2ECC71]">Mon profil</Link></li>
              </ul>

              <h4 className="text-xs font-bold uppercase tracking-wider text-white mt-6 mb-3">Informations</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href={supportMail} className="hover:text-[#2ECC71]">Conditions d'utilisation</a></li>
                <li><a href={supportMail} className="hover:text-[#2ECC71]">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>© {year} Foot Ticket Finder. Tous droits réservés.</p>
            <p>Site indépendant, non affilié à l'UEFA, la FIFA ou aux clubs mentionnés.</p>
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
