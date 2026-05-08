// Translations for the public marketing pages: About (How it works), Pricing, App landing.
// Keys are organized by page prefix: about.*, pricing.*, applanding.*

import type { Locale } from "./translations";

type Dict = Record<string, string>;

const en: Dict = {
  // ABOUT / HOW IT WORKS
  "about.hero.title": "How Foot Ticket Finder works",
  "about.hero.subtitle":
    "We don't sell tickets. We guide you to the right official platform at the right moment, so you can secure your seat with confidence.",
  "about.step1.title": "1. Track upcoming matches",
  "about.step1.desc":
    "We monitor every major fixture across the top European leagues, Champions League and international competitions.",
  "about.step2.title": "2. See ticket release dates",
  "about.step2.desc":
    "Know exactly when each official ticket sale opens — clubs, federations, UEFA and FIFA.",
  "about.step3.title": "3. Get instant alerts",
  "about.step3.desc":
    "Receive a notification the moment tickets become available. Be ahead of the queue.",
  "about.step4.title": "4. Buy from official sources",
  "about.step4.desc":
    "We link you directly to verified, official ticket platforms — no shady resellers.",
  "about.step5.title": "5. Play & earn",
  "about.step5.desc":
    "Play the daily football quiz, build streaks and earn rewards inside the app.",
  "about.step6.title": "6. Upgrade to Premium",
  "about.step6.desc":
    "Unlock priority alerts, remove ads and get early access to ticket releases.",
  "about.cta.title": "Ready to never miss a release?",
  "about.cta.button": "Open the app",

  // PRICING
  "pricing.badge": "Your fan companion",
  "pricing.hero.title": "Never miss a match that matters.",
  "pricing.hero.subtitle":
    "From dream fixtures to your stadium passport — Premium gives you the tools to live football, not just watch it.",
  "pricing.per_month": "/month",
  "pricing.free.title": "Free",
  "pricing.free.subtitle": "Browse, compare, explore",
  "pricing.free.feat1": "Browse upcoming matches across Europe",
  "pricing.free.feat2": "Compare official ticket releases",
  "pricing.free.feat3": "Discover stadiums and atmospheres",
  "pricing.free.feat4": "Save a few favourite matches",
  "pricing.free.cta": "Explore matches",
  "pricing.premium.badge": "Most loved",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "The complete fan experience",
  "pricing.premium.cancel_note": "Cancel anytime · No commitment",
  "pricing.premium.feat1": "Priority alerts on official ticket releases",
  "pricing.premium.feat2": "Trusted resale price comparison",
  "pricing.premium.feat3": "Unlimited dream-match tracking",
  "pricing.premium.feat4": "Stadium passport & visited matches",
  "pricing.premium.feat5": "Ad-free, premium fan experience",
  "pricing.premium.cta": "Become Premium",
  "pricing.values.alerts.title": "Official releases first",
  "pricing.values.alerts.body": "Be the first to know when clubs, UEFA or FIFA open the gates — before they sell out.",
  "pricing.values.tracking.title": "Trusted resale, no surprises",
  "pricing.values.tracking.body": "Compare prices across verified marketplaces and buy with confidence.",
  "pricing.values.favs.title": "Your football passport",
  "pricing.values.favs.body": "Track stadiums visited, matches lived, and never lose a memory.",

  // APP LANDING
  "applanding.hero.badge": "Free companion app",
  "applanding.hero.title_1": "Get ticket price alerts",
  "applanding.hero.title_highlight": "in real time",
  "applanding.hero.subtitle":
    "Be the first to know when prices drop. Track your favorite matches and never miss a deal again.",
  "applanding.hero.cta_install": "Install app",
  "applanding.hero.cta_installed": "Installed",
  "applanding.hero.cta_alerts": "Enable price alerts",
  "applanding.hero.point_free": "Free to use",
  "applanding.hero.point_nospam": "No spam",
  "applanding.hero.point_devices": "iPhone & Android",
  "applanding.phone.eyebrow": "Price alerts",
  "applanding.phone.title": "Your watchlist",
  "applanding.phone.providers": "12 providers",
  "applanding.phone.alert": "Price drop · Liverpool – Man Utd · €89",
  "applanding.features.eyebrow": "What you get",
  "applanding.features.title": "Built for ticket hunters",
  "applanding.features.alerts.title": "Price alerts",
  "applanding.features.alerts.desc":
    "Get push notifications the second prices drop on a match you're tracking.",
  "applanding.features.favorites.title": "Favorite matches",
  "applanding.features.favorites.desc":
    "Build your watchlist and follow your team — synced across all your devices.",
  "applanding.features.history.title": "Price history",
  "applanding.features.history.desc":
    "See how prices have moved over time and decide the best moment to buy.",
  "applanding.trust.free.label": "Free to use",
  "applanding.trust.free.desc": "No card, no fees",
  "applanding.trust.nospam.label": "No spam",
  "applanding.trust.nospam.desc": "Only the alerts you choose",
  "applanding.trust.loved.label": "Loved by fans",
  "applanding.trust.loved.desc": "Across Europe",
  "applanding.install.title": "Install in seconds",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Open this page in Safari",
  "applanding.install.iphone.s2": "Tap the Share icon",
  "applanding.install.iphone.s3": "Choose \"Add to Home Screen\"",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Open this page in Chrome",
  "applanding.install.android.s2": "Tap the menu (⋮)",
  "applanding.install.android.s3": "Choose \"Install app\" or \"Add to Home Screen\"",
  "applanding.cta.title": "Ready to catch the next price drop?",
  "applanding.cta.subtitle": "Install the app now — it's free and takes 5 seconds.",
  "applanding.cta.open": "Open the app",
  "applanding.toast.install_title": "To install:",
  "applanding.toast.install_desc":
    "On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app.",
  "app.coming_soon": "Mobile app coming soon",
  "app.coming_soon_short": "Coming soon",
  "app.coming_soon_desc": "Our mobile app is launching soon. Stay tuned.",
};

