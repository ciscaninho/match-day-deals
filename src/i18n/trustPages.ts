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
   ENGLISH (canonical) — used as fallback for all other locales
   ============================================================ */
const en: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Cookie Policy",
    intro:
      "We use a minimal set of cookies to keep Foot Ticket Finder fast, secure, and personalised — and we ask before setting anything that isn't strictly necessary.",
    lastUpdatedLabel: "Last updated",
    sections: [
      {
        heading: "1. What is a cookie?",
        body: `<p>A cookie is a small text file that a website stores on your device to remember information about your visit — for example, that you are signed in, or which language you prefer. Similar technologies (local storage, session storage, pixel tags) are covered by this policy as well.</p>`,
      },
      {
        heading: "2. Cookies we use",
        body: `<ul>
          <li><strong>Strictly necessary</strong> — authentication, session persistence, security, load-balancing. The Service cannot function without these.</li>
          <li><strong>Functional</strong> — saving your language, currency, theme and onboarding state so you don't have to re-enter them.</li>
          <li><strong>Analytics</strong> — aggregated, privacy-respecting metrics about which pages and matches are popular. Loaded only after consent in regions where consent is required.</li>
          <li><strong>Affiliate attribution</strong> — when you click an outbound ticket link, our partners (e.g. Awin, Ticketmaster, Viagogo, official clubs) may set a cookie that lets them attribute a sale to us. We never receive your payment data.</li>
        </ul>`,
      },
      {
        heading: "3. Marketing & advertising cookies",
        body: `<p>We do not sell ad inventory and we do not set third-party advertising cookies for retargeting or behavioural profiling. The only third-party cookies that may load are the affiliate attribution cookies described above, and only after you click an outbound link.</p>`,
      },
      {
        heading: "4. Managing your preferences",
        body: `<p>Most browsers let you block or delete cookies via their settings. You can also clear our cookies at any time from your browser. Blocking strictly necessary cookies will sign you out and break login. Where consent is required (UK, EEA, Switzerland), you can accept, reject or change your preferences at any time using the cookie banner or by contacting ${mail}.</p>`,
      },
      {
        heading: "5. Retention",
        body: `<p>Session cookies are deleted when you close the browser. Persistent cookies typically last between 30 days and 12 months. Affiliate attribution cookies follow the duration set by each partner network and are usually deleted after 30–90 days.</p>`,
      },
      {
        heading: "6. Updates",
        body: `<p>We may update this Cookie Policy as our partners or the law change. The "Last updated" date at the top reflects the most recent version. Material changes will be communicated in-app.</p>`,
      },
      {
        heading: "7. Contact",
        body: `<p>Questions about cookies or your data? Reach us at ${mail}.</p>`,
      },
    ],
  },
  affiliate: {
    title: "Affiliate Disclosure",
    intro:
      "Foot Ticket Finder is reader-supported. Some of the outbound links on our website are affiliate links — we want you to know exactly what that means and why it doesn't change what we recommend.",
    lastUpdatedLabel: "Last updated",
    sections: [
      {
        heading: "1. We compare, we don't sell",
        body: `<p>Foot Ticket Finder is an independent comparison and discovery service. We do <strong>not</strong> sell match tickets ourselves. Every transaction happens directly between you and an official ticketing provider — for example a club's own box office, an authorised partner, or a regulated marketplace.</p>`,
      },
      {
        heading: "2. How we make money",
        body: `<ul>
          <li><strong>Premium subscriptions</strong> — fans who want advanced alerts, hidden insights, and ad-free browsing pay a small monthly or yearly fee. This is our main source of revenue.</li>
          <li><strong>Affiliate commissions</strong> — when you click certain "Buy ticket" or "Compare prices" buttons and complete a purchase on a partner site, we may receive a small commission from that partner network (such as Awin, Ticketmaster Affiliates, Viagogo Partners, or direct club programmes).</li>
        </ul>
        <p>The price you pay is <strong>never higher</strong> because you came through our link.</p>`,
      },
      {
        heading: "3. Editorial independence",
        body: `<p>Affiliate revenue does <strong>not</strong> influence what we recommend. Our ranking algorithm prioritises:</p>
        <ul>
          <li>availability and price for the section you want;</li>
          <li>seller legitimacy (official, authorised, or regulated marketplaces only);</li>
          <li>delivery method and refund/exchange protection;</li>
          <li>real fan reviews of the experience.</li>
        </ul>
        <p>We never accept payment in exchange for placement, fake reviews, or hiding negative information.</p>`,
      },
      {
        heading: "4. Partners we may work with",
        body: `<p>We may participate in affiliate programmes with networks and merchants including (non-exhaustive list): Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, club official stores, hospitality providers and travel partners. Each partner is vetted for compliance with consumer-protection rules in the user's region.</p>`,
      },
      {
        heading: "5. Identifying affiliate links",
        body: `<p>Outbound links that may earn us a commission are technically standard links — they don't redirect through extra trackers. Where required by local law, sponsored sections and affiliate links are clearly labelled as <em>"sponsored"</em> or <em>"ad"</em>.</p>`,
      },
      {
        heading: "6. Compliance",
        body: `<p>This disclosure is provided in line with the FTC Endorsement Guides (US), the CMA / ASA guidelines (UK), the Loi pour la Confiance dans l'Économie Numérique (France) and the Unfair Commercial Practices Directive (EU). Any questions or compliance enquiries can be sent to ${mail}.</p>`,
      },
    ],
  },
  editorial: {
    title: "Editorial Policy",
    intro:
      "Our content exists to help football fans get into stadiums safely, at a fair price, with the best possible experience. Here is exactly how we research, write and review what you read on Foot Ticket Finder.",
    lastUpdatedLabel: "Last updated",
    sections: [
      {
        heading: "1. Mission",
        body: `<p>We help fans find <strong>real, official, fairly-priced</strong> tickets to football matches anywhere in the world — and to get the most out of the matchday around them. Everything we publish must serve that mission first.</p>`,
      },
      {
        heading: "2. Sources & verification",
        body: `<ul>
          <li>Match data and ticket release dates are aggregated from <strong>official club and league sources</strong>, regulated ticketing partners (Ticketmaster, Eventim, See Tickets, regulated resale marketplaces), and major sports data providers (SportMonks, football-data.org).</li>
          <li>Stadium information (capacity, sections, accessibility, opening year) is cross-checked against the club's own site, official media kits and on-site visits.</li>
          <li>Editorial guides are written by humans, reviewed by an editor, and updated when seasons, prices or club policies change.</li>
        </ul>`,
      },
      {
        heading: "3. Use of AI",
        body: `<p>We use AI tools to translate content into nine languages, to summarise long club ticketing policies, to detect duplicate stadium entries, and to suggest matchday tips. Every AI-assisted output is <strong>reviewed by a human moderator</strong> before publishing. We never publish AI-generated reviews of stadiums or clubs as if they were written by a real fan.</p>`,
      },
      {
        heading: "4. Corrections & updates",
        body: `<p>If we get something wrong — wrong release date, outdated price, broken outbound link — we want to know. Email ${mail} or use the "Report an issue" button on any page. Confirmed corrections are applied within 48 hours and the affected page's "Last updated" timestamp is refreshed.</p>`,
      },
      {
        heading: "5. User-generated content",
        body: `<p>Fan reviews and matchday tips are written by signed-in users. We moderate for spam, harassment, illegal resale offers, doxxing and hate speech. We never edit a user review's substance — we only remove content that violates our community guidelines.</p>`,
      },
      {
        heading: "6. Independence",
        body: `<p>Editorial decisions (which clubs and stadiums to cover, how to rank ticket providers, which content to feature on the homepage) are taken by the editorial team only. Commercial partners, advertisers and affiliate networks have <strong>no influence</strong> on those decisions and never see content before it is published.</p>`,
      },
      {
        heading: "7. Sponsored content",
        body: `<p>If we ever publish a paid placement (sponsored guide, paid stadium spotlight, branded matchday giveaway), it will be clearly labelled <em>"Sponsored"</em> at the top of the page. To date we have not published any sponsored content.</p>`,
      },
      {
        heading: "8. Contact",
        body: `<p>Editorial enquiries, corrections, partnership proposals: ${mail}.</p>`,
      },
    ],
  },
  ticketPolicy: {
    title: "Ticket & Buyer Protection Policy",
    intro:
      "We don't sell match tickets — but we want every fan who clicks an outbound link from Foot Ticket Finder to know exactly what to expect, what's protected, and what to avoid.",
    lastUpdatedLabel: "Last updated",
    sections: [
      {
        heading: "1. We are a comparison service, not a ticket seller",
        body: `<p>All ticket purchases are completed on the website of an <strong>official ticketing partner</strong>: a club's own box office, an authorised distributor (Ticketmaster, Eventim, See Tickets, club partners) or a regulated resale marketplace (Viagogo, StubHub International, Twickets). The buyer's contract is with that partner — not with Foot Ticket Finder.</p>`,
      },
      {
        heading: "2. What we verify before listing a provider",
        body: `<ul>
          <li>Legal registration and operating licence in the relevant jurisdiction.</li>
          <li>Compliance with EU consumer-protection rules (Unfair Commercial Practices Directive, Digital Services Act) and equivalent in the UK / US.</li>
          <li>Buyer-protection guarantee: refund or replacement ticket if the event is cancelled or the ticket is not delivered.</li>
          <li>Transparent pricing — fees are visible before checkout.</li>
        </ul>`,
      },
      {
        heading: "3. Price changes & availability",
        body: `<p>Football ticket prices on resale markets move in real time. The price displayed on Foot Ticket Finder is fetched from each provider on a regular interval and may change before you reach checkout, especially during high-demand windows. Always re-check the final price on the provider's site before paying.</p>`,
      },
      {
        heading: "4. What to avoid",
        body: `<ul>
          <li><strong>Do not buy from social-media sellers</strong> ("DM me for tickets", Telegram resellers, Instagram stories). These are unregulated and most are scams.</li>
          <li>Do not transfer money via wire transfer, gift cards or cryptocurrency for tickets.</li>
          <li>Do not buy paper tickets without a verifiable secondary delivery proof.</li>
          <li>Be careful with names on tickets: many big clubs (FC Barcelona, Bayern Munich, English Premier League grounds) check ID at the turnstile.</li>
        </ul>`,
      },
      {
        heading: "5. Cancelled or postponed matches",
        body: `<p>If a match is postponed or cancelled, refund and rebooking are handled by the original ticketing partner, not by Foot Ticket Finder. We will update the match page within 24 hours of an official announcement and link to the partner's refund procedure.</p>`,
      },
      {
        heading: "6. Reporting a problem",
        body: `<p>If you bought through a link from our site and have a problem — non-delivery, fake ticket, refused entry — first contact the ticketing partner's customer service. Then send us a copy of your case at ${mail} so we can review the partner's compliance and, if necessary, remove them from our index.</p>`,
      },
      {
        heading: "7. Resale & local law",
        body: `<p>Reselling football tickets is regulated differently around the world. In some countries (e.g. France for many official events), reselling tickets without authorisation is a criminal offence. Always check local rules before reselling tickets you bought.</p>`,
      },
      {
        heading: "8. Contact",
        body: `<p>Questions about a ticket, partner or buyer protection: ${mail}.</p>`,
      },
    ],
  },
  contact: {
    title: "Contact us",
    intro:
      "Whether you spotted a mistake, want to partner with us, or just need help finding a ticket — we read every message.",
    lastUpdatedLabel: "Updated",
    sections: [
      {
        heading: "Support",
        body: `<p>For help with your account, Premium subscription, ticket alerts or anything else fan-side, the fastest channel is email: ${mail}. We reply within 24 hours on business days, in English or French. Other languages are answered within 48 hours.</p>`,
      },
      {
        heading: "Press & editorial",
        body: `<p>For interviews, quotes, embargoes and access to our editorial team, contact ${mail} with the subject line <em>"Press"</em>. We can usually respond within one business day.</p>`,
      },
      {
        heading: "Partnerships",
        body: `<p>Clubs, federations, ticketing partners, hospitality providers and affiliate networks can reach us at ${mail} with the subject line <em>"Partnership"</em>. Please include your company name, the country you operate in, and the proposal in your first message.</p>`,
      },
      {
        heading: "Privacy & data requests",
        body: `<p>To exercise your GDPR rights (access, rectification, erasure, portability, objection), email ${mail} with the subject line <em>"Privacy request"</em>. We respond within 30 days as required by law.</p>`,
      },
      {
        heading: "Postal address",
        body: `<p>Foot Ticket Finder — c/o Customer Support<br/>Postal address available on request via email.</p>`,
      },
    ],
  },
};

