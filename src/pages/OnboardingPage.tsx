import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
  Loader2,
  Flame,
  Crown,
  Heart,
  Compass,
  Bell,
  TrendingDown,
  MapPin,
  Star,
  Trophy,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSEO } from "@/lib/seo";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

// --- Static catalogs (re-used from prior onboarding) -------------------------
// Logos served from api-sports media CDN (stable, public).
const teamLogo = (id: number) => `https://media.api-sports.io/football/teams/${id}.png`;
const leagueLogo = (id: number) => `https://media.api-sports.io/football/leagues/${id}.png`;

const TEAMS = [
  { id: "real-madrid", name: "Real Madrid", logo: teamLogo(541), fallback: "RMA", league: "La Liga" },
  { id: "fc-barcelona", name: "FC Barcelona", logo: teamLogo(529), fallback: "FCB", league: "La Liga" },
  { id: "atletico-madrid", name: "Atlético Madrid", logo: teamLogo(530), fallback: "ATM", league: "La Liga" },
  { id: "liverpool", name: "Liverpool", logo: teamLogo(40), fallback: "LIV", league: "Premier League" },
  { id: "manchester-united", name: "Manchester United", logo: teamLogo(33), fallback: "MUN", league: "Premier League" },
  { id: "manchester-city", name: "Manchester City", logo: teamLogo(50), fallback: "MCI", league: "Premier League" },
  { id: "arsenal", name: "Arsenal", logo: teamLogo(42), fallback: "ARS", league: "Premier League" },
  { id: "chelsea", name: "Chelsea", logo: teamLogo(49), fallback: "CHE", league: "Premier League" },
  { id: "tottenham", name: "Tottenham", logo: teamLogo(47), fallback: "TOT", league: "Premier League" },
  { id: "psg", name: "Paris Saint-Germain", logo: teamLogo(85), fallback: "PSG", league: "Ligue 1" },
  { id: "marseille", name: "Marseille", logo: teamLogo(81), fallback: "OM", league: "Ligue 1" },
  { id: "ac-milan", name: "AC Milan", logo: teamLogo(489), fallback: "MIL", league: "Serie A" },
  { id: "inter-milan", name: "Inter Milan", logo: teamLogo(505), fallback: "INT", league: "Serie A" },
  { id: "juventus", name: "Juventus", logo: teamLogo(496), fallback: "JUV", league: "Serie A" },
  { id: "napoli", name: "Napoli", logo: teamLogo(492), fallback: "NAP", league: "Serie A" },
  { id: "bayern-munich", name: "Bayern Munich", logo: teamLogo(157), fallback: "FCB", league: "Bundesliga" },
  { id: "dortmund", name: "Borussia Dortmund", logo: teamLogo(165), fallback: "BVB", league: "Bundesliga" },
];

const LEAGUES = [
  { id: "premier-league", name: "Premier League", logo: leagueLogo(39) },
  { id: "la-liga", name: "La Liga", logo: leagueLogo(140) },
  { id: "serie-a", name: "Serie A", logo: leagueLogo(135) },
  { id: "bundesliga", name: "Bundesliga", logo: leagueLogo(78) },
  { id: "ligue-1", name: "Ligue 1", logo: leagueLogo(61) },
  { id: "champions-league", name: "Champions League", logo: leagueLogo(2) },
  { id: "europa-league", name: "Europa League", logo: leagueLogo(3) },
  { id: "world-cup", name: "World Cup", logo: leagueLogo(1) },
];

// Inline logo renderer with graceful fallback to initials/circle.
const LogoImg = ({ src, alt, fallback, size = 40 }: { src: string; alt: string; fallback: string; size?: number }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        className="rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[10px] font-extrabold text-white/80"
        style={{ width: size, height: size }}
      >
        {fallback}
      </div>
    );
  }
  return (
    <div
      className="rounded-full bg-white/95 border border-white/20 flex items-center justify-center overflow-hidden shadow-sm"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
};

const MATCHDAY_STYLES = [
  { id: "ultra", icon: Flame, accent: "from-orange-500 to-rose-600" },
  { id: "premium", icon: Crown, accent: "from-amber-400 to-yellow-600" },
  { id: "family", icon: Heart, accent: "from-emerald-400 to-teal-600" },
  { id: "explorer", icon: Compass, accent: "from-sky-500 to-indigo-600" },
] as const;

const PASSPORT_BUCKETS = [
  { id: "0_5", icon: MapPin },
  { id: "5_20", icon: Star },
  { id: "20_50", icon: Trophy },
  { id: "50_plus", icon: Sparkles },
] as const;