const fr: Dict = {
  "about.hero.title": "Comment fonctionne Foot Ticket Finder",
  "about.hero.subtitle":
    "Nous ne vendons pas de billets. Nous vous guidons vers la bonne plateforme officielle au bon moment, pour réserver votre place en toute confiance.",
  "about.step1.title": "1. Suivez les prochains matchs",
  "about.step1.desc":
    "Nous surveillons chaque grande affiche des plus grands championnats européens, de la Ligue des Champions et des compétitions internationales.",
  "about.step2.title": "2. Voyez les dates de mise en vente",
  "about.step2.desc":
    "Sachez exactement quand chaque billetterie officielle ouvre — clubs, fédérations, UEFA et FIFA.",
  "about.step3.title": "3. Recevez des alertes instantanées",
  "about.step3.desc":
    "Recevez une notification dès que les billets sont disponibles. Prenez de l'avance sur la file d'attente.",
  "about.step4.title": "4. Achetez auprès de sources officielles",
  "about.step4.desc":
    "Nous vous redirigeons vers des plateformes officielles vérifiées — pas de revendeurs douteux.",
  "about.step5.title": "5. Jouez et gagnez",
  "about.step5.desc":
    "Jouez au quiz foot quotidien, enchaînez les séries et gagnez des récompenses dans l'app.",
  "about.step6.title": "6. Passez à Premium",
  "about.step6.desc":
    "Débloquez des alertes prioritaires, supprimez les pubs et accédez en avant-première aux mises en vente.",
  "about.cta.title": "Prêt à ne plus jamais rater une mise en vente ?",
  "about.cta.button": "Ouvrir l'application",

  "pricing.badge": "Votre compagnon de supporter",
  "pricing.hero.title": "Ne manquez plus jamais un match qui compte.",
  "pricing.hero.subtitle":
    "Des matchs de rêve à votre passeport stade — Premium vous donne les outils pour vivre le football, pas juste le regarder.",
  "pricing.per_month": "/mois",
  "pricing.free.title": "Gratuit",
  "pricing.free.subtitle": "Explorez, comparez, découvrez",
  "pricing.free.feat1": "Parcourez les matchs à venir en Europe",
  "pricing.free.feat2": "Comparez les mises en vente officielles",
  "pricing.free.feat3": "Découvrez les stades et leur ambiance",
  "pricing.free.feat4": "Sauvegardez quelques matchs favoris",
  "pricing.free.cta": "Explorer les matchs",
  "pricing.premium.badge": "Le plus aimé",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "L'expérience supporter complète",
  "pricing.premium.cancel_note": "Sans engagement · Annulable à tout moment",
  "pricing.premium.feat1": "Alertes prioritaires sur les ventes officielles",
  "pricing.premium.feat2": "Comparateur de revente de confiance",
  "pricing.premium.feat3": "Suivi illimité de vos matchs de rêve",
  "pricing.premium.feat4": "Passeport stade & matchs vécus",
  "pricing.premium.feat5": "Sans pub, expérience premium",
  "pricing.premium.cta": "Passer Premium",
  "pricing.values.alerts.title": "Les ventes officielles en premier",
  "pricing.values.alerts.body":
    "Soyez prévenu dès que les clubs, l'UEFA ou la FIFA ouvrent la billetterie — avant la rupture.",
  "pricing.values.tracking.title": "Revente de confiance, sans surprise",
  "pricing.values.tracking.body":
    "Comparez les prix sur des marketplaces vérifiées et achetez en toute confiance.",
  "pricing.values.favs.title": "Votre passeport football",
  "pricing.values.favs.body":
    "Gardez la trace des stades visités et des matchs vécus, jamais d'oubli.",

  "applanding.hero.badge": "Application compagnon gratuite",
  "applanding.hero.title_1": "Recevez les alertes prix de billets",
  "applanding.hero.title_highlight": "en temps réel",
  "applanding.hero.subtitle":
    "Soyez le premier informé quand les prix baissent. Suivez vos matchs préférés et ne ratez plus jamais une bonne affaire.",
  "applanding.hero.cta_install": "Installer l'app",
  "applanding.hero.cta_installed": "Installée",
  "applanding.hero.cta_alerts": "Activer les alertes prix",
  "applanding.hero.point_free": "Gratuit",
  "applanding.hero.point_nospam": "Sans spam",
  "applanding.hero.point_devices": "iPhone & Android",
  "applanding.phone.eyebrow": "Alertes prix",
  "applanding.phone.title": "Votre liste de suivi",
  "applanding.phone.providers": "12 revendeurs",
  "applanding.phone.alert": "Baisse de prix · Liverpool – Man Utd · 89 €",
  "applanding.features.eyebrow": "Ce que vous obtenez",
  "applanding.features.title": "Conçu pour les chasseurs de billets",
  "applanding.features.alerts.title": "Alertes prix",
  "applanding.features.alerts.desc":
    "Recevez une notification dès qu'un prix baisse sur un match suivi.",
  "applanding.features.favorites.title": "Matchs favoris",
  "applanding.features.favorites.desc":
    "Constituez votre liste de suivi et soutenez votre équipe — synchronisée sur tous vos appareils.",
  "applanding.features.history.title": "Historique des prix",
  "applanding.features.history.desc":
    "Voyez comment les prix évoluent dans le temps et choisissez le meilleur moment pour acheter.",
  "applanding.trust.free.label": "Gratuit",
  "applanding.trust.free.desc": "Sans carte, sans frais",
  "applanding.trust.nospam.label": "Sans spam",
  "applanding.trust.nospam.desc": "Uniquement les alertes choisies",
  "applanding.trust.loved.label": "Adorée des fans",
  "applanding.trust.loved.desc": "Partout en Europe",
  "applanding.install.title": "Installation en quelques secondes",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Ouvrez cette page dans Safari",
  "applanding.install.iphone.s2": "Touchez l'icône Partager",
  "applanding.install.iphone.s3": "Choisissez « Sur l'écran d'accueil »",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Ouvrez cette page dans Chrome",
  "applanding.install.android.s2": "Touchez le menu (⋮)",
  "applanding.install.android.s3": "Choisissez « Installer l'application »",
  "applanding.cta.title": "Prêt à attraper la prochaine baisse de prix ?",
  "applanding.cta.subtitle":
    "Installez l'application maintenant — c'est gratuit et ça prend 5 secondes.",
  "applanding.cta.open": "Ouvrir l'application",
  "applanding.toast.install_title": "Pour installer :",
  "applanding.toast.install_desc":
    "Sur iPhone : Partager → Sur l'écran d'accueil. Sur Android : menu navigateur → Installer l'application.",
  "app.coming_soon": "Application bientôt disponible",
  "app.coming_soon_short": "Bientôt disponible",
  "app.coming_soon_desc": "Notre application mobile arrive bientôt. Restez connecté.",
};

