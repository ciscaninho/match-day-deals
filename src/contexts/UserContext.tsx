import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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
  togglePremium: () => void;
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

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    matchId: "1",
    type: "on_sale",
    title: "Tickets now on sale!",
    message: "FC Barcelona vs Real Madrid tickets are now available.",
    read: false,
    date: "2026-04-15T10:00:00",
  },
  {
    id: "n2",
    matchId: "4",
    type: "tickets_soon",
    title: "Tickets available soon",
    message: "AC Milan vs Inter Milan tickets release on April 20.",
    read: false,
    date: "2026-04-14T09:00:00",
  },
  {
    id: "n3",
    matchId: "6",
    type: "resale_available",
    title: "Resale available",
    message: "Liverpool vs Man United — resale tickets are now listed.",
    read: true,
    date: "2026-04-12T14:00:00",
  },
];

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<UserState>({
    isPremium: false,
    points: 25,
    followedMatches: ["1", "6"],
    notifications: INITIAL_NOTIFICATIONS,
    pollAnswers: [],
    lastCheckIn: null,
  });

  const maxFollowed = state.isPremium ? Infinity : 3;

  const togglePremium = useCallback(() => {
    setState((s) => ({ ...s, isPremium: !s.isPremium }));
  }, []);

  const followMatch = useCallback(
    (matchId: string): boolean => {
      let success = false;
      setState((s) => {
        if (s.followedMatches.includes(matchId)) return s;
        const max = s.isPremium ? Infinity : 3;
        if (s.followedMatches.length >= max) return s;
        success = true;
        return {
          ...s,
          followedMatches: [...s.followedMatches, matchId],
          points: s.points + 5,
        };
      });
      return success;
    },
    []
  );

  const unfollowMatch = useCallback((matchId: string) => {
    setState((s) => ({
      ...s,
      followedMatches: s.followedMatches.filter((id) => id !== matchId),
    }));
  }, []);

  const isFollowing = useCallback(
    (matchId: string) => state.followedMatches.includes(matchId),
    [state.followedMatches]
  );

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

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

  // Simulate a new notification after 30s for followed matches
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.followedMatches.includes("4")) {
        setState((s) => {
          if (s.notifications.find((n) => n.id === "n4")) return s;
          return {
            ...s,
            notifications: [
              {
                id: "n4",
                matchId: "4",
                type: "on_sale",
                title: "Tickets now on sale!",
                message: "AC Milan vs Inter Milan tickets just went on sale!",
                read: false,
                date: new Date().toISOString(),
              },
              ...s.notifications,
            ],
          };
        });
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [state.followedMatches]);

  return (
    <UserContext.Provider
      value={{
        ...state,
        togglePremium,
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
