import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Search, Sparkles, Bell, Heart, TrendingDown, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";
import { useSEO } from "@/lib/seo";

const TEAMS: { id: string; name: string; emoji: string; league: string }[] = [
  { id: "real-madrid", name: "Real Madrid", emoji: "👑", league: "La Liga" },
  { id: "fc-barcelona", name: "FC Barcelona", emoji: "🔵", league: "La Liga" },
  { id: "atletico-madrid", name: "Atlético Madrid", emoji: "🔴", league: "La Liga" },
  { id: "liverpool", name: "Liverpool", emoji: "🔴", league: "Premier League" },
  { id: "manchester-united", name: "Manchester United", emoji: "🔴", league: "Premier League" },
  { id: "manchester-city", name: "Manchester City", emoji: "🔵", league: "Premier League" },
  { id: "arsenal", name: "Arsenal", emoji: "🔴", league: "Premier League" },
  { id: "chelsea", name: "Chelsea", emoji: "🔵", league: "Premier League" },
  { id: "tottenham", name: "Tottenham", emoji: "⚪", league: "Premier League" },
  { id: "psg", name: "Paris Saint-Germain", emoji: "🔵", league: "Ligue 1" },
  { id: "marseille", name: "Marseille", emoji: "🔵", league: "Ligue 1" },
  { id: "ac-milan", name: "AC Milan", emoji: "🔴", league: "Serie A" },
  { id: "inter-milan", name: "Inter Milan", emoji: "🔵", league: "Serie A" },
  { id: "juventus", name: "Juventus", emoji: "⚫", league: "Serie A" },
  { id: "napoli", name: "Napoli", emoji: "🔵", league: "Serie A" },
  { id: "bayern-munich", name: "Bayern Munich", emoji: "🔴", league: "Bundesliga" },
  { id: "dortmund", name: "Borussia Dortmund", emoji: "🟡", league: "Bundesliga" },
];

const LEAGUES: { id: string; name: string; flag: string }[] = [
  { id: "premier-league", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "la-liga", name: "La Liga", flag: "🇪🇸" },
  { id: "serie-a", name: "Serie A", flag: "🇮🇹" },
  { id: "bundesliga", name: "Bundesliga", flag: "🇩🇪" },
  { id: "ligue-1", name: "Ligue 1", flag: "🇫🇷" },
  { id: "champions-league", name: "Champions League", flag: "⭐" },
  { id: "europa-league", name: "Europa League", flag: "🏆" },
  { id: "world-cup", name: "World Cup", flag: "🌍" },
];

const INTENTS: { id: string; title: string; desc: string; icon: typeof Bell }[] = [
  { id: "alerts", title: "Get price alerts", desc: "Notify me when prices drop", icon: Bell },
  { id: "tracking", title: "Track matches", desc: "Build a watchlist of upcoming games", icon: Heart },
  { id: "deals", title: "Find best deals", desc: "Show me cheapest available tickets", icon: TrendingDown },
];

const OnboardingPage = () => {
  useSEO({ title: "Welcome to Foot Ticket Finder", description: "Personalize your experience" });
  const navigate = useNavigate();
  const { user, authLoading } = useUser();
  const { data: prefs, update } = useUserPreferences();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [teams, setTeams] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<string[]>([]);
  const [intents, setIntents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (prefs) {
      setTeams(prefs.favorite_teams || []);
      setLeagues(prefs.favorite_leagues || []);
      setIntents(prefs.user_intent || []);
    }
  }, [prefs]);

  const filteredTeams = useMemo(() => {
    if (!search.trim()) return TEAMS;
    const q = search.toLowerCase();
    return TEAMS.filter((t) => t.name.toLowerCase().includes(q) || t.league.toLowerCase().includes(q));
  }, [search]);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const finish = async (skipped: boolean) => {
    setSaving(true);
    try {
      await update.mutateAsync({
        favorite_teams: teams,
        favorite_leagues: leagues,
        user_intent: intents,
        onboarding_completed: !skipped,
        onboarding_skipped_at: skipped ? new Date().toISOString() : null,
      });
      toast.success(skipped ? "You can complete this later" : "All set! Welcome aboard 🎉");
      navigate("/app/home", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-5 py-10 md:py-14">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-[#2ECC71]" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2ECC71] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Step {step} of 3
          </span>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={saving}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Skip for now
          </button>
        </div>

        {step === 1 && (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50] tracking-tight">
              Pick your favorite teams
            </h1>
            <p className="mt-2 text-[#2C3E50]/65">We'll prioritize their matches and price drops for you.</p>

            <div className="mt-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams or leagues…"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#2ECC71]"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredTeams.map((t) => {
                const sel = teams.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(teams, setTeams, t.id)}
                    className={`relative text-left rounded-xl border p-3 transition-all ${
                      sel
                        ? "border-[#2ECC71] bg-[#2ECC71]/5 ring-2 ring-[#2ECC71]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {sel && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <div className="text-2xl mb-1.5">{t.emoji}</div>
                    <p className="font-bold text-sm text-[#2C3E50] leading-tight">{t.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.league}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50] tracking-tight">
              Which leagues do you follow?
            </h1>
            <p className="mt-2 text-[#2C3E50]/65">Select all that apply — we'll tailor alerts to these competitions.</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {LEAGUES.map((l) => {
                const sel = leagues.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(leagues, setLeagues, l.id)}
                    className={`relative text-left rounded-xl border p-4 transition-all flex items-center gap-3 ${
                      sel
                        ? "border-[#2ECC71] bg-[#2ECC71]/5 ring-2 ring-[#2ECC71]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl">{l.flag}</span>
                    <span className="font-bold text-sm text-[#2C3E50]">{l.name}</span>
                    {sel && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50] tracking-tight">
              What do you want?
            </h1>
            <p className="mt-2 text-[#2C3E50]/65">Pick what matters most — you can change this anytime.</p>
            <div className="mt-6 flex flex-col gap-3">
              {INTENTS.map((i) => {
                const sel = intents.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => toggle(intents, setIntents, i.id)}
                    className={`relative text-left rounded-2xl border p-5 transition-all flex items-center gap-4 ${
                      sel
                        ? "border-[#2ECC71] bg-[#2ECC71]/5 ring-2 ring-[#2ECC71]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#2ECC71]/10 flex items-center justify-center shrink-0">
                      <i.icon className="w-5 h-5 text-[#2ECC71]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#2C3E50]">{i.title}</p>
                      <p className="text-xs text-[#2C3E50]/60 mt-0.5">{i.desc}</p>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        sel ? "bg-[#2ECC71]" : "border-2 border-slate-200"
                      }`}
                    >
                      {sel && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Nav */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              ← Back
            </button>
          ) : <span />}

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2C3E50] hover:bg-[#1f2d3a] text-white px-6 py-3 font-bold shadow-md transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => finish(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] hover:bg-[#27ae60] text-white px-6 py-3 font-bold shadow-lg shadow-[#2ECC71]/30 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Finish setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
