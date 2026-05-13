import { Train, BedDouble, UtensilsCrossed, Beer } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type Props = {
  city?: string | null;
  stadiumName: string;
  variant?: "dark" | "light";
};

/**
 * Practical, premium "travel essentials" grid for a stadium.
 * Editorial framing — no fake data, just sensible guidance for fans
 * planning a football trip.
 */
export const TravelEssentials = ({ city, stadiumName, variant = "dark" }: Props) => {
  const { t, tf } = useLanguage();
  const isDark = variant === "dark";
  const place = city || stadiumName;

  const items = [
    {
      icon: Train,
      title: tf("travel.transport.title", "Getting there"),
      body: tf("travel.transport.body", "Public transport into {city} is usually the fastest on matchday — expect heavy traffic around {stadium} from two hours before kick-off.", { city: place, stadium: stadiumName }),
    },
    {
      icon: BedDouble,
      title: tf("travel.stay.title", "Where to stay"),
      body: tf("travel.stay.body", "Sleep in the city centre, not next to the stadium. You'll get the pre-match walk and a much better night out after the final whistle."),
    },
    {
      icon: UtensilsCrossed,
      title: tf("travel.eat.title", "Eat before"),
      body: tf("travel.eat.body", "Pick a long, local lunch around 1–2pm. Avoid the chains close to the ground — quality drops sharply on matchday."),
    },
    {
      icon: Beer,
      title: tf("travel.drink.title", "Pre-match drink"),
      body: tf("travel.drink.body", "Find the supporters' bars on the walk in. Wear neutral colours if you're visiting; ask the bartender — they know which side they serve."),
    },
  ];

  return (
    <section className={isDark ? "bg-[#0b1220] text-white" : "bg-white text-[#1a2332]"}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="max-w-2xl mb-7">
          <div className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-3 ${isDark ? "text-[#2ECC71]" : "text-[#27ae60]"}`}>
            {t("travel.eyebrow")}
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold leading-[1.15] ${isDark ? "text-white" : "text-[#1a2332]"}`}>
            {t("travel.heading")}
          </h2>
          <p className={`mt-3 text-sm ${isDark ? "text-white/65" : "text-[#1a2332]/65"}`}>{t("travel.subheading")}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {items.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className={`rounded-2xl p-5 border transition ${
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

        <p className={`mt-6 text-[11px] ${isDark ? "text-white/40" : "text-[#1a2332]/45"}`}>
          {t("travel.disclaimer")}
        </p>
      </div>
    </section>
  );
};
