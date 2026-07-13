import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAuthButton } from "@/components/auth/HeaderAuthButton";
import {
  LayoutDashboard, Users, MapPin, CalendarDays, Trophy, Ticket, Image as ImageIcon,
  Map as MapIcon, Inbox, Sparkles, Shield, ShieldCheck, ListChecks, Megaphone,
  BarChart3, CalendarRange, Table as TableIcon, ClipboardCheck, ChevronDown,
  Search, FileText, AlertTriangle, Wrench, Database, Globe, Settings as SettingsIcon,
} from "lucide-react";

type NavLeaf = { to: string; label: string; icon: any; end?: boolean };
type NavGroup = { id: string; label: string; icon: any; children: NavLeaf[] };

const LS_KEY = "admin.sidebar.openGroup";

const AdminShell = () => {
  const { t } = useLanguage();
  const { pathname } = useLocation();

  const groups: NavGroup[] = [
    {
      id: "football",
      label: "Football",
      icon: Trophy,
      children: [
        { to: "/admin/clubs", label: "Clubs", icon: Users },
        { to: "/admin/leagues", label: "Leagues", icon: Trophy },
        { to: "/admin/stadiums", label: "Stadiums", icon: MapPin },
        { to: "/admin/matches", label: "Matches", icon: CalendarDays },
      ],
    },
    {
      id: "ticketing",
      label: "Ticketing",
      icon: Ticket,
      children: [
        { to: "/admin/ticketing", label: "Coverage", icon: Ticket, end: true },
        { to: "/admin/ticketing/leagues", label: "Providers", icon: Globe },
        { to: "/admin/match-review", label: "Issues", icon: AlertTriangle },
      ],
    },
    {
      id: "growth",
      label: "Growth",
      icon: BarChart3,
      children: [
        { to: "/admin/insights", label: "SEO & Insights", icon: BarChart3 },
        { to: "/admin/marketing/content", label: "Content", icon: FileText },
        { to: "/admin/marketing", label: "Marketing", icon: Megaphone, end: true },
        { to: "/admin/media", label: "Media", icon: ImageIcon },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: Wrench,
      children: [
        { to: "/admin/football-audit", label: "Data Health", icon: ClipboardCheck },
        { to: "/admin/data-quality", label: "Data Quality", icon: TableIcon },
        { to: "/admin/seasons", label: "Seasons", icon: CalendarRange },
        { to: "/admin/clubs-master", label: "Clubs Master", icon: Database },
        { to: "/admin/clubs-master/review", label: "Duplicate Clubs", icon: ShieldCheck },
        { to: "/admin/map", label: "World Map", icon: MapIcon },
        { to: "/admin/map-review", label: "Map Review", icon: MapIcon },
        { to: "/admin/suggestions", label: "Suggestions", icon: Inbox },
        { to: "/admin/assistant", label: "AI Copilot", icon: Sparkles },
        { to: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
        { to: "/admin/world-cup-2026", label: "World Cup 2026", icon: Globe },
        { to: "/admin/legacy", label: "Legacy Admin", icon: SettingsIcon },
      ],
    },
  ];

  const findActiveGroup = () => {
    for (const g of groups) {
      if (g.children.some((c) => (c.end ? pathname === c.to : pathname.startsWith(c.to)))) return g.id;
    }
    return null;
  };

  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const active = findActiveGroup();
    if (active) return active;
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  });

  useEffect(() => {
    const active = findActiveGroup();
    if (active) setOpenGroup(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    try { if (openGroup) localStorage.setItem(LS_KEY, openGroup); } catch {}
  }, [openGroup]);

  const isLeafActive = (leaf: NavLeaf) =>
    leaf.end ? pathname === leaf.to : pathname.startsWith(leaf.to);

  const dashboardActive = pathname === "/admin";

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
        <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 bg-white">
          <nav className="p-3 space-y-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive ? "bg-[#2C3E50] text-white" : "text-[#2C3E50] hover:bg-slate-100"
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {groups.map((g) => {
              const isOpen = openGroup === g.id;
              const hasActive = g.children.some(isLeafActive);
              return (
                <div key={g.id} className="pt-1">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? null : g.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      hasActive ? "text-[#2C3E50]" : "text-[#2C3E50]/80 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <g.icon className="w-4 h-4 shrink-0" />
                      <span>{g.label}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                      {g.children.map((c) => (
                        <NavLink
                          key={c.to}
                          to={c.to}
                          end={c.end}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition ${
                              isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`
                          }
                        >
                          <c.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{c.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom nav — top-level sections only */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            <NavLink to="/admin" end className={`flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg text-[10px] font-bold transition ${dashboardActive ? "bg-slate-900 text-white" : "text-slate-700"}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span>Home</span>
            </NavLink>
            {groups.map((g) => {
              const hasActive = g.children.some(isLeafActive);
              return (
                <NavLink key={g.id} to={g.children[0].to} className={`flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg text-[10px] font-bold transition ${hasActive ? "bg-slate-900 text-white" : "text-slate-700"}`}>
                  <g.icon className="w-5 h-5" />
                  <span className="truncate max-w-full">{g.label}</span>
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
