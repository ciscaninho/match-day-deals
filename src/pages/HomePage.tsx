import { useNavigate } from "react-router-dom";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { matches } from "@/data/matches";
import { Search, ArrowRight } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const featured = matches.filter((m) => m.featured);

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
        <Button
          variant="secondary"
          className="mt-4 gap-2"
          onClick={() => navigate("/matches")}
        >
          <Search className="w-4 h-4" />
          Browse all matches
        </Button>
      </div>

      {/* Featured */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Featured Matches</h2>
          <button
            onClick={() => navigate("/matches")}
            className="text-xs font-medium text-primary flex items-center gap-1"
          >
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
        <Button
          className="w-full gap-2"
          onClick={() => navigate("/calendar")}
        >
          Open Match Calendar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default HomePage;
