import type { Locale } from "./translations";

export interface GuideSection {
  heading: string;
  body: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  readMinutes: number;
  intro: string;
  sections: GuideSection[];
  takeaways: string[];
}

export type GuideKey = "safe-tickets" | "matchday-travel" | "league-coverage" | "stadium-experience";

const en: Record<GuideKey, Guide> = {
  "safe-tickets": {
    slug: "how-to-buy-tickets-safely",
    title: "How to buy football tickets safely",
    description:
      "A practical guide to buying real, official football tickets — how to spot scams, when to trust resale, and what to check at the turnstile.",
    emoji: "🛡️",
    readMinutes: 6,
    intro:
      "Football ticket scams cost UK and EU fans an estimated €30M+ every season. The good news: avoiding them is mostly mechanical. Follow this checklist and you'll never overpay or get refused at the gate.",
    sections: [
      {
        heading: "1. Start with the official source",
        body: `<p>Every match has a primary seller — usually the home club's own ticket office, sometimes the league or the host federation for cup finals and international matches. Always check the home club's website first. If general sale is open and seats are still available, this is the cheapest, safest, and fastest route.</p>
        <p>Foot Ticket Finder always shows the official source at the top of every match page, in green, before any resale or comparison link.</p>`,
      },
      {
        heading: "2. Understand the three types of seller",
        body: `<ul>
          <li><strong>Official primary</strong> — the club itself, its appointed partner (e.g. Eventim for many German clubs, Ticketmaster for several English clubs), or the league/federation. Lowest price, full buyer protection, no fees beyond face value.</li>
          <li><strong>Authorised resale</strong> — a marketplace approved by the club to handle excess inventory (e.g. official Premier League ticket exchange, FC Barcelona's official resale platform). Usually capped at face value or a small premium.</li>
          <li><strong>Regulated secondary marketplace</strong> — Viagogo, StubHub International, Twickets. Prices float with demand. Buyer protection exists but check the small print on cancellation and ID-on-ticket policies.</li>
        </ul>
        <p>Anything outside those three categories — Telegram resellers, Facebook groups, "DM me" Instagram accounts, classified ads — is high risk. Do not buy there.</p>`,
      },
      {
        heading: "3. Match the name on the ticket",
        body: `<p>FC Barcelona, Bayern Munich, almost every Premier League ground and many Serie A and Ligue 1 clubs check ID at the turnstile when the name on the ticket doesn't match. If you buy from a marketplace where the original buyer's name stays printed on the ticket, you risk being refused entry — without refund.</p>
        <p>Always read the seller's policy on name changes before paying. If they cannot transfer the name to yours, walk away.</p>`,
      },
      {
        heading: "4. Pay smart",
        body: `<ul>
          <li>Use a credit card or a payment service that supports chargebacks (PayPal Buyer Protection, Klarna, Apple Pay/Google Pay backed by a credit card).</li>
          <li>Never wire money, never pay in cryptocurrency, never use gift cards for tickets.</li>
          <li>Keep all receipts and confirmation emails until after the match.</li>
        </ul>`,
      },
      {
        heading: "5. Spot the scam patterns",
        body: `<ul>
          <li>Price is "too good to be true" for a sold-out fixture — it is.</li>
          <li>Seller refuses to use the official platform's transfer feature.</li>
          <li>Pressure to pay quickly, off-platform, in 24h.</li>
          <li>"Just trust me" replaces a paper trail.</li>
        </ul>`,
      },
      {
        heading: "6. Plan for cancellation",
        body: `<p>Before you pay, check the partner's refund policy in case of cancellation, postponement, or behind-closed-doors play. Top providers refund face value automatically; smaller resellers may keep their fees. Also check whether your travel and hotel are refundable independently.</p>`,
      },
    ],
    takeaways: [
      "Always start with the club's own ticket office.",
      "Only buy from official, authorised, or regulated marketplaces.",
      "Check the name-on-ticket policy before paying.",
      "Use a payment method with chargeback protection.",
      "Avoid social-media sellers — that's where 90% of scams happen.",
    ],
  },
  "matchday-travel": {
    slug: "matchday-travel-checklist",
    title: "The matchday & travel checklist",
    description:
      "Everything to plan for an away day or a foreign matchday — from arriving in the city to leaving the stadium without missing the last train.",
    emoji: "🧳",
    readMinutes: 5,
    intro:
      "A football trip lives or dies on logistics. Here's the checklist we use ourselves before booking a flight to a Champions League away fixture or a Premier League weekender.",
    sections: [
      {
        heading: "1. The 72-hour booking window",
        body: `<p>Once you have the ticket confirmed, book travel and accommodation in this exact order: outbound transport → return transport (always check the last train/metro time after kickoff) → hotel → local transport. Booking the return first prevents the classic "I'm in Manchester with no way home at 23:00" mistake.</p>`,
      },
      {
        heading: "2. Where to stay",
        body: `<ul>
          <li>Stay near a metro/tram line that connects to the stadium — not necessarily next to the ground itself.</li>
          <li>For away ends in the UK and Germany, the city centre often beats hotels near the stadium for evening atmosphere and post-match food.</li>
          <li>For Italian and Spanish midweek matches, stay close to the metro that goes back to the airport — many late kick-offs end after the regular metro service.</li>
        </ul>`,
      },
      {
        heading: "3. Arrive at the stadium early",
        body: `<p>Aim to be at the stadium 60 to 90 minutes before kickoff for any top-tier European fixture. Bag checks, ID verification (mandatory at most LaLiga, Bundesliga and Premier League grounds), and turnstile queues can take 30 minutes alone. For Clásicos, derbies, finals, and any Italian match with both ultra ends open, arrive 90+ minutes early.</p>`,
      },
      {
        heading: "4. What to bring (and what to leave)",
        body: `<ul>
          <li><strong>Bring:</strong> printed ticket OR fully-charged phone with the ticket app downloaded offline, photo ID matching the ticket name, a credit card, and warm/waterproof layers (most stadium concourses are open).</li>
          <li><strong>Leave behind:</strong> large bags (banned at almost every European ground), professional cameras with detachable lenses, flag poles longer than 1m, glass bottles, anything sharp.</li>
          <li>Always check the home club's "what to bring" page — rules differ.</li>
        </ul>`,
      },
      {
        heading: "5. Atmosphere planning",
        body: `<p>Want pyro, songs and tifo? Aim for the home ultra section on a derby or European night — but understand the safety rules and the dress code (no opposing colours). For your first foreign matchday, the family stand or a neutral area gives you the best mix of atmosphere and access to facilities.</p>`,
      },
      {
        heading: "6. After the final whistle",
        body: `<ul>
          <li>Stay in your section 5–10 minutes after the final whistle — many grounds delay the away end exit for crowd separation.</li>
          <li>Walk to a metro station 1–2 stops away from the stadium to avoid the worst crush.</li>
          <li>Confirm your last train time before you leave the hotel that morning, not at the stadium.</li>
        </ul>`,
      },
    ],
    takeaways: [
      "Book the return transport before anything else.",
      "Allow 60–90 minutes between arrival at the stadium and kickoff.",
      "Photo ID matching the ticket name is mandatory at most top-tier grounds.",
      "Walk one or two metro stops away after the match to skip the crush.",
    ],
  },
  "league-coverage": {
    slug: "league-coverage",
    title: "League guides",
    description:
      "Practical, season-by-season ticketing guides for every major league we cover — release calendars, membership requirements, ID rules and resale policies.",
    emoji: "🏆",
    readMinutes: 4,
    intro:
      "Each major football league sells tickets a different way. Here's a quick orientation for the leagues we cover end-to-end on Foot Ticket Finder.",
    sections: [
      {
        heading: "Premier League (England)",
        body: `<p>Tickets sell out almost exclusively to season-ticket holders and members. Public sale rarely opens. Your routes in: become a club member (annual fee, often €25–€60), monitor each club's official ticket exchange, or check the regulated resale market for cup competitions and lower-demand fixtures.</p>`,
      },
      {
        heading: "LaLiga (Spain)",
        body: `<p>Most LaLiga clubs release tickets on a rolling 1-to-2 weeks before each fixture. Real Madrid and FC Barcelona use seat-yielding programmes — socios can release their seat to the public, generating extra inventory. Photo ID is checked at the gate at most major grounds.</p>`,
      },
      {
        heading: "Bundesliga (Germany)",
        body: `<p>Cheapest top-tier league in Europe (terraces from €15). Most tickets go to club members and Dauerkarten (season-ticket holders), but a public sale window typically opens 1–2 weeks before each match. Eventim is the dominant ticketing platform.</p>`,
      },
      {
        heading: "Serie A (Italy)",
        body: `<p>Italian clubs require the Tessera del Tifoso (fan card) for some away ends and big domestic fixtures. Public sale typically opens 7–10 days before each match via Vivaticket or the club's site. Photo ID matches mandatory.</p>`,
      },
      {
        heading: "Ligue 1 (France)",
        body: `<p>PSG, OM and Lyon sell out high-demand fixtures within hours of the public sale opening. Other clubs have steady availability up to matchday. Reselling tickets without authorisation is a criminal offence in France — only use the club's official resale.</p>`,
      },
      {
        heading: "UEFA Champions League & Europa League",
        body: `<p>Every UCL/UEL fixture is sold by the home club through their own platform. Away tickets are always allocated to the away club; you cannot buy them on resale. UEFA finals use a separate global ballot which opens around February each year.</p>`,
      },
    ],
    takeaways: [
      "Check the league's release pattern before deciding which match to target.",
      "Membership often unlocks the cheapest seats — pay the €25–€60 if you visit twice or more per season.",
      "Photo ID matching the ticket is now standard at almost every top-five-league ground.",
    ],
  },
  "stadium-experience": {
    slug: "stadium-experience",
    title: "Stadium experience guides",
    description:
      "What to expect inside Europe's most iconic football grounds — from the best sections for atmosphere to the most affordable seats with a great view.",
    emoji: "🏟️",
    readMinutes: 4,
    intro:
      "We document every stadium we cover with the same fact pattern: capacity, opening year, best ultras section, family section, accessibility, photography rules and the secret of where to sit if you only go once.",
    sections: [
      {
        heading: "What we document for every ground",
        body: `<ul>
          <li>Capacity, opening year, and ownership.</li>
          <li>The two or three best sections for atmosphere, plus the family-friendly area.</li>
          <li>Average ticket price by category for the current season.</li>
          <li>How to reach the stadium from the city centre by metro/tram.</li>
          <li>What's allowed and forbidden inside — bags, cameras, banners.</li>
          <li>Real fan tips on the food, beer and best photo angles.</li>
        </ul>`,
      },
      {
        heading: "How we rate atmosphere",
        body: `<p>Atmosphere is scored on a 0–10 scale based on: average decibel level (where measured), number of organised supporter groups, frequency of choreographies, and historical importance of the fixture. We disclose the methodology on each stadium page so you can decide whether the data matches your taste.</p>`,
      },
      {
        heading: "Iconic grounds we cover end-to-end",
        body: `<p>Anfield, Camp Nou, Santiago Bernabéu, Allianz Arena, Signal Iduna Park, San Siro, Maracanã, La Bombonera, Monumental, Old Trafford, Emirates, Wanda Metropolitano, Parc des Princes, Vélodrome, Celtic Park, Ibrox, Westfalenstadion, De Kuip, Estádio do Dragão, Atatürk Stadium and many more. Use the <a class="text-[#2ECC71] font-semibold" href="/stadiums">stadium explorer</a> to filter by continent and country.</p>`,
      },
    ],
    takeaways: [
      "Check the stadium page before you book the ticket — section choice matters more than price.",
      "Family sections are usually the calmest; ultra sections the loudest and the most regulated.",
      "Always reach the stadium 60–90 minutes early on a big night.",
    ],
  },
};

