export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface DailyQuiz {
  date: string;
  questions: QuizQuestion[];
}

// Mock quizzes — one per day cycling
export const quizzes: DailyQuiz[] = [
  {
    date: "2026-04-16",
    questions: [
      {
        id: "q1a",
        question: "Which club has won the most Champions League titles?",
        options: ["AC Milan", "Real Madrid", "Liverpool", "Barcelona"],
        correctIndex: 1,
      },
      {
        id: "q1b",
        question: "In which city is the Camp Nou located?",
        options: ["Madrid", "Lisbon", "Barcelona", "Milan"],
        correctIndex: 2,
      },
      {
        id: "q1c",
        question: "Who won the 2022 FIFA World Cup?",
        options: ["France", "Brazil", "Argentina", "Germany"],
        correctIndex: 2,
      },
      {
        id: "q1d",
        question: "Which league is known as 'Serie A'?",
        options: ["Spain", "France", "Italy", "Germany"],
        correctIndex: 2,
      },
    ],
  },
  {
    date: "2026-04-17",
    questions: [
      {
        id: "q2a",
        question: "What is the capacity of Wembley Stadium?",
        options: ["60,000", "75,000", "90,000", "100,000"],
        correctIndex: 2,
      },
      {
        id: "q2b",
        question: "Which country has won the most World Cups?",
        options: ["Germany", "Italy", "Argentina", "Brazil"],
        correctIndex: 3,
      },
      {
        id: "q2c",
        question: "Who is the all-time top scorer in Premier League history?",
        options: ["Wayne Rooney", "Alan Shearer", "Thierry Henry", "Sergio Agüero"],
        correctIndex: 1,
      },
      {
        id: "q2d",
        question: "Which club plays at Anfield?",
        options: ["Everton", "Liverpool", "Manchester United", "Arsenal"],
        correctIndex: 1,
      },
    ],
  },
  {
    date: "2026-04-18",
    questions: [
      {
        id: "q3a",
        question: "What year was the first FIFA World Cup held?",
        options: ["1926", "1930", "1934", "1950"],
        correctIndex: 1,
      },
      {
        id: "q3b",
        question: "Which club is nicknamed 'The Old Lady'?",
        options: ["AC Milan", "Inter Milan", "Juventus", "AS Roma"],
        correctIndex: 2,
      },
      {
        id: "q3c",
        question: "How many players are on a football team?",
        options: ["9", "10", "11", "12"],
        correctIndex: 2,
      },
      {
        id: "q3d",
        question: "Which competition is Der Klassiker part of?",
        options: ["La Liga", "Serie A", "Bundesliga", "Ligue 1"],
        correctIndex: 2,
      },
    ],
  },
];

export const getTodaysQuiz = (): DailyQuiz => {
  // Cycle through quizzes based on day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return quizzes[dayOfYear % quizzes.length];
};
