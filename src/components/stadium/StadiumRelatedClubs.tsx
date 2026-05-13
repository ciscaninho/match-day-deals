import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { DifficultyBadge } from "@/components/clubs/DifficultyBadge";
import type { ClubTicketingProfile } from "@/hooks/useClubTicketing";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export const StadiumRelatedClubs = ({
  stadiumSlug,
  stadiumName,
}: {
  stadiumSlug: string;
  stadiumName: string;
}) => {
  const { t } = useLanguage();
  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs-by-stadium", stadiumSlug, stadiumName],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ClubTicketingProfile[]> => {
      const { data } = await supabase.from("club_ticketing_profiles").select("*").is("archived_at", null);
      const list = (data ?? []) as ClubTicketingProfile[];
      const t = norm(stadiumName);
      return list.filter(
        (c) =>
          c.stadium_slug === stadiumSlug ||
          (c.stadium_name && (norm(c.stadium_name) === t || norm(c.stadium_name).includes(t) || t.includes(norm(c.stadium_name))))
      );
    },
  });

  if (!clubs.length) return null;

  return (
    <section className="max-w-5xl mx-auto px-5 py-6">
      <div className="text-xs uppercase tracking-wider text-white/55 font-bold mb-3 flex items-center gap-1.5">
        <Ticket className="w-3.5 h-3.5" /> {t("stadium.related_clubs")}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {clubs.map((club) => (
          <Link
            key={club.id}
            to={`/clubs/${club.slug}`}
            className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-[#2ECC71]/40 transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.club_name} className="w-full h-full object-contain" />
              ) : (
                <Ticket className="w-5 h-5 text-white/60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm text-white truncate">{club.club_name}</div>
              <div className="mt-1">
                <DifficultyBadge level={club.average_difficulty} showLabel={false} />
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};
