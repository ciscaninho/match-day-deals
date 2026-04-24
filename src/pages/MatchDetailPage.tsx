import { useParams, useNavigate } from "react-router-dom";
import { useMatch } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { BottomNav } from "@/components/BottomNav";
import { AdBanner } from "@/components/AdBanner";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Clock, ExternalLink, Ticket, Heart, Mail, Star, HelpCircle, Shield } from "lucide-react";
import { toast } from "sonner";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const sourceTypeLabel: Record<string, { label: string; color: string }> = {
  official: { label: "Official", color: "bg-primary/15 text-primary" },
  resale: { label: "Official Resale", color: "bg-accent/15 text-accent" },
  partner: { label: "Partner", color: "bg-secondary text-muted-foreground" },
};

const MatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFollowing, followMatch, unfollowMatch, isPremium, maxFollowed, followedMatches, addPoints } = useUser();
  const { t } = useLanguage();
  const { data: match, isLoading, isError } = useMatch(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-5 pt-12 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <BottomNav />
      </div>
    );
  }

  if (isError || !match) {
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
  const partnerSources = match.ticketSources.filter((s) => s.type === "partner");
  const recommended = match.ticketSources.find((s) => s.recommended);

  const renderSources = (sources: typeof match.ticketSources, typeKey: string) => {
    if (sources.length === 0) return null;
    const config = sourceTypeLabel[typeKey];
    return (
      <>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${config.color}`}>
            {config.label}
          </span>
        </div>
        {sources.map((src) => (
          <Button
            key={src.url}
            variant="outline"
            className="w-full justify-between border-border/50 hover:border-primary/30"
            onClick={() => window.open(src.url, "_blank")}
          >
            <span className="flex items-center gap-2 text-sm">
              {src.name}
              {src.recommended && (
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" /> {t("match.recommended")}
                </span>
              )}
            </span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Button>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-pitch pitch-pattern px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 text-sm">
              <ArrowLeft className="w-4 h-4" /> {t("back")}
            </button>
            <button onClick={handleFollow} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${following ? "bg-destructive/20 text-destructive" : "bg-primary-foreground/10 text-primary-foreground/70"}`}>
              <Heart className={`w-4 h-4 ${following ? "fill-current" : ""}`} />
              {following ? t("match.following") : t("match.follow")}
            </button>
          </div>
          <span className="text-[10px] font-semibold text-primary-foreground/50 uppercase tracking-widest">
            {match.competition}
          </span>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-primary-foreground">{match.homeShort}</span>
              </div>
              <p className="text-sm font-bold text-primary-foreground">{match.homeTeam}</p>
            </div>
            <span className="text-lg font-extrabold text-primary-foreground/30">{t("match.vs")}</span>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-primary-foreground">{match.awayShort}</span>
              </div>
              <p className="text-sm font-bold text-primary-foreground">{match.awayTeam}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Info */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{formatDate(match.date)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(match.date)}</p>
              </div>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{match.stadium}</p>
                <p className="text-xs text-muted-foreground">{match.city}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Info */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{t("match.ticket_info")}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("match.status")}</span>
              <TicketStatusBadge status={match.ticketStatus} />
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("match.starting_price")}</span>
              <span className="text-sm font-bold text-foreground">
                {match.startingPrice ? `€${match.startingPrice}` : "TBA"}
              </span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("match.release_date")}</p>
                <p className="text-sm font-medium text-foreground">{formatDate(match.ticketReleaseDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Where to Buy */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" /> {t("match.where_to_buy")}
            </h3>
            {renderSources(officialSources, "official")}
            {renderSources(resaleSources, "resale")}
            {renderSources(partnerSources, "partner")}
          </CardContent>
        </Card>

        {/* CTA */}
        {recommended && (
          <Button className="w-full gap-2 font-semibold" size="lg" onClick={() => window.open(recommended.url, "_blank")}>
            <Shield className="w-4 h-4" /> {t("match.go_official")}
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}

        <AdBanner variant="detail" />

        {/* Need Help */}
        <Button variant="outline" className="w-full gap-2 text-muted-foreground border-border/50" onClick={handleNeedHelp}>
          <HelpCircle className="w-4 h-4" /> {t("match.need_help")}
          <Mail className="w-4 h-4 ml-auto" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchDetailPage;
