import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useMatches } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Match } from "@/data/matches";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CalendarPage = () => {
  const navigate = useNavigate();
  const { data: matches = [], isLoading } = useMatches();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const matchesByDay = useMemo(() => {
    const map: Record<number, Match[]> = {};
    matches.forEach((m) => {
      const d = new Date(m.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(m);
      }
    });
    return map;
  }, [matches, year, month]);


  const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12">
        <h1 className="text-xl font-bold text-foreground mb-4">Match Calendar</h1>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            {MONTHS[month]} {year}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dayMatches = day ? matchesByDay[day] : undefined;
            const hasMatches = dayMatches && dayMatches.length > 0;

            return (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${
                  hasMatches
                    ? "bg-primary/10 cursor-pointer"
                    : ""
                } ${day ? "text-foreground" : ""}`}
              >
                {day && (
                  <>
                    <span className={`font-medium ${hasMatches ? "text-primary font-bold" : ""}`}>
                      {day}
                    </span>
                    {hasMatches && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayMatches.map((_, idx) => (
                          <div key={idx} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Matches for the month below */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-foreground mb-3">
            Matches in {MONTHS[month]}
          </h2>
          <div className="space-y-2">
            {isLoading && (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            )}
            {!isLoading && Object.entries(matchesByDay)
              .sort(([a], [b]) => Number(a) - Number(b))
              .flatMap(([, dayMatches]) =>
                dayMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/match/${m.id}`)}
                    className="w-full text-left bg-card border border-border rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {m.homeTeam} vs {m.awayTeam}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.date).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}{" "}
                        · {m.competition}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            {!isLoading && Object.keys(matchesByDay).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matches this month.
              </p>
            )}
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CalendarPage;
