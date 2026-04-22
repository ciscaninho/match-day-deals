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
} from "lucide-react";

/**
 * LandingPage — Marketing site for "Foot Ticket Finder"
 * Self-contained: uses inline brand colors (pitch green #2ECC71, midnight #2C3E50)
 * to keep the marketing identity separate from the in-app design system.
 */

const tickerItems = [
  { tag: "🔥", text: "PSG vs Barça : Ouverture billetterie demain 10h" },
  { tag: "⚪", text: "Real Madrid vs Bayern : Sold Out" },
  { tag: "🎟️", text: "Liverpool vs Inter : Phase ballot ouverte" },
  { tag: "📅", text: "France vs Brésil : Vente officielle le 28/04" },
  { tag: "⚡", text: "Man City vs Arsenal : Resale officielle disponible" },
  { tag: "🏆", text: "Finale UCL Munich : Tirage au sort en cours" },
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
    status: "Ventes bientôt ouvertes",
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
    status: "Sold Out",
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
    status: "On Sale",
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
            <a href="#why" className="hover:text-[#2ECC71]">Pourquoi nous</a>
            <a href="#matches" className="hover:text-[#2ECC71]">Matchs chauds</a>
            <a href="#contact" className="hover:text-[#2ECC71]">Contact</a>
          </nav>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2C3E50] text-white text-xs font-bold px-4 py-2 hover:bg-[#1f2d3a] transition-colors"
          >
            Ouvrir l'app <ArrowRight className="w-3.5 h-3.5" />
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
            100% sources officielles · UEFA · FIFA · Clubs
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-3xl">
            Fini les galères de billetterie.{" "}
            <span className="text-[#2ECC71]">Place au foot.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base md:text-lg text-white/70 leading-relaxed">
            Foot Ticket Finder centralise les ventes officielles des plus grands matchs européens et internationaux. Soyez alerté <strong className="text-white">avant tout le monde</strong> — sans revendeurs douteux, sans prix gonflés.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#download"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-black hover:bg-black/85 text-white px-5 py-3.5 font-semibold transition-colors"
            >
              <Apple className="w-5 h-5" />
              <div className="text-left leading-tight">
                <div className="text-[10px] font-medium opacity-70">Télécharger sur</div>
                <div className="text-sm">App Store</div>
              </div>
            </a>
            <a
              href="#download"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-5 py-3.5 font-semibold transition-colors shadow-lg shadow-[#2ECC71]/30"
            >
              <Smartphone className="w-5 h-5" />
              <div className="text-left leading-tight">
                <div className="text-[10px] font-medium opacity-90">Disponible sur</div>
                <div className="text-sm">Google Play</div>
              </div>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Gratuit</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Sans inscription</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> Anti-scalpers</div>
          </div>
        </div>
      </section>

      {/* ============ LIVE TICKER ============ */}
      <section aria-label="Annonces en direct" className="bg-[#2ECC71] text-white border-y border-[#27ae60]">
        <div className="flex items-center">
          <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-[#27ae60] font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Live
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#2ECC71]">Pourquoi nous</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              Le seul outil dont les vrais fans ont besoin
            </h2>
            <p className="mt-4 text-[#2C3E50]/65">
              On ne vend pas de billets. On vous dit exactement quand et où acheter ceux qui sont fiables.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "100% Officiel",
                desc: "Uniquement des sources vérifiées : UEFA, FIFA, fédérations et plateformes officielles des clubs. Aucune revente louche.",
              },
              {
                icon: BellRing,
                title: "Alertes en temps réel",
                desc: "Notifications push avant l'ouverture des ventes. Soyez le premier au coup d'envoi de la billetterie.",
              },
              {
                icon: Globe2,
                title: "Couverture totale",
                desc: "Ligue des Champions, Premier League, Liga, Serie A, Bundesliga, sélections nationales et grandes finales.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#2ECC71]/40 hover:shadow-lg hover:shadow-[#2ECC71]/5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center mb-5 group-hover:bg-[#2ECC71] transition-colors">
                  <f.icon className="w-6 h-6 text-[#2ECC71] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-extrabold text-lg text-[#2C3E50]">{f.title}</h3>
                <p className="mt-2 text-sm text-[#2C3E50]/65 leading-relaxed">{f.desc}</p>
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
                <Flame className="w-3.5 h-3.5" /> Matchs chauds
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
                Les billets que tout le monde attend
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
              <article
                key={`${m.home}-${m.away}`}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-[#2ECC71]/40 hover:shadow-xl hover:shadow-[#2C3E50]/5 transition-all group"
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
                      Détails <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA DOWNLOAD ============ */}
      <section id="download" className="py-20 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2C3E50] to-[#1a2530] text-white p-10 md:p-14 text-center">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#2ECC71]/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Le coup d'envoi est dans votre poche
              </h2>
              <p className="mt-3 text-white/70 max-w-md mx-auto">
                Téléchargez l'app gratuitement et ne ratez plus jamais une ouverture de billetterie.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <a href="#" className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white text-[#2C3E50] px-5 py-3.5 font-semibold hover:bg-white/90">
                  <Apple className="w-5 h-5" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-medium opacity-70">Télécharger sur</div>
                    <div className="text-sm">App Store</div>
                  </div>
                </a>
                <a href="#" className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2ECC71] text-white px-5 py-3.5 font-semibold hover:bg-[#27ae60]">
                  <Smartphone className="w-5 h-5" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-medium opacity-90">Disponible sur</div>
                    <div className="text-sm">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-[#2C3E50] text-white/80">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-white tracking-tight">Foot Ticket Finder</span>
              </div>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                Le compagnon billetterie des fans de football. Officiel, transparent, sans intermédiaire douteux.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/30 px-3.5 py-1.5 text-xs font-bold text-[#2ECC71]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Scalpers : Nous soutenons l'accès juste au football
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Légal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-[#2ECC71]">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-[#2ECC71]">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-[#2ECC71]">Mentions légales</a></li>
                <li><a href="#" className="hover:text-[#2ECC71]">Cookies</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="mailto:support@foottickfinder.app" className="inline-flex items-center gap-1.5 hover:text-[#2ECC71]">
                    <Mail className="w-3.5 h-3.5" /> support@foottickfinder.app
                  </a>
                </li>
                <li><a href="#" className="hover:text-[#2ECC71]">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-[#2ECC71]">FAQ Billetterie</a></li>
                <li><Link to="/" className="hover:text-[#2ECC71]">Ouvrir l'app web</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>© {year} Foot Ticket Finder. Tous droits réservés.</p>
            <p>Non affilié à l'UEFA, la FIFA ou aux clubs mentionnés.</p>
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
