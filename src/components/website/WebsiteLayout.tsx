import { Link, NavLink } from "react-router-dom";
import { Ticket, Menu, X, Mail, Instagram, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAuthButton } from "@/components/auth/HeaderAuthButton";
import { getFooterCopy } from "@/i18n/footer";
import { getGuide } from "@/i18n/guidesContent";
import { useLanguage } from "@/i18n/LanguageContext";
import { getWorldCup2026Copy } from "@/i18n/worldCup2026";

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
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const { t, tf, dir, locale } = useLanguage();
  const wcLabel = getWorldCup2026Copy(locale).nav_label;
  const footer = getFooterCopy(locale);
  const safeGuideSlug = getGuide(locale, "safe-tickets").slug;
  const leaguesGuideSlug = getGuide(locale, "league-coverage").slug;
  const stadiumsGuideSlug = getGuide(locale, "stadium-experience").slug;

  const navItems = [
    { label: t("website.nav.matches"), to: "/matches" },
    { label: t("website.nav.leagues"), to: "/leagues" },
    { label: wcLabel, to: "/world-cup-2026" },
    { label: t("website.nav.pricing"), to: "/pricing" },
  ];

  const footerColumns = [
    {
      id: "browse",
      title: footer.col_browse,
      links: [
        { label: footer.matches, to: "/matches" },
        { label: footer.world_cup, to: "/world-cup-2026" },
        { label: footer.pricing, to: "/pricing" },
      ],
    },
    {
      id: "editorial",
      title: footer.col_editorial,
      links: [
        { label: footer.all_guides, to: "/guides" },
        { label: footer.guide_safe, to: `/guides/${safeGuideSlug}` },
        { label: footer.guide_leagues, to: `/guides/${leaguesGuideSlug}` },
        { label: footer.guide_stadiums, to: `/guides/${stadiumsGuideSlug}` },
        { label: footer.destinations, to: "/destinations" },
        { label: footer.contact_link, to: "/contact" },
        { label: footer.about, to: "/about" },
      ],
    },
    {
      id: "legal",
      title: footer.col_legal,
      links: [
        { label: footer.terms, to: "/terms" },
        { label: footer.privacy, to: "/privacy" },
        { label: footer.cookies, to: "/cookies" },
        { label: footer.affiliate, to: "/affiliate-disclosure" },
        { label: footer.editorial_policy, to: "/editorial-policy" },
        { label: footer.buyer_protection, to: "/ticket-policy" },
        { label: footer.refund, to: "/refund-policy" },
      ],
    },
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
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">{tf("website.footer.explore", "Explore")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/world-cup-2026" className="hover:text-[#2ECC71] transition-colors">{wcLabel}</Link></li>
              <li><Link to="/stadiums" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.stadiums", "Stadiums")}</Link></li>
              <li><Link to="/clubs" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.clubs", "Clubs")}</Link></li>
              <li><Link to="/matches" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.all_matches", "Matches")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">{tf("website.footer.resources", "Resources")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.about", "About")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">{tf("website.footer.support", "Support")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/contact" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.contact_link", "Contact")}</Link></li>
              <li><Link to="/ticket-policy" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.buyer_protection", "Buyer Protection")}</Link></li>
              <li><Link to="/privacy" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.privacy", "Privacy")}</Link></li>
              <li><Link to="/terms" className="hover:text-[#2ECC71] transition-colors">{tf("website.footer.terms", "Terms")}</Link></li>
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
