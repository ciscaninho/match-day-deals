import { useUser } from "@/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Check } from "lucide-react";
import { toast } from "sonner";

export const DailyReward = () => {
  const { canCheckInToday, dailyCheckIn, points } = useUser();

  const handleCheckIn = () => {
    if (dailyCheckIn()) {
      toast.success("+10 points! Daily reward claimed.");
    }
  };

  return (
    <Card className="border-dashed border-accent/40 bg-accent/5">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
            <Gift className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Daily Reward</p>
            <p className="text-xs text-muted-foreground">{points} pts total</p>
          </div>
        </div>
        {canCheckInToday ? (
          <Button size="sm" variant="outline" onClick={handleCheckIn} className="text-xs gap-1">
            <Gift className="w-3 h-3" /> Claim +10
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3" /> Claimed
          </span>
        )}
      </CardContent>
    </Card>
  );
};
