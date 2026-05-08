import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useClubTicketingList } from "@/hooks/useClubTicketing";
import { DifficultyBadge } from "@/components/clubs/DifficultyBadge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSEO } from "@/lib/seo";

const ClubsPage = () => {
  const { data, isLoading } = useClubTicketingList();
  const { t } = useLanguage();

  useSEO({
    title: `${t("clubs.index.title")} | Foot Ticket Finder`,
    description: t("clubs.index.subtitle"),
    canonical: typeof window !== "undefined" ? `${window.location.origin}/clubs` : undefined,
  });

  return (
    <WebsiteLayout>
      <section className="max-w-6xl mx-auto px-5 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#2ECC71]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2ECC71] mb-4">
          <Trophy className="w-3.5 h-3.5" />
          {t("clubs.nav")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2C3E50]">
          {t("clubs.index.title")}
        </h1>
        <p className="mt-3 text-[#2C3E50]/70 max-w-2xl leading-relaxed">
          {t("clubs.index.subtitle")}
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-16">
        {isLoading ? (
          <p className="text-sm text-[#2C3E50]/60">{t("clubs.index.loading")}</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-[#2C3E50]/60">{t("clubs.index.empty")}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/clubs/${c.slug}`}
                  className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#2ECC71]/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#2ECC71]">
                        {c.league}
                      </div>
                      <div className="font-extrabold text-[#2C3E50] text-lg truncate">
                        {c.club_name}
                      </div>
                      <div className="text-xs text-[#2C3E50]/60 mt-0.5 truncate">
                        {[c.city, c.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    <DifficultyBadge level={c.average_difficulty} showLabel={false} />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.membership_required && (
                      <span className="text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                        {t("clubs.badge.membership")}
                      </span>
                    )}
                    {c.resale_exchange_available && (
                      <span className="text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                        {t("clubs.badge.exchange")}
                      </span>
                    )}
                    {c.ballot_system && (
                      <span className="text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                        {t("clubs.badge.ballot")}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2ECC71] group-hover:gap-2 transition-all">
                    {t("clubs.card.view")} <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </WebsiteLayout>
  );
};

export default ClubsPage;
