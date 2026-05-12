import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAuthButton } from "@/components/auth/HeaderAuthButton";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, CalendarDays, Trophy, Ticket, Image as ImageIcon,
  Map as MapIcon, Inbox, Sparkles, Settings as SettingsIcon, Shield, Ticket as TicketLogo,
} from "lucide-react";

const AdminShell = () => {
  const { t } = useLanguage();
  const { pathname } = useLocation();

  const nav = [
    { to: "/admin", end: true, label: t("admin.nav.overview"), icon: LayoutDashboard },
    { to: "/admin/clubs", label: t("admin.nav.clubs"), icon: Users },
    { to: "/admin/stadiums", label: t("admin.nav.stadiums"), icon: MapPin },
    { to: "/admin/matches", label: t("admin.nav.matches"), icon: CalendarDays },
    { to: "/admin/leagues", label: t("admin.nav.leagues"), icon: Trophy },
    { to: "/admin/ticketing", label: t("admin.nav.ticketing"), icon: Ticket },
    { to: "/admin/media", label: t("admin.nav.media"), icon: ImageIcon },
    { to: "/admin/map", label: t("admin.nav.map"), icon: MapIcon },
    { to: "/admin/map-review", label: t("admin.nav.map_review"), icon: MapIcon },
    { to: "/admin/suggestions", label: t("admin.nav.suggestions"), icon: Inbox },
    { to: "/admin/assistant", label: t("admin.nav.assistant"), icon: Sparkles },
    { to: "/admin/legacy", label: t("admin.nav.legacy"), icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2C3E50] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#2ECC71]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#2ECC71] leading-none">Operations</p>
              <p className="text-sm font-extrabold text-[#2C3E50] truncate leading-tight">{t("admin.title")}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <HeaderAuthButton />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-200 bg-white">
          <nav className="p-3 space-y-0.5">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? "bg-[#2C3E50] text-white" : "text-[#2C3E50]/80 hover:bg-slate-100"
                  }`
                }
              >
                <n.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile horizontal nav */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 overflow-x-auto">
          <div className="flex gap-1 px-2 py-1.5 min-w-max">
            {nav.map((n) => {
              const active = n.end ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <NavLink key={n.to} to={n.to} end={n.end}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                    active ? "bg-[#2C3E50] text-white" : "text-[#2C3E50]/70"
                  }`}>
                  <n.icon className="w-4 h-4" />
                  <span>{n.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
