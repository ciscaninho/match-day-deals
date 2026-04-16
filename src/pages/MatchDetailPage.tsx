import { useParams, useNavigate } from "react-router-dom";
import { matches } from "@/data/matches";
import { useUser } from "@/contexts/UserContext";
import { BottomNav } from "@/components/BottomNav";
import { AdBanner } from "@/components/AdBanner";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Clock, ExternalLink, Ticket, Heart, Mail, Star, HelpCircle } from "lucide-react";
import { toast } from "sonner";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const MatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFollowing, followMatch, unfollowMatch, isPremium, maxFollowed, followedMatches, addPoints } = useUser();
  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">Match not found.</p>
        <BottomNav />
      </div>
    );
  }

  const following = isFollowing(match.id);

  const handleFollow = () => {
    if (following) {
      unfollowMatch(match.id);
      toast("Match unfollowed");
    } else {
      if (!isPremium && followedMatches.length >= maxFollowed) {
        toast.error(`Free users can follow max ${maxFollowed} matches. Go Premium for unlimited!`);
        return;
      }
      const ok = followMatch(match.id);
      if (ok) {
        toast.success("Match followed! +5 pts");
        // Points for visiting match page
        addPoints(2);
      }
    }
  };

  const handleNeedHelp = () => {
    const subject = encodeURIComponent("Ticket support request");
    const body = encodeURIComponent(
      `Match: ${match.homeTeam} vs ${match.awayTeam}\nCompetition: ${match.competition}\nDate: ${formatDate(match.date)}\nStadium: ${match.stadium}, ${match.city}\n\nI need help with:`
    );
    window.open(`mailto:support@footticketfinder.com?subject=${subject}&body=${body}`);
  };

  const officialSources = match.ticketSources.filter((s) => s.type === "official");
  const resaleSources = match.ticketSources.filter((s) => s.type === "resale");
  const recommended = match.ticketSources.find((s) => s.recommended);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={handleFollow} className={`flex items-center gap-1 text-sm ${following ? "text-destructive" : "text-primary-foreground/70"}`}>
            <Heart className={`w-4 h-4 ${following ? "fill-current" : ""}`} />
            {following ? "Following" : "Follow"}
          </button>
        </div>
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

        {/* Where to Buy — Partner-ready structure */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Where to buy tickets
            </h3>

            {officialSources.length > 0 && (
              <>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Official</p>
                {officialSources.map((src) => (
                  <Button
                    key={src.url}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(src.url, "_blank")}
                  >
                    <span className="flex items-center gap-2">
                      {src.name}
                      {src.recommended && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" /> Recommended
                        </span>
                      )}
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                ))}
              </>
            )}

            {resaleSources.length > 0 && (
              <>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-2">Resale</p>
                {resaleSources.map((src) => (
                  <Button
                    key={src.url}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(src.url, "_blank")}
                  >
                    {src.name}
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        {recommended && (
          <Button className="w-full gap-2" size="lg" onClick={() => window.open(recommended.url, "_blank")}>
            Go to official ticket site
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}

        <AdBanner variant="detail" />

        {/* Need Help */}
        <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={handleNeedHelp}>
          <HelpCircle className="w-4 h-4" /> Need help finding tickets?
          <Mail className="w-4 h-4 ml-auto" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchDetailPage;