/* ============================================================
   FRENCH translations (full)
   ============================================================ */
const fr: Record<TrustDocKey, TrustDocument> = {
  cookies: {
    title: "Politique des cookies",
    intro:
      "Nous utilisons un nombre minimal de cookies pour rendre Foot Ticket Finder rapide, sûr et personnalisé — et nous demandons votre consentement avant tout cookie non strictement nécessaire.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      {
        heading: "1. Qu'est-ce qu'un cookie ?",
        body: `<p>Un cookie est un petit fichier texte qu'un site enregistre sur votre appareil pour mémoriser des informations sur votre visite — par exemple votre connexion ou votre langue. Les technologies similaires (local storage, session storage, pixels) sont également couvertes par la présente politique.</p>`,
      },
      {
        heading: "2. Cookies que nous utilisons",
        body: `<ul>
          <li><strong>Strictement nécessaires</strong> — authentification, session, sécurité, équilibrage de charge. Le Service ne peut pas fonctionner sans.</li>
          <li><strong>Fonctionnels</strong> — mémorisation de la langue, de la devise, du thème et de l'état d'onboarding.</li>
          <li><strong>Analytiques</strong> — mesures agrégées et respectueuses de la vie privée. Chargés uniquement après consentement dans les zones où il est requis.</li>
          <li><strong>Attribution affiliée</strong> — lorsque vous cliquez sur un lien sortant vers une billetterie, nos partenaires (Awin, Ticketmaster, Viagogo, clubs officiels…) peuvent déposer un cookie permettant de nous attribuer la vente. Nous ne recevons jamais vos données de paiement.</li>
        </ul>`,
      },
      {
        heading: "3. Cookies marketing & publicité",
        body: `<p>Nous ne vendons pas d'espace publicitaire et nous ne déposons pas de cookies tiers de retargeting ou de profilage comportemental. Les seuls cookies tiers susceptibles d'être chargés sont les cookies d'attribution affiliée décrits ci-dessus, et uniquement lorsque vous cliquez sur un lien sortant.</p>`,
      },
      {
        heading: "4. Gérer vos préférences",
        body: `<p>La plupart des navigateurs permettent de bloquer ou supprimer les cookies dans leurs paramètres. Vous pouvez aussi effacer nos cookies à tout moment depuis votre navigateur. Bloquer les cookies strictement nécessaires entraîne la déconnexion. Dans les zones où le consentement est requis (UK, EEE, Suisse), vous pouvez accepter, refuser ou modifier vos préférences à tout moment via la bannière cookies ou en écrivant à ${mail}.</p>`,
      },
      {
        heading: "5. Durée de conservation",
        body: `<p>Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants durent typiquement entre 30 jours et 12 mois. Les cookies d'attribution affiliée suivent la durée fixée par chaque réseau partenaire, généralement 30 à 90 jours.</p>`,
      },
      {
        heading: "6. Mises à jour",
        body: `<p>Nous pouvons mettre à jour cette politique en cas d'évolution de nos partenaires ou de la loi. La date « Dernière mise à jour » reflète la version la plus récente. Tout changement majeur sera communiqué dans l'application.</p>`,
      },
      {
        heading: "7. Contact",
        body: `<p>Questions sur les cookies ou vos données ? Écrivez-nous à ${mail}.</p>`,
      },
    ],
  },
  affiliate: {
    title: "Divulgation affiliée",
    intro:
      "Foot Ticket Finder est financé par ses lecteurs. Certains liens sortants de notre site sont des liens affiliés — voici exactement ce que cela signifie et pourquoi cela n'influence pas nos recommandations.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      {
        heading: "1. Nous comparons, nous ne vendons pas",
        body: `<p>Foot Ticket Finder est un service indépendant de comparaison et de découverte. Nous <strong>ne vendons pas</strong> de billets de match. Chaque transaction se fait directement entre vous et un revendeur officiel — billetterie du club, partenaire autorisé ou marketplace régulée.</p>`,
      },
      {
        heading: "2. Comment nous gagnons de l'argent",
        body: `<ul>
          <li><strong>Abonnements Premium</strong> — les fans qui veulent des alertes avancées, des analyses cachées et une navigation sans pub paient un petit montant mensuel ou annuel. C'est notre source principale de revenus.</li>
          <li><strong>Commissions affiliées</strong> — lorsque vous cliquez sur certains boutons « Acheter le billet » ou « Comparer les prix » et finalisez un achat chez un partenaire, nous pouvons recevoir une petite commission via un réseau (Awin, Ticketmaster Affiliates, Viagogo Partners, programmes directs des clubs).</li>
        </ul>
        <p>Le prix payé n'est <strong>jamais plus élevé</strong> parce que vous êtes passé par notre lien.</p>`,
      },
      {
        heading: "3. Indépendance éditoriale",
        body: `<p>Les revenus affiliés <strong>n'influencent pas</strong> nos recommandations. Notre algorithme de classement priorise :</p>
        <ul>
          <li>la disponibilité et le prix pour la zone que vous voulez ;</li>
          <li>la légitimité du vendeur (officiel, autorisé ou marketplace régulée uniquement) ;</li>
          <li>le mode de livraison et les protections d'échange/remboursement ;</li>
          <li>les vrais avis de fans sur l'expérience.</li>
        </ul>
        <p>Nous n'acceptons jamais de paiement en échange d'un placement, de faux avis ou de la dissimulation d'informations négatives.</p>`,
      },
      {
        heading: "4. Partenaires avec lesquels nous pouvons travailler",
        body: `<p>Nous participons potentiellement aux programmes affiliés de réseaux et marchands incluant (liste non exhaustive) : Awin, Impact, Ticketmaster Affiliates, Viagogo Partners, StubHub International, Eventim, Fanatics, boutiques officielles de clubs, prestataires d'hospitalité et partenaires voyage. Chaque partenaire est audité pour sa conformité aux règles de protection des consommateurs dans la zone de l'utilisateur.</p>`,
      },
      {
        heading: "5. Identifier les liens affiliés",
        body: `<p>Les liens sortants susceptibles de générer une commission sont des liens standards — ils ne redirigent pas via des trackers supplémentaires. Là où la loi locale l'exige, les sections sponsorisées et les liens affiliés sont clairement étiquetés <em>« sponsorisé »</em> ou <em>« publicité »</em>.</p>`,
      },
      {
        heading: "6. Conformité",
        body: `<p>Cette divulgation est conforme aux FTC Endorsement Guides (US), aux directives CMA / ASA (UK), à la Loi pour la Confiance dans l'Économie Numérique (France) et à la directive sur les pratiques commerciales déloyales (UE). Toute question ou demande de conformité peut être envoyée à ${mail}.</p>`,
      },
    ],
  },
  editorial: {
    title: "Politique éditoriale",
    intro:
      "Nos contenus existent pour aider les fans à entrer dans les stades en toute sécurité, à un prix juste, avec la meilleure expérience possible. Voici exactement comment nous recherchons, écrivons et vérifions ce que vous lisez.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      {
        heading: "1. Mission",
        body: `<p>Nous aidons les fans à trouver des billets <strong>réels, officiels et à un prix juste</strong> pour des matchs de football partout dans le monde — et à profiter au maximum du matchday autour. Tout ce que nous publions doit servir cette mission en priorité.</p>`,
      },
      {
        heading: "2. Sources & vérification",
        body: `<ul>
          <li>Les données de match et les dates de mise en vente sont agrégées depuis les <strong>sources officielles des clubs et des ligues</strong>, des partenaires régulés (Ticketmaster, Eventim, See Tickets, marketplaces régulées) et des fournisseurs de données sportives majeurs (SportMonks, football-data.org).</li>
          <li>Les informations sur les stades (capacité, tribunes, accessibilité, année d'ouverture) sont recoupées avec le site officiel du club, les kits média et des visites sur place.</li>
          <li>Les guides éditoriaux sont écrits par des humains, relus par un éditeur et mis à jour quand les saisons, prix ou politiques de club changent.</li>
        </ul>`,
      },
      {
        heading: "3. Utilisation de l'IA",
        body: `<p>Nous utilisons l'IA pour traduire les contenus dans neuf langues, résumer les politiques de billetterie longues, détecter les doublons de stades et suggérer des conseils matchday. Toute sortie assistée par IA est <strong>relue par un modérateur humain</strong> avant publication. Nous ne publions jamais d'avis de stade ou de club générés par IA en les présentant comme rédigés par un fan réel.</p>`,
      },
      {
        heading: "4. Corrections & mises à jour",
        body: `<p>Si nous nous trompons — mauvaise date de mise en vente, prix obsolète, lien sortant cassé — nous voulons le savoir. Écrivez à ${mail} ou utilisez le bouton « Signaler un problème » sur n'importe quelle page. Les corrections confirmées sont appliquées sous 48 heures et la date « Dernière mise à jour » de la page concernée est rafraîchie.</p>`,
      },
      {
        heading: "5. Contenu généré par les utilisateurs",
        body: `<p>Les avis de fans et conseils matchday sont écrits par des utilisateurs connectés. Nous modérons le spam, le harcèlement, les offres de revente illégales, le doxxing et la haine. Nous ne modifions jamais le fond d'un avis utilisateur — nous retirons uniquement les contenus qui violent nos règles de communauté.</p>`,
      },
      {
        heading: "6. Indépendance",
        body: `<p>Les décisions éditoriales (clubs et stades à couvrir, classement des revendeurs, contenus mis en avant en page d'accueil) sont prises par l'équipe éditoriale uniquement. Les partenaires commerciaux, annonceurs et réseaux affiliés n'ont <strong>aucune influence</strong> sur ces décisions et ne voient jamais les contenus avant publication.</p>`,
      },
      {
        heading: "7. Contenu sponsorisé",
        body: `<p>Si nous publions un jour un placement payant (guide sponsorisé, mise en avant payante d'un stade, jeu-concours sponsorisé), il sera clairement étiqueté <em>« Sponsorisé »</em> en haut de page. À ce jour, nous n'avons publié aucun contenu sponsorisé.</p>`,
      },
      {
        heading: "8. Contact",
        body: `<p>Questions éditoriales, corrections, propositions de partenariat : ${mail}.</p>`,
      },
    ],
  },
  ticketPolicy: {
    title: "Politique billetterie & protection acheteur",
    intro:
      "Nous ne vendons pas de billets — mais nous voulons que chaque fan qui clique sur un lien sortant depuis Foot Ticket Finder sache exactement à quoi s'attendre, ce qui est protégé, et ce qu'il faut éviter.",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      {
        heading: "1. Nous sommes un comparateur, pas un vendeur",
        body: `<p>Tous les achats de billets sont finalisés sur le site d'un <strong>partenaire officiel</strong> : billetterie du club, distributeur autorisé (Ticketmaster, Eventim, See Tickets, partenaires de club) ou marketplace régulée (Viagogo, StubHub International, Twickets). Le contrat d'achat est conclu avec ce partenaire — pas avec Foot Ticket Finder.</p>`,
      },
      {
        heading: "2. Ce que nous vérifions avant d'intégrer un revendeur",
        body: `<ul>
          <li>Enregistrement légal et licence d'exploitation dans la juridiction concernée.</li>
          <li>Conformité aux règles européennes de protection des consommateurs (directive sur les pratiques commerciales déloyales, Digital Services Act) et équivalents UK / US.</li>
          <li>Garantie de protection acheteur : remboursement ou billet de remplacement si l'événement est annulé ou si le billet n'est pas livré.</li>
          <li>Tarification transparente — les frais sont visibles avant le paiement.</li>
        </ul>`,
      },
      {
        heading: "3. Variations de prix & disponibilité",
        body: `<p>Sur les marchés secondaires, les prix des billets de foot bougent en temps réel. Le prix affiché sur Foot Ticket Finder est récupéré régulièrement chez chaque revendeur et peut changer avant le checkout, surtout en période de forte demande. Vérifiez toujours le prix final sur le site du revendeur avant de payer.</p>`,
      },
      {
        heading: "4. Ce qu'il faut éviter",
        body: `<ul>
          <li><strong>N'achetez jamais à un vendeur sur les réseaux sociaux</strong> (« DM moi pour des places », revendeurs Telegram, stories Instagram). Ce circuit n'est pas régulé et la majorité sont des arnaques.</li>
          <li>Ne transférez jamais d'argent par virement bancaire, carte cadeau ou cryptomonnaie pour des billets.</li>
          <li>N'achetez pas de billets papier sans preuve secondaire de livraison vérifiable.</li>
          <li>Attention aux noms inscrits : beaucoup de gros clubs (FC Barcelone, Bayern Munich, stades de Premier League) vérifient l'identité aux portiques.</li>
        </ul>`,
      },
      {
        heading: "5. Matchs annulés ou reportés",
        body: `<p>Si un match est reporté ou annulé, le remboursement et la réservation alternative sont gérés par le revendeur d'origine, pas par Foot Ticket Finder. Nous mettrons à jour la fiche du match sous 24 heures après l'annonce officielle et lierons vers la procédure de remboursement du partenaire.</p>`,
      },
      {
        heading: "6. Signaler un problème",
        body: `<p>Si vous avez acheté via un lien depuis notre site et que vous rencontrez un problème — non-livraison, faux billet, refus à l'entrée — contactez d'abord le service client du revendeur. Puis envoyez-nous votre dossier à ${mail} pour que nous puissions auditer la conformité du partenaire et, si nécessaire, le retirer de notre index.</p>`,
      },
      {
        heading: "7. Revente & droit local",
        body: `<p>La revente de billets de foot est régulée différemment selon les pays. Dans certains (par ex. la France pour de nombreux événements officiels), revendre des billets sans autorisation est un délit. Vérifiez toujours la réglementation locale avant de revendre vos billets.</p>`,
      },
      {
        heading: "8. Contact",
        body: `<p>Questions sur un billet, un partenaire ou la protection acheteur : ${mail}.</p>`,
      },
    ],
  },
  contact: {
    title: "Nous contacter",
    intro:
      "Que vous ayez repéré une erreur, vouliez devenir partenaire, ou ayez juste besoin d'aide pour trouver un billet — nous lisons chaque message.",
    lastUpdatedLabel: "Mis à jour",
    sections: [
      {
        heading: "Support",
        body: `<p>Pour toute aide concernant votre compte, votre abonnement Premium, vos alertes ou autre, le canal le plus rapide est l'email : ${mail}. Nous répondons sous 24 heures les jours ouvrés, en français ou en anglais. Les autres langues sont traitées sous 48 heures.</p>`,
      },
      {
        heading: "Presse & éditorial",
        body: `<p>Pour les interviews, citations, embargos et accès à notre équipe éditoriale, contactez ${mail} avec l'objet <em>« Presse »</em>. Réponse généralement sous un jour ouvré.</p>`,
      },
      {
        heading: "Partenariats",
        body: `<p>Clubs, fédérations, partenaires billetterie, prestataires hospitalité et réseaux affiliés peuvent nous écrire à ${mail} avec l'objet <em>« Partenariat »</em>. Merci d'inclure le nom de votre société, le pays d'opération et la proposition dès le premier message.</p>`,
      },
      {
        heading: "Vie privée & demandes RGPD",
        body: `<p>Pour exercer vos droits RGPD (accès, rectification, effacement, portabilité, opposition), écrivez à ${mail} avec l'objet <em>« Demande RGPD »</em>. Nous répondons sous 30 jours conformément à la loi.</p>`,
      },
      {
        heading: "Adresse postale",
        body: `<p>Foot Ticket Finder — Service client<br/>Adresse postale disponible sur demande par email.</p>`,
      },
    ],
  },
};

export const trustContent: Record<Locale, Record<TrustDocKey, TrustDocument>> = {
  en, fr,
  // Other locales fall back to English until full translations are commissioned.
  es: en, de: en, it: en, pt: en, nl: en, ar: en, ru: en,
};

export const getTrustDoc = (locale: Locale, key: TrustDocKey): TrustDocument =>
  (trustContent[locale] ?? trustContent.en)[key] ?? trustContent.en[key];
