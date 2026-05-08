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
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Heart,
  Mail,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { TicketProviders } from "@/components/TicketProviders";
import { MatchContextLinks } from "@/components/match/MatchContextLinks";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const MatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    isFollowing,
    followMatch,
    unfollowMatch,
    isPremium,
    maxFollowed,
    followedMatches,
    addPoints,
  } = useUser();
  const { t } = useLanguage();
  const { data: match, isLoading, isError } = useMatch(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-12 space-y-4">
        <Skeleton className="h-48 w-full" />
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
      `Match: ${match.homeTeam} vs ${match.awayTeam}\nCompetition: ${match.competition}\nDate: ${formatDate(match.date)}\nStadium: ${match.stadium}, ${match.city}\n\nI need help with:`,
    );
    window.open(`mailto:support@footticketfinder.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="gradient-pitch pitch-pattern px-5 pt-10 pb-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-primary-foreground/70 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> {t("back")}
            </button>
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                following
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary-foreground/10 text-primary-foreground/80"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${following ? "fill-current" : ""}`} />
              {following ? t("match.following") : t("match.follow")}
            </button>
          </div>

          <div className="text-center">
            <span className="inline-block text-[10px] font-semibold text-primary-foreground/55 uppercase tracking-widest">
              {match.competition}
            </span>
          </div>

          <div className="flex items-center justify-center gap-5 mt-5">
            <div className="text-center flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center mx-auto mb-2.5 backdrop-blur-sm">
                <span className="text-base font-extrabold text-primary-foreground">
                  {match.homeShort}
                </span>
              </div>
              <p className="text-sm font-bold text-primary-foreground truncate">{match.homeTeam}</p>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <span className="text-xs font-bold text-primary-foreground/35 uppercase tracking-wider">
                {t("match.vs")}
              </span>
            </div>
            <div className="text-center flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center mx-auto mb-2.5 backdrop-blur-sm">
                <span className="text-base font-extrabold text-primary-foreground">
                  {match.awayShort}
                </span>
              </div>
              <p className="text-sm font-bold text-primary-foreground truncate">{match.awayTeam}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-primary-foreground/70">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">{formatDate(match.date)}</span>
            <span className="text-primary-foreground/30">·</span>
            <span>{formatTime(match.date)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-4 relative z-10">
        {/* Stadium card */}
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{match.stadium}</p>
              <p className="text-xs text-muted-foreground truncate">{match.city}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Info */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{t("match.ticket_info")}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
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
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {t("match.release_date")}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(match.ticketReleaseDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Where to Buy */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" /> {t("match.where_to_buy")}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Always check the club's official ticket office first. Resale marketplaces are listed for comparison only.
            </p>
            <TicketProviders homeTeam={match.homeTeam} awayTeam={match.awayTeam} compact />
          </CardContent>
        </Card>

        {/* Deep links: club guides + stadium guide + official CTA */}
        <div className="-mx-5">
          <MatchContextLinks
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            stadiumName={match.stadium}
            variant="light"
          />
        </div>

        <AdBanner variant="detail" />

        {/* Need Help */}
        <Button
          variant="outline"
          className="w-full gap-2 text-muted-foreground border-border/50"
          onClick={handleNeedHelp}
        >
          <HelpCircle className="w-4 h-4" /> {t("match.need_help")}
          <Mail className="w-4 h-4 ml-auto" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchDetailPage;