const es: Dict = {
  "about.hero.title": "Cómo funciona Foot Ticket Finder",
  "about.hero.subtitle":
    "No vendemos entradas. Te guiamos a la plataforma oficial correcta en el momento adecuado para que asegures tu asiento con confianza.",
  "about.step1.title": "1. Sigue los próximos partidos",
  "about.step1.desc":
    "Monitoreamos cada gran partido de las principales ligas europeas, la Champions League y las competiciones internacionales.",
  "about.step2.title": "2. Conoce las fechas de venta",
  "about.step2.desc":
    "Sabe exactamente cuándo abre cada venta oficial: clubes, federaciones, UEFA y FIFA.",
  "about.step3.title": "3. Recibe alertas instantáneas",
  "about.step3.desc":
    "Recibe una notificación en cuanto las entradas estén disponibles. Adelántate a la cola.",
  "about.step4.title": "4. Compra en fuentes oficiales",
  "about.step4.desc":
    "Te enlazamos directamente a plataformas oficiales verificadas — sin revendedores dudosos.",
  "about.step5.title": "5. Juega y gana",
  "about.step5.desc":
    "Juega el quiz diario de fútbol, mantén la racha y gana recompensas en la app.",
  "about.step6.title": "6. Hazte Premium",
  "about.step6.desc":
    "Desbloquea alertas prioritarias, elimina anuncios y obtén acceso anticipado a las ventas.",
  "about.cta.title": "¿Listo para no perderte ninguna venta?",
  "about.cta.button": "Abrir la app",

  "pricing.badge": "Tu compañero como aficionado",
  "pricing.hero.title": "Nunca te pierdas un partido que importa.",
  "pricing.hero.subtitle":
    "De los partidos soñados a tu pasaporte de estadios — Premium te da las herramientas para vivir el fútbol, no solo verlo.",
  "pricing.per_month": "/mes",
  "pricing.free.title": "Gratis",
  "pricing.free.subtitle": "Explora, compara, descubre",
  "pricing.free.feat1": "Explora los próximos partidos en Europa",
  "pricing.free.feat2": "Compara las salidas oficiales a la venta",
  "pricing.free.feat3": "Descubre estadios y ambientes",
  "pricing.free.feat4": "Guarda algunos partidos favoritos",
  "pricing.free.cta": "Explorar partidos",
  "pricing.premium.badge": "El más querido",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "La experiencia completa del aficionado",
  "pricing.premium.cancel_note": "Cancela cuando quieras · Sin compromiso",
  "pricing.premium.feat1": "Alertas prioritarias en ventas oficiales",
  "pricing.premium.feat2": "Comparador de reventa de confianza",
  "pricing.premium.feat3": "Seguimiento ilimitado de partidos soñados",
  "pricing.premium.feat4": "Pasaporte de estadios y partidos vividos",
  "pricing.premium.feat5": "Sin anuncios, experiencia premium",
  "pricing.premium.cta": "Hazte Premium",
  "pricing.values.alerts.title": "Las ventas oficiales primero",
  "pricing.values.alerts.body":
    "Entérate antes que nadie cuando clubes, UEFA o FIFA abran las taquillas — antes de que se agoten.",
  "pricing.values.tracking.title": "Reventa de confianza, sin sorpresas",
  "pricing.values.tracking.body":
    "Compara precios en marketplaces verificados y compra con confianza.",
  "pricing.values.favs.title": "Tu pasaporte futbolero",
  "pricing.values.favs.body":
    "Registra estadios visitados y partidos vividos, sin olvidos.",

  "applanding.hero.badge": "App complementaria gratuita",
  "applanding.hero.title_1": "Recibe alertas de precio de entradas",
  "applanding.hero.title_highlight": "en tiempo real",
  "applanding.hero.subtitle":
    "Sé el primero en saber cuándo bajan los precios. Sigue tus partidos favoritos y no te pierdas ninguna oferta.",
  "applanding.hero.cta_install": "Instalar app",
  "applanding.hero.cta_installed": "Instalada",
  "applanding.hero.cta_alerts": "Activar alertas de precio",
  "applanding.hero.point_free": "Gratis",
  "applanding.hero.point_nospam": "Sin spam",
  "applanding.hero.point_devices": "iPhone y Android",
  "applanding.phone.eyebrow": "Alertas de precio",
  "applanding.phone.title": "Tu lista de seguimiento",
  "applanding.phone.providers": "12 proveedores",
  "applanding.phone.alert": "Bajada de precio · Liverpool – Man Utd · 89 €",
  "applanding.features.eyebrow": "Lo que obtienes",
  "applanding.features.title": "Hecha para cazadores de entradas",
  "applanding.features.alerts.title": "Alertas de precio",
  "applanding.features.alerts.desc":
    "Recibe notificaciones push en cuanto bajen los precios de un partido que sigues.",
  "applanding.features.favorites.title": "Partidos favoritos",
  "applanding.features.favorites.desc":
    "Crea tu lista de seguimiento y sigue a tu equipo — sincronizado en todos tus dispositivos.",
  "applanding.features.history.title": "Histórico de precios",
  "applanding.features.history.desc":
    "Ve cómo han cambiado los precios y decide el mejor momento para comprar.",
  "applanding.trust.free.label": "Gratis",
  "applanding.trust.free.desc": "Sin tarjeta, sin comisiones",
  "applanding.trust.nospam.label": "Sin spam",
  "applanding.trust.nospam.desc": "Solo las alertas que elijas",
  "applanding.trust.loved.label": "Querida por los aficionados",
  "applanding.trust.loved.desc": "En toda Europa",
  "applanding.install.title": "Instala en segundos",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Abre esta página en Safari",
  "applanding.install.iphone.s2": "Toca el icono Compartir",
  "applanding.install.iphone.s3": "Elige «Añadir a pantalla de inicio»",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Abre esta página en Chrome",
  "applanding.install.android.s2": "Toca el menú (⋮)",
  "applanding.install.android.s3": "Elige «Instalar app» o «Añadir a pantalla de inicio»",
  "applanding.cta.title": "¿Listo para cazar la próxima bajada de precio?",
  "applanding.cta.subtitle":
    "Instala la app ahora — es gratis y tarda 5 segundos.",
  "applanding.cta.open": "Abrir la app",
  "applanding.toast.install_title": "Para instalar:",
  "applanding.toast.install_desc":
    "En iPhone: Compartir → Añadir a pantalla de inicio. En Android: menú del navegador → Instalar app.",
  "app.coming_soon": "Aplicación móvil próximamente",
  "app.coming_soon_short": "Próximamente",
  "app.coming_soon_desc": "Nuestra app móvil llegará pronto. Mantente atento.",
};

const de: Dict = {
  "about.hero.title": "So funktioniert Foot Ticket Finder",
  "about.hero.subtitle":
    "Wir verkaufen keine Tickets. Wir leiten dich zur richtigen offiziellen Plattform zum richtigen Zeitpunkt — damit du deinen Platz mit Vertrauen sicherst.",
  "about.step1.title": "1. Verfolge kommende Spiele",
  "about.step1.desc":
    "Wir beobachten jedes Top-Spiel der größten europäischen Ligen, der Champions League und internationaler Wettbewerbe.",
  "about.step2.title": "2. Erfahre die Verkaufsstarts",
  "about.step2.desc":
    "Wisse genau, wann jeder offizielle Ticketverkauf öffnet — Vereine, Verbände, UEFA und FIFA.",
  "about.step3.title": "3. Erhalte sofortige Benachrichtigungen",
  "about.step3.desc":
    "Erhalte eine Meldung, sobald Tickets verfügbar sind. Sei der Schlange voraus.",
  "about.step4.title": "4. Kaufe bei offiziellen Quellen",
  "about.step4.desc":
    "Wir verlinken dich direkt zu verifizierten, offiziellen Ticketplattformen — keine zwielichtigen Wiederverkäufer.",
  "about.step5.title": "5. Spiele & gewinne",
  "about.step5.desc":
    "Spiele das tägliche Fußball-Quiz, baue Streaks auf und sammle Belohnungen in der App.",
  "about.step6.title": "6. Auf Premium upgraden",
  "about.step6.desc":
    "Schalte priorisierte Alerts frei, entferne Werbung und erhalte frühen Zugang zu Verkaufsstarts.",
  "about.cta.title": "Bereit, keinen Verkaufsstart mehr zu verpassen?",
  "about.cta.button": "App öffnen",

  "pricing.badge": "Dein Fan-Begleiter",
  "pricing.hero.title": "Verpasse nie wieder ein Spiel, das zählt.",
  "pricing.hero.subtitle":
    "Von Traumspielen bis zu deinem Stadion-Pass — Premium gibt dir die Werkzeuge, Fußball zu leben, nicht nur zu schauen.",
  "pricing.per_month": "/Monat",
  "pricing.free.title": "Kostenlos",
  "pricing.free.subtitle": "Stöbern, vergleichen, entdecken",
  "pricing.free.feat1": "Kommende Spiele in ganz Europa entdecken",
  "pricing.free.feat2": "Offizielle Ticket-Releases vergleichen",
  "pricing.free.feat3": "Stadien und Atmosphären entdecken",
  "pricing.free.feat4": "Einige Lieblingsspiele speichern",
  "pricing.free.cta": "Spiele entdecken",
  "pricing.premium.badge": "Am beliebtesten",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Das komplette Fan-Erlebnis",
  "pricing.premium.cancel_note": "Jederzeit kündbar · Keine Verpflichtung",
  "pricing.premium.feat1": "Prioritäts-Alarme bei offiziellen Releases",
  "pricing.premium.feat2": "Vertrauenswürdiger Resale-Vergleich",
  "pricing.premium.feat3": "Unbegrenztes Tracking deiner Traumspiele",
  "pricing.premium.feat4": "Stadion-Pass & besuchte Spiele",
  "pricing.premium.feat5": "Werbefrei, Premium-Erlebnis",
  "pricing.premium.cta": "Premium werden",
  "pricing.values.alerts.title": "Offizielle Releases zuerst",
  "pricing.values.alerts.body":
    "Erfahre als Erster, wenn Clubs, UEFA oder FIFA die Tore öffnen — bevor alles weg ist.",
  "pricing.values.tracking.title": "Vertrauenswürdiger Resale, keine Überraschungen",
  "pricing.values.tracking.body":
    "Vergleiche Preise auf verifizierten Marktplätzen und kaufe mit Vertrauen.",
  "pricing.values.favs.title": "Dein Fußball-Pass",
  "pricing.values.favs.body":
    "Halte besuchte Stadien und erlebte Spiele fest — keine Erinnerung geht verloren.",

  "applanding.hero.badge": "Kostenlose Companion-App",
  "applanding.hero.title_1": "Erhalte Ticket-Preisalarme",
  "applanding.hero.title_highlight": "in Echtzeit",
  "applanding.hero.subtitle":
    "Sei der Erste, der weiß, wann Preise fallen. Verfolge deine Lieblingsspiele und verpasse keinen Deal mehr.",
  "applanding.hero.cta_install": "App installieren",
  "applanding.hero.cta_installed": "Installiert",
  "applanding.hero.cta_alerts": "Preisalarme aktivieren",
  "applanding.hero.point_free": "Kostenlos",
  "applanding.hero.point_nospam": "Kein Spam",
  "applanding.hero.point_devices": "iPhone & Android",
  "applanding.phone.eyebrow": "Preisalarme",
  "applanding.phone.title": "Deine Watchlist",
  "applanding.phone.providers": "12 Anbieter",
  "applanding.phone.alert": "Preisrückgang · Liverpool – Man Utd · 89 €",
  "applanding.features.eyebrow": "Was du bekommst",
  "applanding.features.title": "Gemacht für Ticket-Jäger",
  "applanding.features.alerts.title": "Preisalarme",
  "applanding.features.alerts.desc":
    "Erhalte Push-Benachrichtigungen in der Sekunde, in der Preise für ein verfolgtes Spiel fallen.",
  "applanding.features.favorites.title": "Lieblingsspiele",
  "applanding.features.favorites.desc":
    "Erstelle deine Watchlist und folge deinem Team — auf allen Geräten synchronisiert.",
  "applanding.features.history.title": "Preisverlauf",
  "applanding.features.history.desc":
    "Sieh, wie sich die Preise entwickelt haben, und entscheide den besten Kaufzeitpunkt.",
  "applanding.trust.free.label": "Kostenlos",
  "applanding.trust.free.desc": "Keine Karte, keine Gebühren",
  "applanding.trust.nospam.label": "Kein Spam",
  "applanding.trust.nospam.desc": "Nur die Alarme, die du wählst",
  "applanding.trust.loved.label": "Von Fans geliebt",
  "applanding.trust.loved.desc": "In ganz Europa",
  "applanding.install.title": "In Sekunden installieren",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Öffne diese Seite in Safari",
  "applanding.install.iphone.s2": "Tippe auf das Teilen-Symbol",
  "applanding.install.iphone.s3": "Wähle „Zum Home-Bildschirm“",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Öffne diese Seite in Chrome",
  "applanding.install.android.s2": "Tippe auf das Menü (⋮)",
  "applanding.install.android.s3": "Wähle „App installieren“ oder „Zum Startbildschirm“",
  "applanding.cta.title": "Bereit, den nächsten Preisrückgang mitzunehmen?",
  "applanding.cta.subtitle":
    "Installiere die App jetzt — kostenlos und in 5 Sekunden erledigt.",
  "applanding.cta.open": "App öffnen",
  "applanding.toast.install_title": "Zum Installieren:",
  "applanding.toast.install_desc":
    "Auf iPhone: Teilen → Zum Home-Bildschirm. Auf Android: Browsermenü → App installieren.",
  "app.coming_soon": "Mobile App bald verfügbar",
  "app.coming_soon_short": "Bald verfügbar",
  "app.coming_soon_desc": "Unsere mobile App kommt bald. Bleib dran.",
};

