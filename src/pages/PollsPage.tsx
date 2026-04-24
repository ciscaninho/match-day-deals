import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { BarChart3, Check } from "lucide-react";
import { toast } from "sonner";

interface Poll {
  id: string;
  question: string;
  options: string[];
}

const polls: Poll[] = [
  {
    id: "poll1",
    question: "Which match would you like to attend most?",
    options: [
      "FC Barcelona vs Real Madrid",
      "Liverpool vs Manchester United",
      "Bayern Munich vs Borussia Dortmund",
      "AC Milan vs Inter Milan",
    ],
  },
  {
    id: "poll2",
    question: "What's most important when buying tickets?",
    options: ["Price", "Seat location", "Easy process", "Refund policy"],
  },
];

const PollsPage = () => {
  const { answerPoll, hasAnsweredPoll, pollAnswers } = useUser();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const handleVote = (pollId: string) => {
    const answer = selected[pollId];
    if (!answer) return;
    answerPoll(pollId, answer);
    toast.success("+5 points! Thanks for voting.");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Polls
        </h1>

        <div className="space-y-4">
          {polls.map((poll) => {
            const answered = hasAnsweredPoll(poll.id);
            const userAnswer = pollAnswers.find((a) => a.pollId === poll.id)?.answer;

            return (
              <Card key={poll.id}>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-bold text-foreground">{poll.question}</p>
                  <div className="space-y-2">
                    {poll.options.map((opt) => (
                      <button
                        key={opt}
                        disabled={answered}
                        onClick={() => setSelected((s) => ({ ...s, [poll.id]: opt }))}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                          answered && userAnswer === opt
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : selected[poll.id] === opt
                            ? "border-primary/50 bg-primary/5 text-foreground"
                            : "border-border text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          {opt}
                          {answered && userAnswer === opt && <Check className="w-4 h-4 text-primary" />}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!answered && (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      disabled={!selected[poll.id]}
                      onClick={() => handleVote(poll.id)}
                    >
                      Vote (+5 pts)
                    </Button>
                  )}
                  {answered && (
                    <p className="text-xs text-muted-foreground text-center">Thanks for voting!</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PollsPage;