const ALERTS = [
  { id: "tickets", icon: Bell },
  { id: "price", icon: TrendingDown },
  { id: "nearby", icon: MapPin },
  { id: "dream", icon: Sparkles },
] as const;

const CURATED_DREAM_SLUGS = ["san-siro", "signal-iduna-park", "allianz-arena", "camp-nou"];

const TOTAL_STEPS = 5;

// --- Step types --------------------------------------------------------------
type Step = 1 | 2 | 3 | 4 | 5;

interface DreamStadium {
  slug: string;
  stadium_name: string;
  city: string | null;
  country: string | null;
  hero_image_url: string | null;
  image_url: string | null;
}

const OnboardingPage = () => {
  const { t, dir } = useLanguage();
  useSEO({ title: "Welcome to Foot Ticket Finder", description: "Personalize your matchday experience" });
  const navigate = useNavigate();
  const { user, authLoading } = useUser();
  const { data: prefs, update } = useUserPreferences();

  const [step, setStep] = useState<Step>(1);
  const [teams, setTeams] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<string[]>([]);
  const [favTab, setFavTab] = useState<"teams" | "leagues">("teams");
  const [style, setStyle] = useState<string | null>(null);
  const [dreamSlug, setDreamSlug] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Record<string, boolean>>({
    tickets: true,
    price: true,
    nearby: false,
    dream: true,
  });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (prefs) {
      setTeams(prefs.favorite_teams || []);
      setLeagues(prefs.favorite_leagues || []);
      setStyle(prefs.matchday_style || null);
      setDreamSlug(prefs.dream_stadium_slug || null);
      setBucket(prefs.stadiums_visited_bucket || null);
      if (prefs.alert_preferences && Object.keys(prefs.alert_preferences).length > 0) {
        setAlerts({ tickets: true, price: true, nearby: false, dream: true, ...prefs.alert_preferences });
      }
    }
  }, [prefs]);

  // Fetch dream stadium options (curated 4 + top 6 by popularity)
  const { data: dreamStadiums } = useQuery({
    queryKey: ["onboarding_dream_stadiums"],
    queryFn: async (): Promise<DreamStadium[]> => {
      const [curatedRes, topRes] = await Promise.all([
        supabase
          .from("stadiums")
          .select("slug,stadium_name,city,country,hero_image_url,image_url,popularity_score")
          .in("slug", CURATED_DREAM_SLUGS),
        supabase
          .from("stadiums")
          .select("slug,stadium_name,city,country,hero_image_url,image_url,popularity_score")
          .not("hero_image_url", "is", null)
          .order("popularity_score", { ascending: false, nullsFirst: false })
          .limit(20),
      ]);
      const curated = (curatedRes.data || []) as DreamStadium[];
      const top = (topRes.data || []) as DreamStadium[];
      const seen = new Set<string>();
      const merged: DreamStadium[] = [];
      for (const s of [...curated, ...top]) {
        if (!s.slug || seen.has(s.slug)) continue;
        seen.add(s.slug);
        merged.push(s);
        if (merged.length >= 10) break;
      }
      return merged;
    },
  });

  const filteredTeams = useMemo(() => {
    if (!search.trim()) return TEAMS;
    const q = search.toLowerCase();
    return TEAMS.filter((x) => x.name.toLowerCase().includes(q) || x.league.toLowerCase().includes(q));
  }, [search]);

  const totalFavs = teams.length + leagues.length;

  const toggleFav = (list: string[], setList: (v: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
      return;
    }
    if (totalFavs >= 5) {
      toast.message(t("onb2.max_reached"));
      return;
    }
    setList([...list, id]);
  };

  const canContinue = (() => {
    switch (step) {
      case 1:
        return totalFavs > 0;
      case 2:
        return !!style;
      case 3:
        return true; // optional
      case 4:
        return !!bucket;
      case 5:
        return true;
      default:
        return false;
    }
  })();

  const finish = async (skipped: boolean) => {
    setSaving(true);
    try {
      await update.mutateAsync({
        favorite_teams: teams,
        favorite_leagues: leagues,
        matchday_style: style,
        dream_stadium_slug: dreamSlug,
        stadiums_visited_bucket: bucket,
        alert_preferences: alerts,
        onboarding_completed: !skipped,
        onboarding_skipped_at: skipped ? new Date().toISOString() : null,
      } as any);
      toast.success(skipped ? t("onb2.toast.skip") : t("onb2.toast.success"));
      // Redirect to the public homepage (not /app/home)
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message || t("onb2.toast.error"));
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => ((s + 1) as Step));
    } else {
      finish(false);
    }
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const ChevForward = dir === "rtl" ? ChevronLeft : ChevronRight;
  const ChevBackward = dir === "rtl" ? ChevronRight : ChevronLeft;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0b1726] to-slate-950 text-white"
      dir={dir}
    >
      {/* Atmospheric glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-5 py-10 md:py-14">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-emerald-400" : "bg-white/10",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-[0.18em]">
            <Sparkles className="w-3.5 h-3.5" /> {t("onb2.step", { current: step, total: TOTAL_STEPS })}
          </span>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={saving}
            className="text-xs font-semibold text-white/60 hover:text-white"
          >
            {t("onb2.skip")}
          </button>
        </div>

        {/* ---------- STEP 1 — Football heart ---------- */}
        {step === 1 && (
          <>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              {t("onb2.s1.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("onb2.s1.title")}</h1>
            <p className="mt-2 text-white/70">{t("onb2.s1.subtitle")}</p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10">
                {(["teams", "leagues"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFavTab(tab)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                      favTab === tab ? "bg-white text-slate-900" : "text-white/70 hover:text-white",
                    )}
                  >
                    {t(`onb2.s1.tab.${tab}`)}
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                {t("onb2.s1.selected", { count: totalFavs })}
              </span>
            </div>

            {favTab === "teams" && (
              <>
                <div className="mt-4 relative">
                  <Search
                    className={cn(
                      "w-4 h-4 text-white/40 absolute top-1/2 -translate-y-1/2",
                      dir === "rtl" ? "right-3" : "left-3",
                    )}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("onb2.s1.search")}
                    className={cn(
                      "w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm placeholder:text-white/40 focus:outline-none focus:border-emerald-400",
                      dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3",
                    )}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredTeams.map((team) => {
                    const sel = teams.includes(team.id);
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => toggleFav(teams, setTeams, team.id)}
                        className={cn(
                          "relative text-left rounded-xl border p-3 transition-all",
                          sel
                            ? "border-emerald-400 bg-emerald-400/10 ring-2 ring-emerald-400/20"
                            : "border-white/10 hover:border-white/30 bg-white/5",
                        )}
                      >
                        {sel && (
                          <span
                            className={cn(
                              "absolute top-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center",
                              dir === "rtl" ? "left-2" : "right-2",
                            )}
                          >
                            <Check className="w-3 h-3 text-slate-900" />
                          </span>
                        )}
                        <div className="mb-2">
                          <LogoImg src={team.logo} alt={team.name} fallback={team.fallback} size={44} />
                        </div>
                        <p className="font-bold text-sm leading-tight">{team.name}</p>
                        <p className="text-[11px] text-white/50 mt-0.5">{team.league}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {favTab === "leagues" && (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {LEAGUES.map((l) => {
                  const sel = leagues.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleFav(leagues, setLeagues, l.id)}
                      className={cn(
                        "relative text-left rounded-xl border p-4 transition-all flex items-center gap-3",
                        sel
                          ? "border-emerald-400 bg-emerald-400/10 ring-2 ring-emerald-400/20"
                          : "border-white/10 hover:border-white/30 bg-white/5",
                      )}
                    >
                      <LogoImg src={l.logo} alt={l.name} fallback={l.name.slice(0, 2).toUpperCase()} size={36} />
                      <span className="font-bold text-sm">{l.name}</span>
                      {sel && (
                        <span className="ms-auto w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-slate-900" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---------- STEP 2 — Matchday style ---------- */}
        {step === 2 && (
          <>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              {t("onb2.s2.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("onb2.s2.title")}</h1>
            <p className="mt-2 text-white/70">{t("onb2.s2.subtitle")}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MATCHDAY_STYLES.map((s) => {
                const sel = style === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      "relative text-left rounded-2xl border overflow-hidden p-5 transition-all group",
                      sel
                        ? "border-emerald-400 ring-2 ring-emerald-400/30 bg-white/5"
                        : "border-white/10 hover:border-white/30 bg-white/5",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-20 bg-gradient-to-br pointer-events-none transition-opacity",
                        s.accent,
                        sel ? "opacity-30" : "opacity-10 group-hover:opacity-20",
                      )}
                    />
                    <div className="relative">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                          s.accent,
                        )}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="mt-4 font-extrabold text-lg">{t(`onb2.style.${s.id}.title`)}</h3>
                      <p className="mt-1 text-sm text-white/70">{t(`onb2.style.${s.id}.desc`)}</p>
                    </div>
                    {sel && (
                      <span
                        className={cn(
                          "absolute top-3 w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center",
                          dir === "rtl" ? "left-3" : "right-3",
                        )}
                      >
                        <Check className="w-3.5 h-3.5 text-slate-900" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ---------- STEP 3 — Dream stadium ---------- */}
        {step === 3 && (
          <>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              {t("onb2.s3.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("onb2.s3.title")}</h1>
            <p className="mt-2 text-white/70">{t("onb2.s3.subtitle")}</p>

            <div
              className="mt-6 -mx-5 px-5 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth"
              style={{ scrollbarWidth: "thin" }}
            >
              {(dreamStadiums || []).map((s) => {
                const sel = dreamSlug === s.slug;
                const img = s.hero_image_url || s.image_url || "";
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setDreamSlug(sel ? null : s.slug)}
                    className={cn(
                      "relative shrink-0 snap-center w-64 sm:w-72 h-80 rounded-2xl overflow-hidden border transition-all",
                      sel
                        ? "border-emerald-400 ring-2 ring-emerald-400/40 scale-[1.02]"
                        : "border-white/10 hover:border-white/30",
                    )}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={s.stadium_name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-start">
                      <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                        {s.country}
                      </p>
                      <h3 className="mt-1 font-extrabold text-xl leading-tight">{s.stadium_name}</h3>
                      <p className="text-sm text-white/80">{s.city}</p>
                    </div>
                    {sel && (
                      <span
                        className={cn(
                          "absolute top-3 w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center",
                          dir === "rtl" ? "left-3" : "right-3",
                        )}
                      >
                        <Check className="w-4 h-4 text-slate-900" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setDreamSlug(null)}
              className="mt-2 text-xs font-semibold text-white/60 hover:text-white"
            >
              {t("onb2.s3.skip_choice")}
            </button>
          </>
        )}

        {/* ---------- STEP 4 — Football passport ---------- */}
        {step === 4 && (
          <>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              {t("onb2.s4.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("onb2.s4.title")}</h1>
            <p className="mt-2 text-white/70">{t("onb2.s4.subtitle")}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PASSPORT_BUCKETS.map((b) => {
                const sel = bucket === b.id;
                const Icon = b.icon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBucket(b.id)}
                    className={cn(
                      "relative text-left rounded-2xl border p-5 transition-all flex items-center gap-4",
                      sel
                        ? "border-emerald-400 bg-emerald-400/10 ring-2 ring-emerald-400/20"
                        : "border-white/10 hover:border-white/30 bg-white/5",
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-400/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate">{t(`onb2.passport.${b.id}`)}</p>
                      <p className="text-xs text-white/60 mt-0.5 truncate">
                        {t(`onb2.passport.${b.id}.tag`)}
                      </p>
                    </div>
                    {sel && (
                      <span className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-slate-900" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ---------- STEP 5 — Alerts ---------- */}
        {step === 5 && (
          <>
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
              {t("onb2.s5.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("onb2.s5.title")}</h1>
            <p className="mt-2 text-white/70">{t("onb2.s5.subtitle")}</p>

            <div className="mt-6 flex flex-col gap-3">
              {ALERTS.map((a) => {
                const sel = !!alerts[a.id];
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAlerts((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                    className={cn(
                      "relative text-left rounded-2xl border p-4 sm:p-5 transition-all flex items-center gap-4",
                      sel
                        ? "border-emerald-400 bg-emerald-400/10 ring-2 ring-emerald-400/20"
                        : "border-white/10 hover:border-white/30 bg-white/5",
                    )}
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-400/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{t(`onb2.alert.${a.id}.title`)}</p>
                      <p className="text-xs text-white/60 mt-0.5 truncate">{t(`onb2.alert.${a.id}.desc`)}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors relative",
                        sel ? "bg-emerald-400" : "bg-white/10",
                      )}
                    >
                      <span
                        className={cn(
                          "block w-5 h-5 rounded-full bg-white shadow transition-transform",
                          sel ? (dir === "rtl" ? "-translate-x-5" : "translate-x-5") : "translate-x-0",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
            >
              <ChevBackward className="w-4 h-4" />
              {t("onb2.back")}
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={next}
            disabled={!canContinue || saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold shadow-lg transition-all",
              "bg-emerald-400 text-slate-900 hover:bg-emerald-300 shadow-emerald-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
            )}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {step < TOTAL_STEPS ? t("onb2.continue") : t("onb2.finish")}
            {step < TOTAL_STEPS && <ChevForward className="w-4 h-4" />}
          </button>
        </div>

        {!canContinue && step === 1 && (
          <p className="mt-3 text-xs text-white/50 text-end">{t("onb2.required")}</p>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
