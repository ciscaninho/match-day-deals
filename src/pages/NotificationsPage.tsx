import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Ticket, AlertCircle, ShoppingBag } from "lucide-react";

const iconMap = {
  tickets_soon: AlertCircle,
  on_sale: Ticket,
  resale_available: ShoppingBag,
};

const NotificationsPage = () => {
  const { notifications, markNotificationRead } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notifications
        </h1>

        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
        )}

        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            return (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
                onClick={() => {
                  markNotificationRead(n.id);
                  navigate(`/match/${n.matchId}`);
                }}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      !n.read ? "bg-primary/15" : "bg-muted"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
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

export default NotificationsPage;
