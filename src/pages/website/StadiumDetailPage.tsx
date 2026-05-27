import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Building2, Users, Star, Flame, ShieldCheck, Crown, Ticket, ChevronRight } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMatches } from "@/hooks/useMatches";
import { StadiumReviews } from "@/components/StadiumReviews";
import { StadiumHero } from "@/components/StadiumHero";
import { StadiumPassportButton } from "@/components/StadiumPassportButton";
import { StadiumExperienceTips } from "@/components/StadiumExperienceTips";
import { StadiumUpcomingMatches } from "@/components/stadium/StadiumUpcomingMatches";
import { StadiumRelatedClubs } from "@/components/stadium/StadiumRelatedClubs";
import { TopFanReviews } from "@/components/stadium/TopFanReviews";
import { MatchdayVibes } from "@/components/match/MatchdayVibes";
import { StadiumPilgrimage } from "@/components/match/StadiumPilgrimage";
import { MatchdayJourney } from "@/components/match/MatchdayJourney";
import { TravelEssentials } from "@/components/match/TravelEssentials";
import { vibesForStadium } from "@/lib/matchdayVibes";
import { useSEO } from "@/lib/seo";
import type { Stadium } from "@/hooks/useStadium";

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
    <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{label}</div>
    <div className="mt-1.5 text-xl font-extrabold text-white">{value}</div>
    {sub && <div className="text-[11px] text-white/55 mt-0.5">{sub}</div>}
  </div>
);

