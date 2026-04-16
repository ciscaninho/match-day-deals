export interface NewsItem {
  id: string;
  title: string;
  category: "trending" | "tickets" | "highlight";
  emoji: string;
  description: string;
}

export const newsItems: NewsItem[] = [
  {
    id: "news1",
    title: "El Clásico tickets selling fast",
    category: "tickets",
    emoji: "🔥",
    description: "FC Barcelona vs Real Madrid — official tickets almost gone.",
  },
  {
    id: "news2",
    title: "Champions League semis announced",
    category: "highlight",
    emoji: "🏆",
    description: "Real Madrid vs Bayern & Arsenal vs PSG confirmed.",
  },
  {
    id: "news3",
    title: "Derby della Madonnina tickets soon",
    category: "tickets",
    emoji: "🎟️",
    description: "AC Milan vs Inter tickets releasing April 20.",
  },
  {
    id: "news4",
    title: "Premier League title race heats up",
    category: "trending",
    emoji: "⚡",
    description: "Man City vs Arsenal could decide the league.",
  },
  {
    id: "news5",
    title: "Bundesliga Der Klassiker this week",
    category: "highlight",
    emoji: "⚽",
    description: "Bayern Munich hosts Borussia Dortmund in Munich.",
  },
  {
    id: "news6",
    title: "International friendlies scheduled",
    category: "trending",
    emoji: "🌍",
    description: "France vs Germany and England vs Spain coming in June.",
  },
];
