import { Plane, Coffee, Music2, Trophy, Moon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type Props = {
  stadiumName: string;
  city?: string | null;
  variant?: "dark" | "light";
};

/**
 * Cinematic 5-chapter matchday timeline. The "pilgrimage" framing —
 * from arriving in the city to walking out after the final whistle.
 */
export const MatchdayJourney = ({ stadiumName, city, variant = "dark" }: Props) => {
  const { t, tf } = useLanguage();
  const isDark = variant === "dark";
  const place = city || stadiumName;

  const chapters = [
    {
      icon: Plane,
      label: tf("journey.ch1.label", "Days before"),
      title: tf("journey.ch1.title", "Arrive into the city"),
      body: tf("journey.ch1.body", "Land in {city} a day early. Walk the old town, find the club shop, feel the build-up.", { city: place }),
    },
    {
      icon: Coffee,
      label: tf("journey.ch2.label", "Matchday morning"),
      title: tf("journey.ch2.title", "Soak up the city"),
      body: tf("journey.ch2.body", "Coffee with locals, a long lunch, scarves already on the streets. The day belongs to football."),
    },
    {
      icon: Music2,
      label: tf("journey.ch3.label", "Two hours before"),
      title: tf("journey.ch3.title", "Walk to the ground"),
      body: tf("journey.ch3.body", "Join the crowd flowing toward {stadium}. Pre-match drinks, songs, the first roar from inside.", { stadium: stadiumName }),
    },
    {
      icon: Trophy,
      label: tf("journey.ch4.label", "Kick-off"),
      title: tf("journey.ch4.title", "90 minutes you'll remember"),
      body: tf("journey.ch4.body", "Anthems, tifo, the lights. Phones away — this is what you came for."),
    },
    {
      icon: Moon,
      label: tf("journey.ch5.label", "Final whistle"),
      title: tf("journey.ch5.title", "Take the long way home"),
      body: tf("journey.ch5.body", "Stay in the streets after. Talk to home fans, find a late bar, replay the night before it fades."),
    },
  ];

  return (
    <section className={isDark ? "bg-[#0b1220] text-white" : "bg-white text-[#1a2332]"}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="max-w-2xl mb-8">
          <div className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-3 ${isDark ? "text-[#2ECC71]" : "text-[#27ae60]"}`}>
            {t("journey.eyebrow")}
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold leading-[1.15] ${isDark ? "text-white" : "text-[#1a2332]"}`}>
            {t("journey.heading")}
          </h2>
          <p className={`mt-3 text-sm ${isDark ? "text-white/65" : "text-[#1a2332]/65"}`}>{t("journey.subheading")}</p>
        </div>

        <ol className="relative space-y-4 sm:space-y-5">
          {/* vertical rail */}
          <div
            className={`absolute left-[19px] top-2 bottom-2 w-px ${isDark ? "bg-gradient-to-b from-[#2ECC71]/40 via-white/10 to-transparent" : "bg-gradient-to-b from-[#2ECC71]/40 via-[#1a2332]/10 to-transparent"}`}
            aria-hidden
          />
          {chapters.map(({ icon: Icon, label, title, body }, i) => (
            <li key={title} className="relative pl-14">
              <div
                className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ring-4 ${
                  isDark
                    ? "bg-[#0b1220] ring-[#0b1220] border border-[#2ECC71]/40 text-[#2ECC71]"
                    : "bg-white ring-white border border-[#2ECC71]/40 text-[#27ae60]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div
                className={`rounded-2xl p-4 sm:p-5 border transition ${
                  isDark
                    ? "bg-white/[0.04] border-white/10 hover:border-[#2ECC71]/40"
                    : "bg-[#f7f9fc] border-[#e6ebf2] hover:border-[#2ECC71]/40 hover:bg-white"
                }`}
              >
                <div className={`text-[10px] uppercase tracking-[0.18em] font-bold mb-1 ${isDark ? "text-white/45" : "text-[#1a2332]/50"}`}>
                  {t("journey.chapter", { n: i + 1 })} · {label}
                </div>
                <div className={`font-extrabold text-[15px] sm:text-base ${isDark ? "text-white" : "text-[#1a2332]"}`}>{title}</div>
                <p className={`mt-1.5 text-[13px] leading-relaxed ${isDark ? "text-white/70" : "text-[#1a2332]/70"}`}>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