const fr: Record<GuideKey, Guide> = {
  "safe-tickets": {
    slug: "comment-acheter-billets-football-en-securite",
    title: "Comment acheter ses billets de foot en toute sécurité",
    description:
      "Un guide concret pour acheter de vrais billets officiels — comment repérer les arnaques, quand faire confiance à la revente, et quoi vérifier au portique.",
    emoji: "🛡️",
    readMinutes: 6,
    intro:
      "Les arnaques aux billets de foot coûtent à elles seules plus de 30 M€ par saison aux fans en Europe. La bonne nouvelle : les éviter est mécanique. Suivez cette checklist et vous ne payerez jamais trop cher, ni ne serez refoulé à l'entrée.",
    sections: [
      {
        heading: "1. Commencez par la source officielle",
        body: `<p>Chaque match a un vendeur principal — généralement la billetterie du club domicile, parfois la ligue ou la fédération hôte pour les finales et les matchs internationaux. Vérifiez toujours le site du club domicile en premier. Si la vente publique est ouverte et qu'il reste des places, c'est la voie la moins chère, la plus sûre et la plus rapide.</p>
        <p>Foot Ticket Finder affiche toujours la source officielle en haut de chaque fiche match, en vert, avant tout lien de comparaison ou de revente.</p>`,
      },
      {
        heading: "2. Comprenez les trois types de vendeurs",
        body: `<ul>
          <li><strong>Officiel primaire</strong> — le club lui-même, son partenaire désigné (Eventim pour beaucoup de clubs allemands, Ticketmaster pour plusieurs clubs anglais) ou la ligue/fédération. Prix le plus bas, pleine protection acheteur, pas de frais au-delà de la valeur faciale.</li>
          <li><strong>Revente autorisée</strong> — une marketplace approuvée par le club pour gérer le surplus (exchange officiel Premier League, plateforme officielle de revente FC Barcelone). Généralement plafonnée à la valeur faciale ou un faible supplément.</li>
          <li><strong>Marché secondaire régulé</strong> — Viagogo, StubHub International, Twickets. Prix variables selon la demande. La protection acheteur existe mais lisez les petites lignes sur l'annulation et le nom sur le billet.</li>
        </ul>
        <p>Tout ce qui sort de ces trois catégories — revendeurs Telegram, groupes Facebook, comptes Instagram « DM moi », petites annonces — est à haut risque. N'achetez pas.</p>`,
      },
      {
        heading: "3. Le nom sur le billet doit correspondre",
        body: `<p>FC Barcelone, Bayern Munich, presque tous les stades de Premier League et beaucoup de clubs de Serie A et Ligue 1 vérifient l'identité au portique quand le nom imprimé ne correspond pas. Si vous achetez sur une marketplace où le nom de l'acheteur initial reste imprimé, vous risquez le refus à l'entrée — sans remboursement.</p>
        <p>Lisez toujours la politique de changement de nom du vendeur avant de payer. S'il ne peut pas transférer le nom au vôtre, partez.</p>`,
      },
      {
        heading: "4. Payez intelligemment",
        body: `<ul>
          <li>Utilisez une carte de crédit ou un service avec chargeback (PayPal Buyer Protection, Klarna, Apple Pay/Google Pay adossé à une carte de crédit).</li>
          <li>Jamais de virement bancaire, jamais de cryptomonnaie, jamais de carte cadeau pour des billets.</li>
          <li>Conservez tous les reçus et e-mails de confirmation jusqu'après le match.</li>
        </ul>`,
      },
      {
        heading: "5. Détectez les schémas d'arnaque",
        body: `<ul>
          <li>Le prix est « trop beau pour être vrai » sur un match guichets fermés — c'est qu'il l'est.</li>
          <li>Le vendeur refuse d'utiliser la fonction de transfert de la plateforme officielle.</li>
          <li>Pression pour payer vite, hors plateforme, sous 24h.</li>
          <li>« Fais-moi confiance » remplace toute trace écrite.</li>
        </ul>`,
      },
      {
        heading: "6. Anticipez l'annulation",
        body: `<p>Avant de payer, vérifiez la politique de remboursement du partenaire en cas d'annulation, report ou huis clos. Les meilleurs revendeurs remboursent automatiquement la valeur faciale ; les plus petits gardent leurs frais. Vérifiez aussi si votre transport et votre hôtel sont remboursables séparément.</p>`,
      },
    ],
    takeaways: [
      "Commencez toujours par la billetterie officielle du club.",
      "N'achetez qu'auprès de revendeurs officiels, autorisés ou régulés.",
      "Vérifiez la politique du nom sur le billet avant de payer.",
      "Utilisez un moyen de paiement avec chargeback.",
      "Évitez les vendeurs sur les réseaux sociaux — c'est là que 90 % des arnaques arrivent.",
    ],
  },
  "matchday-travel": {
    slug: "checklist-matchday-voyage",
    title: "La checklist matchday & voyage",
    description:
      "Tout ce qu'il faut anticiper pour un déplacement au stade ou un weekend foot à l'étranger — de l'arrivée en ville à la sortie sans rater le dernier métro.",
    emoji: "🧳",
    readMinutes: 5,
    intro:
      "Un voyage foot tient à sa logistique. Voici la checklist que nous utilisons nous-mêmes avant de réserver un déplacement de Ligue des Champions ou un weekend en Premier League.",
    sections: [
      {
        heading: "1. La fenêtre de réservation des 72 heures",
        body: `<p>Une fois le billet confirmé, réservez votre voyage et votre hébergement dans cet ordre exact : aller → retour (vérifiez toujours l'heure du dernier train/métro après le coup de sifflet) → hôtel → transport local. Réserver le retour en premier évite l'erreur classique « je suis à Manchester sans solution à 23h ».</p>`,
      },
      {
        heading: "2. Où dormir",
        body: `<ul>
          <li>Dormez près d'une ligne métro/tram qui dessert le stade — pas forcément à côté du stade lui-même.</li>
          <li>Pour les déplacements UK/Allemagne, le centre-ville bat souvent les hôtels près du stade pour l'ambiance d'avant-match et le fooding d'après.</li>
          <li>Pour les matchs italiens et espagnols en semaine, dormez près du métro qui retourne à l'aéroport — beaucoup de matchs tardifs finissent après le dernier métro régulier.</li>
        </ul>`,
      },
      {
        heading: "3. Arrivez tôt au stade",
        body: `<p>Visez le stade 60 à 90 minutes avant le coup d'envoi pour tout match européen majeur. Fouilles, vérification d'identité (obligatoire dans la majorité des stades de LaLiga, Bundesliga et Premier League) et files aux tourniquets prennent à elles seules 30 minutes. Pour les Clásicos, derbies, finales et tout match italien avec deux virages ouverts, prévoyez 90+ minutes.</p>`,
      },
      {
        heading: "4. Quoi emporter (et laisser)",
        body: `<ul>
          <li><strong>Emportez :</strong> billet imprimé OU téléphone chargé avec l'app billet téléchargée offline, pièce d'identité au nom du billet, carte de crédit, vêtements chauds/imperméables (la plupart des coursives sont à l'air libre).</li>
          <li><strong>Laissez :</strong> grands sacs (interdits dans presque tous les stades européens), appareils photo pro avec objectifs détachables, hampes de drapeau de plus d'1 m, bouteilles en verre, tout objet tranchant.</li>
          <li>Vérifiez toujours la page « Ce que vous pouvez apporter » du club — les règles varient.</li>
        </ul>`,
      },
      {
        heading: "5. Anticipez l'ambiance",
        body: `<p>Vous voulez fumigènes, chants et tifo ? Visez le virage ultra du domicile sur un derby ou une soirée européenne — mais comprenez les règles de sécurité et le dress code (jamais les couleurs adverses). Pour un premier match à l'étranger, la tribune famille ou une zone neutre offre le meilleur compromis ambiance / accès aux services.</p>`,
      },
      {
        heading: "6. Après le coup de sifflet final",
        body: `<ul>
          <li>Restez dans votre tribune 5–10 minutes après le coup de sifflet — beaucoup de stades retardent la sortie du parcage visiteurs.</li>
          <li>Marchez jusqu'à un arrêt de métro à 1–2 stations du stade pour éviter le pic de foule.</li>
          <li>Confirmez l'heure du dernier train avant de quitter l'hôtel le matin, pas au stade.</li>
        </ul>`,
      },
    ],
    takeaways: [
      "Réservez le retour avant toute autre chose.",
      "Comptez 60 à 90 minutes entre l'arrivée au stade et le coup d'envoi.",
      "Une pièce d'identité au nom du billet est obligatoire dans la plupart des stades majeurs.",
      "Marchez 1–2 stations de métro après le match pour éviter la cohue.",
    ],
  },
  "league-coverage": {
    slug: "guides-championnats",
    title: "Guides des championnats",
    description:
      "Guides pratiques et saisonniers pour chaque grand championnat couvert — calendriers de mise en vente, exigences d'adhésion, règles d'identité et politiques de revente.",
    emoji: "🏆",
    readMinutes: 4,
    intro:
      "Chaque grand championnat vend ses billets différemment. Voici une orientation rapide pour les compétitions que nous couvrons de bout en bout sur Foot Ticket Finder.",
    sections: [
      {
        heading: "Premier League (Angleterre)",
        body: `<p>Les billets partent presque exclusivement aux abonnés et aux membres. La vente publique ouvre rarement. Vos voies d'accès : devenir membre du club (cotisation annuelle, souvent 25–60 €), surveiller l'exchange officiel de chaque club, ou consulter le marché secondaire régulé pour les coupes et les matchs à plus faible demande.</p>`,
      },
      {
        heading: "LaLiga (Espagne)",
        body: `<p>La plupart des clubs de LaLiga ouvrent la vente 1 à 2 semaines avant chaque match. Real Madrid et FC Barcelone utilisent un programme de libération de places — les socios libèrent leur siège pour le grand public, créant du stock supplémentaire. L'identité est vérifiée au portique dans les grands stades.</p>`,
      },
      {
        heading: "Bundesliga (Allemagne)",
        body: `<p>Le championnat top-tier le moins cher d'Europe (debouts à partir de 15 €). La plupart des billets vont aux membres et aux Dauerkarten (abonnés), mais une fenêtre publique ouvre généralement 1–2 semaines avant chaque match. Eventim est la plateforme dominante.</p>`,
      },
      {
        heading: "Serie A (Italie)",
        body: `<p>Les clubs italiens demandent la Tessera del Tifoso (carte supporter) pour certains parcages visiteurs et les grands matchs nationaux. La vente publique ouvre généralement 7–10 jours avant chaque match via Vivaticket ou le site du club. Identité au nom du billet obligatoire.</p>`,
      },
      {
        heading: "Ligue 1 (France)",
        body: `<p>PSG, OM et Lyon affichent complet en quelques heures sur les matchs les plus demandés. Les autres clubs ont du stock régulier jusqu'au matchday. Revendre sans autorisation est un délit en France — n'utilisez que la revente officielle du club.</p>`,
      },
      {
        heading: "Ligue des Champions & Europa League",
        body: `<p>Chaque match UCL/UEL est vendu par le club domicile via sa propre plateforme. Les places visiteurs sont toujours allouées au club visiteur ; on ne peut pas les acheter en revente. Les finales UEFA passent par un tirage mondial qui ouvre généralement en février.</p>`,
      },
    ],
    takeaways: [
      "Vérifiez le calendrier de mise en vente du championnat avant de cibler un match.",
      "L'adhésion débloque souvent les sièges les moins chers — payez les 25–60 € si vous y allez 2 fois ou plus par saison.",
      "L'identité au nom du billet est désormais standard dans presque tous les stades du top 5.",
    ],
  },
  "stadium-experience": {
    slug: "guides-experience-stade",
    title: "Guides expérience stade",
    description:
      "À quoi s'attendre à l'intérieur des stades de foot les plus iconiques d'Europe — des meilleures tribunes pour l'ambiance aux sièges les plus abordables avec une vraie vue.",
    emoji: "🏟️",
    readMinutes: 4,
    intro:
      "Nous documentons chaque stade avec le même schéma : capacité, année d'ouverture, meilleur virage ultra, tribune famille, accessibilité, règles photo et le secret de où s'asseoir si vous n'y allez qu'une fois.",
    sections: [
      {
        heading: "Ce que nous documentons pour chaque stade",
        body: `<ul>
          <li>Capacité, année d'ouverture et propriété.</li>
          <li>Les deux ou trois meilleures tribunes pour l'ambiance, plus la zone famille.</li>
          <li>Prix moyen par catégorie pour la saison en cours.</li>
          <li>Comment rejoindre le stade depuis le centre en métro/tram.</li>
          <li>Ce qui est autorisé et interdit à l'intérieur — sacs, appareils photo, banderoles.</li>
          <li>Conseils de fans réels sur la bouffe, la bière et les meilleurs angles photo.</li>
        </ul>`,
      },
      {
        heading: "Comment nous notons l'ambiance",
        body: `<p>L'ambiance est notée sur 0–10 selon : décibels moyens (lorsque mesurés), nombre de groupes de supporters organisés, fréquence des tifos, importance historique du match. Nous publions la méthodologie sur chaque fiche stade pour que vous puissiez juger si elle colle à vos goûts.</p>`,
      },
      {
        heading: "Stades iconiques couverts de bout en bout",
        body: `<p>Anfield, Camp Nou, Santiago Bernabéu, Allianz Arena, Signal Iduna Park, San Siro, Maracanã, La Bombonera, Monumental, Old Trafford, Emirates, Wanda Metropolitano, Parc des Princes, Vélodrome, Celtic Park, Ibrox, Westfalenstadion, De Kuip, Estádio do Dragão, Stade Atatürk et bien d'autres. Utilisez l'<a class="text-[#2ECC71] font-semibold" href="/stadiums">explorateur de stades</a> pour filtrer par continent et pays.</p>`,
      },
    ],
    takeaways: [
      "Consultez la fiche stade avant de réserver — le choix de la tribune compte plus que le prix.",
      "Les tribunes famille sont les plus calmes ; les virages ultras les plus bruyants et les plus encadrés.",
      "Visez 60–90 minutes d'avance les soirs de gros match.",
    ],
  },
};

export const guidesContent: Record<Locale, Record<GuideKey, Guide>> = {
  en, fr,
  es: en, de: en, it: en, pt: en, nl: en, ar: en, ru: en,
};

export const getGuide = (locale: Locale, key: GuideKey): Guide =>
  (guidesContent[locale] ?? guidesContent.en)[key];

export const listGuides = (locale: Locale): Guide[] =>
  (Object.keys(en) as GuideKey[]).map((k) => getGuide(locale, k));
