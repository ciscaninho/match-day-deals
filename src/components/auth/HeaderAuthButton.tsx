import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGate } from "./AuthGate";
import {
  LogIn,
  User as UserIcon,
  Heart,
  Bell,
  Trophy,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUserIdentity } from "@/hooks/useUserIdentity";
import { UserAvatar } from "@/components/account/UserAvatar";
import { UserBadge } from "@/components/account/UserBadge";

export const HeaderAuthButton = () => {
  const { user } = useUser();
  const { isAdmin, signOut } = useAuth();
  const { openAuth } = useAuthGate();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const identity = useUserIdentity();

  if (user) {
    const handleSignOut = async () => {
      await signOut();
      navigate("/", { replace: true });
    };

    const ring = identity.isAdmin
      ? "admin"
      : identity.isPremium
      ? "premium"
      : "soft";

    const sectionLabel =
      "px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400";
    const itemCls =
      "group cursor-pointer rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 transition-colors";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white text-[#2C3E50] text-xs font-bold pl-1 pr-3 py-1 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <UserAvatar
              name={identity.displayName}
              initials={identity.initials}
              src={identity.avatarUrl}
              size="sm"
              ring={ring as any}
            />
            <span className="hidden sm:inline max-w-[110px] truncate">
              {identity.displayName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-72 z-[60] p-0 overflow-hidden border-slate-200 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] rounded-2xl"
        >
          {/* Premium header */}
          <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#2C3E50] text-white">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.35),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.25),transparent_55%)]" />
            <div className="relative flex items-center gap-3">
              <UserAvatar
                name={identity.displayName}
                initials={identity.initials}
                src={identity.avatarUrl}
                size="lg"
                ring={ring as any}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold leading-tight truncate">
                  {identity.displayName}
                </div>
                <div className="mt-1.5">
                  <UserBadge label={identity.badge} size="xs" />
                </div>
                {identity.email && (
                  <div className="mt-1.5 text-[11px] text-white/55 truncate">
                    {identity.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: account */}
          <div className="p-1.5 bg-white">
            <div className={sectionLabel}>
              {t("account.section.you") || "Your account"}
            </div>
            <DropdownMenuItem onClick={() => navigate("/profile")} className={itemCls}>
              <UserIcon className="w-4 h-4 mr-2.5 text-slate-500 group-hover:text-[#2ECC71]" />
              {t("account.menu.profile") || "Profile"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/favorites")} className={itemCls}>
              <Heart className="w-4 h-4 mr-2.5 text-slate-500 group-hover:text-rose-500" />
              {t("account.menu.favorites") || "Favorites"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/alerts")} className={itemCls}>
              <Bell className="w-4 h-4 mr-2.5 text-slate-500 group-hover:text-amber-500" />
              {t("account.menu.alerts") || "Alerts"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/passport")} className={itemCls}>
              <Trophy className="w-4 h-4 mr-2.5 text-slate-500 group-hover:text-amber-500" />
              {t("account.menu.passport") || "Stadium Passport"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className={itemCls}>
              <SettingsIcon className="w-4 h-4 mr-2.5 text-slate-500" />
              {t("account.menu.settings") || "Settings"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/onboarding")} className={itemCls}>
              <Sparkles className="w-4 h-4 mr-2.5 text-slate-500 group-hover:text-violet-500" />
              {t("account.menu.personalize") || "Personalize"}
            </DropdownMenuItem>

            {isAdmin && (
              <>
                <DropdownMenuSeparator className="my-1" />
                <div className={sectionLabel}>
                  {t("account.section.staff") || "Staff"}
                </div>
                <DropdownMenuItem onClick={() => navigate("/admin")} className={itemCls}>
                  <Shield className="w-4 h-4 mr-2.5 text-emerald-600" />
                  {t("account.menu.admin") || "Admin"}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="group cursor-pointer rounded-lg px-2.5 py-2 text-sm text-rose-600 hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              {t("account.menu.signout") || "Sign out"}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openAuth()}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 text-[#2C3E50] text-xs font-bold px-3.5 py-2 hover:bg-slate-50 transition-colors"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{t("account.menu.signin") || "Sign in"}</span>
    </button>
  );
};
