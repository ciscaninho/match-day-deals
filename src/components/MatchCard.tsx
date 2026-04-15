import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import type { Match } from "@/data/matches";
import { Calendar, MapPin } from "lucide-react";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

export const MatchCard = ({ match }: { match: Match }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-border"
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {match.competition}
          </span>
          <TicketStatusBadge status={match.ticketStatus} />
        </div>

        <div className="text-center py-3">
          <p className="text-lg font-bold text-foreground">
            {match.homeTeam}
          </p>
          <span className="text-xs font-semibold text-muted-foreground">vs</span>
          <p className="text-lg font-bold text-foreground">
            {match.awayTeam}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(match.date)} · {formatTime(match.date)}</span>
          </div>
          {match.startingPrice && (
            <span className="font-semibold text-primary">
              From €{match.startingPrice}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{match.stadium}, {match.city}</span>
        </div>
      </CardContent>
    </Card>
  );
};