const it: Dict = {
  "about.hero.title": "Come funziona Foot Ticket Finder",
  "about.hero.subtitle":
    "Non vendiamo biglietti. Ti guidiamo alla piattaforma ufficiale giusta nel momento giusto, così puoi assicurarti il posto con sicurezza.",
  "about.step1.title": "1. Segui le prossime partite",
  "about.step1.desc":
    "Monitoriamo ogni grande sfida dei principali campionati europei, della Champions League e delle competizioni internazionali.",
  "about.step2.title": "2. Vedi le date di vendita",
  "about.step2.desc":
    "Scopri esattamente quando aprono le vendite ufficiali — club, federazioni, UEFA e FIFA.",
  "about.step3.title": "3. Ricevi avvisi istantanei",
  "about.step3.desc":
    "Ricevi una notifica appena i biglietti sono disponibili. Anticipa la coda.",
  "about.step4.title": "4. Acquista da fonti ufficiali",
  "about.step4.desc":
    "Ti colleghiamo direttamente a piattaforme ufficiali verificate — niente rivenditori sospetti.",
  "about.step5.title": "5. Gioca e guadagna",
  "about.step5.desc":
    "Gioca al quiz quotidiano, costruisci serie e guadagna ricompense nell'app.",
  "about.step6.title": "6. Passa a Premium",
  "about.step6.desc":
    "Sblocca avvisi prioritari, rimuovi gli annunci e ottieni accesso anticipato alle vendite.",
  "about.cta.title": "Pronto a non perdere più nessuna vendita?",
  "about.cta.button": "Apri l'app",

  "pricing.badge": "Il tuo compagno da tifoso",
  "pricing.hero.title": "Non perdere mai una partita che conta.",
  "pricing.hero.subtitle":
    "Dalle partite dei sogni al tuo passaporto degli stadi — Premium ti dà gli strumenti per vivere il calcio, non solo guardarlo.",
  "pricing.per_month": "/mese",
  "pricing.free.title": "Gratis",
  "pricing.free.subtitle": "Esplora, confronta, scopri",
  "pricing.free.feat1": "Esplora le prossime partite in Europa",
  "pricing.free.feat2": "Confronta le uscite ufficiali dei biglietti",
  "pricing.free.feat3": "Scopri stadi e atmosfere",
  "pricing.free.feat4": "Salva alcune partite preferite",
  "pricing.free.cta": "Esplora le partite",
  "pricing.premium.badge": "Il più amato",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "L'esperienza tifoso completa",
  "pricing.premium.cancel_note": "Annulla quando vuoi · Senza impegno",
  "pricing.premium.feat1": "Avvisi prioritari sulle uscite ufficiali",
  "pricing.premium.feat2": "Confronto rivendita di fiducia",
  "pricing.premium.feat3": "Tracking illimitato delle partite dei sogni",
  "pricing.premium.feat4": "Passaporto stadi e partite vissute",
  "pricing.premium.feat5": "Senza pubblicità, esperienza premium",
  "pricing.premium.cta": "Diventa Premium",
  "pricing.values.alerts.title": "Le uscite ufficiali per prime",
  "pricing.values.alerts.body":
    "Sappilo per primo quando club, UEFA o FIFA aprono i botteghini — prima del sold out.",
  "pricing.values.tracking.title": "Rivendita di fiducia, senza sorprese",
  "pricing.values.tracking.body":
    "Confronta i prezzi su marketplace verificati e acquista con fiducia.",
  "pricing.values.favs.title": "Il tuo passaporto calcistico",
  "pricing.values.favs.body":
    "Tieni traccia degli stadi visitati e delle partite vissute, niente va perso.",

  "applanding.hero.badge": "App companion gratuita",
  "applanding.hero.title_1": "Ricevi avvisi sui prezzi dei biglietti",
  "applanding.hero.title_highlight": "in tempo reale",
  "applanding.hero.subtitle":
    "Sii il primo a sapere quando i prezzi calano. Segui le tue partite preferite e non perdere mai un'offerta.",
  "applanding.hero.cta_install": "Installa l'app",
  "applanding.hero.cta_installed": "Installata",
  "applanding.hero.cta_alerts": "Attiva gli avvisi prezzo",
  "applanding.hero.point_free": "Gratis",
  "applanding.hero.point_nospam": "Niente spam",
  "applanding.hero.point_devices": "iPhone e Android",
  "applanding.phone.eyebrow": "Avvisi prezzo",
  "applanding.phone.title": "La tua watchlist",
  "applanding.phone.providers": "12 rivenditori",
  "applanding.phone.alert": "Calo di prezzo · Liverpool – Man Utd · 89 €",
  "applanding.features.eyebrow": "Cosa ottieni",
  "applanding.features.title": "Pensata per i cacciatori di biglietti",
  "applanding.features.alerts.title": "Avvisi prezzo",
  "applanding.features.alerts.desc":
    "Ricevi notifiche push appena calano i prezzi di una partita che segui.",
  "applanding.features.favorites.title": "Partite preferite",
  "applanding.features.favorites.desc":
    "Crea la tua watchlist e segui la tua squadra — sincronizzata su tutti i dispositivi.",
  "applanding.features.history.title": "Storico prezzi",
  "applanding.features.history.desc":
    "Vedi come si sono mossi i prezzi e scegli il momento migliore per comprare.",
  "applanding.trust.free.label": "Gratis",
  "applanding.trust.free.desc": "Niente carta, niente costi",
  "applanding.trust.nospam.label": "Niente spam",
  "applanding.trust.nospam.desc": "Solo gli avvisi che scegli",
  "applanding.trust.loved.label": "Amata dai tifosi",
  "applanding.trust.loved.desc": "In tutta Europa",
  "applanding.install.title": "Installa in pochi secondi",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Apri questa pagina in Safari",
  "applanding.install.iphone.s2": "Tocca l'icona Condividi",
  "applanding.install.iphone.s3": "Scegli «Aggiungi a Home»",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Apri questa pagina in Chrome",
  "applanding.install.android.s2": "Tocca il menu (⋮)",
  "applanding.install.android.s3": "Scegli «Installa app» o «Aggiungi a schermata Home»",
  "applanding.cta.title": "Pronto a cogliere il prossimo calo di prezzo?",
  "applanding.cta.subtitle":
    "Installa l'app ora — è gratis e ci vogliono 5 secondi.",
  "applanding.cta.open": "Apri l'app",
  "applanding.toast.install_title": "Per installare:",
  "applanding.toast.install_desc":
    "Su iPhone: Condividi → Aggiungi a Home. Su Android: menu del browser → Installa app.",
  "app.coming_soon": "App mobile in arrivo",
  "app.coming_soon_short": "In arrivo",
  "app.coming_soon_desc": "La nostra app mobile arriverà presto. Resta sintonizzato.",
};

