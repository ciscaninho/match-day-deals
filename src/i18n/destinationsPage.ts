// Translations for the new Destinations Foot public experience (PR 1).
// Editorial copy, kept grounded — no AI-poetic writing.
// All 9 supported locales: en, fr, es, de, it, pt, nl, ar, ru.

import type { Locale } from "./translations";

export type DestinationsCopy = {
  eyebrow: string;
  hero_headlines: string[]; // rotates with carousel
  hero_subtitle: string;
  cta_explore: string;
  cta_view_all: string;
  featured_eyebrow: string;
  featured_title: string;
  featured_subtitle: string;
  upcoming_label: string; // "{count} upcoming"
  no_destinations: string;
  meta_title: string;
  meta_description: string;
  nav_label: string;
};

const COPY: Record<Locale, DestinationsCopy> = {
  en: {
    eyebrow: "Destinations Foot",
    hero_headlines: [
      "Choose your next football destination.",
      "Some stadiums are visited. Others are remembered.",
      "Every stadium tells a different story.",
    ],
    hero_subtitle: "Iconic clubs, legendary stadiums, and the cities that hold them — built for fans who travel for the game.",
    cta_explore: "Explore destinations",
    cta_view_all: "View all destinations",
    featured_eyebrow: "Featured this season",
    featured_title: "Where the matches are happening",
    featured_subtitle: "Hand-picked destinations with upcoming fixtures and verified ticket access.",
    upcoming_label: "{count} upcoming",
    no_destinations: "No destinations available right now.",
    meta_title: "Destinations Foot — Plan your next football trip",
    meta_description: "Discover iconic football destinations: clubs, stadiums, matchday experiences and the cities behind them.",
    nav_label: "Destinations",
  },
  fr: {
    eyebrow: "Destinations Foot",
    hero_headlines: [
      "Choisissez votre prochaine destination foot.",
      "Certains stades se visitent. D'autres se gravent.",
      "Chaque stade raconte une autre histoire.",
    ],
    hero_subtitle: "Clubs iconiques, stades de légende, et les villes qui les abritent — pensé pour les supporters qui voyagent pour le match.",
    cta_explore: "Explorer les destinations",
    cta_view_all: "Voir toutes les destinations",
    featured_eyebrow: "À l'affiche cette saison",
    featured_title: "Là où ça se passe",
    featured_subtitle: "Destinations sélectionnées avec matchs à venir et accès billetterie vérifié.",
    upcoming_label: "{count} à venir",
    no_destinations: "Aucune destination disponible pour le moment.",
    meta_title: "Destinations Foot — Préparez votre prochain voyage football",
    meta_description: "Découvrez les destinations foot iconiques : clubs, stades, expériences matchday et les villes qui les portent.",
    nav_label: "Destinations",
  },
  es: {
    eyebrow: "Destinos Foot",
    hero_headlines: [
      "Elige tu próximo destino futbolero.",
      "Algunos estadios se visitan. Otros se recuerdan.",
      "Cada estadio cuenta una historia distinta.",
    ],
    hero_subtitle: "Clubes míticos, estadios legendarios y las ciudades que los acogen — pensado para los aficionados que viajan por el partido.",
    cta_explore: "Explorar destinos",
    cta_view_all: "Ver todos los destinos",
    featured_eyebrow: "Destacados esta temporada",
    featured_title: "Dónde se juegan los partidos",
    featured_subtitle: "Destinos seleccionados con partidos próximos y acceso a entradas verificado.",
    upcoming_label: "{count} próximos",
    no_destinations: "No hay destinos disponibles en este momento.",
    meta_title: "Destinos Foot — Planifica tu próximo viaje futbolero",
    meta_description: "Descubre destinos futboleros icónicos: clubes, estadios, experiencias de día de partido y las ciudades que los rodean.",
    nav_label: "Destinos",
  },
  de: {
    eyebrow: "Fußball-Destinationen",
    hero_headlines: [
      "Wähle dein nächstes Fußballziel.",
      "Manche Stadien besucht man. Andere bleiben für immer.",
      "Jedes Stadion erzählt eine andere Geschichte.",
    ],
    hero_subtitle: "Legendäre Vereine, ikonische Stadien und die Städte, die sie tragen — für Fans, die für das Spiel reisen.",
    cta_explore: "Destinationen entdecken",
    cta_view_all: "Alle Destinationen ansehen",
    featured_eyebrow: "Diese Saison im Fokus",
    featured_title: "Wo gespielt wird",
    featured_subtitle: "Ausgewählte Destinationen mit kommenden Spielen und geprüftem Ticketzugang.",
    upcoming_label: "{count} bevorstehend",
    no_destinations: "Aktuell keine Destinationen verfügbar.",
    meta_title: "Fußball-Destinationen — Plane deine nächste Fußballreise",
    meta_description: "Entdecke ikonische Fußballziele: Vereine, Stadien, Matchday-Erlebnisse und die Städte dahinter.",
    nav_label: "Destinationen",
  },
  it: {
    eyebrow: "Destinazioni Foot",
    hero_headlines: [
      "Scegli la tua prossima destinazione calcistica.",
      "Alcuni stadi si visitano. Altri si ricordano.",
      "Ogni stadio racconta una storia diversa.",
    ],
    hero_subtitle: "Club iconici, stadi leggendari e le città che li ospitano — pensato per i tifosi che viaggiano per la partita.",
    cta_explore: "Esplora le destinazioni",
    cta_view_all: "Vedi tutte le destinazioni",
    featured_eyebrow: "In primo piano questa stagione",
    featured_title: "Dove si gioca",
    featured_subtitle: "Destinazioni selezionate con partite imminenti e accesso ai biglietti verificato.",
    upcoming_label: "{count} in arrivo",
    no_destinations: "Nessuna destinazione disponibile al momento.",
    meta_title: "Destinazioni Foot — Pianifica il tuo prossimo viaggio calcistico",
    meta_description: "Scopri destinazioni calcistiche iconiche: club, stadi, esperienze matchday e le città che li circondano.",
    nav_label: "Destinazioni",
  },
  pt: {
    eyebrow: "Destinos Foot",
    hero_headlines: [
      "Escolhe o teu próximo destino de futebol.",
      "Alguns estádios visitam-se. Outros guardam-se.",
      "Cada estádio conta uma história diferente.",
    ],
    hero_subtitle: "Clubes míticos, estádios lendários e as cidades que os abrigam — feito para adeptos que viajam pelo jogo.",
    cta_explore: "Explorar destinos",
    cta_view_all: "Ver todos os destinos",
    featured_eyebrow: "Destaques desta temporada",
    featured_title: "Onde se joga",
    featured_subtitle: "Destinos selecionados com jogos próximos e acesso a bilhetes verificado.",
    upcoming_label: "{count} próximos",
    no_destinations: "Sem destinos disponíveis de momento.",
    meta_title: "Destinos Foot — Planeia a tua próxima viagem de futebol",
    meta_description: "Descobre destinos de futebol icónicos: clubes, estádios, experiências de dia de jogo e as cidades à sua volta.",
    nav_label: "Destinos",
  },
  nl: {
    eyebrow: "Voetbalbestemmingen",
    hero_headlines: [
      "Kies je volgende voetbalbestemming.",
      "Sommige stadions bezoek je. Andere onthou je.",
      "Elk stadion vertelt een ander verhaal.",
    ],
    hero_subtitle: "Iconische clubs, legendarische stadions en de steden die ze dragen — gemaakt voor fans die reizen voor de wedstrijd.",
    cta_explore: "Bestemmingen ontdekken",
    cta_view_all: "Alle bestemmingen bekijken",
    featured_eyebrow: "Uitgelicht dit seizoen",
    featured_title: "Waar er gevoetbald wordt",
    featured_subtitle: "Geselecteerde bestemmingen met komende wedstrijden en geverifieerde ticketmogelijkheden.",
    upcoming_label: "{count} aankomend",
    no_destinations: "Momenteel geen bestemmingen beschikbaar.",
    meta_title: "Voetbalbestemmingen — Plan je volgende voetbalreis",
    meta_description: "Ontdek iconische voetbalbestemmingen: clubs, stadions, matchday-ervaringen en de steden eromheen.",
    nav_label: "Bestemmingen",
  },
  ar: {
    eyebrow: "وجهات كرة القدم",
    hero_headlines: [
      "اختر وجهتك الكروية القادمة.",
      "بعض الملاعب تُزار. أخرى لا تُنسى.",
      "كل ملعب يروي قصة مختلفة.",
    ],
    hero_subtitle: "أندية أيقونية وملاعب أسطورية والمدن التي تحتضنها — مصمَّم للمشجعين الذين يسافرون من أجل المباراة.",
    cta_explore: "استكشاف الوجهات",
    cta_view_all: "عرض كل الوجهات",
    featured_eyebrow: "أبرز هذا الموسم",
    featured_title: "حيث تُقام المباريات",
    featured_subtitle: "وجهات مختارة بمباريات قادمة وإمكانية شراء تذاكر موثوقة.",
    upcoming_label: "{count} قادمة",
    no_destinations: "لا توجد وجهات متاحة حالياً.",
    meta_title: "وجهات كرة القدم — خطّط لرحلتك الكروية القادمة",
    meta_description: "اكتشف وجهات كرة القدم الأيقونية: الأندية والملاعب وتجارب يوم المباراة والمدن المحيطة بها.",
    nav_label: "وجهات",
  },
  ru: {
    eyebrow: "Футбольные направления",
    hero_headlines: [
      "Выберите ваше следующее футбольное направление.",
      "Одни стадионы посещают. Другие — запоминают.",
      "Каждый стадион рассказывает свою историю.",
    ],
    hero_subtitle: "Легендарные клубы, культовые стадионы и города вокруг них — для фанатов, которые едут ради матча.",
    cta_explore: "Открыть направления",
    cta_view_all: "Все направления",
    featured_eyebrow: "В фокусе этого сезона",
    featured_title: "Где играют матчи",
    featured_subtitle: "Подобранные направления с ближайшими матчами и проверенным доступом к билетам.",
    upcoming_label: "{count} впереди",
    no_destinations: "Сейчас нет доступных направлений.",
    meta_title: "Футбольные направления — спланируйте следующую футбольную поездку",
    meta_description: "Откройте знаковые футбольные направления: клубы, стадионы, матчдей-опыт и города вокруг них.",
    nav_label: "Направления",
  },
};

export const getDestinationsCopy = (locale: Locale): DestinationsCopy =>
  COPY[locale] ?? COPY.en;
