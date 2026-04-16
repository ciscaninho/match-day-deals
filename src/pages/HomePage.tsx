import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import { DailyReward } from "@/components/DailyReward";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { matches } from "@/data/matches";
import { Search, ArrowRight, Crown, Star } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const { isPremium } = useUser();
  const featured = matches.filter((m) => m.featured);
  const priority = matches.filter((m) => m.priority);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <div className="bg-primary px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold text-primary-foreground leading-tight">
          Find the best time<br />to buy football tickets
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-2">
          Track prices, release dates & availability for top European matches.
        </p>
        <Button variant="secondary" className="mt-4 gap-2" onClick={() => navigate("/matches")}>
          <Search className="w-4 h-4" /> Browse all matches
        </Button>
      </div>

      <AdBanner variant="banner" />

      {/* Daily Reward */}
      <div className="px-5 mt-4">
        <DailyReward />
      </div>

      {/* Premium CTA for free users */}
      {!isPremium && (
        <div className="px-5 mt-4">
          <button
            onClick={() => navigate("/premium")}
            className="w-full rounded-lg bg-accent/10 border border-accent/30 p-3 flex items-center gap-3"
          >
            <Crown className="w-5 h-5 text-accent-foreground" />
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Go Premium</p>
              <p className="text-xs text-muted-foreground">No ads, unlimited follows & more</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Priority Matches (Premium) */}
      {isPremium && priority.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-accent-foreground" />
            <h2 className="text-lg font-bold text-foreground">Priority Matches</h2>
          </div>
          <div className="flex flex-col gap-3">
            {priority.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Featured Matches</h2>
          <button onClick={() => navigate("/matches")} className="text-xs font-medium text-primary flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {featured.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>

      {/* Calendar CTA */}
      <div className="px-5 mt-8">
        <Button className="w-full gap-2" onClick={() => navigate("/calendar")}>
          Open Match Calendar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