const pt: Dict = {
  "about.hero.title": "Como funciona o Foot Ticket Finder",
  "about.hero.subtitle":
    "Não vendemos bilhetes. Levamos-te à plataforma oficial certa no momento certo, para garantires o teu lugar com confiança.",
  "about.step1.title": "1. Acompanha os próximos jogos",
  "about.step1.desc":
    "Monitorizamos todos os grandes jogos das principais ligas europeias, Liga dos Campeões e competições internacionais.",
  "about.step2.title": "2. Vê as datas de venda",
  "about.step2.desc":
    "Sabe exatamente quando abre cada venda oficial — clubes, federações, UEFA e FIFA.",
  "about.step3.title": "3. Recebe alertas instantâneos",
  "about.step3.desc":
    "Recebe uma notificação assim que os bilhetes ficarem disponíveis. Adianta-te à fila.",
  "about.step4.title": "4. Compra em fontes oficiais",
  "about.step4.desc":
    "Ligamos-te diretamente a plataformas oficiais verificadas — sem revendedores duvidosos.",
  "about.step5.title": "5. Joga e ganha",
  "about.step5.desc":
    "Joga o quiz diário de futebol, mantém sequências e ganha recompensas na app.",
  "about.step6.title": "6. Passa a Premium",
  "about.step6.desc":
    "Desbloqueia alertas prioritários, remove anúncios e tem acesso antecipado às vendas.",
  "about.cta.title": "Pronto para nunca perder uma venda?",
  "about.cta.button": "Abrir a app",

  "pricing.badge": "O teu companheiro de adepto",
  "pricing.hero.title": "Nunca percas um jogo que importa.",
  "pricing.hero.subtitle":
    "Dos jogos de sonho ao teu passaporte de estádios — Premium dá-te as ferramentas para viver o futebol, não só vê-lo.",
  "pricing.per_month": "/mês",
  "pricing.free.title": "Grátis",
  "pricing.free.subtitle": "Explora, compara, descobre",
  "pricing.free.feat1": "Explora os próximos jogos na Europa",
  "pricing.free.feat2": "Compara as vendas oficiais de bilhetes",
  "pricing.free.feat3": "Descobre estádios e atmosferas",
  "pricing.free.feat4": "Guarda alguns jogos favoritos",
  "pricing.free.cta": "Explorar jogos",
  "pricing.premium.badge": "O mais amado",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "A experiência completa de adepto",
  "pricing.premium.cancel_note": "Cancela quando quiseres · Sem compromisso",
  "pricing.premium.feat1": "Alertas prioritários nas vendas oficiais",
  "pricing.premium.feat2": "Comparador de revenda de confiança",
  "pricing.premium.feat3": "Acompanhamento ilimitado de jogos de sonho",
  "pricing.premium.feat4": "Passaporte de estádios e jogos vividos",
  "pricing.premium.feat5": "Sem publicidade, experiência premium",
  "pricing.premium.cta": "Tornar-me Premium",
  "pricing.values.alerts.title": "Vendas oficiais primeiro",
  "pricing.values.alerts.body":
    "Sê o primeiro a saber quando clubes, UEFA ou FIFA abrem as bilheteiras — antes de esgotar.",
  "pricing.values.tracking.title": "Revenda de confiança, sem surpresas",
  "pricing.values.tracking.body":
    "Compara preços em marketplaces verificados e compra com confiança.",
  "pricing.values.favs.title": "O teu passaporte de futebol",
  "pricing.values.favs.body":
    "Regista estádios visitados e jogos vividos, sem perder memórias.",

  "applanding.hero.badge": "App complementar gratuita",
  "applanding.hero.title_1": "Recebe alertas de preço de bilhetes",
  "applanding.hero.title_highlight": "em tempo real",
  "applanding.hero.subtitle":
    "Sê o primeiro a saber quando os preços baixam. Acompanha os teus jogos favoritos e nunca percas uma oportunidade.",
  "applanding.hero.cta_install": "Instalar app",
  "applanding.hero.cta_installed": "Instalada",
  "applanding.hero.cta_alerts": "Ativar alertas de preço",
  "applanding.hero.point_free": "Grátis",
  "applanding.hero.point_nospam": "Sem spam",
  "applanding.hero.point_devices": "iPhone e Android",
  "applanding.phone.eyebrow": "Alertas de preço",
  "applanding.phone.title": "A tua watchlist",
  "applanding.phone.providers": "12 fornecedores",
  "applanding.phone.alert": "Descida de preço · Liverpool – Man Utd · 89 €",
  "applanding.features.eyebrow": "O que recebes",
  "applanding.features.title": "Feita para caçadores de bilhetes",
  "applanding.features.alerts.title": "Alertas de preço",
  "applanding.features.alerts.desc":
    "Recebe notificações push assim que os preços baixarem num jogo que segues.",
  "applanding.features.favorites.title": "Jogos favoritos",
  "applanding.features.favorites.desc":
    "Cria a tua watchlist e segue a tua equipa — sincronizada em todos os dispositivos.",
  "applanding.features.history.title": "Histórico de preços",
  "applanding.features.history.desc":
    "Vê como os preços evoluíram e decide o melhor momento para comprar.",
  "applanding.trust.free.label": "Grátis",
  "applanding.trust.free.desc": "Sem cartão, sem custos",
  "applanding.trust.nospam.label": "Sem spam",
  "applanding.trust.nospam.desc": "Só os alertas que escolheres",
  "applanding.trust.loved.label": "Amada pelos adeptos",
  "applanding.trust.loved.desc": "Em toda a Europa",
  "applanding.install.title": "Instala em segundos",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Abre esta página no Safari",
  "applanding.install.iphone.s2": "Toca no ícone Partilhar",
  "applanding.install.iphone.s3": "Escolhe «Adicionar ao Ecrã Principal»",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Abre esta página no Chrome",
  "applanding.install.android.s2": "Toca no menu (⋮)",
  "applanding.install.android.s3": "Escolhe «Instalar app» ou «Adicionar ao Ecrã Principal»",
  "applanding.cta.title": "Pronto para apanhar a próxima descida de preço?",
  "applanding.cta.subtitle":
    "Instala a app agora — é grátis e demora 5 segundos.",
  "applanding.cta.open": "Abrir a app",
  "applanding.toast.install_title": "Para instalar:",
  "applanding.toast.install_desc":
    "No iPhone: Partilhar → Adicionar ao Ecrã Principal. No Android: menu do browser → Instalar app.",
  "app.coming_soon": "Aplicação móvel em breve",
  "app.coming_soon_short": "Em breve",
  "app.coming_soon_desc": "A nossa app móvel chega em breve. Fique atento.",
};

