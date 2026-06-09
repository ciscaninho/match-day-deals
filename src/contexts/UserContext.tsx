import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import type { User } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  matchId: string;
  type: "tickets_soon" | "on_sale" | "resale_available";
  title: string;
  message: string;
  read: boolean;
  date: string;
}

export interface PollAnswer {
  pollId: string;
  answer: string;
}

interface UserState {
  isPremium: boolean;
  points: number;
  followedMatches: string[];
  notifications: Notification[];
  pollAnswers: PollAnswer[];
  lastCheckIn: string | null;
}

interface UserContextType extends UserState {
  user: User | null;
  authLoading: boolean;
  togglePremium: () => void;
  refreshSubscription: () => Promise<void>;
  followMatch: (matchId: string) => boolean;
  unfollowMatch: (matchId: string) => void;
  isFollowing: (matchId: string) => boolean;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
  addPoints: (amount: number) => void;
  dailyCheckIn: () => boolean;
  canCheckInToday: boolean;
  answerPoll: (pollId: string, answer: string) => void;
  hasAnsweredPoll: (pollId: string) => boolean;
  maxFollowed: number;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<UserState>({
    isPremium: false,
    points: 0,
    followedMatches: [],
    // Notifications are DB-backed; until a notifications system is implemented,
    // this stays empty. No mock data.
    notifications: [],
    pollAnswers: [],
    lastCheckIn: null,
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => authSub.unsubscribe();
  }, []);

  // --- Followed matches: DB-backed (saved_matches) ---
  const loadFollowed = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("saved_matches")
      .select("match_id")
      .eq("user_id", uid);
    const ids = (data || []).map((r: { match_id: string }) => r.match_id);
    setState((s) => ({ ...s, followedMatches: ids }));
  }, []);

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, followedMatches: [] }));
      return;
    }
    loadFollowed(user.id);
    const channel = supabase
      .channel(`saved_matches:user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_matches",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadFollowed(user.id),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFollowed]);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, isPremium: false }));
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .eq("environment", getPaddleEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let active = false;
    if (data) {
      const end = data.current_period_end ? new Date(data.current_period_end).getTime() : null;
      const future = end === null || end > Date.now();
      if (["active", "trialing", "past_due"].includes(data.status) && future) active = true;
      else if (data.status === "canceled" && end !== null && end > Date.now()) active = true;
    }
    setState((s) => ({ ...s, isPremium: active }));
  }, [user]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Realtime updates on subscriptions for current user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => refreshSubscription(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshSubscription]);

  const maxFollowed = state.isPremium ? Infinity : 3;

  const togglePremium = useCallback(() => {
    setState((s) => ({ ...s, isPremium: !s.isPremium }));
  }, []);

  const followMatch = useCallback(
    (matchId: string): boolean => {
      if (!user) return false;
      let allowed = false;
      setState((s) => {
        if (s.followedMatches.includes(matchId)) return s;
        const max = s.isPremium ? Infinity : 3;
        if (s.followedMatches.length >= max) return s;
        allowed = true;
        return { ...s, followedMatches: [...s.followedMatches, matchId] };
      });
      if (!allowed) return false;
      supabase
        .from("saved_matches")
        .insert({ user_id: user.id, match_id: matchId, alerts_enabled: true })
        .then(({ error }) => {
          if (error && !String(error.message).toLowerCase().includes("duplicate")) {
            // Revert optimistic add on failure
            setState((s) => ({
              ...s,
              followedMatches: s.followedMatches.filter((id) => id !== matchId),
            }));
          }
        });
      return true;
    },
    [user]
  );

  const unfollowMatch = useCallback((matchId: string) => {
    if (!user) return;
    setState((s) => ({
      ...s,
      followedMatches: s.followedMatches.filter((id) => id !== matchId),
    }));
    supabase
      .from("saved_matches")
      .delete()
      .eq("user_id", user.id)
      .eq("match_id", matchId)
      .then(({ error }) => {
        if (error) {
          // Revert on failure
          setState((s) =>
            s.followedMatches.includes(matchId)
              ? s
              : { ...s, followedMatches: [...s.followedMatches, matchId] }
          );
        }
      });
  }, [user]);

  const isFollowing = useCallback(
    (matchId: string) => state.followedMatches.includes(matchId),
    [state.followedMatches]
  );

  // Notifications: no mock data. APIs preserved for callers; no-ops until backed.
  const markNotificationRead = useCallback((_id: string) => {
    // Intentionally a no-op until a real notifications system exists.
  }, []);

  const unreadCount = 0;

  const addPoints = useCallback((amount: number) => {
    setState((s) => ({ ...s, points: s.points + amount }));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const canCheckInToday = state.lastCheckIn !== today;

  const dailyCheckIn = useCallback((): boolean => {
    const t = new Date().toISOString().split("T")[0];
    let success = false;
    setState((s) => {
      if (s.lastCheckIn === t) return s;
      success = true;
      return { ...s, lastCheckIn: t, points: s.points + 10 };
    });
    return success;
  }, []);

  const answerPoll = useCallback((pollId: string, answer: string) => {
    setState((s) => {
      if (s.pollAnswers.find((a) => a.pollId === pollId)) return s;
      return {
        ...s,
        pollAnswers: [...s.pollAnswers, { pollId, answer }],
        points: s.points + 5,
      };
    });
  }, []);

  const hasAnsweredPoll = useCallback(
    (pollId: string) => !!state.pollAnswers.find((a) => a.pollId === pollId),
    [state.pollAnswers]
  );

  return (
    <UserContext.Provider
      value={{
        ...state,
        user,
        authLoading,
        togglePremium,
        refreshSubscription,
        followMatch,
        unfollowMatch,
        isFollowing,
        markNotificationRead,
        unreadCount,
        addPoints,
        dailyCheckIn,
        canCheckInToday,
        answerPoll,
        hasAnsweredPoll,
        maxFollowed,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
