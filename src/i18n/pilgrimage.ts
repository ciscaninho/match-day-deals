import type { Locale } from "./translations";

/**
 * Pilgrimage / Matchday Journey / Travel Essentials i18n.
 * Other locales fall back to English via LanguageContext.
 */
export const pilgrimageI18n: Record<Locale, Record<string, string>> = {
  en: {
    // Pilgrimage intro
    "pilgrimage.eyebrow": "The Pilgrimage",
    "pilgrimage.heading": "{stadium} isn't a venue. It's a destination.",
    "pilgrimage.subheading":
      "Football trips are made of small rituals — the walk through the city, the songs from the bar next door, the first glimpse of the floodlights. Here's what makes this one matter.",

    // Matchday Journey timeline
    "journey.eyebrow": "Matchday Journey",
    "journey.heading": "Five chapters of a perfect matchday",
    "journey.subheading":
      "The match itself lasts 90 minutes. The journey lasts longer — and it's what you'll remember.",
    "journey.chapter": "Chapter {n}",

    // Travel essentials
    "travel.eyebrow": "Travel Essentials",
    "travel.heading": "Plan it like a fan, not a tourist",
    "travel.subheading":
      "Editorial guidance from people who travel for football. Practical, honest, no fluff.",
    "travel.disclaimer":
      "Local conditions vary by matchday. Always double-check transport schedules and stadium policies before you set off.",
  },
  fr: {
    "pilgrimage.eyebrow": "Le Pèlerinage",
    "pilgrimage.heading": "{stadium} n'est pas une enceinte. C'est une destination.",
    "pilgrimage.subheading":
      "Un voyage football, ce sont de petits rituels — la marche dans la ville, les chants du bar voisin, la première vue des projecteurs. Voici pourquoi celui-ci compte.",
    "journey.eyebrow": "Voyage du Matchday",
    "journey.heading": "Les cinq chapitres d'un matchday parfait",
    "journey.subheading":
      "Le match dure 90 minutes. Le voyage, lui, dure plus longtemps — et c'est ce dont vous vous souviendrez.",
    "journey.chapter": "Chapitre {n}",
    "travel.eyebrow": "Essentiels du voyage",
    "travel.heading": "Préparez-le en supporter, pas en touriste",
    "travel.subheading":
      "Des conseils éditoriaux de gens qui voyagent pour le football. Concrets, honnêtes, sans blabla.",
    "travel.disclaimer":
      "Les conditions locales varient selon les matchs. Vérifiez toujours les horaires de transport et les règles du stade avant de partir.",
  },
  es: {}, de: {}, it: {}, pt: {}, nl: {}, ar: {}, ru: {},
};
