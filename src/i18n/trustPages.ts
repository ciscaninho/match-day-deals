import type { Locale } from "./translations";

export interface TrustSection {
  heading: string;
  body: string; // sanitized static HTML
}

export interface TrustDocument {
  title: string;
  intro: string;
  lastUpdatedLabel: string;
  sections: TrustSection[];
}

export type TrustDocKey =
  | "cookies"
  | "affiliate"
  | "editorial"
  | "ticketPolicy"
  | "contact";

const EMAIL = "support@footticketfinder.com";
const mail = `<a class="text-[#2ECC71] font-semibold" href="mailto:${EMAIL}">${EMAIL}</a>`;

/* ============================================================
   ENGLISH (canonical)
   ============================================================ */
const en: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Cookie Policy",
    intro:
      "We use a minimal set of cookies to keep Foot Ticket Finder fast, secure, and personalised — and we ask before setting anything that isn't strictly necessary.",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "1. What is a cookie?", body: `<p>A cookie is a small text file that a website stores on your device to remember information about your visit — for example, that you are signed in, or which language you prefer. Similar technologies (local storage, session storage, pixel tags) are covered by this policy as well.</p>` },
      { heading: "2. Cookies we use", body: `<ul><li><strong>Strictly necessary</strong> — authentication, session persistence, security, load-balancing. The Service cannot function without these.</li><li><strong>Functional</strong> — saving your language, currency, theme and onboarding state so you don't have to re-enter them.</li><li><strong>Analytics</strong> — aggregated, privacy-respecting metrics about which pages and matches are popular. Loaded only after consent in regions where consent is required.</li><li><strong>Affiliate attribution</strong> — when you click an outbound ticket link, our partners (e.g. Awin, Ticketmaster, Viagogo, official clubs) may set a cookie that lets them attribute a sale to us. We never receive your payment data.</li></ul>` },
      { heading: "3. Marketing & advertising cookies", body: `<p>We do not sell ad inventory and we do not set third-party advertising cookies for retargeting or behavioural profiling. The only third-party cookies that may load are the affiliate attribution cookies described above, and only after you click an outbound link.</p>` },
      { heading: "4. Managing your preferences", body: `<p>Most browsers let you block or delete cookies via their settings. You can also clear our cookies at any time from your browser. Blocking strictly necessary cookies will sign you out and break login. Where consent is required (UK, EEA, Switzerland), you can accept, reject or change your preferences at any time using the cookie banner or by contacting ${mail}.</p>` },
      { heading: "5. Retention", body: `<p>Session cookies are deleted when you close the browser. Persistent cookies typically last between 30 days and 12 months. Affiliate attribution cookies follow the duration set by each partner network and are usually deleted after 30–90 days.</p>` },
      { heading: "6. Updates", body: `<p>We may update this Cookie Policy as our partners or the law change. The "Last updated" date at the top reflects the most recent version. Material changes will be communicated in-app.</p>` },
      { heading: "7. Contact", body: `<p>Questions about cookies or your data? Reach us at ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Affiliate Disclosure",
    intro:
      "Foot Ticket Finder is reader-supported. Some of the outbound links on our website are affiliate links — we want you to know exactly what that means and why it doesn't change what we recommend.",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "1. We compare, we don't sell", body: `<p>Foot Ticket Finder is an independent comparison and discovery service. We do <strong>not</strong> sell match tickets ourselves. Every transaction happens directly between you and an official ticketing provider — for example a club's own box office, an authorised partner, or a regulated marketplace.</p>` },
      { heading: "2. How we make money", body: `<ul><li><strong>Premium subscriptions</strong> — fans who want advanced alerts, hidden insights, and ad-free browsing pay a small monthly or yearly fee. This is our main source of revenue.</li><li><strong>Affiliate commissions</strong> — when you click certain "Buy ticket" or "Compare prices" buttons and complete a purchase on a partner site, we may receive a small commission from that partner network (such as Awin, Ticketmaster Affiliates, Viagogo Partners, or direct club programmes).</li></ul><p>The price you pay is <strong>never higher</strong> because you came through our link.</p>` },
      { heading: "3. Editorial independence", body: `<p>Affiliate revenue does <strong>not</strong> influence what we recommend. Our ranking algorithm prioritises:</p><ul><li>availability and price for the section you want;</li><li>seller legitimacy (official, authorised, or regulated marketplaces only);</li><li>delivery method and refund/exchange protection;</li><li>real fan reviews of the experience.</li></ul><p>We never accept payment in exchange for placement, fake reviews, or hiding negative information.</p>` },
      { heading: "4. Partners we may work with", body: `<p>We may participate in affiliate programmes with networks and merchants including (non-exhaustive list): Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, club official stores, hospitality providers and travel partners. Each partner is vetted for compliance with consumer-protection rules in the user's region.</p>` },
      { heading: "5. Identifying affiliate links", body: `<p>Outbound links that may earn us a commission are technically standard links — they don't redirect through extra trackers. Where required by local law, sponsored sections and affiliate links are clearly labelled as <em>"sponsored"</em> or <em>"ad"</em>.</p>` },
      { heading: "6. Compliance", body: `<p>This disclosure is provided in line with the FTC Endorsement Guides (US), the CMA / ASA guidelines (UK), the Loi pour la Confiance dans l'Économie Numérique (France) and the Unfair Commercial Practices Directive (EU). Any questions or compliance enquiries can be sent to ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Editorial Policy",
    intro:
      "Our content exists to help football fans get into stadiums safely, at a fair price, with the best possible experience. Here is exactly how we research, write and review what you read on Foot Ticket Finder.",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "1. Mission", body: `<p>We help fans find <strong>real, official, fairly-priced</strong> tickets to football matches anywhere in the world — and to get the most out of the matchday around them. Everything we publish must serve that mission first.</p>` },
      { heading: "2. Sources & verification", body: `<ul><li>Match data and ticket release dates are aggregated from <strong>official club and league sources</strong>, regulated ticketing partners (Ticketmaster, Eventim, See Tickets, regulated resale marketplaces), and major sports data providers (SportMonks, football-data.org).</li><li>Stadium information (capacity, sections, accessibility, opening year) is cross-checked against the club's own site, official media kits and on-site visits.</li><li>Editorial guides are written by humans, reviewed by an editor, and updated when seasons, prices or club policies change.</li></ul>` },
      { heading: "3. Use of AI", body: `<p>We use AI tools to translate content into nine languages, to summarise long club ticketing policies, to detect duplicate stadium entries, and to suggest matchday tips. Every AI-assisted output is <strong>reviewed by a human moderator</strong> before publishing. We never publish AI-generated reviews of stadiums or clubs as if they were written by a real fan.</p>` },
      { heading: "4. Corrections & updates", body: `<p>If we get something wrong — wrong release date, outdated price, broken outbound link — we want to know. Email ${mail} or use the "Report an issue" button on any page. Confirmed corrections are applied within 48 hours and the affected page's "Last updated" timestamp is refreshed.</p>` },
      { heading: "5. User-generated content", body: `<p>Fan reviews and matchday tips are written by signed-in users. We moderate for spam, harassment, illegal resale offers, doxxing and hate speech. We never edit a user review's substance — we only remove content that violates our community guidelines.</p>` },
      { heading: "6. Independence", body: `<p>Editorial decisions (which clubs and stadiums to cover, how to rank ticket providers, which content to feature on the homepage) are taken by the editorial team only. Commercial partners, advertisers and affiliate networks have <strong>no influence</strong> on those decisions and never see content before it is published.</p>` },
      { heading: "7. Sponsored content", body: `<p>If we ever publish a paid placement (sponsored guide, paid stadium spotlight, branded matchday giveaway), it will be clearly labelled <em>"Sponsored"</em> at the top of the page. To date we have not published any sponsored content.</p>` },
      { heading: "8. Contact", body: `<p>Editorial enquiries, corrections, partnership proposals: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Ticket & Buyer Protection Policy",
    intro:
      "We don't sell match tickets — but we want every fan who clicks an outbound link from Foot Ticket Finder to know exactly what to expect, what's protected, and what to avoid.",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "1. We are a comparison service, not a ticket seller", body: `<p>All ticket purchases are completed on the website of an <strong>official ticketing partner</strong>: a club's own box office, an authorised distributor (Ticketmaster, Eventim, See Tickets, club partners) or a regulated resale marketplace (Viagogo, StubHub International, Twickets). The buyer's contract is with that partner — not with Foot Ticket Finder.</p>` },
      { heading: "2. What we verify before listing a provider", body: `<ul><li>Legal registration and operating licence in the relevant jurisdiction.</li><li>Compliance with EU consumer-protection rules (Unfair Commercial Practices Directive, Digital Services Act) and equivalent in the UK / US.</li><li>Buyer-protection guarantee: refund or replacement ticket if the event is cancelled or the ticket is not delivered.</li><li>Transparent pricing — fees are visible before checkout.</li></ul>` },
      { heading: "3. Price changes & availability", body: `<p>Football ticket prices on resale markets move in real time. The price displayed on Foot Ticket Finder is fetched from each provider on a regular interval and may change before you reach checkout, especially during high-demand windows. Always re-check the final price on the provider's site before paying.</p>` },
      { heading: "4. What to avoid", body: `<ul><li><strong>Do not buy from social-media sellers</strong> ("DM me for tickets", Telegram resellers, Instagram stories). These are unregulated and most are scams.</li><li>Do not transfer money via wire transfer, gift cards or cryptocurrency for tickets.</li><li>Do not buy paper tickets without a verifiable secondary delivery proof.</li><li>Be careful with names on tickets: many big clubs (FC Barcelona, Bayern Munich, English Premier League grounds) check ID at the turnstile.</li></ul>` },
      { heading: "5. Cancelled or postponed matches", body: `<p>If a match is postponed or cancelled, refund and rebooking are handled by the original ticketing partner, not by Foot Ticket Finder. We will update the match page within 24 hours of an official announcement and link to the partner's refund procedure.</p>` },
      { heading: "6. Reporting a problem", body: `<p>If you bought through a link from our site and have a problem — non-delivery, fake ticket, refused entry — first contact the ticketing partner's customer service. Then send us a copy of your case at ${mail} so we can review the partner's compliance and, if necessary, remove them from our index.</p>` },
      { heading: "7. Resale & local law", body: `<p>Reselling football tickets is regulated differently around the world. In some countries (e.g. France for many official events), reselling tickets without authorisation is a criminal offence. Always check local rules before reselling tickets you bought.</p>` },
      { heading: "8. Contact", body: `<p>Questions about a ticket, partner or buyer protection: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Contact us",
    intro:
      "Whether you spotted a mistake, want to partner with us, or just need help finding a ticket — we read every message.",
    lastUpdatedLabel: "Updated",
    sections: [
      { heading: "Support", body: `<p>For help with your account, Premium subscription, ticket alerts or anything else fan-side, the fastest channel is email: ${mail}. We reply within 24 hours on business days, in English or French. Other languages are answered within 48 hours.</p>` },
      { heading: "Press & editorial", body: `<p>For interviews, quotes, embargoes and access to our editorial team, contact ${mail} with the subject line <em>"Press"</em>. We can usually respond within one business day.</p>` },
      { heading: "Partnerships", body: `<p>Clubs, federations, ticketing partners, hospitality providers and affiliate networks can reach us at ${mail} with the subject line <em>"Partnership"</em>. Please include your company name, the country you operate in, and the proposal in your first message.</p>` },
      { heading: "Privacy & data requests", body: `<p>To exercise your GDPR rights (access, rectification, erasure, portability, objection), email ${mail} with the subject line <em>"Privacy request"</em>. We respond within 30 days as required by law.</p>` },
      { heading: "Postal address", body: `<p>Foot Ticket Finder — c/o Customer Support<br/>Postal address available on request via email.</p>` },
    ],
  },
};

/* ============================================================
   FRENCH
   ============================================================ */
const fr: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Politique des cookies",
    intro: "Nous utilisons un nombre minimal de cookies pour rendre Foot Ticket Finder rapide, sûr et personnalisé — et nous demandons votre consentement avant tout cookie non strictement nécessaire.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "1. Qu'est-ce qu'un cookie ?", body: `<p>Un cookie est un petit fichier texte qu'un site enregistre sur votre appareil pour mémoriser des informations sur votre visite — par exemple votre connexion ou votre langue. Les technologies similaires (local storage, session storage, pixels) sont également couvertes par la présente politique.</p>` },
      { heading: "2. Cookies que nous utilisons", body: `<ul><li><strong>Strictement nécessaires</strong> — authentification, session, sécurité, équilibrage de charge.</li><li><strong>Fonctionnels</strong> — mémorisation de la langue, de la devise, du thème et de l'état d'onboarding.</li><li><strong>Analytiques</strong> — mesures agrégées, respectueuses de la vie privée. Chargés après consentement là où requis.</li><li><strong>Attribution affiliée</strong> — cookies déposés par nos partenaires (Awin, Ticketmaster, Viagogo, clubs) lors d'un clic sortant. Nous ne recevons jamais vos données de paiement.</li></ul>` },
      { heading: "3. Cookies marketing & publicité", body: `<p>Nous ne vendons pas d'espace publicitaire et n'utilisons aucun cookie de retargeting ou de profilage comportemental.</p>` },
      { heading: "4. Gérer vos préférences", body: `<p>Vous pouvez bloquer ou supprimer les cookies dans votre navigateur. Bloquer les cookies strictement nécessaires entraîne la déconnexion. Dans les zones où le consentement est requis (UK, EEE, Suisse), vous pouvez modifier vos préférences à tout moment via la bannière cookies ou en écrivant à ${mail}.</p>` },
      { heading: "5. Durée de conservation", body: `<p>Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants durent 30 jours à 12 mois. Les cookies d'attribution affiliée durent 30 à 90 jours.</p>` },
      { heading: "6. Mises à jour", body: `<p>Nous pouvons mettre à jour cette politique. La date « Dernière mise à jour » en haut reflète la version courante.</p>` },
      { heading: "7. Contact", body: `<p>Questions sur les cookies ? Écrivez à ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Divulgation affiliée",
    intro: "Foot Ticket Finder est financé par ses lecteurs. Certains liens sortants sont des liens affiliés — voici ce que cela signifie et pourquoi cela n'influence pas nos recommandations.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "1. Nous comparons, nous ne vendons pas", body: `<p>Foot Ticket Finder est un comparateur indépendant. Nous <strong>ne vendons pas</strong> de billets. Chaque transaction se fait directement entre vous et un revendeur officiel.</p>` },
      { heading: "2. Comment nous gagnons de l'argent", body: `<ul><li><strong>Abonnements Premium</strong> — notre source principale de revenus.</li><li><strong>Commissions affiliées</strong> — versées par les partenaires (Awin, Ticketmaster Affiliates, Viagogo Partners, programmes clubs) en cas d'achat finalisé.</li></ul><p>Le prix payé n'est <strong>jamais plus élevé</strong> via notre lien.</p>` },
      { heading: "3. Indépendance éditoriale", body: `<p>Les revenus affiliés <strong>n'influencent pas</strong> nos recommandations. Notre classement priorise la disponibilité, la légitimité du vendeur, les protections acheteur et les avis fans.</p>` },
      { heading: "4. Partenaires", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, boutiques officielles, hospitalité, voyage. Chaque partenaire est audité.</p>` },
      { heading: "5. Identification des liens affiliés", body: `<p>Les liens affiliés sont des liens standards. Là où la loi l'exige, ils sont étiquetés <em>« sponsorisé »</em> ou <em>« publicité »</em>.</p>` },
      { heading: "6. Conformité", body: `<p>Conforme aux directives FTC (US), CMA/ASA (UK), LCEN (France) et à la directive UE sur les pratiques commerciales déloyales. Questions : ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Politique éditoriale",
    intro: "Nos contenus existent pour aider les fans à entrer dans les stades en toute sécurité, à un prix juste, avec la meilleure expérience possible.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "1. Mission", body: `<p>Aider les fans à trouver des billets <strong>réels, officiels et à un prix juste</strong> partout dans le monde.</p>` },
      { heading: "2. Sources & vérification", body: `<ul><li>Données agrégées depuis les <strong>sources officielles</strong> des clubs et ligues et des partenaires régulés (Ticketmaster, Eventim, SportMonks).</li><li>Informations stades recoupées avec les sites officiels et des visites sur place.</li><li>Guides rédigés par des humains, relus par un éditeur.</li></ul>` },
      { heading: "3. Utilisation de l'IA", body: `<p>L'IA est utilisée pour traduire, résumer et détecter des doublons. Chaque sortie est <strong>relue par un modérateur humain</strong>. Aucun faux avis généré par IA.</p>` },
      { heading: "4. Corrections", body: `<p>Erreur repérée ? Écrivez à ${mail} ou utilisez « Signaler un problème ». Corrections sous 48 heures.</p>` },
      { heading: "5. Contenu utilisateur", body: `<p>Les avis fans sont modérés contre le spam, le harcèlement, le doxxing et la haine. Nous ne modifions jamais le fond.</p>` },
      { heading: "6. Indépendance", body: `<p>Les partenaires commerciaux n'ont <strong>aucune influence</strong> sur nos décisions éditoriales.</p>` },
      { heading: "7. Contenu sponsorisé", body: `<p>Tout placement payant serait étiqueté <em>« Sponsorisé »</em>. À ce jour aucun.</p>` },
      { heading: "8. Contact", body: `<p>Corrections et partenariats : ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Politique billetterie & protection acheteur",
    intro: "Nous ne vendons pas de billets — mais nous voulons que chaque fan sache à quoi s'attendre, ce qui est protégé, et ce qu'il faut éviter.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "1. Comparateur, pas vendeur", body: `<p>Tous les achats sont finalisés sur le site d'un <strong>partenaire officiel</strong>. Le contrat est conclu avec ce partenaire — pas avec Foot Ticket Finder.</p>` },
      { heading: "2. Ce que nous vérifions", body: `<ul><li>Enregistrement légal et licence.</li><li>Conformité aux règles UE / UK / US.</li><li>Garantie de protection acheteur.</li><li>Tarification transparente.</li></ul>` },
      { heading: "3. Variations de prix", body: `<p>Les prix sur les marchés secondaires bougent en temps réel. Vérifiez toujours le prix final sur le site du revendeur avant de payer.</p>` },
      { heading: "4. À éviter", body: `<ul><li><strong>Ne jamais acheter sur les réseaux sociaux</strong> (Telegram, Instagram, « DM moi »).</li><li>Pas de virement, carte cadeau ni crypto pour des billets.</li><li>Attention au nom sur le billet — beaucoup de gros clubs vérifient l'identité.</li></ul>` },
      { heading: "5. Matchs annulés ou reportés", body: `<p>Le remboursement est géré par le revendeur d'origine. Nous mettons à jour la fiche match sous 24 heures.</p>` },
      { heading: "6. Signaler un problème", body: `<p>Contactez d'abord le service client du revendeur, puis transmettez votre dossier à ${mail}.</p>` },
      { heading: "7. Revente & droit local", body: `<p>La revente est régulée différemment selon les pays. En France, revendre sans autorisation est un délit.</p>` },
      { heading: "8. Contact", body: `<p>Questions : ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Nous contacter",
    intro: "Que vous ayez repéré une erreur, vouliez devenir partenaire, ou ayez juste besoin d'aide pour trouver un billet — nous lisons chaque message.",
    lastUpdatedLabel: "Mis à jour",
    sections: [
      { heading: "Support", body: `<p>Compte, abonnement Premium, alertes : ${mail}. Réponse sous 24 h les jours ouvrés en français/anglais, 48 h dans les autres langues.</p>` },
      { heading: "Presse & éditorial", body: `<p>Interviews et citations : ${mail} avec l'objet <em>« Presse »</em>. Réponse sous un jour ouvré.</p>` },
      { heading: "Partenariats", body: `<p>Clubs, fédérations, billetterie, hospitalité, affiliés : ${mail} avec l'objet <em>« Partenariat »</em>.</p>` },
      { heading: "Vie privée & demandes RGPD", body: `<p>Pour exercer vos droits RGPD : ${mail} avec l'objet <em>« Demande RGPD »</em>. Réponse sous 30 jours.</p>` },
      { heading: "Adresse postale", body: `<p>Foot Ticket Finder — Service client<br/>Adresse postale disponible sur demande par email.</p>` },
    ],
  },
};

/* ============================================================
   SPANISH
   ============================================================ */
const es: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Política de cookies",
    intro: "Usamos un conjunto mínimo de cookies para que Foot Ticket Finder sea rápido, seguro y personalizado — y pedimos consentimiento antes de instalar cualquier cookie no estrictamente necesaria.",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "1. ¿Qué es una cookie?", body: `<p>Una cookie es un pequeño archivo de texto que un sitio guarda en su dispositivo para recordar información sobre su visita — por ejemplo, su inicio de sesión o su idioma. Esta política cubre también tecnologías similares (local storage, session storage, píxeles).</p>` },
      { heading: "2. Cookies que utilizamos", body: `<ul><li><strong>Estrictamente necesarias</strong> — autenticación, sesión, seguridad, balanceo de carga.</li><li><strong>Funcionales</strong> — guardan idioma, divisa, tema y estado de onboarding.</li><li><strong>Analíticas</strong> — métricas agregadas y respetuosas con la privacidad. Cargadas tras consentimiento donde se requiera.</li><li><strong>Atribución de afiliados</strong> — al hacer clic en enlaces salientes, partners (Awin, Ticketmaster, Viagogo, clubes) pueden establecer una cookie de atribución. No recibimos sus datos de pago.</li></ul>` },
      { heading: "3. Cookies de marketing y publicidad", body: `<p>No vendemos espacio publicitario ni utilizamos cookies de retargeting o perfilado conductual.</p>` },
      { heading: "4. Gestionar sus preferencias", body: `<p>Puede bloquear o eliminar cookies desde su navegador. Bloquear las estrictamente necesarias cerrará su sesión. Donde se requiera consentimiento (UE, UK, Suiza), puede cambiar sus preferencias en cualquier momento desde el banner o escribiendo a ${mail}.</p>` },
      { heading: "5. Conservación", body: `<p>Las cookies de sesión se eliminan al cerrar el navegador. Las persistentes duran de 30 días a 12 meses. Las de afiliación duran 30–90 días.</p>` },
      { heading: "6. Actualizaciones", body: `<p>Podemos actualizar esta política. La fecha de actualización refleja la versión más reciente.</p>` },
      { heading: "7. Contacto", body: `<p>¿Dudas sobre cookies? Escríbanos a ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Divulgación de afiliados",
    intro: "Foot Ticket Finder se financia por sus lectores. Algunos enlaces salientes son enlaces de afiliados — esto es lo que significa y por qué no afecta a lo que recomendamos.",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "1. Comparamos, no vendemos", body: `<p>Somos un servicio independiente de comparación. <strong>No</strong> vendemos entradas. Cada transacción es directa con el proveedor oficial.</p>` },
      { heading: "2. Cómo generamos ingresos", body: `<ul><li><strong>Suscripciones Premium</strong> — nuestra fuente principal.</li><li><strong>Comisiones de afiliados</strong> — abonadas por partners (Awin, Ticketmaster Affiliates, Viagogo Partners, programas de clubes) tras una compra completada.</li></ul><p>El precio que paga <strong>nunca es más alto</strong> por venir de nuestro enlace.</p>` },
      { heading: "3. Independencia editorial", body: `<p>Los ingresos por afiliación <strong>no influyen</strong> en nuestras recomendaciones. Priorizamos disponibilidad, legitimidad del vendedor, protección al comprador y reseñas reales.</p>` },
      { heading: "4. Partners", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, tiendas oficiales, hospitalidad y viaje. Cada partner es auditado.</p>` },
      { heading: "5. Identificación de enlaces afiliados", body: `<p>Son enlaces estándar. Donde la ley lo exija, se etiquetan como <em>«patrocinado»</em> o <em>«publicidad»</em>.</p>` },
      { heading: "6. Cumplimiento", body: `<p>Conforme a FTC (US), CMA/ASA (UK), LCEN (Francia) y la Directiva UE sobre prácticas comerciales desleales. Consultas: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Política editorial",
    intro: "Nuestro contenido existe para ayudar a los aficionados a entrar a los estadios de forma segura, a un precio justo y con la mejor experiencia posible.",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "1. Misión", body: `<p>Ayudar a los aficionados a encontrar entradas <strong>reales, oficiales y a precio justo</strong> en cualquier parte del mundo.</p>` },
      { heading: "2. Fuentes y verificación", body: `<ul><li>Datos agregados desde <strong>fuentes oficiales</strong> de clubes y ligas y partners regulados (Ticketmaster, Eventim, SportMonks).</li><li>Información de estadios cotejada con webs oficiales y visitas in situ.</li><li>Guías escritas por humanos y revisadas por un editor.</li></ul>` },
      { heading: "3. Uso de IA", body: `<p>Usamos IA para traducir, resumir y detectar duplicados. Toda salida es <strong>revisada por un moderador humano</strong>. Nunca publicamos reseñas generadas por IA como si fueran de un aficionado real.</p>` },
      { heading: "4. Correcciones", body: `<p>¿Detectó un error? Escriba a ${mail} o use «Reportar un problema». Correcciones en 48 horas.</p>` },
      { heading: "5. Contenido de usuarios", body: `<p>Reseñas y consejos están moderados contra spam, acoso, doxxing y odio. Nunca editamos el fondo.</p>` },
      { heading: "6. Independencia", body: `<p>Los partners comerciales <strong>no influyen</strong> en nuestras decisiones editoriales.</p>` },
      { heading: "7. Contenido patrocinado", body: `<p>Cualquier colocación pagada se etiquetaría como <em>«Patrocinado»</em>. Hasta hoy, ninguna.</p>` },
      { heading: "8. Contacto", body: `<p>Correcciones y partnerships: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Política de entradas y protección al comprador",
    intro: "No vendemos entradas — pero queremos que cada aficionado sepa qué esperar, qué está protegido y qué evitar.",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "1. Comparador, no vendedor", body: `<p>Toda compra se finaliza en el sitio de un <strong>partner oficial</strong>. El contrato es con el partner — no con Foot Ticket Finder.</p>` },
      { heading: "2. Qué verificamos", body: `<ul><li>Registro legal y licencia.</li><li>Cumplimiento UE / UK / US.</li><li>Garantía de protección al comprador.</li><li>Precios transparentes.</li></ul>` },
      { heading: "3. Cambios de precio", body: `<p>Los precios en mercados secundarios cambian en tiempo real. Verifique siempre el precio final en el sitio del revendedor antes de pagar.</p>` },
      { heading: "4. Qué evitar", body: `<ul><li><strong>Nunca compre en redes sociales</strong> (Telegram, Instagram, «DM para entradas»).</li><li>Sin transferencias, gift cards ni cripto para entradas.</li><li>Cuidado con el nombre en la entrada — muchos clubes verifican identidad.</li></ul>` },
      { heading: "5. Partidos cancelados o aplazados", body: `<p>El reembolso lo gestiona el partner original. Actualizamos la ficha del partido en 24 horas.</p>` },
      { heading: "6. Reportar un problema", body: `<p>Contacte primero al servicio al cliente del partner, luego envíenos su caso a ${mail}.</p>` },
      { heading: "7. Reventa y ley local", body: `<p>La reventa se regula de forma distinta en cada país. En Francia, revender sin autorización es delito.</p>` },
      { heading: "8. Contacto", body: `<p>Consultas: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Contáctenos",
    intro: "¿Detectó un error, quiere asociarse o necesita ayuda con una entrada? Leemos cada mensaje.",
    lastUpdatedLabel: "Actualizado",
    sections: [
      { heading: "Soporte", body: `<p>Cuenta, Premium, alertas: ${mail}. Respuesta en 24 h laborables en español/inglés, 48 h en otros idiomas.</p>` },
      { heading: "Prensa y editorial", body: `<p>Entrevistas y citas: ${mail} con asunto <em>«Prensa»</em>.</p>` },
      { heading: "Partnerships", body: `<p>Clubes, federaciones, ticketing, hospitalidad, afiliados: ${mail} con asunto <em>«Partnership»</em>.</p>` },
      { heading: "Privacidad y solicitudes RGPD", body: `<p>Para ejercer sus derechos RGPD: ${mail} con asunto <em>«Privacidad»</em>. Respuesta en 30 días.</p>` },
      { heading: "Dirección postal", body: `<p>Foot Ticket Finder — Atención al cliente<br/>Dirección postal disponible bajo petición por email.</p>` },
    ],
  },
};

/* ============================================================
   GERMAN
   ============================================================ */
const de: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Cookie-Richtlinie",
    intro: "Wir verwenden ein Minimum an Cookies, um Foot Ticket Finder schnell, sicher und personalisiert zu halten — und fragen vor jedem nicht notwendigen Cookie um Einwilligung.",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "1. Was ist ein Cookie?", body: `<p>Ein Cookie ist eine kleine Textdatei, die eine Website auf Ihrem Gerät speichert, um Informationen über Ihren Besuch zu merken (z. B. Login, Sprache). Ähnliche Technologien (Local Storage, Pixel) sind ebenfalls erfasst.</p>` },
      { heading: "2. Genutzte Cookies", body: `<ul><li><strong>Unbedingt erforderlich</strong> — Authentifizierung, Session, Sicherheit, Load-Balancing.</li><li><strong>Funktional</strong> — Sprache, Währung, Theme, Onboarding-Status.</li><li><strong>Analytik</strong> — aggregierte, datenschutzfreundliche Metriken. Nur nach Einwilligung wo erforderlich.</li><li><strong>Affiliate-Tracking</strong> — Partner (Awin, Ticketmaster, Viagogo, Vereine) setzen ggf. ein Attributions-Cookie. Wir erhalten keine Zahlungsdaten.</li></ul>` },
      { heading: "3. Marketing- & Werbe-Cookies", body: `<p>Wir verkaufen keinen Werbeplatz und setzen keine Retargeting- oder Profiling-Cookies ein.</p>` },
      { heading: "4. Einstellungen verwalten", body: `<p>Sie können Cookies im Browser blockieren oder löschen. Notwendige Cookies blockieren beendet die Sitzung. In Regionen mit Einwilligungspflicht (EU, UK, Schweiz) können Sie jederzeit Ihre Einstellungen über das Cookie-Banner ändern oder ${mail} schreiben.</p>` },
      { heading: "5. Speicherdauer", body: `<p>Session-Cookies werden beim Schließen des Browsers gelöscht. Persistente Cookies leben 30 Tage bis 12 Monate. Affiliate-Cookies 30–90 Tage.</p>` },
      { heading: "6. Aktualisierungen", body: `<p>Wir können diese Richtlinie aktualisieren. Das Datum oben spiegelt die aktuelle Version.</p>` },
      { heading: "7. Kontakt", body: `<p>Fragen zu Cookies? ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Affiliate-Offenlegung",
    intro: "Foot Ticket Finder wird von seinen Lesern finanziert. Einige ausgehende Links sind Affiliate-Links — hier ist, was das bedeutet und warum es unsere Empfehlungen nicht beeinflusst.",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "1. Wir vergleichen, wir verkaufen nicht", body: `<p>Wir verkaufen <strong>keine</strong> Tickets. Jede Transaktion erfolgt direkt mit einem offiziellen Anbieter.</p>` },
      { heading: "2. Wie wir Geld verdienen", body: `<ul><li><strong>Premium-Abos</strong> — unsere Haupteinnahmequelle.</li><li><strong>Affiliate-Provisionen</strong> — gezahlt von Partnern (Awin, Ticketmaster Affiliates, Viagogo Partners) nach erfolgtem Kauf.</li></ul><p>Der gezahlte Preis ist <strong>nie höher</strong>, weil Sie über unseren Link kommen.</p>` },
      { heading: "3. Redaktionelle Unabhängigkeit", body: `<p>Affiliate-Einnahmen <strong>beeinflussen nicht</strong> unsere Empfehlungen. Wir priorisieren Verfügbarkeit, Anbieter-Legitimität, Käuferschutz und echte Fan-Bewertungen.</p>` },
      { heading: "4. Partner", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, offizielle Vereinsshops, Hospitality, Reise. Jeder Partner wird geprüft.</p>` },
      { heading: "5. Affiliate-Links erkennen", body: `<p>Es sind Standardlinks. Wo gesetzlich erforderlich, sind sie als <em>„gesponsert"</em> oder <em>„Werbung"</em> gekennzeichnet.</p>` },
      { heading: "6. Compliance", body: `<p>Konform mit FTC (US), CMA/ASA (UK), LCEN (FR) und der EU-Richtlinie über unlautere Geschäftspraktiken. Fragen: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Redaktions-Richtlinie",
    intro: "Unsere Inhalte helfen Fans, sicher und fair bepreist ins Stadion zu kommen — mit dem bestmöglichen Erlebnis.",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "1. Mission", body: `<p>Wir helfen Fans, <strong>echte, offizielle, fair bepreiste</strong> Tickets weltweit zu finden.</p>` },
      { heading: "2. Quellen & Verifikation", body: `<ul><li>Daten aggregiert aus <strong>offiziellen Quellen</strong> der Vereine/Ligen und regulierten Partnern (Ticketmaster, Eventim, SportMonks).</li><li>Stadion-Infos abgeglichen mit Vereins-Websites und Vor-Ort-Besuchen.</li><li>Guides von Menschen verfasst, redaktionell geprüft.</li></ul>` },
      { heading: "3. KI-Einsatz", body: `<p>KI hilft beim Übersetzen, Zusammenfassen und Duplikat-Erkennen. Jede Ausgabe wird <strong>von einem menschlichen Moderator geprüft</strong>. Keine KI-generierten Fake-Reviews.</p>` },
      { heading: "4. Korrekturen", body: `<p>Fehler entdeckt? Schreiben Sie an ${mail} oder nutzen Sie „Problem melden". Korrekturen binnen 48 Stunden.</p>` },
      { heading: "5. Nutzer-Inhalte", body: `<p>Fan-Bewertungen werden gegen Spam, Belästigung, Doxxing und Hass moderiert. Inhaltlich nie verändert.</p>` },
      { heading: "6. Unabhängigkeit", body: `<p>Kommerzielle Partner haben <strong>keinen Einfluss</strong> auf redaktionelle Entscheidungen.</p>` },
      { heading: "7. Gesponserte Inhalte", body: `<p>Bezahlte Platzierungen wären klar als <em>„Gesponsert"</em> gekennzeichnet. Bisher keine.</p>` },
      { heading: "8. Kontakt", body: `<p>Korrekturen, Partnerschaften: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Ticket- & Käuferschutz-Richtlinie",
    intro: "Wir verkaufen keine Tickets — aber wir möchten, dass jeder Fan weiß, was zu erwarten, was geschützt und was zu vermeiden ist.",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "1. Vergleichsdienst, kein Verkäufer", body: `<p>Jeder Kauf wird auf der Website eines <strong>offiziellen Partners</strong> abgeschlossen. Der Vertrag besteht mit dem Partner — nicht mit Foot Ticket Finder.</p>` },
      { heading: "2. Was wir prüfen", body: `<ul><li>Rechtliche Registrierung und Lizenz.</li><li>Konformität EU / UK / US.</li><li>Käuferschutz-Garantie.</li><li>Transparente Preise.</li></ul>` },
      { heading: "3. Preisänderungen", body: `<p>Preise auf Resale-Märkten bewegen sich in Echtzeit. Prüfen Sie immer den Endpreis beim Anbieter, bevor Sie zahlen.</p>` },
      { heading: "4. Was zu vermeiden ist", body: `<ul><li><strong>Niemals über Social Media kaufen</strong> (Telegram, Instagram, „DM mich").</li><li>Keine Banküberweisung, Geschenkkarten oder Krypto für Tickets.</li><li>Achten Sie auf den Namen — viele Großvereine prüfen den Ausweis.</li></ul>` },
      { heading: "5. Abgesagte/verlegte Spiele", body: `<p>Erstattung erfolgt durch den ursprünglichen Partner. Wir aktualisieren die Spielseite binnen 24 Stunden.</p>` },
      { heading: "6. Probleme melden", body: `<p>Kontaktieren Sie zuerst den Partner-Support, dann senden Sie uns Ihren Fall an ${mail}.</p>` },
      { heading: "7. Weiterverkauf & lokales Recht", body: `<p>Weiterverkauf ist je Land unterschiedlich reguliert. In Frankreich ist nicht genehmigter Wiederverkauf strafbar.</p>` },
      { heading: "8. Kontakt", body: `<p>Fragen: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Kontakt",
    intro: "Ob Fehler entdeckt, Partnerschaft gewünscht oder Ticket-Hilfe nötig — wir lesen jede Nachricht.",
    lastUpdatedLabel: "Aktualisiert",
    sections: [
      { heading: "Support", body: `<p>Konto, Premium, Alerts: ${mail}. Antwort innerhalb 24 h werktags auf Englisch/Französisch, 48 h in anderen Sprachen.</p>` },
      { heading: "Presse & Redaktion", body: `<p>Interviews und Zitate: ${mail} mit Betreff <em>„Presse"</em>.</p>` },
      { heading: "Partnerschaften", body: `<p>Vereine, Verbände, Ticketing, Hospitality, Affiliates: ${mail} mit Betreff <em>„Partnership"</em>.</p>` },
      { heading: "Datenschutz / DSGVO-Anfragen", body: `<p>DSGVO-Rechte: ${mail} mit Betreff <em>„Datenschutz"</em>. Antwort binnen 30 Tagen.</p>` },
      { heading: "Postanschrift", body: `<p>Foot Ticket Finder — Kundenservice<br/>Postanschrift auf Anfrage per E-Mail.</p>` },
    ],
  },
};

/* ============================================================
   ITALIAN
   ============================================================ */
const it: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Informativa sui cookie",
    intro: "Usiamo un set minimo di cookie per rendere Foot Ticket Finder veloce, sicuro e personalizzato — chiediamo il consenso prima di installare cookie non strettamente necessari.",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "1. Cos'è un cookie?", body: `<p>Un cookie è un piccolo file di testo che un sito salva sul tuo dispositivo per ricordare informazioni sulla tua visita (login, lingua). Tecnologie simili (local storage, pixel) sono incluse.</p>` },
      { heading: "2. Cookie utilizzati", body: `<ul><li><strong>Strettamente necessari</strong> — autenticazione, sessione, sicurezza.</li><li><strong>Funzionali</strong> — lingua, valuta, tema, onboarding.</li><li><strong>Analitici</strong> — metriche aggregate. Caricati solo dopo consenso ove richiesto.</li><li><strong>Attribuzione affiliata</strong> — i partner (Awin, Ticketmaster, Viagogo, club) possono impostare un cookie. Non riceviamo i tuoi dati di pagamento.</li></ul>` },
      { heading: "3. Cookie marketing/pubblicitari", body: `<p>Non vendiamo spazi pubblicitari né usiamo cookie di retargeting o profilazione comportamentale.</p>` },
      { heading: "4. Gestire le preferenze", body: `<p>Puoi bloccare o eliminare i cookie dal browser. Bloccare quelli necessari ti farà uscire dall'account. Dove richiesto (UE, UK, Svizzera), puoi modificare le preferenze tramite banner o scrivendo a ${mail}.</p>` },
      { heading: "5. Conservazione", body: `<p>I cookie di sessione vengono eliminati alla chiusura del browser. Quelli persistenti durano 30 giorni–12 mesi. Quelli di affiliazione 30–90 giorni.</p>` },
      { heading: "6. Aggiornamenti", body: `<p>Possiamo aggiornare questa informativa. La data in alto indica la versione corrente.</p>` },
      { heading: "7. Contatti", body: `<p>Domande sui cookie? Scrivi a ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Disclosure affiliati",
    intro: "Foot Ticket Finder è sostenuto dai lettori. Alcuni link in uscita sono link di affiliazione — ecco cosa significa e perché non influisce sulle nostre raccomandazioni.",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "1. Confrontiamo, non vendiamo", body: `<p><strong>Non</strong> vendiamo biglietti. Ogni transazione avviene direttamente con il fornitore ufficiale.</p>` },
      { heading: "2. Come guadagniamo", body: `<ul><li><strong>Abbonamenti Premium</strong> — la nostra principale fonte di ricavi.</li><li><strong>Commissioni di affiliazione</strong> — pagate dai partner (Awin, Ticketmaster Affiliates, Viagogo Partners) dopo un acquisto.</li></ul><p>Il prezzo che paghi <strong>non è mai più alto</strong> passando dal nostro link.</p>` },
      { heading: "3. Indipendenza editoriale", body: `<p>I ricavi affiliati <strong>non influenzano</strong> le nostre raccomandazioni. Priorità a disponibilità, legittimità del venditore, tutela del compratore e recensioni reali.</p>` },
      { heading: "4. Partner", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, store ufficiali dei club, hospitality e viaggio.</p>` },
      { heading: "5. Identificare i link affiliati", body: `<p>Sono link standard. Dove la legge lo richiede sono etichettati come <em>«sponsorizzato»</em> o <em>«pubblicità»</em>.</p>` },
      { heading: "6. Conformità", body: `<p>Conforme a FTC (US), CMA/ASA (UK), LCEN (FR) e Direttiva UE pratiche commerciali sleali. Contatti: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Politica editoriale",
    intro: "I nostri contenuti aiutano i tifosi a entrare negli stadi in sicurezza, a un prezzo equo, con la migliore esperienza possibile.",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "1. Missione", body: `<p>Aiutare i tifosi a trovare biglietti <strong>reali, ufficiali e a prezzo equo</strong> in tutto il mondo.</p>` },
      { heading: "2. Fonti e verifica", body: `<ul><li>Dati aggregati da <strong>fonti ufficiali</strong> di club e leghe e partner regolati (Ticketmaster, Eventim, SportMonks).</li><li>Info stadi confrontate con siti ufficiali e visite sul posto.</li><li>Guide scritte da umani e riviste editorialmente.</li></ul>` },
      { heading: "3. Uso dell'IA", body: `<p>L'IA aiuta a tradurre, riassumere e individuare duplicati. Ogni output è <strong>revisionato da un moderatore umano</strong>. Nessuna recensione finta generata da IA.</p>` },
      { heading: "4. Correzioni", body: `<p>Errore notato? Scrivi a ${mail} o usa «Segnala un problema». Correzioni entro 48 ore.</p>` },
      { heading: "5. Contenuti utente", body: `<p>Recensioni moderate contro spam, molestie, doxxing, odio. Mai modificate nei contenuti.</p>` },
      { heading: "6. Indipendenza", body: `<p>I partner commerciali <strong>non influenzano</strong> le decisioni editoriali.</p>` },
      { heading: "7. Contenuti sponsorizzati", body: `<p>Eventuali contenuti pagati sarebbero etichettati <em>«Sponsorizzato»</em>. Ad oggi nessuno.</p>` },
      { heading: "8. Contatti", body: `<p>Correzioni e partnership: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Politica biglietti e tutela del compratore",
    intro: "Non vendiamo biglietti — ma vogliamo che ogni tifoso sappia cosa aspettarsi, cosa è tutelato e cosa evitare.",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "1. Comparatore, non venditore", body: `<p>Ogni acquisto avviene sul sito di un <strong>partner ufficiale</strong>. Il contratto è con il partner — non con Foot Ticket Finder.</p>` },
      { heading: "2. Cosa verifichiamo", body: `<ul><li>Registrazione legale e licenza.</li><li>Conformità UE / UK / US.</li><li>Garanzia di tutela del compratore.</li><li>Prezzi trasparenti.</li></ul>` },
      { heading: "3. Variazioni di prezzo", body: `<p>I prezzi sul secondario cambiano in tempo reale. Verifica sempre il prezzo finale sul sito del rivenditore prima di pagare.</p>` },
      { heading: "4. Cosa evitare", body: `<ul><li><strong>Mai comprare sui social</strong> (Telegram, Instagram, «DM per biglietti»).</li><li>Niente bonifici, gift card o cripto per i biglietti.</li><li>Attenzione al nominativo — molti grandi club verificano l'identità.</li></ul>` },
      { heading: "5. Partite annullate/rinviate", body: `<p>Il rimborso è gestito dal partner originario. Aggiorniamo la scheda partita entro 24 ore.</p>` },
      { heading: "6. Segnalare un problema", body: `<p>Contatta prima l'assistenza del partner, poi inviaci il caso a ${mail}.</p>` },
      { heading: "7. Rivendita e legge locale", body: `<p>La rivendita è regolata in modo diverso nei vari Paesi. In Francia rivendere senza autorizzazione è reato.</p>` },
      { heading: "8. Contatti", body: `<p>Domande: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Contattaci",
    intro: "Hai notato un errore, vuoi diventare partner o ti serve aiuto con un biglietto? Leggiamo ogni messaggio.",
    lastUpdatedLabel: "Aggiornato",
    sections: [
      { heading: "Supporto", body: `<p>Account, Premium, avvisi: ${mail}. Risposta entro 24 h nei giorni lavorativi in italiano/inglese, 48 h in altre lingue.</p>` },
      { heading: "Stampa & editoriale", body: `<p>Interviste e citazioni: ${mail} con oggetto <em>«Stampa»</em>.</p>` },
      { heading: "Partnership", body: `<p>Club, federazioni, ticketing, hospitality, affiliati: ${mail} con oggetto <em>«Partnership»</em>.</p>` },
      { heading: "Privacy e richieste GDPR", body: `<p>Per i diritti GDPR: ${mail} con oggetto <em>«Privacy»</em>. Risposta entro 30 giorni.</p>` },
      { heading: "Indirizzo postale", body: `<p>Foot Ticket Finder — Servizio clienti<br/>Indirizzo postale disponibile su richiesta via email.</p>` },
    ],
  },
};

/* ============================================================
   PORTUGUESE
   ============================================================ */
const pt: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Política de cookies",
    intro: "Usamos um conjunto mínimo de cookies para manter o Foot Ticket Finder rápido, seguro e personalizado — pedimos consentimento antes de qualquer cookie não estritamente necessário.",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "1. O que é um cookie?", body: `<p>Um cookie é um pequeno ficheiro de texto que um site guarda no seu dispositivo para lembrar informações da sua visita (login, idioma). Tecnologias semelhantes também estão cobertas.</p>` },
      { heading: "2. Cookies que utilizamos", body: `<ul><li><strong>Estritamente necessários</strong> — autenticação, sessão, segurança.</li><li><strong>Funcionais</strong> — idioma, moeda, tema, onboarding.</li><li><strong>Analíticos</strong> — métricas agregadas. Carregados após consentimento onde exigido.</li><li><strong>Atribuição de afiliados</strong> — parceiros (Awin, Ticketmaster, Viagogo, clubes) podem definir cookies. Não recebemos os seus dados de pagamento.</li></ul>` },
      { heading: "3. Cookies de marketing/publicidade", body: `<p>Não vendemos espaço publicitário nem usamos cookies de retargeting ou perfilagem.</p>` },
      { heading: "4. Gerir preferências", body: `<p>Pode bloquear/eliminar cookies no navegador. Bloquear os essenciais encerra a sessão. Onde for exigido (UE, UK, Suíça), pode alterar preferências via banner ou escrevendo para ${mail}.</p>` },
      { heading: "5. Retenção", body: `<p>Cookies de sessão eliminados ao fechar o navegador. Persistentes 30 dias–12 meses. Atribuição de afiliados 30–90 dias.</p>` },
      { heading: "6. Atualizações", body: `<p>Podemos atualizar esta política. A data acima reflete a versão atual.</p>` },
      { heading: "7. Contacto", body: `<p>Dúvidas sobre cookies? ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Divulgação de afiliados",
    intro: "O Foot Ticket Finder é financiado pelos leitores. Alguns links de saída são links de afiliados — eis o que isso significa e por que não influencia as recomendações.",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "1. Comparamos, não vendemos", body: `<p><strong>Não</strong> vendemos bilhetes. Toda transação é direta com o fornecedor oficial.</p>` },
      { heading: "2. Como ganhamos dinheiro", body: `<ul><li><strong>Subscrições Premium</strong> — fonte principal.</li><li><strong>Comissões de afiliados</strong> — pagas pelos parceiros (Awin, Ticketmaster Affiliates, Viagogo Partners) após uma compra.</li></ul><p>O preço pago <strong>nunca é mais alto</strong> ao usar o nosso link.</p>` },
      { heading: "3. Independência editorial", body: `<p>Os ganhos de afiliação <strong>não influenciam</strong> as recomendações. Prioridade a disponibilidade, legitimidade, proteção ao comprador e avaliações reais.</p>` },
      { heading: "4. Parceiros", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, lojas oficiais, hospitalidade e viagens.</p>` },
      { heading: "5. Identificação", body: `<p>São links padrão. Onde a lei exige, são marcados como <em>«patrocinado»</em> ou <em>«publicidade»</em>.</p>` },
      { heading: "6. Conformidade", body: `<p>Conforme FTC (US), CMA/ASA (UK), LCEN (FR) e Diretiva UE sobre práticas comerciais desleais. Contacto: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Política editorial",
    intro: "O nosso conteúdo ajuda os adeptos a entrarem nos estádios com segurança, a preço justo e com a melhor experiência possível.",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "1. Missão", body: `<p>Ajudar adeptos a encontrar bilhetes <strong>reais, oficiais e a preço justo</strong> em todo o mundo.</p>` },
      { heading: "2. Fontes e verificação", body: `<ul><li>Dados agregados de <strong>fontes oficiais</strong> de clubes e ligas e parceiros regulados (Ticketmaster, Eventim, SportMonks).</li><li>Informação de estádios cruzada com sites oficiais e visitas presenciais.</li><li>Guias escritos por humanos e revistos editorialmente.</li></ul>` },
      { heading: "3. Uso de IA", body: `<p>A IA ajuda a traduzir, resumir e detetar duplicados. Toda saída é <strong>revista por um moderador humano</strong>. Nunca publicamos avaliações falsas geradas por IA.</p>` },
      { heading: "4. Correções", body: `<p>Encontrou um erro? Escreva para ${mail} ou use «Reportar problema». Correções em 48 horas.</p>` },
      { heading: "5. Conteúdo de utilizadores", body: `<p>Avaliações moderadas contra spam, assédio, doxxing e ódio. Nunca alteramos o conteúdo.</p>` },
      { heading: "6. Independência", body: `<p>Parceiros comerciais <strong>não influenciam</strong> decisões editoriais.</p>` },
      { heading: "7. Conteúdo patrocinado", body: `<p>Qualquer colocação paga seria marcada como <em>«Patrocinado»</em>. Até hoje, nenhuma.</p>` },
      { heading: "8. Contacto", body: `<p>Correções e parcerias: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Política de bilhetes e proteção ao comprador",
    intro: "Não vendemos bilhetes — mas queremos que cada adepto saiba o que esperar, o que está protegido e o que evitar.",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "1. Comparador, não vendedor", body: `<p>Toda compra é finalizada no site de um <strong>parceiro oficial</strong>. O contrato é com o parceiro — não com o Foot Ticket Finder.</p>` },
      { heading: "2. O que verificamos", body: `<ul><li>Registo legal e licença.</li><li>Conformidade UE / UK / US.</li><li>Garantia de proteção ao comprador.</li><li>Preços transparentes.</li></ul>` },
      { heading: "3. Variações de preço", body: `<p>No mercado secundário, os preços mudam em tempo real. Confirme sempre o preço final no site do revendedor antes de pagar.</p>` },
      { heading: "4. O que evitar", body: `<ul><li><strong>Nunca compre nas redes sociais</strong> (Telegram, Instagram, «DM para bilhetes»).</li><li>Sem transferências, gift cards ou cripto.</li><li>Atenção ao nome no bilhete — muitos clubes verificam identidade.</li></ul>` },
      { heading: "5. Jogos cancelados/adiados", body: `<p>Reembolso é gerido pelo parceiro original. Atualizamos a página em 24 horas.</p>` },
      { heading: "6. Reportar um problema", body: `<p>Contacte primeiro o apoio do parceiro, depois envie-nos o caso para ${mail}.</p>` },
      { heading: "7. Revenda e lei local", body: `<p>A revenda é regulada de forma diferente em cada país. Em França, revender sem autorização é crime.</p>` },
      { heading: "8. Contacto", body: `<p>Dúvidas: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Contacte-nos",
    intro: "Encontrou um erro, quer ser parceiro ou precisa de ajuda com um bilhete? Lemos todas as mensagens.",
    lastUpdatedLabel: "Atualizado",
    sections: [
      { heading: "Suporte", body: `<p>Conta, Premium, alertas: ${mail}. Resposta em 24 h em dias úteis em português/inglês, 48 h noutros idiomas.</p>` },
      { heading: "Imprensa e editorial", body: `<p>Entrevistas e citações: ${mail} com assunto <em>«Imprensa»</em>.</p>` },
      { heading: "Parcerias", body: `<p>Clubes, federações, ticketing, hospitalidade, afiliados: ${mail} com assunto <em>«Parceria»</em>.</p>` },
      { heading: "Privacidade e pedidos RGPD", body: `<p>Direitos RGPD: ${mail} com assunto <em>«Privacidade»</em>. Resposta em 30 dias.</p>` },
      { heading: "Morada postal", body: `<p>Foot Ticket Finder — Apoio ao cliente<br/>Morada postal disponível a pedido por email.</p>` },
    ],
  },
};

/* ============================================================
   DUTCH
   ============================================================ */
const nl: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Cookiebeleid",
    intro: "We gebruiken een minimaal aantal cookies om Foot Ticket Finder snel, veilig en persoonlijk te houden — en vragen toestemming voor alles wat niet strikt noodzakelijk is.",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "1. Wat is een cookie?", body: `<p>Een cookie is een klein tekstbestand dat een site op uw apparaat plaatst om informatie te onthouden (login, taal). Vergelijkbare technologieën (local storage, pixels) vallen ook onder dit beleid.</p>` },
      { heading: "2. Cookies die we gebruiken", body: `<ul><li><strong>Strikt noodzakelijk</strong> — authenticatie, sessie, beveiliging.</li><li><strong>Functioneel</strong> — taal, valuta, thema, onboarding.</li><li><strong>Analytisch</strong> — geaggregeerde, privacy-vriendelijke metingen. Alleen na toestemming waar vereist.</li><li><strong>Affiliate-attributie</strong> — partners (Awin, Ticketmaster, Viagogo, clubs) kunnen een cookie plaatsen. Wij ontvangen uw betaalgegevens nooit.</li></ul>` },
      { heading: "3. Marketing-/advertentiecookies", body: `<p>We verkopen geen advertentieruimte en gebruiken geen retargeting- of profileringscookies.</p>` },
      { heading: "4. Voorkeuren beheren", body: `<p>U kunt cookies blokkeren of verwijderen in uw browser. Strikt noodzakelijke blokkeren leidt tot uitloggen. Waar toestemming vereist is (EU, UK, Zwitserland) kunt u uw voorkeuren wijzigen via de banner of door te mailen naar ${mail}.</p>` },
      { heading: "5. Bewaartermijn", body: `<p>Sessiecookies worden gewist bij het sluiten van de browser. Persistente cookies duren 30 dagen–12 maanden. Affiliate-cookies 30–90 dagen.</p>` },
      { heading: "6. Updates", body: `<p>We kunnen dit beleid bijwerken. De datum bovenaan toont de huidige versie.</p>` },
      { heading: "7. Contact", body: `<p>Vragen over cookies? ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Affiliate-disclosure",
    intro: "Foot Ticket Finder wordt door zijn lezers ondersteund. Sommige uitgaande links zijn affiliate-links — dit legt uit wat dat betekent en waarom het onze aanbevelingen niet beïnvloedt.",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "1. We vergelijken, we verkopen niet", body: `<p>We verkopen <strong>geen</strong> tickets. Elke transactie verloopt direct met de officiële aanbieder.</p>` },
      { heading: "2. Hoe we geld verdienen", body: `<ul><li><strong>Premium-abonnementen</strong> — onze belangrijkste bron.</li><li><strong>Affiliate-commissies</strong> — betaald door partners (Awin, Ticketmaster Affiliates, Viagogo Partners) na een aankoop.</li></ul><p>De prijs die u betaalt is <strong>nooit hoger</strong> via onze link.</p>` },
      { heading: "3. Redactionele onafhankelijkheid", body: `<p>Affiliate-inkomsten <strong>beïnvloeden</strong> onze aanbevelingen niet. We prioriteren beschikbaarheid, legitimiteit, kopersbescherming en echte fan-reviews.</p>` },
      { heading: "4. Partners", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, officiële clubshops, hospitality en reis.</p>` },
      { heading: "5. Affiliate-links herkennen", body: `<p>Het zijn standaardlinks. Waar wettelijk vereist worden ze gelabeld als <em>"gesponsord"</em> of <em>"advertentie"</em>.</p>` },
      { heading: "6. Compliance", body: `<p>Conform FTC (US), CMA/ASA (UK), LCEN (FR) en EU-richtlijn oneerlijke handelspraktijken. Vragen: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Redactioneel beleid",
    intro: "Onze content helpt fans veilig en tegen een eerlijke prijs het stadion in te komen — met de best mogelijke ervaring.",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "1. Missie", body: `<p>Fans helpen <strong>echte, officiële, eerlijk geprijsde</strong> tickets te vinden wereldwijd.</p>` },
      { heading: "2. Bronnen & verificatie", body: `<ul><li>Data van <strong>officiële bronnen</strong> van clubs/competities en gereguleerde partners (Ticketmaster, Eventim, SportMonks).</li><li>Stadioninformatie gecheckt met officiële sites en bezoeken.</li><li>Gidsen door mensen geschreven en redactioneel beoordeeld.</li></ul>` },
      { heading: "3. Gebruik van AI", body: `<p>AI helpt bij vertalen, samenvatten en duplicaatdetectie. Elke output wordt <strong>door een menselijke moderator beoordeeld</strong>. Nooit nep-reviews door AI.</p>` },
      { heading: "4. Correcties", body: `<p>Fout gezien? Mail ${mail} of gebruik "Probleem melden". Correcties binnen 48 uur.</p>` },
      { heading: "5. Gebruikerscontent", body: `<p>Reviews worden gemodereerd tegen spam, intimidatie, doxxing en haat. Inhoud nooit gewijzigd.</p>` },
      { heading: "6. Onafhankelijkheid", body: `<p>Commerciële partners hebben <strong>geen invloed</strong> op redactionele beslissingen.</p>` },
      { heading: "7. Gesponsorde content", body: `<p>Betaalde plaatsing zou duidelijk gelabeld worden als <em>"Gesponsord"</em>. Tot op heden geen.</p>` },
      { heading: "8. Contact", body: `<p>Correcties en partnerships: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Ticket- & kopersbeschermingsbeleid",
    intro: "We verkopen geen tickets — maar we willen dat elke fan weet wat te verwachten, wat beschermd is en wat te vermijden.",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "1. Vergelijker, geen verkoper", body: `<p>Elke aankoop wordt afgerond op de site van een <strong>officiële partner</strong>. Het contract is met de partner — niet met Foot Ticket Finder.</p>` },
      { heading: "2. Wat we controleren", body: `<ul><li>Juridische registratie en licentie.</li><li>EU / UK / US compliance.</li><li>Kopersbeschermingsgarantie.</li><li>Transparante prijzen.</li></ul>` },
      { heading: "3. Prijswijzigingen", body: `<p>Prijzen op de secundaire markt bewegen in realtime. Controleer altijd de eindprijs op de site van de verkoper voor u betaalt.</p>` },
      { heading: "4. Wat te vermijden", body: `<ul><li><strong>Koop nooit via social media</strong> (Telegram, Instagram, "DM voor tickets").</li><li>Geen overschrijvingen, cadeaubonnen of crypto voor tickets.</li><li>Let op de naam op het ticket — veel grote clubs controleren ID.</li></ul>` },
      { heading: "5. Afgelaste/uitgestelde wedstrijden", body: `<p>Terugbetaling via de originele partner. Wij updaten de wedstrijdpagina binnen 24 uur.</p>` },
      { heading: "6. Probleem melden", body: `<p>Neem eerst contact op met de partnersupport, stuur uw zaak daarna naar ${mail}.</p>` },
      { heading: "7. Doorverkoop & lokale wet", body: `<p>Doorverkoop wordt per land verschillend gereguleerd. In Frankrijk is doorverkoop zonder toestemming strafbaar.</p>` },
      { heading: "8. Contact", body: `<p>Vragen: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Contact",
    intro: "Of u nu een fout zag, partner wilt worden of hulp nodig hebt bij een ticket — we lezen elk bericht.",
    lastUpdatedLabel: "Bijgewerkt",
    sections: [
      { heading: "Support", body: `<p>Account, Premium, alerts: ${mail}. Reactie binnen 24 u op werkdagen in Engels/Frans, 48 u in andere talen.</p>` },
      { heading: "Pers & redactie", body: `<p>Interviews en citaten: ${mail} met onderwerp <em>"Pers"</em>.</p>` },
      { heading: "Partnerships", body: `<p>Clubs, federaties, ticketing, hospitality, affiliates: ${mail} met onderwerp <em>"Partnership"</em>.</p>` },
      { heading: "Privacy & AVG-verzoeken", body: `<p>Voor uw AVG-rechten: ${mail} met onderwerp <em>"Privacy"</em>. Reactie binnen 30 dagen.</p>` },
      { heading: "Postadres", body: `<p>Foot Ticket Finder — Klantenservice<br/>Postadres op aanvraag per e-mail.</p>` },
    ],
  },
};

/* ============================================================
   ARABIC
   ============================================================ */
const ar: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "سياسة ملفات تعريف الارتباط",
    intro: "نستخدم الحد الأدنى من ملفات تعريف الارتباط لإبقاء Foot Ticket Finder سريعاً وآمناً ومخصصاً — ونطلب موافقتك قبل أي ملف غير ضروري تماماً.",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "1. ما هو ملف تعريف الارتباط؟", body: `<p>هو ملف نصي صغير يحفظه الموقع على جهازك لتذكر معلومات زيارتك (تسجيل الدخول، اللغة). تشمل السياسة التقنيات المشابهة (local storage، pixels).</p>` },
      { heading: "2. الملفات التي نستخدمها", body: `<ul><li><strong>ضرورية بشكل صارم</strong> — المصادقة، الجلسة، الأمان.</li><li><strong>وظيفية</strong> — اللغة، العملة، السمة، الإعداد الأولي.</li><li><strong>تحليلية</strong> — مقاييس مجمّعة. تُحمّل بعد الموافقة حيث يلزم.</li><li><strong>إسناد الشراكات</strong> — قد يضع الشركاء (Awin، Ticketmaster، Viagogo، الأندية) ملفاً عند النقر على رابط خارجي. لا نتلقى بياناتك المالية.</li></ul>` },
      { heading: "3. ملفات التسويق/الإعلان", body: `<p>لا نبيع مساحات إعلانية ولا نستخدم ملفات إعادة الاستهداف أو التحليل السلوكي.</p>` },
      { heading: "4. إدارة تفضيلاتك", body: `<p>يمكنك حظر/حذف الملفات من المتصفح. حظر الضرورية يؤدي إلى تسجيل الخروج. حيث تكون الموافقة مطلوبة (الاتحاد الأوروبي، UK، سويسرا) يمكنك تعديل تفضيلاتك عبر شريط الكوكيز أو بمراسلة ${mail}.</p>` },
      { heading: "5. مدة الاحتفاظ", body: `<p>ملفات الجلسة تُحذف عند إغلاق المتصفح. الدائمة تدوم 30 يوماً إلى 12 شهراً. ملفات الإسناد 30–90 يوماً.</p>` },
      { heading: "6. التحديثات", body: `<p>قد نحدّث هذه السياسة. التاريخ في الأعلى يعكس النسخة الحالية.</p>` },
      { heading: "7. التواصل", body: `<p>أسئلة عن الكوكيز؟ ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "إفصاح الشراكات بالعمولة",
    intro: "يُموَّل Foot Ticket Finder من قرّائه. بعض الروابط الخارجية روابط شراكة — إليك ما يعنيه ذلك ولماذا لا يؤثر على توصياتنا.",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "1. نقارن ولا نبيع", body: `<p><strong>لا</strong> نبيع التذاكر. كل عملية تتم مباشرة مع مزود رسمي.</p>` },
      { heading: "2. كيف نكسب المال", body: `<ul><li><strong>اشتراكات Premium</strong> — مصدرنا الرئيسي.</li><li><strong>عمولات الشراكة</strong> — يدفعها الشركاء (Awin، Ticketmaster Affiliates، Viagogo Partners) بعد إتمام الشراء.</li></ul><p>السعر الذي تدفعه <strong>ليس أعلى أبداً</strong> عبر رابطنا.</p>` },
      { heading: "3. الاستقلال التحريري", body: `<p>إيرادات الشراكة <strong>لا تؤثر</strong> على توصياتنا. نُولي الأولوية للتوافر وشرعية البائع وحماية المشتري والتقييمات الحقيقية.</p>` },
      { heading: "4. الشركاء", body: `<p>Awin، Impact، Ticketmaster Affiliates، Viagogo Partners، StubHub International، Eventim، Fanatics، متاجر الأندية الرسمية، الضيافة والسفر.</p>` },
      { heading: "5. تحديد روابط الشراكة", body: `<p>هي روابط قياسية. حيث يقتضي القانون تُعنوَن <em>«إعلان»</em> أو <em>«برعاية»</em>.</p>` },
      { heading: "6. الامتثال", body: `<p>متوافق مع FTC (US)، CMA/ASA (UK)، LCEN (FR) وتوجيه الاتحاد الأوروبي. للاستفسار: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "السياسة التحريرية",
    intro: "محتوانا يساعد المشجعين على دخول الملاعب بأمان وبسعر عادل وبأفضل تجربة ممكنة.",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "1. الرسالة", body: `<p>مساعدة المشجعين على إيجاد تذاكر <strong>حقيقية ورسمية وعادلة السعر</strong> حول العالم.</p>` },
      { heading: "2. المصادر والتحقق", body: `<ul><li>البيانات مجمّعة من <strong>المصادر الرسمية</strong> للأندية والدوريات وشركاء منظّمين (Ticketmaster، Eventim، SportMonks).</li><li>معلومات الملاعب مقارنة مع المواقع الرسمية وزيارات ميدانية.</li><li>الأدلة يكتبها بشر وتراجعها هيئة تحرير.</li></ul>` },
      { heading: "3. استخدام الذكاء الاصطناعي", body: `<p>نستخدم الذكاء الاصطناعي للترجمة والتلخيص واكتشاف المكررات. كل ناتج <strong>يراجعه مشرف بشري</strong>. لا تقييمات وهمية مولّدة آلياً.</p>` },
      { heading: "4. التصحيحات", body: `<p>اكتشفت خطأ؟ راسل ${mail} أو استخدم «الإبلاغ عن مشكلة». تصحيحات خلال 48 ساعة.</p>` },
      { heading: "5. محتوى المستخدمين", body: `<p>تقييمات المشجعين تخضع للإشراف ضد السبام والتحرش والكراهية. لا نعدّل المحتوى أبداً.</p>` },
      { heading: "6. الاستقلال", body: `<p>الشركاء التجاريون <strong>لا يؤثرون</strong> على القرارات التحريرية.</p>` },
      { heading: "7. المحتوى المموَّل", body: `<p>أي محتوى مدفوع سيُعنوَن <em>«برعاية»</em>. حتى الآن لا يوجد.</p>` },
      { heading: "8. التواصل", body: `<p>للتصحيحات والشراكات: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "سياسة التذاكر وحماية المشتري",
    intro: "لا نبيع التذاكر — لكننا نريد أن يعرف كل مشجع ما المتوقع وما هو محمي وما يجب تجنّبه.",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "1. خدمة مقارنة لا بيع", body: `<p>كل شراء يتم على موقع <strong>شريك رسمي</strong>. العقد بينك وبين الشريك — لا مع Foot Ticket Finder.</p>` },
      { heading: "2. ما الذي نتحقق منه", body: `<ul><li>التسجيل القانوني والرخصة.</li><li>الالتزام بقوانين الاتحاد الأوروبي / UK / US.</li><li>ضمان حماية المشتري.</li><li>أسعار شفافة.</li></ul>` },
      { heading: "3. تقلبات الأسعار", body: `<p>تتحرك أسعار السوق الثانوي لحظياً. تحقق دائماً من السعر النهائي على موقع البائع قبل الدفع.</p>` },
      { heading: "4. ما يجب تجنّبه", body: `<ul><li><strong>لا تشترِ عبر وسائل التواصل</strong> (Telegram، Instagram، «راسلني خاص»).</li><li>لا تحويلات بنكية ولا بطاقات هدايا ولا عملات رقمية لشراء التذاكر.</li><li>انتبه للاسم على التذكرة — كثير من الأندية الكبرى تتحقق من الهوية.</li></ul>` },
      { heading: "5. المباريات الملغاة/المؤجلة", body: `<p>الاسترداد يديره الشريك الأصلي. نُحدّث صفحة المباراة خلال 24 ساعة.</p>` },
      { heading: "6. الإبلاغ عن مشكلة", body: `<p>اتصل أولاً بدعم الشريك ثم أرسل لنا الحالة على ${mail}.</p>` },
      { heading: "7. إعادة البيع والقانون المحلي", body: `<p>إعادة البيع منظّمة بشكل مختلف حسب الدولة. في فرنسا إعادة البيع دون تصريح جريمة.</p>` },
      { heading: "8. التواصل", body: `<p>أسئلة: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "اتصل بنا",
    intro: "سواء لاحظت خطأً، أو أردت الشراكة، أو احتجت مساعدة في تذكرة — نقرأ كل رسالة.",
    lastUpdatedLabel: "مُحدَّث",
    sections: [
      { heading: "الدعم", body: `<p>الحساب، Premium، التنبيهات: ${mail}. الرد خلال 24 ساعة في أيام العمل بالإنجليزية/الفرنسية، 48 ساعة باللغات الأخرى.</p>` },
      { heading: "الإعلام والتحرير", body: `<p>المقابلات والاقتباسات: ${mail} مع عنوان <em>«الإعلام»</em>.</p>` },
      { heading: "الشراكات", body: `<p>الأندية، الاتحادات، التذاكر، الضيافة، الشركاء: ${mail} مع عنوان <em>«شراكة»</em>.</p>` },
      { heading: "الخصوصية وطلبات GDPR", body: `<p>لممارسة حقوق GDPR: ${mail} مع عنوان <em>«خصوصية»</em>. الرد خلال 30 يوماً.</p>` },
      { heading: "العنوان البريدي", body: `<p>Foot Ticket Finder — خدمة العملاء<br/>العنوان البريدي متاح عند الطلب عبر البريد الإلكتروني.</p>` },
    ],
  },
};

/* ============================================================
   RUSSIAN
   ============================================================ */
const ru: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Политика cookie",
    intro: "Мы используем минимум cookie, чтобы Foot Ticket Finder был быстрым, безопасным и персонализированным — и спрашиваем согласие перед установкой любого необязательного файла.",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "1. Что такое cookie?", body: `<p>Cookie — это небольшой текстовый файл, который сайт сохраняет на вашем устройстве, чтобы запоминать данные о визите (вход, язык). Аналогичные технологии (local storage, pixels) также покрываются этой политикой.</p>` },
      { heading: "2. Используемые cookie", body: `<ul><li><strong>Строго необходимые</strong> — аутентификация, сессия, безопасность.</li><li><strong>Функциональные</strong> — язык, валюта, тема, онбординг.</li><li><strong>Аналитические</strong> — агрегированные метрики. Только после согласия там, где это требуется.</li><li><strong>Партнёрская атрибуция</strong> — партнёры (Awin, Ticketmaster, Viagogo, клубы) могут установить cookie при клике по внешней ссылке. Мы не получаем ваши платёжные данные.</li></ul>` },
      { heading: "3. Маркетинговые cookie", body: `<p>Мы не продаём рекламные места и не используем cookie ретаргетинга или поведенческого профилирования.</p>` },
      { heading: "4. Управление настройками", body: `<p>Вы можете блокировать/удалять cookie в браузере. Блокировка обязательных приведёт к выходу из аккаунта. Где требуется согласие (ЕС, UK, Швейцария), вы можете изменить настройки через баннер или написав на ${mail}.</p>` },
      { heading: "5. Сроки хранения", body: `<p>Сессионные cookie удаляются при закрытии браузера. Постоянные живут 30 дней–12 месяцев. Партнёрские 30–90 дней.</p>` },
      { heading: "6. Обновления", body: `<p>Мы можем обновлять политику. Дата вверху отражает текущую версию.</p>` },
      { heading: "7. Контакты", body: `<p>Вопросы по cookie? ${mail}.</p>` },
    ],
  },
  affiliate: {
    title: "Партнёрское раскрытие",
    intro: "Foot Ticket Finder финансируется читателями. Некоторые внешние ссылки — партнёрские. Вот что это значит и почему это не влияет на наши рекомендации.",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "1. Мы сравниваем, не продаём", body: `<p>Мы <strong>не</strong> продаём билеты. Каждая транзакция — напрямую с официальным поставщиком.</p>` },
      { heading: "2. Как мы зарабатываем", body: `<ul><li><strong>Премиум-подписки</strong> — основной источник дохода.</li><li><strong>Партнёрские комиссии</strong> — выплачиваются партнёрами (Awin, Ticketmaster Affiliates, Viagogo Partners) после совершённой покупки.</li></ul><p>Цена, которую вы платите, <strong>никогда не выше</strong> при переходе по нашей ссылке.</p>` },
      { heading: "3. Редакционная независимость", body: `<p>Партнёрский доход <strong>не влияет</strong> на наши рекомендации. Приоритет — доступность, легитимность продавца, защита покупателя и реальные отзывы.</p>` },
      { heading: "4. Партнёры", body: `<p>Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, официальные клубные магазины, hospitality и тревел.</p>` },
      { heading: "5. Идентификация партнёрских ссылок", body: `<p>Это обычные ссылки. Где требует закон — они помечены как <em>«спонсорство»</em> или <em>«реклама»</em>.</p>` },
      { heading: "6. Соответствие", body: `<p>Соответствует FTC (US), CMA/ASA (UK), LCEN (FR) и Директиве ЕС о недобросовестных практиках. Вопросы: ${mail}.</p>` },
    ],
  },
  editorial: {
    title: "Редакционная политика",
    intro: "Наш контент помогает фанатам безопасно и по справедливой цене попасть на стадион с лучшим опытом.",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "1. Миссия", body: `<p>Помогать фанатам находить <strong>настоящие, официальные, по справедливой цене</strong> билеты по всему миру.</p>` },
      { heading: "2. Источники и проверка", body: `<ul><li>Данные агрегируются из <strong>официальных источников</strong> клубов и лиг и регулируемых партнёров (Ticketmaster, Eventim, SportMonks).</li><li>Информация о стадионах сверяется с официальными сайтами и визитами на место.</li><li>Гайды пишут люди и проверяет редактор.</li></ul>` },
      { heading: "3. Использование ИИ", body: `<p>ИИ помогает переводить, резюмировать и находить дубликаты. Каждый вывод <strong>проверяется человеком-модератором</strong>. Никаких фейковых отзывов от ИИ.</p>` },
      { heading: "4. Исправления", body: `<p>Заметили ошибку? Напишите на ${mail} или используйте «Сообщить о проблеме». Исправления в течение 48 часов.</p>` },
      { heading: "5. Пользовательский контент", body: `<p>Отзывы модерируются от спама, харассмента, доксинга и ненависти. Содержание не редактируется.</p>` },
      { heading: "6. Независимость", body: `<p>Коммерческие партнёры <strong>не влияют</strong> на редакционные решения.</p>` },
      { heading: "7. Спонсорский контент", body: `<p>Любая платная публикация была бы помечена <em>«Спонсор»</em>. На сегодня — нет.</p>` },
      { heading: "8. Контакты", body: `<p>Исправления и партнёрства: ${mail}.</p>` },
    ],
  },
  ticketPolicy: {
    title: "Политика билетов и защиты покупателя",
    intro: "Мы не продаём билеты — но хотим, чтобы каждый фанат знал, чего ожидать, что защищено и чего избегать.",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "1. Сервис сравнения, не продавец", body: `<p>Каждая покупка завершается на сайте <strong>официального партнёра</strong>. Договор — с партнёром, а не с Foot Ticket Finder.</p>` },
      { heading: "2. Что мы проверяем", body: `<ul><li>Юридическая регистрация и лицензия.</li><li>Соответствие ЕС / UK / US.</li><li>Гарантия защиты покупателя.</li><li>Прозрачные цены.</li></ul>` },
      { heading: "3. Изменения цен", body: `<p>На вторичном рынке цены меняются в реальном времени. Всегда проверяйте итоговую цену на сайте продавца перед оплатой.</p>` },
      { heading: "4. Чего избегать", body: `<ul><li><strong>Никогда не покупайте в соцсетях</strong> (Telegram, Instagram, «напиши в ЛС»).</li><li>Никаких банковских переводов, подарочных карт или крипты за билеты.</li><li>Следите за именем на билете — многие клубы проверяют документы.</li></ul>` },
      { heading: "5. Отменённые/перенесённые матчи", body: `<p>Возврат осуществляет исходный партнёр. Мы обновляем страницу матча в течение 24 часов.</p>` },
      { heading: "6. Сообщить о проблеме", body: `<p>Сначала свяжитесь с поддержкой партнёра, затем пришлите кейс на ${mail}.</p>` },
      { heading: "7. Перепродажа и местное право", body: `<p>Перепродажа регулируется по-разному в разных странах. Во Франции перепродажа без разрешения — уголовное преступление.</p>` },
      { heading: "8. Контакты", body: `<p>Вопросы: ${mail}.</p>` },
    ],
  },
  contact: {
    title: "Связаться с нами",
    intro: "Заметили ошибку, хотите стать партнёром или нужна помощь с билетом — мы читаем каждое сообщение.",
    lastUpdatedLabel: "Обновлено",
    sections: [
      { heading: "Поддержка", body: `<p>Аккаунт, Premium, уведомления: ${mail}. Ответ в течение 24 ч в рабочие дни на английском/французском, 48 ч на других языках.</p>` },
      { heading: "Пресса и редакция", body: `<p>Интервью и цитаты: ${mail} с темой <em>«Пресса»</em>.</p>` },
      { heading: "Партнёрства", body: `<p>Клубы, федерации, тикетинг, hospitality, аффилиаты: ${mail} с темой <em>«Партнёрство»</em>.</p>` },
      { heading: "Приватность и GDPR-запросы", body: `<p>Для GDPR-прав: ${mail} с темой <em>«Приватность»</em>. Ответ в течение 30 дней.</p>` },
      { heading: "Почтовый адрес", body: `<p>Foot Ticket Finder — Клиентская поддержка<br/>Почтовый адрес по запросу через email.</p>` },
    ],
  },
};

/** Per-locale completeness map: which doc keys have a dedicated translation (true) vs fall back to English (false). */
export const TRUST_TRANSLATION_COVERAGE: Record<Locale, Record<TrustDocKey, boolean>> = {
  en: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  fr: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  es: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  de: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  it: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  pt: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  nl: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  ar: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
  ru: { cookies: true, affiliate: true, editorial: true, ticketPolicy: true, contact: true },
};

export const trustContent: Record<Locale, Record<TrustDocKey, TrustDocument>> = {
  en, fr, es, de, it, pt, nl, ar, ru,
};

export const getTrustDoc = (locale: Locale, key: TrustDocKey): TrustDocument =>
  (trustContent[locale] ?? trustContent.en)[key] ?? trustContent.en[key];
