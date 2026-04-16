import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Star, Heart, Bell, ArrowRight } from "lucide-react";

const ProfilePage = () => {
  const { isPremium, points, followedMatches, unreadCount } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12">
        <h1 className="text-xl font-bold text-foreground mb-6">Profile</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{points}</p>
              <p className="text-[10px] text-muted-foreground">Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Heart className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{followedMatches.length}</p>
              <p className="text-[10px] text-muted-foreground">Following</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Bell className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{unreadCount}</p>
              <p className="text-[10px] text-muted-foreground">Unread</p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Status */}
        <Card className={isPremium ? "border-accent/40 bg-accent/5" : ""}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${isPremium ? "text-accent-foreground" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isPremium ? "Premium Member" : "Free Plan"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? "All features unlocked" : "Upgrade for full access"}
                </p>
              </div>
            </div>
            <Button size="sm" variant={isPremium ? "outline" : "default"} className="text-xs" onClick={() => navigate("/premium")}>
              {isPremium ? "Manage" : "Upgrade"} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="mt-4 space-y-2">
          {[
            { label: "Notifications", path: "/notifications", icon: Bell },
            { label: "Polls", path: "/polls", icon: Star },
          ].map((item) => (
            <Card key={item.path} className="cursor-pointer" onClick={() => navigate(item.path)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
