import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

export interface UserIdentity {
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  email: string;
  badge: string | null;
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const cleanName = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Reject email-looking values
  if (trimmed.includes("@")) return null;
  return trimmed;
};

const buildInitials = (name: string): string => {
  const parts = name.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "F";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const fallbackFromEmail = (email: string): string => {
  const local = email.split("@")[0] || "";
  // Strip numbers/dots, capitalize
  const cleaned = local.replace(/[._\d]+/g, " ").trim();
  if (!cleaned) return "Football Fan";
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

interface ProfileRow {
  display_name: string | null;
  avatar_url: string | null;
}

export const useUserIdentity = (): UserIdentity => {
  const { user, isPremium } = useUser();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: prof }, { data: roleRow }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setProfile(prof ?? null);
      setIsAdmin(!!roleRow);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const email = user?.email || "";
  const metaName =
    cleanName((user?.user_metadata as any)?.display_name) ||
    cleanName((user?.user_metadata as any)?.full_name) ||
    cleanName((user?.user_metadata as any)?.name);

  const displayName =
    cleanName(profile?.display_name) ||
    metaName ||
    (email ? fallbackFromEmail(email) : "Football Fan");

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    null;

  let badge: string | null = null;
  if (isAdmin) badge = "Moderator";
  else if (isPremium) badge = "Founding Supporter";
  else badge = "Football Explorer";

  return {
    displayName,
    initials: buildInitials(displayName),
    avatarUrl,
    email,
    badge,
    isPremium,
    isAdmin,
    loading,
  };
};
