import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Ticket,
  Users,
  Repeat,
  Crown,
  AlertTriangle,
  Clock,
  Shield,
  Star,
  MapPin,
  Building2,
} from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useClubTicketing } from "@/hooks/useClubTicketing";
import { useStadium } from "@/hooks/useStadium";
import { DifficultyBadge } from "@/components/clubs/DifficultyBadge";
import { transformAffiliateUrl } from "@/lib/affiliate";
import { ClubUpcomingMatches } from "@/components/clubs/ClubUpcomingMatches";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-8 h-8 rounded-lg bg-[#2ECC71]/10 text-[#2ECC71] inline-flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <h2 className="font-extrabold text-[#2C3E50]">{title}</h2>
    </div>
    <div className="text-sm text-[#2C3E50]/80 leading-relaxed space-y-2">{children}</div>
  </section>
);

const ClubDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: club, isLoading } = useClubTicketing(slug);
  const { data: stadium } = useStadium(club?.stadium_name ?? null);
  const { t, locale } = useLanguage();

  useSEO({
    title:
      club?.seo_title ||
      `${club?.club_name ?? "Club"} Tickets — Official Access Guide | Foot Ticket Finder`,
    description:
      club?.seo_description ||
      `Official ticketing guide for ${club?.club_name ?? "this club"}: how to buy, membership, resale and tips.`,
    canonical:
      typeof window !== "undefined" && club
        ? `${window.location.origin}/clubs/${club.slug}`
        : undefined,
    noindex: true,
    jsonLd: club
      ? [
          {
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: club.club_name,
            sport: "Football",
            url:
              typeof window !== "undefined"
                ? `${window.location.origin}/clubs/${club.slug}`
                : undefined,
            location: [club.city, club.country].filter(Boolean).join(", "),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: t("clubs.nav"), item: "/clubs" },
              { "@type": "ListItem", position: 3, name: club.club_name, item: `/clubs/${club.slug}` },
            ],
          },
        ]
      : undefined,
  });

  if (isLoading) {
    return (
      <WebsiteLayout>
        <div className="max-w-6xl mx-auto px-5 py-16 text-sm text-[#2C3E50]/60">…</div>
      </WebsiteLayout>
    );
  }

  if (!club) {
    return (
      <WebsiteLayout>
        <div className="max-w-3xl mx-auto px-5 py-20 text-center">
          <h1 className="text-2xl font-extrabold text-[#2C3E50] mb-2">
            {t("clubs.not_found.title")}
          </h1>
          <p className="text-[#2C3E50]/70 mb-6">{t("clubs.not_found.desc")}</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-1 text-[#2ECC71] font-semibold hover:gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("clubs.not_found.back")}
          </Link>
        </div>
      </WebsiteLayout>
    );
  }

  const verified = club.last_verified_at
    ? new Date(club.last_verified_at).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <WebsiteLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2C3E50] to-[#1a2733] text-white">
        <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("clubs.nav")}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.club_name} className="w-full h-full object-contain" />
              ) : (
                <Ticket className="w-10 h-10 text-white/60" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#2ECC71] mb-1">
                {club.league}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight break-words">
                {club.club_name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                {club.stadium_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {club.stadium_name}
                  </span>
                )}
                {(club.city || club.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {[club.city, club.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {club.official_ticketing_url && (
              <a
                href={club.official_ticketing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#27ae60] transition-colors"
              >
                <Ticket className="w-4 h-4" />
                {t("clubs.cta.official_tickets")}
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}
            {club.official_website && (
              <a
                href={club.official_website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              >
                {t("clubs.cta.official_site")}
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}
            {club.hospitality_available && club.hospitality_url && (
              <a
                href={transformAffiliateUrl(club.hospitality_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              >
                <Crown className="w-4 h-4" />
                {t("clubs.cta.hospitality")}
              </a>
            )}
          </div>

          {/* Quick badges */}
          <div className="mt-6 flex flex-wrap gap-2">
            <DifficultyBadge level={club.average_difficulty} />
            {club.membership_required ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold">
                <Users className="w-3 h-3" /> {t("clubs.badge.membership")}
              </span>
            ) : club.membership_required_for_big_games ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold">
                <Users className="w-3 h-3" /> {t("clubs.badge.membership_big")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold">
                {t("clubs.badge.public_sale")}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${
                club.resale_exchange_available
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200"
                  : "bg-white/5 border-white/10 text-white/60"
              }`}
            >
              <Repeat className="w-3 h-3" />
              {club.resale_exchange_available
                ? t("clubs.badge.exchange")
                : t("clubs.badge.no_exchange")}
            </span>
            {club.ballot_system && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 px-3 py-1 text-xs font-semibold">
                {t("clubs.badge.ballot")}
              </span>
            )}
            {club.hospitality_available && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 px-3 py-1 text-xs font-semibold">
                <Crown className="w-3 h-3" /> {t("clubs.badge.hospitality")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-5 py-10 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {club.ticket_release_process && (
            <Section icon={Ticket} title={t("clubs.section.how")}>
              <p>{club.ticket_release_process}</p>
            </Section>
          )}

          {(club.membership_required || club.membership_required_for_big_games || club.membership_name) && (
            <Section icon={Users} title={t("clubs.section.membership")}>
              {club.membership_name && (
                <p>
                  <strong>{club.membership_name}</strong>
                </p>
              )}
              {club.membership_required && <p>{t("clubs.badge.membership")}.</p>}
              {!club.membership_required && club.membership_required_for_big_games && (
                <p>{t("clubs.badge.membership_big")}.</p>
              )}
            </Section>
          )}

          <Section icon={Repeat} title={t("clubs.section.exchange")}>
            {club.resale_exchange_available ? (
              <>
                {club.resale_exchange_name && <p><strong>{club.resale_exchange_name}</strong></p>}
                {club.resale_exchange_url && (
                  <a
                    href={transformAffiliateUrl(club.resale_exchange_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2ECC71] font-semibold hover:underline"
                  >
                    {t("clubs.cta.exchange")} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </>
            ) : (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {t("clubs.no_exchange_warning")}
              </p>
            )}
          </Section>

          {club.queue_system && (
            <Section icon={Clock} title={t("clubs.section.queue")}>
              <p>{club.queue_system}</p>
            </Section>
          )}

          {club.ballot_system && club.ballot_notes && (
            <Section icon={Shield} title={t("clubs.section.ballot")}>
              <p>{club.ballot_notes}</p>
            </Section>
          )}

          {club.important_restrictions && (
            <Section icon={AlertTriangle} title={t("clubs.section.restrictions")}>
              <p>{club.important_restrictions}</p>
            </Section>
          )}

          {club.local_fan_restrictions && (
            <Section icon={Users} title={t("clubs.section.away")}>
              <p>{club.local_fan_restrictions}</p>
            </Section>
          )}

          {club.best_matches && (
            <Section icon={Star} title={t("clubs.section.best_matches")}>
              <p>{club.best_matches}</p>
            </Section>
          )}

          <Section icon={Ticket} title={t("clubs.section.upcoming")}>
            <ClubUpcomingMatches clubName={club.club_name} />
          </Section>
        </div>

        <aside className="space-y-5">
          {stadium && (
            <Section icon={Building2} title={t("clubs.section.stadium")}>
              <div className="font-semibold text-[#2C3E50]">{stadium.stadium_name}</div>
              <ul className="grid grid-cols-3 gap-2 mt-2">
                <li className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[#2C3E50]/50">
                    {t("clubs.section.stadium.atmosphere")}
                  </div>
                  <div className="font-bold text-[#2C3E50]">
                    {stadium.atmosphere_score?.toFixed(1) ?? "—"}
                  </div>
                </li>
                <li className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[#2C3E50]/50">
                    {t("clubs.section.stadium.family")}
                  </div>
                  <div className="font-bold text-[#2C3E50]">
                    {stadium.family_friendly_score?.toFixed(1) ?? "—"}
                  </div>
                </li>
                <li className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[#2C3E50]/50">
                    {t("clubs.section.stadium.accessibility")}
                  </div>
                  <div className="font-bold text-[#2C3E50]">
                    {stadium.accessibility_score?.toFixed(1) ?? "—"}
                  </div>
                </li>
              </ul>
              <Link
                to={`/stadiums/${stadium.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-[#2ECC71] font-semibold text-sm hover:gap-2 transition-all"
              >
                {t("clubs.section.stadium.view")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Section>
          )}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
            {t("clubs.disclaimer")}
            {verified && (
              <div className="mt-2 text-amber-800/80">
                {t("clubs.last_verified")}: {verified}
              </div>
            )}
          </div>
        </aside>
      </section>
    </WebsiteLayout>
  );
};

export default ClubDetailPage;