const ScoreBar = ({ label, score }: { label: string; score: number | null }) => {
  const pct = score != null ? Math.max(0, Math.min(100, score * 10)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/70 font-semibold">{label}</span>
        <span className="text-white font-bold">{score != null ? score.toFixed(1) : "—"}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#2ECC71] to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const StadiumDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { t } = useLanguage();
  const { data: matches = [] } = useMatches();

  // Detect if we're on the World Cup-owned route. WC host stadiums must always
  // render under /world-cup-2026/stadiums/:slug — generic /stadiums/:slug
  // redirects there (preserving query + hash). Non-WC stadiums work as-is.
  const isWcRoute = location.pathname.startsWith("/world-cup-2026/stadiums");

  const { data: stadium, isLoading } = useQuery({
    queryKey: ["stadium-by-slug", slug],
    enabled: !!slug,
    queryFn: async (): Promise<(Stadium & { is_world_cup_host?: boolean | null }) | null> => {
      const { data, error } = await supabase.from("stadiums").select("*").eq("slug", slug!).is("archived_at", null).maybeSingle();
      if (error) throw error;
      return data as (Stadium & { archived_into_slug?: string | null; is_world_cup_host?: boolean | null }) | null;
    },
  });

  useSEO({
    title: stadium ? `${stadium.stadium_name} — ${stadium.city} | Foot Ticket Finder` : "Stadium guide",
    description: stadium?.description ?? "Premium football stadium intelligence guide.",
    noindex: true,
  });

  // WC host stadiums hit on /stadiums/:slug → redirect to canonical WC URL,
  // preserving query string and hash.
  if (stadium?.is_world_cup_host && !isWcRoute) {
    return (
      <Navigate
        to={`/world-cup-2026/stadiums/${slug}${location.search}${location.hash}`}
        replace
      />
    );
  }

  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center text-sm text-white/60">Loading…</div>
      </WebsiteLayout>
    );
  }

  if (!stadium) {
    return (
      <WebsiteLayout>
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h1 className="text-2xl font-extrabold text-[#2C3E50]">Stadium not found</h1>
          <Link
            to={isWcRoute ? "/world-cup-2026/stadiums" : "/stadiums"}
            className="mt-4 inline-flex items-center gap-2 text-[#2ECC71] font-bold"
          >
            <ArrowLeft className="w-4 h-4" />{" "}
            {isWcRoute ? t("wc.back_to_host_stadiums") || "View all World Cup host stadiums" : t("stadium.back_to_stadiums")}
          </Link>
        </div>
      </WebsiteLayout>
    );
  }


  const upcoming = matches
    .filter((m) => stadium.stadium_name && m.stadium?.toLowerCase().includes(stadium.stadium_name.toLowerCase()))
    .filter((m) => new Date(m.date) > new Date())
    .slice(0, 6);

  const bgImage = stadium.background_image_url || stadium.image_url;

  return (
    <WebsiteLayout>
      <StadiumHero stadium={stadium} />

      <div className="bg-[#0b1220] text-white">
        <section className="max-w-5xl mx-auto px-5 pt-6 pb-2 flex items-center justify-between gap-3 flex-wrap">
          <MatchdayVibes vibes={vibesForStadium(stadium)} variant="dark" size="sm" showLabel />
          <StadiumPassportButton
            stadiumSlug={stadium.slug}
            stadiumName={stadium.stadium_name}
            city={stadium.city}
            country={stadium.country}
          />
        </section>
        <section className="max-w-5xl mx-auto px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label={t("stadium.capacity")} value={stadium.capacity ? stadium.capacity.toLocaleString() : "—"} sub={t("stadium.capacity")} />
            <Stat label={t("stadium.atmosphere")} value={stadium.atmosphere_score != null ? `${stadium.atmosphere_score.toFixed(1)}/10` : "—"} />
            <Stat label={t("stadium.accessibility")} value={stadium.accessibility_score != null ? `${stadium.accessibility_score.toFixed(1)}/10` : "—"} />
            <Stat label={t("stadium.family_friendly")} value={stadium.family_friendly_score != null ? `${stadium.family_friendly_score.toFixed(1)}/10` : "—"} />
          </div>

          {stadium.description && (
            <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/10 p-5">
              <div className="text-xs uppercase tracking-wider text-white/55 font-bold mb-2">{t("stadium.about_stadium")}</div>
              <p className="text-sm text-white/80 leading-relaxed">{stadium.description}</p>
            </div>
          )}

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-3">
              <ScoreBar label={t("stadium.atmosphere")} score={stadium.atmosphere_score} />
              <ScoreBar label={t("stadium.popularity")} score={stadium.popularity_score} />
              <ScoreBar label={t("stadium.value")} score={stadium.value_score} />
              <ScoreBar label={t("stadium.accessibility")} score={stadium.accessibility_score} />
              <ScoreBar label={t("stadium.family_friendly")} score={stadium.family_friendly_score} />
            </div>
            <div className="space-y-3">
              {stadium.best_sections && stadium.best_sections.length > 0 && (
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
                  <Star className="w-5 h-5 text-amber-300 mt-0.5" />
                  <div>
                    <div className="font-bold">{t("stadium.best_sections")}</div>
                    <div className="text-xs text-white/65 mt-0.5">{stadium.best_sections.join(" · ")}</div>
                  </div>
                </div>
              )}
              {stadium.ultras_section && (
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
                  <Flame className="w-5 h-5 text-red-300 mt-0.5" />
                  <div>
                    <div className="font-bold">{t("stadium.ultras_section")}</div>
                    <div className="text-xs text-white/65 mt-0.5">{stadium.ultras_section}</div>
                  </div>
                </div>
              )}
              {stadium.family_section && (
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-300 mt-0.5" />
                  <div>
                    <div className="font-bold">{t("stadium.family_section")}</div>
                    <div className="text-xs text-white/65 mt-0.5">{stadium.family_section}</div>
                  </div>
                </div>
              )}
              {stadium.vip_available && (
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-300 mt-0.5" />
                  <div>
                    <div className="font-bold">{t("stadium.vip_available")}: {t("stadium.vip_yes")}</div>
                    {stadium.official_ticket_provider && (
                      <div className="text-xs text-white/65 mt-0.5">
                        {t("stadium.official_provider")}: {stadium.official_ticket_provider}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {upcoming.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-white/55 font-bold mb-3 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> {t("stadium.upcoming_matches") || "Upcoming matches"}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {upcoming.map((m) => (
                  <Link
                    key={m.id}
                    to={`/matches/${m.id}`}
                    className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-[#2ECC71]/40 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-sm">{m.homeTeam} vs {m.awayTeam}</div>
                      <div className="text-xs text-white/60 mt-0.5">{new Date(m.date).toLocaleDateString()} · {m.competition}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <StadiumPilgrimage stadium={stadium} variant="dark" />

        <StadiumRelatedClubs stadiumSlug={stadium.slug} stadiumName={stadium.stadium_name} />
        <StadiumUpcomingMatches stadiumName={stadium.stadium_name} />

        <MatchdayJourney stadiumName={stadium.stadium_name} city={stadium.city} variant="dark" />
        <TravelEssentials stadiumName={stadium.stadium_name} city={stadium.city} variant="dark" />

        <TopFanReviews stadiumSlug={stadium.slug} />

        <StadiumReviews stadium={stadium.stadium_name} matchDate={undefined} />
        <StadiumExperienceTips stadiumSlug={stadium.slug} />
      </div>
    </WebsiteLayout>
  );
};

export default StadiumDetailPage;