const nl: Dict = {
  "about.hero.title": "Hoe Foot Ticket Finder werkt",
  "about.hero.subtitle":
    "Wij verkopen geen tickets. Wij wijzen je op het juiste officiële platform op het juiste moment, zodat je je plek met vertrouwen veiligstelt.",
  "about.step1.title": "1. Volg aankomende wedstrijden",
  "about.step1.desc":
    "We monitoren elke topwedstrijd in de grootste Europese competities, de Champions League en internationale toernooien.",
  "about.step2.title": "2. Bekijk de verkoopdata",
  "about.step2.desc":
    "Weet precies wanneer elke officiële verkoop opent — clubs, bonden, UEFA en FIFA.",
  "about.step3.title": "3. Ontvang directe meldingen",
  "about.step3.desc":
    "Krijg een melding zodra tickets beschikbaar komen. Sta vooraan in de rij.",
  "about.step4.title": "4. Koop bij officiële bronnen",
  "about.step4.desc":
    "We verwijzen je rechtstreeks naar geverifieerde, officiële ticketplatforms — geen dubieuze doorverkopers.",
  "about.step5.title": "5. Speel & verdien",
  "about.step5.desc":
    "Speel de dagelijkse voetbalquiz, bouw streaks op en verdien beloningen in de app.",
  "about.step6.title": "6. Upgrade naar Premium",
  "about.step6.desc":
    "Ontgrendel prioriteitsmeldingen, verwijder advertenties en krijg vroege toegang tot verkoopstarts.",
  "about.cta.title": "Klaar om geen enkele verkoop te missen?",
  "about.cta.button": "App openen",

  "pricing.badge": "Jouw fan-companion",
  "pricing.hero.title": "Mis nooit meer een wedstrijd die telt.",
  "pricing.hero.subtitle":
    "Van droomwedstrijden tot je stadionpaspoort — Premium geeft je de tools om voetbal te beleven, niet alleen te kijken.",
  "pricing.per_month": "/maand",
  "pricing.free.title": "Gratis",
  "pricing.free.subtitle": "Ontdek, vergelijk, verken",
  "pricing.free.feat1": "Bekijk komende wedstrijden in Europa",
  "pricing.free.feat2": "Vergelijk officiële ticketreleases",
  "pricing.free.feat3": "Ontdek stadions en sferen",
  "pricing.free.feat4": "Sla enkele favoriete wedstrijden op",
  "pricing.free.cta": "Wedstrijden ontdekken",
  "pricing.premium.badge": "Meest geliefd",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "De complete fan-ervaring",
  "pricing.premium.cancel_note": "Wanneer je wilt opzegbaar · Geen verplichting",
  "pricing.premium.feat1": "Prioriteitsmeldingen bij officiële releases",
  "pricing.premium.feat2": "Vertrouwde resale-prijsvergelijking",
  "pricing.premium.feat3": "Onbeperkt droomwedstrijden volgen",
  "pricing.premium.feat4": "Stadionpaspoort & beleefde wedstrijden",
  "pricing.premium.feat5": "Reclamevrij, premium ervaring",
  "pricing.premium.cta": "Word Premium",
  "pricing.values.alerts.title": "Officiële releases als eerste",
  "pricing.values.alerts.body":
    "Weet als eerste wanneer clubs, UEFA of FIFA openen — voordat het uitverkocht is.",
  "pricing.values.tracking.title": "Vertrouwde resale, geen verrassingen",
  "pricing.values.tracking.body":
    "Vergelijk prijzen op geverifieerde marktplaatsen en koop met vertrouwen.",
  "pricing.values.favs.title": "Je voetbalpaspoort",
  "pricing.values.favs.body":
    "Houd bezochte stadions en beleefde wedstrijden bij — geen herinnering verloren.",

  "applanding.hero.badge": "Gratis companion-app",
  "applanding.hero.title_1": "Krijg ticket-prijsmeldingen",
  "applanding.hero.title_highlight": "in realtime",
  "applanding.hero.subtitle":
    "Wees de eerste die weet wanneer de prijzen dalen. Volg je favoriete wedstrijden en mis nooit meer een deal.",
  "applanding.hero.cta_install": "App installeren",
  "applanding.hero.cta_installed": "Geïnstalleerd",
  "applanding.hero.cta_alerts": "Prijsmeldingen activeren",
  "applanding.hero.point_free": "Gratis",
  "applanding.hero.point_nospam": "Geen spam",
  "applanding.hero.point_devices": "iPhone & Android",
  "applanding.phone.eyebrow": "Prijsmeldingen",
  "applanding.phone.title": "Jouw watchlist",
  "applanding.phone.providers": "12 aanbieders",
  "applanding.phone.alert": "Prijsdaling · Liverpool – Man Utd · €89",
  "applanding.features.eyebrow": "Wat je krijgt",
  "applanding.features.title": "Gemaakt voor ticketjagers",
  "applanding.features.alerts.title": "Prijsmeldingen",
  "applanding.features.alerts.desc":
    "Ontvang pushmeldingen op het moment dat prijzen dalen voor een gevolgde wedstrijd.",
  "applanding.features.favorites.title": "Favoriete wedstrijden",
  "applanding.features.favorites.desc":
    "Bouw je watchlist en volg je team — op al je apparaten gesynchroniseerd.",
  "applanding.features.history.title": "Prijsgeschiedenis",
  "applanding.features.history.desc":
    "Bekijk hoe prijzen zich hebben ontwikkeld en bepaal het beste moment om te kopen.",
  "applanding.trust.free.label": "Gratis",
  "applanding.trust.free.desc": "Geen kaart, geen kosten",
  "applanding.trust.nospam.label": "Geen spam",
  "applanding.trust.nospam.desc": "Alleen de meldingen die je kiest",
  "applanding.trust.loved.label": "Geliefd bij fans",
  "applanding.trust.loved.desc": "In heel Europa",
  "applanding.install.title": "Installeer in seconden",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Open deze pagina in Safari",
  "applanding.install.iphone.s2": "Tik op het Deel-icoon",
  "applanding.install.iphone.s3": "Kies \"Zet op beginscherm\"",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Open deze pagina in Chrome",
  "applanding.install.android.s2": "Tik op het menu (⋮)",
  "applanding.install.android.s3": "Kies \"App installeren\" of \"Aan startscherm toevoegen\"",
  "applanding.cta.title": "Klaar om de volgende prijsdaling te grijpen?",
  "applanding.cta.subtitle":
    "Installeer de app nu — gratis en in 5 seconden klaar.",
  "applanding.cta.open": "App openen",
  "applanding.toast.install_title": "Om te installeren:",
  "applanding.toast.install_desc":
    "Op iPhone: Delen → Zet op beginscherm. Op Android: browsermenu → App installeren.",
  "app.coming_soon": "Mobiele app binnenkort beschikbaar",
  "app.coming_soon_short": "Binnenkort beschikbaar",
  "app.coming_soon_desc": "Onze mobiele app komt binnenkort. Blijf op de hoogte.",
};

