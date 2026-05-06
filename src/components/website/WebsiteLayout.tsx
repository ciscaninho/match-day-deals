import { Link, NavLink } from "react-router-dom";
import { Ticket, ArrowRight, Menu, X, Bell, Mail, Twitter, Instagram } from "lucide-react";
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

export const WebsiteLayout = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const { t, dir } = useLanguage();

  const navItems = [
    { label: t("website.nav.matches"), to: "/matches" },
    { label: t("website.nav.leagues"), to: "/leagues" },
    { label: t("website.nav.how"), to: "/how-it-works" },
    { label: t("website.nav.pricing"), to: "/pricing" },
    { label: t("website.nav.faq"), to: "/faq" },
  ];

  const socialLinks = [
    { label: "X (Twitter)", href: "https://x.com/footticket", icon: Twitter },
    { label: "Instagram", href: "https://instagram.com/footticket", icon: Instagram },
    { label: "TikTok", href: "https://tiktok.com/@footticket", icon: TikTokIcon },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2C3E50] font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Foot Ticket Finder home">
            <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-md shadow-[#2ECC71]/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight">Foot Ticket Finder</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#2C3E50]/70">
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

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <HeaderAuthButton />
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#2C3E50] text-white text-xs font-bold px-4 py-2 hover:bg-[#1f2d3a] transition-colors"
              aria-label={t("app.coming_soon")}
            >
              <Bell className="w-3.5 h-3.5" /> {t("website.nav.get_app")}
              <span className="ms-1 rounded-full bg-[#2ECC71]/20 text-[#2ECC71] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {t("app.coming_soon_short")}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200"
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
              <Link
                to="/app"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#2C3E50] text-white text-xs font-bold px-4 py-2.5"
              >
                <Bell className="w-3.5 h-3.5" /> {t("website.nav.get_app")}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer dir={dir} className="bg-[#2C3E50] text-white/80 mt-16">
        <div className="max-w-6xl mx-auto px-5 py-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2ECC71] flex items-center justify-center shadow-lg shadow-[#2ECC71]/30">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-white tracking-tight text-lg">Foot Ticket Finder</span>
            </Link>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              {t("website.footer.tagline")}
            </p>

            <div className="mt-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-3">
                {t("website.footer.contact")}
              </h4>
              <a
                href="mailto:support.footticket@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-[#2ECC71] transition-colors"
              >
                <Mail className="w-4 h-4" />
                support.footticket@gmail.com
              </a>
            </div>

            <div className="mt-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-3">
                {t("website.footer.follow")}
              </h4>
              <div className="flex items-center gap-2">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#2ECC71] hover:text-white transition-colors flex items-center justify-center"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">
              {t("website.footer.browse")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/matches" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.all_matches")}</Link></li>
              <li><Link to="/leagues" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.leagues")}</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.how")}</Link></li>
              <li><Link to="/pricing" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.pricing")}</Link></li>
              <li><Link to="/app" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.the_app")}</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white mb-4">
              {t("website.footer.legal")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.privacy")}</Link></li>
              <li><Link to="/terms" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.terms")}</Link></li>
              <li><Link to="/refund-policy" className="hover:text-[#2ECC71] transition-colors">{t("website.footer.refund")}</Link></li>
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
