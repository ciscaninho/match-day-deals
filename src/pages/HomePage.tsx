import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import { DailyReward } from "@/components/DailyReward";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMatches } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { newsItems } from "@/data/news";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { Search, ArrowRight, Crown, Star, Zap, Ticket, Trophy, Flame } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const { isPremium } = useUser();
  const { t } = useLanguage();
  const { data: matches = [], isLoading, isError } = useMatches();
  const featured = matches.filter((m) => m.featured);
  const priority = matches.filter((m) => m.priority);
  const upcomingReleases = matches
    .filter((m) => m.ticketStatus === "not_released")
    .sort((a, b) => new Date(a.ticketReleaseDate).getTime() - new Date(b.ticketReleaseDate).getTime())
    .slice(0, 3);

  const streak = parseInt(localStorage.getItem("ftf_quiz_streak") || "0");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <div className="gradient-pitch pitch-pattern px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-primary-foreground/80">{t("app.name")}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-primary-foreground leading-tight whitespace-pre-line">
            {t("hero.title")}
          </h1>
          <p className="text-primary-foreground/50 text-sm mt-2 max-w-xs">
            {t("hero.subtitle")}
          </p>
          <Button variant="secondary" className="mt-4 gap-2 font-semibold" onClick={() => navigate("/app/matches")}>
            <Search className="w-4 h-4" /> {t("hero.cta")}
          </Button>
        </div>
      </div>

      <AdBanner variant="banner" />

      <div className="px-5 mt-4">
        <OnboardingBanner />
      </div>

      {/* Daily Quiz CTA */}
      <div className="px-5 mt-4">
        <Card
          className="cursor-pointer border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden"
          onClick={() => navigate("/app/daily-game")}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{t("home.daily_game")}</p>
              <p className="text-xs text-muted-foreground">{t("home.daily_game.desc")}</p>
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-accent">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs font-bold">{streak}</span>
                </div>
              )}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reward */}
      <div className="px-5 mt-3">
        <DailyReward />
      </div>

      {/* Premium CTA for free users */}
      {!isPremium && (
        <div className="px-5 mt-3">
          <button
            onClick={() => navigate("/app/premium")}
            className="w-full rounded-lg gradient-gold p-3 flex items-center gap-3"
          >
            <Crown className="w-5 h-5 text-accent-foreground" />
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-accent-foreground">{t("home.premium_cta")}</p>
              <p className="text-[11px] text-accent-foreground/70">{t("home.premium_desc")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-accent-foreground/60" />
          </button>
        </div>
      )}

      {/* Loading / error states */}
      {isLoading && (
        <div className="px-5 mt-6 flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && !isLoading && (
        <p className="px-5 mt-6 text-center text-sm text-destructive">
          {t("home.error_loading") || "Unable to load matches. Please try again."}
        </p>
      )}

      {/* Priority Matches (Premium) */}
      {isPremium && priority.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-accent" />
            <h2 className="text-base font-bold text-foreground">Priority Matches</h2>
          </div>
          <div className="flex flex-col gap-3">
            {priority.slice(0, 3).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Trending / Featured */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h2 className="text-base font-bold text-foreground">{t("home.trending")}</h2>
          </div>
          <button onClick={() => navigate("/app/matches")} className="text-xs font-medium text-primary flex items-center gap-1">
            {t("home.view_all")} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {featured.slice(0, 3).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>

      {/* Upcoming Ticket Releases */}
      {upcomingReleases.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4 text-ticket-soon" />
            <h2 className="text-base font-bold text-foreground">{t("home.upcoming_releases")}</h2>
          </div>
          <div className="space-y-2">
            {upcomingReleases.map((m) => (
              <Card key={m.id} className="cursor-pointer border-border/50 hover:border-accent/30 transition-colors" onClick={() => navigate(`/app/matches/${m.id}`)}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.homeTeam} vs {m.awayTeam}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Tickets release: {new Date(m.ticketReleaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* News / Highlights */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-foreground mb-3">{t("home.news")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {newsItems.map((news) => (
            <Card key={news.id} className="min-w-[200px] max-w-[200px] shrink-0 border-border/50">
              <CardContent className="p-3">
                <span className="text-lg">{news.emoji}</span>
                <p className="text-xs font-bold text-foreground mt-1.5 leading-tight">{news.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{news.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Calendar CTA */}
      <div className="px-5 mt-6 mb-4">
        <Button className="w-full gap-2" onClick={() => navigate("/app/calendar")}>
          Open Match Calendar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
