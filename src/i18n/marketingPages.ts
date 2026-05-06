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
  "pricing.badge": "Save up to 30% on tickets",
  "pricing.hero.title": "Free forever. Premium when you want more.",
  "pricing.hero.subtitle":
    "Comparing prices is always free. Upgrade only if you want price alerts and tracking.",
  "pricing.per_month": "/month",
  "pricing.free.title": "Free",
  "pricing.free.subtitle": "For browsing & comparing",
  "pricing.free.feat1": "Search matches & compare prices",
  "pricing.free.feat2": "View all ticket offers",
  "pricing.free.feat3": "Browse leagues and teams",
  "pricing.free.feat4": "Basic notifications",
  "pricing.free.cta": "Browse matches",
  "pricing.premium.badge": "Best value",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Buy at the right time, every time",
  "pricing.premium.cancel_note": "Cancel anytime · No commitment",
  "pricing.premium.feat1": "Real-time price alerts",
  "pricing.premium.feat2": "Price tracking & trends",
  "pricing.premium.feat3": "Unlimited favourite matches",
  "pricing.premium.feat4": "Faster notifications",
  "pricing.premium.feat5": "Personalised recommendations",
  "pricing.premium.cta": "Go Premium",
  "pricing.values.alerts.title": "Real-time alerts",
  "pricing.values.alerts.body": "Get notified the moment prices drop or new tickets go on sale.",
  "pricing.values.tracking.title": "Price tracking",
  "pricing.values.tracking.body": "See historical prices and buy at the perfect moment.",
  "pricing.values.favs.title": "Unlimited favourites",
  "pricing.values.favs.body": "Track every match you care about — no limits.",

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

  "pricing.badge": "Économisez jusqu'à 30 % sur vos billets",
  "pricing.hero.title": "Gratuit pour toujours. Premium quand vous voulez plus.",
  "pricing.hero.subtitle":
    "La comparaison des prix est toujours gratuite. Passez Premium uniquement si vous voulez les alertes et le suivi.",
  "pricing.per_month": "/mois",
  "pricing.free.title": "Gratuit",
  "pricing.free.subtitle": "Pour parcourir et comparer",
  "pricing.free.feat1": "Recherchez des matchs et comparez les prix",
  "pricing.free.feat2": "Voyez toutes les offres de billets",
  "pricing.free.feat3": "Parcourez les championnats et les équipes",
  "pricing.free.feat4": "Notifications de base",
  "pricing.free.cta": "Voir les matchs",
  "pricing.premium.badge": "Meilleure offre",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Achetez au bon moment, à chaque fois",
  "pricing.premium.cancel_note": "Annulez à tout moment · Sans engagement",
  "pricing.premium.feat1": "Alertes prix en temps réel",
  "pricing.premium.feat2": "Suivi et tendances des prix",
  "pricing.premium.feat3": "Matchs favoris illimités",
  "pricing.premium.feat4": "Notifications plus rapides",
  "pricing.premium.feat5": "Recommandations personnalisées",
  "pricing.premium.cta": "Passer Premium",
  "pricing.values.alerts.title": "Alertes en temps réel",
  "pricing.values.alerts.body":
    "Soyez prévenu dès que les prix baissent ou que de nouveaux billets sont mis en vente.",
  "pricing.values.tracking.title": "Suivi des prix",
  "pricing.values.tracking.body":
    "Consultez l'historique des prix et achetez au moment idéal.",
  "pricing.values.favs.title": "Favoris illimités",
  "pricing.values.favs.body":
    "Suivez tous les matchs qui vous intéressent — sans limite.",

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

  "pricing.badge": "Ahorra hasta un 30 % en entradas",
  "pricing.hero.title": "Gratis para siempre. Premium cuando quieras más.",
  "pricing.hero.subtitle":
    "Comparar precios siempre es gratis. Pasa a Premium solo si quieres alertas y seguimiento.",
  "pricing.per_month": "/mes",
  "pricing.free.title": "Gratis",
  "pricing.free.subtitle": "Para explorar y comparar",
  "pricing.free.feat1": "Busca partidos y compara precios",
  "pricing.free.feat2": "Ver todas las ofertas de entradas",
  "pricing.free.feat3": "Explora ligas y equipos",
  "pricing.free.feat4": "Notificaciones básicas",
  "pricing.free.cta": "Ver partidos",
  "pricing.premium.badge": "Mejor valor",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Compra en el momento justo, siempre",
  "pricing.premium.cancel_note": "Cancela cuando quieras · Sin compromiso",
  "pricing.premium.feat1": "Alertas de precio en tiempo real",
  "pricing.premium.feat2": "Seguimiento y tendencias de precios",
  "pricing.premium.feat3": "Partidos favoritos ilimitados",
  "pricing.premium.feat4": "Notificaciones más rápidas",
  "pricing.premium.feat5": "Recomendaciones personalizadas",
  "pricing.premium.cta": "Hazte Premium",
  "pricing.values.alerts.title": "Alertas en tiempo real",
  "pricing.values.alerts.body":
    "Recibe avisos en cuanto bajen los precios o se pongan a la venta nuevas entradas.",
  "pricing.values.tracking.title": "Seguimiento de precios",
  "pricing.values.tracking.body":
    "Consulta el histórico de precios y compra en el momento perfecto.",
  "pricing.values.favs.title": "Favoritos ilimitados",
  "pricing.values.favs.body":
    "Sigue todos los partidos que te importan, sin límites.",

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

  "pricing.badge": "Spare bis zu 30 % auf Tickets",
  "pricing.hero.title": "Für immer kostenlos. Premium, wenn du mehr willst.",
  "pricing.hero.subtitle":
    "Preisvergleich ist immer gratis. Upgrade nur, wenn du Preisalarme und Tracking willst.",
  "pricing.per_month": "/Monat",
  "pricing.free.title": "Kostenlos",
  "pricing.free.subtitle": "Zum Stöbern & Vergleichen",
  "pricing.free.feat1": "Spiele suchen & Preise vergleichen",
  "pricing.free.feat2": "Alle Ticketangebote ansehen",
  "pricing.free.feat3": "Ligen und Teams durchsuchen",
  "pricing.free.feat4": "Grundlegende Benachrichtigungen",
  "pricing.free.cta": "Spiele ansehen",
  "pricing.premium.badge": "Bestes Angebot",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Kaufe immer zum richtigen Zeitpunkt",
  "pricing.premium.cancel_note": "Jederzeit kündbar · Keine Verpflichtung",
  "pricing.premium.feat1": "Echtzeit-Preisalarme",
  "pricing.premium.feat2": "Preis-Tracking & Trends",
  "pricing.premium.feat3": "Unbegrenzte Lieblingsspiele",
  "pricing.premium.feat4": "Schnellere Benachrichtigungen",
  "pricing.premium.feat5": "Personalisierte Empfehlungen",
  "pricing.premium.cta": "Premium werden",
  "pricing.values.alerts.title": "Echtzeit-Alarme",
  "pricing.values.alerts.body":
    "Werde benachrichtigt, sobald Preise fallen oder neue Tickets in den Verkauf gehen.",
  "pricing.values.tracking.title": "Preis-Tracking",
  "pricing.values.tracking.body":
    "Sieh historische Preise und kaufe im perfekten Moment.",
  "pricing.values.favs.title": "Unbegrenzte Favoriten",
  "pricing.values.favs.body":
    "Verfolge jedes Spiel, das dir wichtig ist — ohne Limit.",

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

  "pricing.badge": "Risparmia fino al 30 % sui biglietti",
  "pricing.hero.title": "Gratis per sempre. Premium quando vuoi di più.",
  "pricing.hero.subtitle":
    "Confrontare i prezzi è sempre gratis. Passa a Premium solo se vuoi avvisi e tracking.",
  "pricing.per_month": "/mese",
  "pricing.free.title": "Gratis",
  "pricing.free.subtitle": "Per esplorare e confrontare",
  "pricing.free.feat1": "Cerca partite e confronta i prezzi",
  "pricing.free.feat2": "Vedi tutte le offerte di biglietti",
  "pricing.free.feat3": "Esplora campionati e squadre",
  "pricing.free.feat4": "Notifiche di base",
  "pricing.free.cta": "Vedi le partite",
  "pricing.premium.badge": "Miglior valore",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Compra al momento giusto, ogni volta",
  "pricing.premium.cancel_note": "Cancella quando vuoi · Nessun impegno",
  "pricing.premium.feat1": "Avvisi prezzo in tempo reale",
  "pricing.premium.feat2": "Tracking e tendenze prezzi",
  "pricing.premium.feat3": "Partite preferite illimitate",
  "pricing.premium.feat4": "Notifiche più rapide",
  "pricing.premium.feat5": "Raccomandazioni personalizzate",
  "pricing.premium.cta": "Diventa Premium",
  "pricing.values.alerts.title": "Avvisi in tempo reale",
  "pricing.values.alerts.body":
    "Ricevi una notifica appena i prezzi calano o nuovi biglietti vanno in vendita.",
  "pricing.values.tracking.title": "Tracking dei prezzi",
  "pricing.values.tracking.body":
    "Vedi lo storico dei prezzi e compra al momento perfetto.",
  "pricing.values.favs.title": "Preferiti illimitati",
  "pricing.values.favs.body":
    "Segui ogni partita che ti interessa — senza limiti.",

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

  "pricing.badge": "Poupa até 30 % em bilhetes",
  "pricing.hero.title": "Grátis para sempre. Premium quando quiseres mais.",
  "pricing.hero.subtitle":
    "Comparar preços é sempre grátis. Passa a Premium apenas se quiseres alertas e acompanhamento.",
  "pricing.per_month": "/mês",
  "pricing.free.title": "Grátis",
  "pricing.free.subtitle": "Para explorar e comparar",
  "pricing.free.feat1": "Pesquisa jogos e compara preços",
  "pricing.free.feat2": "Vê todas as ofertas de bilhetes",
  "pricing.free.feat3": "Explora ligas e equipas",
  "pricing.free.feat4": "Notificações básicas",
  "pricing.free.cta": "Ver jogos",
  "pricing.premium.badge": "Melhor valor",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Compra no momento certo, sempre",
  "pricing.premium.cancel_note": "Cancela quando quiseres · Sem compromisso",
  "pricing.premium.feat1": "Alertas de preço em tempo real",
  "pricing.premium.feat2": "Acompanhamento e tendências de preços",
  "pricing.premium.feat3": "Jogos favoritos ilimitados",
  "pricing.premium.feat4": "Notificações mais rápidas",
  "pricing.premium.feat5": "Recomendações personalizadas",
  "pricing.premium.cta": "Tornar-me Premium",
  "pricing.values.alerts.title": "Alertas em tempo real",
  "pricing.values.alerts.body":
    "Sê notificado assim que os preços baixam ou novos bilhetes vão à venda.",
  "pricing.values.tracking.title": "Acompanhamento de preços",
  "pricing.values.tracking.body":
    "Vê o histórico de preços e compra no momento perfeito.",
  "pricing.values.favs.title": "Favoritos ilimitados",
  "pricing.values.favs.body":
    "Acompanha todos os jogos que te interessam — sem limites.",

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

  "pricing.badge": "Bespaar tot 30% op tickets",
  "pricing.hero.title": "Voor altijd gratis. Premium als je meer wilt.",
  "pricing.hero.subtitle":
    "Prijzen vergelijken is altijd gratis. Upgrade alleen als je prijsmeldingen en tracking wilt.",
  "pricing.per_month": "/maand",
  "pricing.free.title": "Gratis",
  "pricing.free.subtitle": "Om te bladeren en vergelijken",
  "pricing.free.feat1": "Zoek wedstrijden en vergelijk prijzen",
  "pricing.free.feat2": "Bekijk alle ticketaanbiedingen",
  "pricing.free.feat3": "Blader door competities en teams",
  "pricing.free.feat4": "Basismeldingen",
  "pricing.free.cta": "Wedstrijden bekijken",
  "pricing.premium.badge": "Beste waarde",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Koop altijd op het juiste moment",
  "pricing.premium.cancel_note": "Op elk moment opzegbaar · Geen verplichting",
  "pricing.premium.feat1": "Realtime prijsmeldingen",
  "pricing.premium.feat2": "Prijs tracking & trends",
  "pricing.premium.feat3": "Onbeperkte favoriete wedstrijden",
  "pricing.premium.feat4": "Snellere meldingen",
  "pricing.premium.feat5": "Persoonlijke aanbevelingen",
  "pricing.premium.cta": "Word Premium",
  "pricing.values.alerts.title": "Realtime meldingen",
  "pricing.values.alerts.body":
    "Krijg een melding zodra de prijzen dalen of nieuwe tickets in de verkoop gaan.",
  "pricing.values.tracking.title": "Prijs tracking",
  "pricing.values.tracking.body":
    "Bekijk de prijsgeschiedenis en koop op het perfecte moment.",
  "pricing.values.favs.title": "Onbeperkte favorieten",
  "pricing.values.favs.body":
    "Volg elke wedstrijd die je belangrijk vindt — zonder limieten.",

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

  "pricing.badge": "وفّر حتى 30٪ على التذاكر",
  "pricing.hero.title": "مجاني للأبد. Premium عندما تريد المزيد.",
  "pricing.hero.subtitle":
    "مقارنة الأسعار مجانية دائمًا. ارتقِ إلى Premium فقط إذا أردت تنبيهات الأسعار والتتبع.",
  "pricing.per_month": "/شهر",
  "pricing.free.title": "مجاني",
  "pricing.free.subtitle": "للتصفح والمقارنة",
  "pricing.free.feat1": "ابحث عن المباريات وقارن الأسعار",
  "pricing.free.feat2": "اطلع على جميع عروض التذاكر",
  "pricing.free.feat3": "تصفح الدوريات والفرق",
  "pricing.free.feat4": "إشعارات أساسية",
  "pricing.free.cta": "تصفح المباريات",
  "pricing.premium.badge": "الأفضل قيمة",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "اشترِ في الوقت المناسب، في كل مرة",
  "pricing.premium.cancel_note": "ألغِ في أي وقت · بدون التزام",
  "pricing.premium.feat1": "تنبيهات أسعار فورية",
  "pricing.premium.feat2": "تتبع الأسعار واتجاهاتها",
  "pricing.premium.feat3": "مباريات مفضلة بلا حدود",
  "pricing.premium.feat4": "إشعارات أسرع",
  "pricing.premium.feat5": "توصيات مخصصة",
  "pricing.premium.cta": "اشترك في Premium",
  "pricing.values.alerts.title": "تنبيهات فورية",
  "pricing.values.alerts.body":
    "تلقَّ إشعارًا فور انخفاض الأسعار أو طرح تذاكر جديدة.",
  "pricing.values.tracking.title": "تتبع الأسعار",
  "pricing.values.tracking.body":
    "اطلع على تاريخ الأسعار واشترِ في اللحظة المثالية.",
  "pricing.values.favs.title": "مفضلات بلا حدود",
  "pricing.values.favs.body":
    "تابع كل مباراة تهمك — بدون أي حد.",

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

  "pricing.badge": "Экономьте до 30 % на билетах",
  "pricing.hero.title": "Бесплатно навсегда. Premium — когда захочется большего.",
  "pricing.hero.subtitle":
    "Сравнение цен всегда бесплатно. Premium — только если нужны оповещения и отслеживание цен.",
  "pricing.per_month": "/мес",
  "pricing.free.title": "Бесплатно",
  "pricing.free.subtitle": "Для просмотра и сравнения",
  "pricing.free.feat1": "Поиск матчей и сравнение цен",
  "pricing.free.feat2": "Просмотр всех предложений билетов",
  "pricing.free.feat3": "Просмотр лиг и команд",
  "pricing.free.feat4": "Базовые уведомления",
  "pricing.free.cta": "Смотреть матчи",
  "pricing.premium.badge": "Лучшая цена",
  "pricing.premium.title": "Premium",
  "pricing.premium.subtitle": "Покупайте в нужный момент, всегда",
  "pricing.premium.cancel_note": "Отмена в любой момент · Без обязательств",
  "pricing.premium.feat1": "Оповещения о ценах в реальном времени",
  "pricing.premium.feat2": "Отслеживание и тренды цен",
  "pricing.premium.feat3": "Безлимит избранных матчей",
  "pricing.premium.feat4": "Более быстрые уведомления",
  "pricing.premium.feat5": "Персональные рекомендации",
  "pricing.premium.cta": "Перейти на Premium",
  "pricing.values.alerts.title": "Оповещения в реальном времени",
  "pricing.values.alerts.body":
    "Получайте уведомление, как только цены упадут или появятся новые билеты.",
  "pricing.values.tracking.title": "Отслеживание цен",
  "pricing.values.tracking.body":
    "Смотрите историю цен и покупайте в идеальный момент.",
  "pricing.values.favs.title": "Безлимит избранного",
  "pricing.values.favs.body":
    "Следите за всеми важными для вас матчами — без ограничений.",

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
