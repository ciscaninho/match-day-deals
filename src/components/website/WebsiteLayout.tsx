import { Link, NavLink } from "react-router-dom";
import { Ticket, ArrowRight, Menu, X, Mail, Instagram } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAuthButton } from "@/components/auth/HeaderAuthButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  children: ReactNode;
}

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.4 8.4 0 0 1-4.5-1.4v6.7a6.2 6.2 0 1 1-6.2-6.2c.3 0 .6 0 .9.1v3.2a3 3 0 1 0 2.1 2.9V3h3.2Z" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const WebsiteLayout = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const { t, tf, dir } = useLanguage();

  const navItems = [
    { label: t("website.nav.matches"), to: "/matches" },
    { label: t("website.nav.leagues"), to: "/leagues" },
    { label: t("website.nav.how"), to: "/how-it-works" },
    { label: t("website.nav.pricing"), to: "/pricing" },
  ];

  const socialLinks = [
    { label: "X", href: "https://x.com/Footticketfind", icon: XIcon },
    { label: "Instagram", href: "https://www.instagram.com/footticketfinder/", icon: Instagram },
    { label: "TikTok", href: "https://www.tiktok.com/@footticketfinder", icon: TikTokIcon },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2C3E50] font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0" aria-label="Foot Ticket Finder home">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-md shadow-[#2ECC71]/30 shrink-0">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-sm sm:text-base truncate">Foot Ticket Finder</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-[15px] font-medium text-[#2C3E50]/70">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `hover:text-[#2ECC71] transition-colors ${isActive ? "text-[#2ECC71]" : ""}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageSwitcher />
            <HeaderAuthButton />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="max-w-6xl mx-auto px-5 py-3 flex flex-col gap-1">
              {navItems.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm font-medium text-[#2C3E50]/80 hover:text-[#2ECC71]"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer dir={dir} className="bg-gradient-to-b from-[#2C3E50] to-[#1A2533] text-white/80">
        {/* Trust strip */}
        <div className="bg-[#0B1424]/80 border-b border-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-5 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-[11.5px] text-white/55 text-center">
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" /> {tf("website.trust.compare", "We compare official ticket providers")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" /> {tf("website.trust.no_sale", "We do not sell tickets directly")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" /> {tf("website.trust.affiliate", "Some outbound links may earn us a commission")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" /> {tf("website.trust.gdpr", "GDPR-compliant")}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-lg shadow-[#2ECC71]/30">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-white tracking-tight text-lg">Foot Ticket Finder</span>
            </Link>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">{t("website.footer.tagline")}</p>

            <div className="mt-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-3">{t("website.footer.contact")}</h4>
              <a href="mailto:support@footticketfinder.com" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#2ECC71] transition-colors">
                <Mail className="w-4 h-4" />
                support@footticketfinder.com
              </a>
            </div>

            <div className="mt-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-3">{t("website.footer.follow")}</h4>
              <div className="flex items-center gap-2">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#2ECC71] hover:text-white transition-colors flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">{tf("website.footer.browse", "Browse")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/matches" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.all_matches", "All matches")}</Link></li>
              <li><Link to="/leagues" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.leagues", "Leagues")}</Link></li>
              <li><Link to="/pricing" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.pricing", "Pricing")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">{tf("website.footer.editorial", "Editorial")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/guides" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.guides", "All guides")}</Link></li>
              <li><Link to="/guides/how-to-buy-tickets-safely" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.guide_safe", "Buy tickets safely")}</Link></li>
              <li><Link to="/guides/matchday-travel-checklist" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.guide_travel", "Matchday & travel")}</Link></li>
              <li><Link to="/guides/league-coverage" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.guide_leagues", "League guides")}</Link></li>
              <li><Link to="/guides/stadium-experience" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.guide_stadiums", "Stadium guides")}</Link></li>
              <li><Link to="/about" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.about", "About us")}</Link></li>
              <li><Link to="/contact" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.contact_link", "Contact")}</Link></li>
              <li><Link to="/faq" className="hover:text-[#2ECC71] transition-colors">{tf("website.nav.faq", "FAQ")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">{tf("website.footer.legal", "Legal")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/terms" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.terms", "Terms")}</Link></li>
              <li><Link to="/privacy" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.privacy", "Privacy")}</Link></li>
              <li><Link to="/cookies" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.cookies", "Cookie policy")}</Link></li>
              <li><Link to="/affiliate-disclosure" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.affiliate", "Affiliate disclosure")}</Link></li>
              <li><Link to="/editorial-policy" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.editorial_policy", "Editorial policy")}</Link></li>
              <li><Link to="/ticket-policy" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.ticket_policy", "Ticket & buyer protection")}</Link></li>
              <li><Link to="/refund-policy" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.refund", "Refunds")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 py-5 text-xs text-white/50 text-center">
            {t("website.footer.copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
};
