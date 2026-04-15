import { useState, useMemo } from "react";
import { MatchCard } from "@/components/MatchCard";
import { BottomNav } from "@/components/BottomNav";
import { matches } from "@/data/matches";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const competitions = [...new Set(matches.map((m) => m.competition))];
const teams = [...new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam]))].sort();

const MatchesPage = () => {
  const [search, setSearch] = useState("");
  const [competition, setCompetition] = useState("all");
  const [team, setTeam] = useState("all");

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q);
        const matchesComp = competition === "all" || m.competition === competition;
        const matchesTeam =
          team === "all" || m.homeTeam === team || m.awayTeam === team;
        return matchesSearch && matchesComp && matchesTeam;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [search, competition, team]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-foreground mb-4">All Matches</h1>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 mb-4">
          <Select value={competition} onValueChange={setCompetition}>
            <SelectTrigger className="flex-1 text-xs h-9">
              <SelectValue placeholder="Competition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitions</SelectItem>
              {competitions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="flex-1 text-xs h-9">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} match{filtered.length !== 1 ? "es" : ""} found
        </p>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {filtered.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No matches found.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MatchesPage;
