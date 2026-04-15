import { useParams, useNavigate } from "react-router-dom";
import { matches } from "@/data/matches";
import { BottomNav } from "@/components/BottomNav";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Clock, ExternalLink, Ticket } from "lucide-react";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const MatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Match not found.</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary px-5 pt-10 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-primary-foreground/70 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-medium text-primary-foreground/60 uppercase tracking-wide">
          {match.competition}
        </span>
        <div className="text-center mt-3">
          <p className="text-xl font-bold text-primary-foreground">{match.homeTeam}</p>
          <span className="text-sm text-primary-foreground/50 font-medium">vs</span>
          <p className="text-xl font-bold text-primary-foreground">{match.awayTeam}</p>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{formatDate(match.date)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(match.date)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{match.stadium}</p>
                <p className="text-xs text-muted-foreground">{match.city}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Ticket Information</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <TicketStatusBadge status={match.ticketStatus} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Starting Price</span>
              <span className="text-sm font-semibold text-foreground">
                {match.startingPrice ? `€${match.startingPrice}` : "TBA"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Ticket Release Date</p>
                <p className="text-sm font-medium text-foreground">{formatDate(match.ticketReleaseDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Where to Buy */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Where to buy tickets
            </h3>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open(match.officialTicketUrl, "_blank")}
            >
              Official Club Ticketing
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open(match.resaleUrl, "_blank")}
            >
              Official Resale Platform
              <ExternalLink className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => window.open(match.officialTicketUrl, "_blank")}
        >
          Go to official ticket site
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchDetailPage;
