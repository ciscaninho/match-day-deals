import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTodaysQuiz } from "@/data/quiz";
import { ArrowLeft, Trophy, Flame, CheckCircle2, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const QuizPage = () => {
  const navigate = useNavigate();
  const { addPoints } = useUser();
  const { t } = useLanguage();
  const quiz = getTodaysQuiz();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [streak] = useState(() => {
    const saved = localStorage.getItem("ftf_quiz_streak");
    return saved ? parseInt(saved) : 0;
  });

  const alreadyPlayed = localStorage.getItem("ftf_quiz_date") === new Date().toISOString().split("T")[0];

  const selectAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.includes(null)) {
      toast.error("Answer all questions first!");
      return;
    }
    setSubmitted(true);
    const score = quiz.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const pts = score * 5;
    addPoints(pts);

    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("ftf_quiz_date", today);

    const lastDate = localStorage.getItem("ftf_quiz_last_day");
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = lastDate === yesterday ? streak + 1 : 1;
    localStorage.setItem("ftf_quiz_streak", String(newStreak));
    localStorage.setItem("ftf_quiz_last_day", today);

    toast.success(`+${pts} points earned!`);
  };

  const score = submitted
    ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  if (alreadyPlayed && !submitted) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-5 pt-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </button>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("quiz.title")}</h1>
            <p className="text-muted-foreground text-sm mt-2">{t("quiz.play_again")}</p>
            {streak > 0 && (
              <div className="flex items-center justify-center gap-2 mt-4 text-accent">
                <Flame className="w-5 h-5" />
                <span className="font-bold">{streak} {t("quiz.streak")}</span>
              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-pitch px-5 pt-10 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-primary-foreground/70 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">{t("quiz.title")}</h1>
            <p className="text-sm text-primary-foreground/60">
              {t("quiz.question_of", { current: String(currentQ + 1), total: String(quiz.questions.length) })}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-accent bg-accent/10 px-3 py-1 rounded-full">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{streak}</span>
            </div>
          )}
        </div>
        {/* Progress */}
        <div className="flex gap-1.5 mt-4">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                submitted
                  ? answers[i] === quiz.questions[i].correctIndex
                    ? "bg-primary"
                    : "bg-destructive"
                  : answers[i] !== null
                  ? "bg-primary-foreground/60"
                  : "bg-primary-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {!submitted ? (
          <>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="text-base font-semibold text-foreground mb-4">
                  {quiz.questions[currentQ].question}
                </p>
                <div className="space-y-2">
                  {quiz.questions[currentQ].options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(currentQ, oi)}
                      className={`w-full text-left p-3 rounded-lg border text-sm font-medium transition-all ${
                        answers[currentQ] === oi
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-muted-foreground/30"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(currentQ - 1)}
              >
                Previous
              </Button>
              {currentQ < quiz.questions.length - 1 ? (
                <Button
                  className="flex-1"
                  disabled={answers[currentQ] === null}
                  onClick={() => setCurrentQ(currentQ + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="flex-1 gap-2"
                  disabled={answers.includes(null)}
                  onClick={handleSubmit}
                >
                  <Zap className="w-4 h-4" /> {t("quiz.submit")}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {t("quiz.score", { score: String(score), total: String(quiz.questions.length) })}
              </h2>
              <p className="text-sm text-primary mt-1">
                {t("quiz.points_earned", { points: String(score * 5) })}
              </p>
            </div>

            {quiz.questions.map((q, i) => (
              <Card key={q.id} className={`border-l-4 ${answers[i] === q.correctIndex ? "border-l-primary" : "border-l-destructive"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {answers[i] === q.correctIndex ? (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      <p className="text-xs text-primary mt-1">✓ {q.options[q.correctIndex]}</p>
                      {answers[i] !== q.correctIndex && (
                        <p className="text-xs text-destructive">✗ {q.options[answers[i]!]}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default QuizPage;
