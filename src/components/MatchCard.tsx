import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import type { Match } from "@/data/matches";
import { Calendar, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-all border-border/50 overflow-hidden group"
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <CardContent className="p-0">
        {/* Competition bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {match.competition}
          </span>
          <TicketStatusBadge status={match.ticketStatus} />
        </div>

        {/* Teams */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Home team */}
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {match.homeShort}
              </div>
              <p className="text-sm font-bold text-foreground leading-tight">
                {match.homeTeam}
              </p>
            </div>

            <span className="text-xs font-bold text-muted-foreground px-2">{t("match.vs")}</span>

            {/* Away team */}
            <div className="flex-1 flex items-center gap-3 justify-end text-right">
              <p className="text-sm font-bold text-foreground leading-tight">
                {match.awayTeam}
              </p>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {match.awayShort}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(match.date)} · {formatTime(match.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{match.city}</span>
            </div>
          </div>
          {match.startingPrice && (
            <span className="text-xs font-bold text-primary">
              {t("match.from")} €{match.startingPrice}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
