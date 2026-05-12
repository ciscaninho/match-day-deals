import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGate } from "./AuthGate";
import { LogIn, User as UserIcon, Heart, Bell, Trophy, Settings as SettingsIcon, Shield, LogOut, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";

export const HeaderAuthButton = () => {
  const { user } = useUser();
  const { isAdmin, signOut } = useAuth();
  const { openAuth } = useAuthGate();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (user) {
    const email = user.email || "";
    const initial = (email[0] || "U").toUpperCase();
    const handleSignOut = async () => {
      await signOut();
      navigate("/", { replace: true });
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 text-[#2C3E50] text-xs font-bold pl-1.5 pr-3 py-1 hover:bg-slate-50 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-[#2ECC71] text-white text-[11px] font-extrabold flex items-center justify-center">
              {initial}
            </span>
            <span className="hidden sm:inline">{t("nav.account") || "Account"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-[60]">
          <DropdownMenuLabel className="truncate text-xs text-muted-foreground font-normal">
            {email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/app/home")}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/app/profile")}>
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/onboarding")}>
            <Sparkles className="w-4 h-4 mr-2" />
            Personalize
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
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
      <span className="hidden sm:inline">Sign in</span>
    </button>
  );
};
