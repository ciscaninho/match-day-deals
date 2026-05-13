import { Compass, Heart, Landmark, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Stadium } from "@/hooks/useStadium";

type Props = {
  stadium: Stadium;
  variant?: "dark" | "light";
};

/**
 * Emotional pilgrimage intro for a stadium page.
 * Frames the venue as a destination, not a building — using only data we have
 * (capacity, opened_year, ultras_section, club_name).
 */
export const StadiumPilgrimage = ({ stadium, variant = "dark" }: Props) => {
  const { t, tf } = useLanguage();
  const isDark = variant === "dark";

  const ageYears = stadium.opened_year ? new Date().getFullYear() - stadium.opened_year : null;

  const cards = [
    {
      icon: Heart,
      title: tf("pilgrimage.story.title", "More than a stadium"),
      body: stadium.club_name
        ? tf("pilgrimage.story.body_with_club", "For supporters of {club}, every step toward {stadium} is part of the ritual — the songs, the scarves, the walk through the city.", {
            club: stadium.club_name,
            stadium: stadium.stadium_name,
          })
        : tf("pilgrimage.story.body_generic", "{stadium} is one of those places where the journey matters as much as the match.", { stadium: stadium.stadium_name }),
    },
    {
      icon: Landmark,
      title: tf("pilgrimage.heritage.title", "Heritage"),
      body: ageYears
        ? tf("pilgrimage.heritage.body_age", "Standing for {years} years in {city} — a piece of football history etched into the city itself.", {
            years: ageYears,
            city: stadium.city,
          })
        : tf("pilgrimage.heritage.body_generic", "Anchored in {city}, the stadium carries the identity of the club and its supporters.", { city: stadium.city }),
    },
    {
      icon: Sparkles,
      title: tf("pilgrimage.atmosphere.title", "Atmosphere"),
      body: stadium.ultras_section
        ? tf("pilgrimage.atmosphere.body_ultras", "When the {section} unleashes its tifo and song, the entire bowl follows. Few experiences in football compare.", {
            section: stadium.ultras_section,
          })
        : tf("pilgrimage.atmosphere.body_generic", "Capacity {capacity} — and on the right night, every single seat sounds like one.", {
            capacity: stadium.capacity ? stadium.capacity.toLocaleString() : "—",
          }),
    },
    {
      icon: Compass,
      title: tf("pilgrimage.journey.title", "Plan the journey"),
      body: tf("pilgrimage.journey.body", "Arrive early, wander the streets around the ground, find the supporters' bars. The match is the climax — not the whole story."),
    },
  ];

  return (
    <section className={isDark ? "bg-[#0b1220] text-white" : "bg-white text-[#1a2332]"}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-3 ${isDark ? "text-[#2ECC71]" : "text-[#27ae60]"}`}>
            {t("pilgrimage.eyebrow")}
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold leading-[1.15] ${isDark ? "text-white" : "text-[#1a2332]"}`}>
            {t("pilgrimage.heading", { stadium: stadium.stadium_name })}
          </h2>
          <p className={`mt-3 text-sm ${isDark ? "text-white/65" : "text-[#1a2332]/65"}`}>
            {t("pilgrimage.subheading")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {cards.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className={`group rounded-2xl p-5 border transition ${
                isDark
                  ? "bg-white/[0.04] border-white/10 hover:border-[#2ECC71]/40 hover:bg-white/[0.06]"
                  : "bg-[#f7f9fc] border-[#e6ebf2] hover:border-[#2ECC71]/40 hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-[#2ECC71]/15 text-[#2ECC71]" : "bg-[#2ECC71]/10 text-[#27ae60]"}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className={`font-extrabold text-[15px] ${isDark ? "text-white" : "text-[#1a2332]"}`}>{title}</div>
                  <p className={`mt-1 text-[13px] leading-relaxed ${isDark ? "text-white/70" : "text-[#1a2332]/70"}`}>{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