const ar: Dict = {
  "about.hero.title": "كيف يعمل Foot Ticket Finder",
  "about.hero.subtitle":
    "نحن لا نبيع التذاكر. نوجهك إلى المنصة الرسمية الصحيحة في الوقت المناسب لتحجز مقعدك بثقة.",
  "about.step1.title": "1. تابع المباريات القادمة",
  "about.step1.desc":
    "نراقب كل مباراة كبرى في أكبر الدوريات الأوروبية ودوري أبطال أوروبا والبطولات الدولية.",
  "about.step2.title": "2. تعرف على مواعيد طرح التذاكر",
  "about.step2.desc":
    "اعرف بالضبط متى يبدأ كل بيع رسمي للتذاكر — الأندية والاتحادات ويويفا وفيفا.",
  "about.step3.title": "3. احصل على تنبيهات فورية",
  "about.step3.desc":
    "تلقّ إشعارًا في اللحظة التي تتوفر فيها التذاكر. كن في المقدمة قبل الجميع.",
  "about.step4.title": "4. اشترِ من مصادر رسمية",
  "about.step4.desc":
    "نوصلك مباشرة بمنصات تذاكر رسمية موثقة — بدون موزعين مشبوهين.",
  "about.step5.title": "5. العب واربح",
  "about.step5.desc":
    "العب اختبار كرة القدم اليومي، حافظ على سلسلتك، واربح مكافآت داخل التطبيق.",
  "about.step6.title": "6. ارتقِ إلى Premium",
  "about.step6.desc":
    "افتح تنبيهات ذات أولوية، وأزل الإعلانات، واحصل على وصول مبكر لمواعيد البيع.",
  "about.cta.title": "هل أنت مستعد لعدم تفويت أي إصدار؟",
  "about.cta.button": "افتح التطبيق",

  "pricing.badge": "رفيقك ككرة قدم",
  "pricing.hero.title": "لا تفوّت أي مباراة تهمك.",
  "pricing.hero.subtitle":
    "من مباريات الأحلام إلى جواز سفر الملاعب — Premium يمنحك الأدوات لتعيش كرة القدم، لا لمجرد مشاهدتها.",
  "pricing.per_month": "/شهر",
  "pricing.free.title": "مجاني",
  "pricing.free.subtitle": "تصفح، قارن، اكتشف",
  "pricing.free.feat1": "تصفّح المباريات القادمة في أوروبا",
  "pricing.free.feat2": "قارن طرح التذاكر الرسمية",
  "pricing.free.feat3": "اكتشف الملاعب وأجواءها",
  "pricing.free.feat4": "احفظ بعض المباريات المفضلة",
  "pricing.free.cta": "استكشاف المباريات",
  "pricing.premium.badge": "الأكثر تفضيلاً",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "تجربة المشجع الكاملة",
  "pricing.premium.cancel_note": "إلغاء في أي وقت · بدون التزام",
  "pricing.premium.feat1": "تنبيهات أولوية لطرح التذاكر الرسمية",
  "pricing.premium.feat2": "مقارنة موثوقة لإعادة البيع",
  "pricing.premium.feat3": "متابعة غير محدودة لمباريات أحلامك",
  "pricing.premium.feat4": "جواز سفر الملاعب والمباريات المحضورة",
  "pricing.premium.feat5": "بدون إعلانات، تجربة Premium",
  "pricing.premium.cta": "اشترك في Premium",
  "pricing.values.alerts.title": "الإصدارات الرسمية أولاً",
  "pricing.values.alerts.body":
    "كن أول من يعرف عند فتح الأندية أو UEFA أو FIFA للحجز — قبل النفاد.",
  "pricing.values.tracking.title": "إعادة بيع موثوقة، بلا مفاجآت",
  "pricing.values.tracking.body":
    "قارن الأسعار عبر أسواق موثوقة واشترِ بثقة.",
  "pricing.values.favs.title": "جواز سفرك الكروي",
  "pricing.values.favs.body":
    "تتبع الملاعب التي زرتها والمباريات التي عشتها — دون فقدان أي ذكرى.",

  "applanding.hero.badge": "تطبيق مرافق مجاني",
  "applanding.hero.title_1": "احصل على تنبيهات أسعار التذاكر",
  "applanding.hero.title_highlight": "في الوقت الفعلي",
  "applanding.hero.subtitle":
    "كن أول من يعلم عند انخفاض الأسعار. تابع مبارياتك المفضلة ولا تفوت أي صفقة.",
  "applanding.hero.cta_install": "تثبيت التطبيق",
  "applanding.hero.cta_installed": "تم التثبيت",
  "applanding.hero.cta_alerts": "تفعيل تنبيهات السعر",
  "applanding.hero.point_free": "مجاني",
  "applanding.hero.point_nospam": "بدون إزعاج",
  "applanding.hero.point_devices": "iPhone و Android",
  "applanding.phone.eyebrow": "تنبيهات السعر",
  "applanding.phone.title": "قائمة متابعتك",
  "applanding.phone.providers": "12 موزعًا",
  "applanding.phone.alert": "انخفاض السعر · ليفربول – مان يونايتد · 89 €",
  "applanding.features.eyebrow": "ما الذي تحصل عليه",
  "applanding.features.title": "مصمم لصيادي التذاكر",
  "applanding.features.alerts.title": "تنبيهات السعر",
  "applanding.features.alerts.desc":
    "تلقَّ إشعارًا فوريًا في اللحظة التي ينخفض فيها سعر مباراة تتابعها.",
  "applanding.features.favorites.title": "المباريات المفضلة",
  "applanding.features.favorites.desc":
    "أنشئ قائمة متابعتك وتابع فريقك — متزامنة على جميع أجهزتك.",
  "applanding.features.history.title": "تاريخ الأسعار",
  "applanding.features.history.desc":
    "اطلع على كيفية تحرك الأسعار عبر الزمن وقرر أفضل لحظة للشراء.",
  "applanding.trust.free.label": "مجاني",
  "applanding.trust.free.desc": "بدون بطاقة، بدون رسوم",
  "applanding.trust.nospam.label": "بدون إزعاج",
  "applanding.trust.nospam.desc": "فقط التنبيهات التي تختارها",
  "applanding.trust.loved.label": "محبوب من المشجعين",
  "applanding.trust.loved.desc": "في جميع أنحاء أوروبا",
  "applanding.install.title": "ثبّت في ثوانٍ",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "افتح هذه الصفحة في Safari",
  "applanding.install.iphone.s2": "اضغط على أيقونة المشاركة",
  "applanding.install.iphone.s3": "اختر «إضافة إلى الشاشة الرئيسية»",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "افتح هذه الصفحة في Chrome",
  "applanding.install.android.s2": "اضغط على القائمة (⋮)",
  "applanding.install.android.s3": "اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»",
  "applanding.cta.title": "جاهز لاقتناص الانخفاض القادم في الأسعار؟",
  "applanding.cta.subtitle":
    "ثبّت التطبيق الآن — مجاني ويستغرق 5 ثوانٍ.",
  "applanding.cta.open": "افتح التطبيق",
  "applanding.toast.install_title": "للتثبيت:",
  "applanding.toast.install_desc":
    "على iPhone: مشاركة → إضافة إلى الشاشة الرئيسية. على Android: قائمة المتصفح → تثبيت التطبيق.",
  "app.coming_soon": "تطبيق الجوال قريباً",
  "app.coming_soon_short": "قريباً",
  "app.coming_soon_desc": "تطبيقنا للجوال قادم قريباً. ترقّبوا.",
};

