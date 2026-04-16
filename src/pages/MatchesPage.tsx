import { useState, useMemo } from "react";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import { AdBanner } from "@/components/AdBanner";
import { matches, competitions, countries } from "@/data/matches";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const teams = [...new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam]))].sort();

const MatchesPage = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [competition, setCompetition] = useState("all");
  const [country, setCountry] = useState("all");
  const [team, setTeam] = useState("all");

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q);
        const matchesComp = competition === "all" || m.competition === competition;
        const matchesCountry = country === "all" || m.country === country;
        const matchesTeam = team === "all" || m.homeTeam === team || m.awayTeam === team;
        return matchesSearch && matchesComp && matchesCountry && matchesTeam;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [search, competition, country, team]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-4">{t("matches.title")}</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("matches.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border/50" />
        </div>
        <div className="flex gap-2 mb-2">
          <Select value={competition} onValueChange={setCompetition}>
            <SelectTrigger className="flex-1 text-xs h-9 bg-secondary border-border/50"><SelectValue placeholder="Competition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("matches.all_competitions")}</SelectItem>
              {competitions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="flex-1 text-xs h-9 bg-secondary border-border/50"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 mb-3">
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="flex-1 text-xs h-9 bg-secondary border-border/50"><SelectValue placeholder="Team" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("matches.all_teams")}</SelectItem>
              {teams.map((te) => (<SelectItem key={te} value={te}>{te}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} {filtered.length !== 1 ? t("matches.found") : t("matches.found_one")}
        </p>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {filtered.map((match, i) => (
          <div key={match.id}>
            <MatchCard match={match} />
            {(i + 1) % 3 === 0 && i < filtered.length - 1 && <AdBanner variant="inline" />}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t("matches.none")}</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchesPage;
