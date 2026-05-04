import { Link, NavLink } from "react-router-dom";
import { Ticket, ArrowRight, Menu, X, Bell } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAuthButton } from "@/components/auth/HeaderAuthButton";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  children: ReactNode;
}

export const WebsiteLayout = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const { t, dir } = useLanguage();

  const navItems = [
    { label: t("website.nav.matches"), to: "/matches" },
    { label: t("website.nav.leagues"), to: "/leagues" },
    { label: t("website.nav.how"), to: "/about" },
    { label: t("website.nav.pricing"), to: "/pricing" },
    { label: t("website.nav.faq"), to: "/faq" },
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
            >
              <Bell className="w-3.5 h-3.5" /> {t("website.nav.get_app")}
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
        <div className="max-w-6xl mx-auto px-5 py-12 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-white tracking-tight">Foot Ticket Finder</span>
            </Link>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              {t("website.footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{t("website.footer.browse")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/matches" className="hover:text-[#2ECC71]">{t("website.footer.all_matches")}</Link></li>
              <li><Link to="/leagues" className="hover:text-[#2ECC71]">{t("website.footer.leagues")}</Link></li>
              <li><Link to="/about" className="hover:text-[#2ECC71]">{t("website.footer.how")}</Link></li>
              <li><Link to="/pricing" className="hover:text-[#2ECC71]">{t("website.footer.pricing")}</Link></li>
              <li><Link to="/app" className="hover:text-[#2ECC71]">{t("website.footer.the_app")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">{t("website.footer.legal")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/legal/privacy" className="hover:text-[#2ECC71]">{t("website.footer.privacy")}</Link></li>
              <li><Link to="/legal/terms" className="hover:text-[#2ECC71]">{t("website.footer.terms")}</Link></li>
              <li><Link to="/legal/refund" className="hover:text-[#2ECC71]">{t("website.footer.refund")}</Link></li>
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