const ru: Dict = {
  "about.hero.title": "Как работает Foot Ticket Finder",
  "about.hero.subtitle":
    "Мы не продаём билеты. Мы направляем вас на нужную официальную платформу в нужный момент, чтобы вы могли уверенно занять своё место.",
  "about.step1.title": "1. Следите за предстоящими матчами",
  "about.step1.desc":
    "Мы отслеживаем все важные матчи топовых европейских лиг, Лиги чемпионов и международных турниров.",
  "about.step2.title": "2. Узнавайте даты старта продаж",
  "about.step2.desc":
    "Знайте точно, когда открывается каждая официальная продажа — клубы, федерации, УЕФА и ФИФА.",
  "about.step3.title": "3. Получайте мгновенные уведомления",
  "about.step3.desc":
    "Получите уведомление, как только билеты появятся в продаже. Опередите очередь.",
  "about.step4.title": "4. Покупайте у официальных источников",
  "about.step4.desc":
    "Мы направляем вас прямо на проверенные официальные платформы — никаких сомнительных перекупщиков.",
  "about.step5.title": "5. Играйте и зарабатывайте",
  "about.step5.desc":
    "Играйте в ежедневный футбольный квиз, держите серию и получайте награды в приложении.",
  "about.step6.title": "6. Перейдите на Premium",
  "about.step6.desc":
    "Откройте приоритетные оповещения, уберите рекламу и получите ранний доступ к продажам.",
  "about.cta.title": "Готовы больше не пропускать ни одной продажи?",
  "about.cta.button": "Открыть приложение",

  "pricing.badge": "Ваш футбольный компаньон",
  "pricing.hero.title": "Никогда не пропускайте важный матч.",
  "pricing.hero.subtitle":
    "От матчей мечты до вашего стадионного паспорта — Premium даёт инструменты, чтобы жить футболом, а не просто смотреть его.",
  "pricing.per_month": "/мес",
  "pricing.free.title": "Бесплатно",
  "pricing.free.subtitle": "Изучайте, сравнивайте, открывайте",
  "pricing.free.feat1": "Просматривайте предстоящие матчи Европы",
  "pricing.free.feat2": "Сравнивайте официальные продажи билетов",
  "pricing.free.feat3": "Открывайте стадионы и их атмосферу",
  "pricing.free.feat4": "Сохраняйте несколько любимых матчей",
  "pricing.free.cta": "Открыть матчи",
  "pricing.premium.badge": "Самый любимый",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Полный опыт болельщика",
  "pricing.premium.cancel_note": "Отмена в любой момент · Без обязательств",
  "pricing.premium.feat1": "Приоритетные оповещения об официальных продажах",
  "pricing.premium.feat2": "Доверенное сравнение цен на ресейле",
  "pricing.premium.feat3": "Безлимитное отслеживание матчей мечты",
  "pricing.premium.feat4": "Паспорт стадионов и посещённых матчей",
  "pricing.premium.feat5": "Без рекламы, премиум-опыт",
  "pricing.premium.cta": "Стать Premium",
  "pricing.values.alerts.title": "Официальные продажи первыми",
  "pricing.values.alerts.body":
    "Узнавайте первыми, когда клубы, УЕФА или ФИФА открывают продажи — до распродажи.",
  "pricing.values.tracking.title": "Доверенный ресейл, без сюрпризов",
  "pricing.values.tracking.body":
    "Сравнивайте цены на проверенных площадках и покупайте уверенно.",
  "pricing.values.favs.title": "Ваш футбольный паспорт",
  "pricing.values.favs.body":
    "Сохраняйте посещённые стадионы и пережитые матчи — ни одного воспоминания.",

  "applanding.hero.badge": "Бесплатное приложение-компаньон",
  "applanding.hero.title_1": "Получайте оповещения о ценах",
  "applanding.hero.title_highlight": "в реальном времени",
  "applanding.hero.subtitle":
    "Узнавайте о падении цен первыми. Следите за любимыми матчами и не упускайте выгодных предложений.",
  "applanding.hero.cta_install": "Установить приложение",
  "applanding.hero.cta_installed": "Установлено",
  "applanding.hero.cta_alerts": "Включить оповещения о ценах",
  "applanding.hero.point_free": "Бесплатно",
  "applanding.hero.point_nospam": "Без спама",
  "applanding.hero.point_devices": "iPhone и Android",
  "applanding.phone.eyebrow": "Оповещения о ценах",
  "applanding.phone.title": "Ваш список наблюдения",
  "applanding.phone.providers": "12 продавцов",
  "applanding.phone.alert": "Падение цены · Ливерпуль – Ман Юнайтед · 89 €",
  "applanding.features.eyebrow": "Что вы получаете",
  "applanding.features.title": "Создано для охотников за билетами",
  "applanding.features.alerts.title": "Оповещения о ценах",
  "applanding.features.alerts.desc":
    "Получайте push-уведомления в момент падения цены на матч из вашего списка.",
  "applanding.features.favorites.title": "Любимые матчи",
  "applanding.features.favorites.desc":
    "Создайте список наблюдения и следите за командой — синхронизация на всех устройствах.",
  "applanding.features.history.title": "История цен",
  "applanding.features.history.desc":
    "Смотрите, как менялись цены, и выбирайте лучший момент для покупки.",
  "applanding.trust.free.label": "Бесплатно",
  "applanding.trust.free.desc": "Без карты и без комиссий",
  "applanding.trust.nospam.label": "Без спама",
  "applanding.trust.nospam.desc": "Только выбранные вами оповещения",
  "applanding.trust.loved.label": "Любимо фанатами",
  "applanding.trust.loved.desc": "По всей Европе",
  "applanding.install.title": "Установка за секунды",
  "applanding.install.iphone": "iPhone (Safari)",
  "applanding.install.iphone.s1": "Откройте эту страницу в Safari",
  "applanding.install.iphone.s2": "Нажмите значок «Поделиться»",
  "applanding.install.iphone.s3": "Выберите «На экран «Домой»»",
  "applanding.install.android": "Android (Chrome)",
  "applanding.install.android.s1": "Откройте эту страницу в Chrome",
  "applanding.install.android.s2": "Нажмите меню (⋮)",
  "applanding.install.android.s3": "Выберите «Установить приложение» или «Добавить на главный экран»",
  "applanding.cta.title": "Готовы поймать следующее падение цены?",
  "applanding.cta.subtitle":
    "Установите приложение прямо сейчас — это бесплатно и занимает 5 секунд.",
  "applanding.cta.open": "Открыть приложение",
  "applanding.toast.install_title": "Чтобы установить:",
  "applanding.toast.install_desc":
    "На iPhone: Поделиться → На экран «Домой». На Android: меню браузера → Установить приложение.",
  "app.coming_soon": "Мобильное приложение скоро",
  "app.coming_soon_short": "Скоро",
  "app.coming_soon_desc": "Наше мобильное приложение скоро выйдет. Следите за обновлениями.",
};

export const marketingPages: Record<Locale, Dict> = {
  en,
  fr,
  es,
  de,
  it,
  pt,
  nl,
  ar,
  ru,
};
