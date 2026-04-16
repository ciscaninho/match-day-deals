import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Home, List, CalendarDays, Bell, User } from "lucide-react";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useUser();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav.home"), icon: Home, path: "/" },
    { label: t("nav.matches"), icon: List, path: "/matches" },
    { label: t("nav.calendar"), icon: CalendarDays, path: "/calendar" },
    { label: t("nav.alerts"), icon: Bell, path: "/notifications" },
    { label: t("nav.profile"), icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/" && location.pathname === "/");
          const showBadge = item.path === "/notifications" && unreadCount > 0;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
