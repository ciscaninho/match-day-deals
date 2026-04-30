import { Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuthGate } from "./AuthGate";
import { LogIn, User as UserIcon } from "lucide-react";

export const HeaderAuthButton = () => {
  const { user } = useUser();
  const { openAuth } = useAuthGate();

  if (user) {
    return (
      <Link
        to="/app/profile"
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 text-[#2C3E50] text-xs font-bold px-3.5 py-2 hover:bg-slate-50 transition-colors"
      >
        <UserIcon className="w-3.5 h-3.5" />
        Account
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openAuth()}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 text-[#2C3E50] text-xs font-bold px-3.5 py-2 hover:bg-slate-50 transition-colors"
    >
      <LogIn className="w-3.5 h-3.5" />
      Sign in
    </button>
  );
};
