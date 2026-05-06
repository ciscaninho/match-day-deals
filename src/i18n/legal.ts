import type { Locale } from "./translations";

export interface LegalSection {
  heading: string;
  /** HTML allowed (links, lists, strong). Sanitized by build (static content). */
  body: string;
}

export interface LegalDocument {
  title: string;
  lastUpdatedLabel: string;
  sections: LegalSection[];
}

export interface LegalCopy {
  privacy: LegalDocument;
  terms: LegalDocument;
  refund: LegalDocument;
}

const SELLER = "Foot Ticket Finder";
const EMAIL = "support.footticket@gmail.com";
const mail = `<a class="text-[#2ECC71] font-semibold" href="mailto:${EMAIL}">${EMAIL}</a>`;
const paddleLink = `<a class="text-[#2ECC71] font-semibold" href="https://www.paddle.com" target="_blank" rel="noreferrer">Paddle.com</a>`;
const paddlePrivacyLink = `<a class="text-[#2ECC71] font-semibold" href="https://www.paddle.com/legal/privacy" target="_blank" rel="noreferrer">Paddle</a>`;
const paddleNetLink = `<a class="text-[#2ECC71] font-semibold" href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a>`;
const paddleBuyerLink = `<a class="text-[#2ECC71] font-semibold" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noreferrer">Checkout / Buyer Terms</a>`;

/* ============================================================
   ENGLISH (canonical)
   ============================================================ */
const en: LegalCopy = {
  privacy: {
    title: "Privacy Notice",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "1. Who we are", body: `<p><strong>${SELLER}</strong> ("we", "us", "our") operates the ${SELLER} app and website. We act as the <strong>data controller</strong> for the personal data we collect about you when you use the Service.</p>` },
      { heading: "2. Data we collect", body: `<ul><li><strong>Account data:</strong> email address, display name, password (hashed), avatar.</li><li><strong>Product usage:</strong> matches you follow, notification preferences, polls answered, points earned.</li><li><strong>Support data:</strong> messages you send to our support, the page you were on, language and user type.</li><li><strong>Technical data:</strong> device, browser, IP address, log data needed for security, fraud prevention and debugging.</li></ul>` },
      { heading: "3. Why we use it (purpose & legal basis)", body: `<ul><li><strong>Provide the Service</strong> (account creation, ticket alerts, follow lists) — performance of contract.</li><li><strong>Improve the product and personalise it</strong> — legitimate interests.</li><li><strong>Customer support</strong> — performance of contract / legitimate interests.</li><li><strong>Security & fraud prevention</strong> — legitimate interests / legal obligation.</li><li><strong>Marketing communications</strong> — only if you opt in (consent).</li></ul>` },
      { heading: "4. Who we share data with", body: `<ul><li><strong>Service providers / subprocessors:</strong> hosting (Lovable Cloud / Supabase), analytics, email delivery, support tooling.</li><li><strong>Payment processing — Paddle (Merchant of Record):</strong> when you subscribe to Premium, payment data is collected and processed by ${paddlePrivacyLink}, who acts as the seller of record and handles payments, tax, invoicing and subscription management.</li><li><strong>Professional advisers</strong> (legal, accounting) where necessary.</li><li><strong>Authorities</strong> when required by law.</li></ul><p>We never sell your personal data.</p>` },
      { heading: "5. International transfers", body: `<p>Some of our service providers process data outside the UK/EEA. When we transfer personal data internationally, we rely on appropriate safeguards (Standard Contractual Clauses or adequacy decisions).</p>` },
      { heading: "6. How long we keep it", body: `<p>We keep personal data only as long as needed to provide the Service and comply with our legal obligations. When data is no longer needed, it is deleted or anonymised.</p>` },
      { heading: "7. Your rights", body: `<p>Subject to applicable law (including GDPR for users in the UK/EEA), you have the right to access, rectify, erase, restrict processing, object to processing, request portability of your data, and withdraw consent at any time. You also have the right to lodge a complaint with your local supervisory authority. We respond to requests within 1 month.</p><p>To exercise any of these rights, email ${mail}.</p>` },
      { heading: "8. Security", body: `<p>We use appropriate technical and organisational measures (encryption in transit, access controls, regular reviews) to protect your data.</p>` },
      { heading: "9. Cookies", body: `<p>We use a small number of essential cookies needed to keep you signed in and operate the Service. We do not use marketing cookies without your consent.</p>` },
      { heading: "10. Contact", body: `<p>Any privacy question? Reach us at ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "1. Who we are", body: `<p>These Terms govern your use of ${SELLER} (the "Service"), operated by <strong>${SELLER}</strong> ("we", "us", "our"). By accessing or using the Service you agree to these Terms. If you do not agree, do not use the Service.</p>` },
      { heading: "2. The Service", body: `<p>${SELLER} is an information and alert service that helps fans discover when official football tickets go on sale. We do <strong>not</strong> sell tickets ourselves — all purchases are made directly on official platforms.</p>` },
      { heading: "3. Acceptable use", body: `<p>You agree not to misuse the Service. You will not:</p><ul><li>use the Service for any unlawful, fraudulent or abusive purpose;</li><li>send spam or attempt to interfere with other users;</li><li>infringe intellectual property rights or post infringing content;</li><li>interfere with the security of the Service (including malware, probing, scanning, scraping or circumventing technical limits).</li></ul>` },
      { heading: "4. Account & security", body: `<p>You are responsible for keeping your account credentials confidential and for all activity under your account. Provide accurate information and keep it up to date.</p>` },
      { heading: "5. Intellectual property", body: `<p>${SELLER} and all related software, content, branding, and documentation are owned by us or our licensors. We grant you a limited, non-exclusive, non-transferable right to use the Service for your personal, non-commercial use within your selected plan. You may not copy, resell, redistribute, reverse-engineer or sub-licence the Service.</p>` },
      { heading: "6. Premium subscription", body: `<p>${SELLER} Premium is a recurring subscription billed monthly (€2.99) or yearly (€29). Subscriptions renew automatically at the end of each period until you cancel. You can cancel at any time from your account; cancellation takes effect at the end of the current billing period.</p>` },
      { heading: "7. Payments — Paddle as Merchant of Record", body: `<p>Our order process is conducted by our online reseller ${paddleLink}. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Payment, billing, tax, cancellation and refund mechanics are governed by Paddle's ${paddleBuyerLink}.</p>` },
      { heading: "8. Refunds", body: `<p>See our <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Refund Policy</a> for details. We offer a 30-day money-back guarantee on Premium subscriptions.</p>` },
      { heading: "9. Service availability", body: `<p>We make best efforts to keep ticket release dates and availability accurate, but we do not guarantee that the Service will be uninterrupted or error-free, or that ticket information will always be exact or up to date.</p>` },
      { heading: "10. Disclaimer & liability", body: `<p>To the fullest extent permitted by law, the Service is provided "as is" and we disclaim all implied warranties including merchantability and fitness for a particular purpose. Our aggregate liability is capped at the fees you paid us in the 12 months preceding the claim. We are not liable for indirect, consequential or special damages (loss of profits, data or goodwill). Nothing excludes liability for fraud, death or personal injury where required by law.</p>` },
      { heading: "11. Suspension & termination", body: `<p>We may suspend or terminate your access to the Service for material breach of these Terms, non-payment, security or fraud risk, or repeated/serious policy violations. On termination, your right to use the Service ends.</p>` },
      { heading: "12. Changes to these Terms", body: `<p>We may update these Terms from time to time. We will post the updated version on this page with a new "Last updated" date. Continued use after changes means you accept them.</p>` },
      { heading: "13. Contact", body: `<p>Questions? Email ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Refund Policy",
    lastUpdatedLabel: "Last updated",
    sections: [
      { heading: "30-day money-back guarantee", body: `<p>We want you to be fully satisfied with your ${SELLER} Premium subscription. If you are not happy with your purchase, you can request a full refund within <strong>30 days</strong> of your order date — no questions asked.</p>` },
      { heading: "How to request a refund", body: `<p>Refunds for ${SELLER} are processed by our payment provider, Paddle, who acts as the Merchant of Record for all our orders. To request a refund:</p><ul><li>Visit ${paddleNetLink} and look up your order using the email address you used at checkout, or</li><li>Email us at ${mail} and we will help you with the refund.</li></ul>` },
      { heading: "After 30 days", body: `<p>After 30 days, refunds may still be granted in exceptional circumstances at our discretion. Cancelling your subscription stops future renewals, and you keep access until the end of the current billing period.</p>` },
      { heading: "Contact", body: `<p>Questions about a refund? Reach us at ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   FRENCH
   ============================================================ */
const fr: LegalCopy = {
  privacy: {
    title: "Politique de confidentialité",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "1. Qui sommes-nous", body: `<p><strong>${SELLER}</strong> (« nous ») exploite l'application et le site ${SELLER}. Nous agissons en tant que <strong>responsable du traitement</strong> pour les données personnelles que nous collectons à votre sujet lorsque vous utilisez le Service.</p>` },
      { heading: "2. Données que nous collectons", body: `<ul><li><strong>Données de compte :</strong> e-mail, nom affiché, mot de passe (haché), avatar.</li><li><strong>Utilisation du produit :</strong> matchs suivis, préférences de notification, sondages répondus, points gagnés.</li><li><strong>Données de support :</strong> messages envoyés au support, page consultée, langue et type d'utilisateur.</li><li><strong>Données techniques :</strong> appareil, navigateur, adresse IP, journaux nécessaires à la sécurité, à la prévention de la fraude et au débogage.</li></ul>` },
      { heading: "3. Pourquoi nous l'utilisons (finalités et base légale)", body: `<ul><li><strong>Fournir le Service</strong> (création de compte, alertes billets, listes de suivi) — exécution du contrat.</li><li><strong>Améliorer et personnaliser le produit</strong> — intérêts légitimes.</li><li><strong>Support client</strong> — exécution du contrat / intérêts légitimes.</li><li><strong>Sécurité et prévention de la fraude</strong> — intérêts légitimes / obligation légale.</li><li><strong>Communications marketing</strong> — uniquement si vous y consentez.</li></ul>` },
      { heading: "4. Avec qui nous partageons les données", body: `<ul><li><strong>Prestataires / sous-traitants :</strong> hébergement (Lovable Cloud / Supabase), analyse, envoi d'e-mails, outils de support.</li><li><strong>Paiement — Paddle (vendeur officiel) :</strong> lors d'un abonnement Premium, les données de paiement sont collectées et traitées par ${paddlePrivacyLink}, qui agit comme vendeur officiel et gère les paiements, taxes, factures et abonnements.</li><li><strong>Conseillers professionnels</strong> (juridiques, comptables) si nécessaire.</li><li><strong>Autorités</strong> lorsque la loi l'exige.</li></ul><p>Nous ne vendons jamais vos données personnelles.</p>` },
      { heading: "5. Transferts internationaux", body: `<p>Certains de nos prestataires traitent les données hors UK/EEE. Lors de transferts internationaux, nous appliquons les garanties appropriées (clauses contractuelles types ou décisions d'adéquation).</p>` },
      { heading: "6. Durée de conservation", body: `<p>Nous conservons les données personnelles uniquement le temps nécessaire à la fourniture du Service et au respect de nos obligations légales. Les données ne sont plus nécessaires sont supprimées ou anonymisées.</p>` },
      { heading: "7. Vos droits", body: `<p>Conformément à la loi applicable (notamment le RGPD), vous avez le droit d'accéder, rectifier, effacer, limiter le traitement, vous opposer, demander la portabilité de vos données et retirer votre consentement à tout moment. Vous pouvez également déposer une plainte auprès de votre autorité de contrôle. Nous répondons sous 1 mois.</p><p>Pour exercer ces droits, écrivez à ${mail}.</p>` },
      { heading: "8. Sécurité", body: `<p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement en transit, contrôles d'accès, revues régulières) pour protéger vos données.</p>` },
      { heading: "9. Cookies", body: `<p>Nous utilisons un petit nombre de cookies essentiels pour vous garder connecté et faire fonctionner le Service. Aucun cookie marketing sans votre consentement.</p>` },
      { heading: "10. Contact", body: `<p>Une question sur la confidentialité ? Contactez-nous à ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Conditions générales",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "1. Qui sommes-nous", body: `<p>Les présentes Conditions régissent votre utilisation de ${SELLER} (le « Service »), exploité par <strong>${SELLER}</strong>. En utilisant le Service, vous acceptez ces Conditions. Si vous n'êtes pas d'accord, n'utilisez pas le Service.</p>` },
      { heading: "2. Le Service", body: `<p>${SELLER} est un service d'information et d'alerte qui aide les fans à savoir quand les billets officiels de football sont mis en vente. Nous ne <strong>vendons pas</strong> de billets — tous les achats se font directement sur les plateformes officielles.</p>` },
      { heading: "3. Utilisation acceptable", body: `<p>Vous acceptez de ne pas utiliser le Service de manière abusive. Vous ne :</p><ul><li>n'utiliserez pas le Service à des fins illégales, frauduleuses ou abusives ;</li><li>n'enverrez pas de spam ni n'interférerez avec d'autres utilisateurs ;</li><li>ne porterez pas atteinte aux droits de propriété intellectuelle ;</li><li>n'attaquerez pas la sécurité du Service (malwares, scraping, contournement des limites techniques).</li></ul>` },
      { heading: "4. Compte et sécurité", body: `<p>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité sur votre compte. Fournissez des informations exactes et à jour.</p>` },
      { heading: "5. Propriété intellectuelle", body: `<p>${SELLER}, son logiciel, son contenu, sa marque et sa documentation appartiennent à nous ou à nos concédants. Nous vous accordons un droit limité, non exclusif et non transférable d'utiliser le Service pour un usage personnel et non commercial. Vous ne pouvez pas copier, revendre, redistribuer, désosser ou sous-licencier le Service.</p>` },
      { heading: "6. Abonnement Premium", body: `<p>${SELLER} Premium est un abonnement récurrent facturé mensuellement (2,99 €) ou annuellement (29 €). Les abonnements se renouvellent automatiquement jusqu'à annulation. Vous pouvez annuler à tout moment depuis votre compte ; l'annulation prend effet à la fin de la période en cours.</p>` },
      { heading: "7. Paiements — Paddle vendeur officiel", body: `<p>Notre processus de commande est géré par notre revendeur en ligne ${paddleLink}. Paddle est le vendeur officiel pour toutes nos commandes. Paddle gère le service client et les retours. Les modalités de paiement, facturation, taxes, annulation et remboursement sont régies par les ${paddleBuyerLink} de Paddle.</p>` },
      { heading: "8. Remboursements", body: `<p>Voir notre <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Politique de remboursement</a>. Nous offrons une garantie satisfait ou remboursé de 30 jours sur les abonnements Premium.</p>` },
      { heading: "9. Disponibilité du Service", body: `<p>Nous faisons de notre mieux pour garder les dates et disponibilités exactes, mais nous ne garantissons pas que le Service sera ininterrompu ou exempt d'erreurs.</p>` },
      { heading: "10. Avertissement et responsabilité", body: `<p>Dans toute la mesure permise par la loi, le Service est fourni « tel quel ». Notre responsabilité globale est limitée aux frais payés au cours des 12 mois précédant la réclamation. Nous ne sommes pas responsables des dommages indirects ou consécutifs. Rien n'exclut la responsabilité en cas de fraude, décès ou blessure corporelle.</p>` },
      { heading: "11. Suspension et résiliation", body: `<p>Nous pouvons suspendre ou résilier votre accès en cas de violation grave des Conditions, non-paiement, risque de sécurité ou de fraude.</p>` },
      { heading: "12. Modifications des Conditions", body: `<p>Nous pouvons mettre à jour ces Conditions. La version mise à jour est publiée sur cette page avec une nouvelle date « Dernière mise à jour ». L'utilisation continue vaut acceptation.</p>` },
      { heading: "13. Contact", body: `<p>Une question ? Écrivez à ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Politique de remboursement",
    lastUpdatedLabel: "Dernière mise à jour",
    sections: [
      { heading: "Garantie satisfait ou remboursé 30 jours", body: `<p>Nous voulons que vous soyez pleinement satisfait de votre abonnement ${SELLER} Premium. Si vous n'êtes pas satisfait, vous pouvez demander un remboursement intégral dans les <strong>30 jours</strong> suivant votre commande — sans question.</p>` },
      { heading: "Comment demander un remboursement", body: `<p>Les remboursements sont traités par notre prestataire de paiement Paddle, vendeur officiel de toutes nos commandes. Pour demander un remboursement :</p><ul><li>Visitez ${paddleNetLink} et recherchez votre commande avec l'e-mail utilisé au paiement, ou</li><li>Écrivez-nous à ${mail} et nous vous aiderons.</li></ul>` },
      { heading: "Après 30 jours", body: `<p>Au-delà de 30 jours, des remboursements peuvent être accordés à titre exceptionnel. L'annulation de l'abonnement stoppe les renouvellements futurs ; vous gardez l'accès jusqu'à la fin de la période en cours.</p>` },
      { heading: "Contact", body: `<p>Une question sur un remboursement ? Contactez-nous à ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   SPANISH
   ============================================================ */
const es: LegalCopy = {
  privacy: {
    title: "Política de privacidad",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "1. Quiénes somos", body: `<p><strong>${SELLER}</strong> opera la app y el sitio ${SELLER}. Actuamos como <strong>responsable del tratamiento</strong> de los datos personales que recopilamos sobre usted al usar el Servicio.</p>` },
      { heading: "2. Datos que recopilamos", body: `<ul><li><strong>Datos de cuenta:</strong> correo, nombre, contraseña (con hash), avatar.</li><li><strong>Uso del producto:</strong> partidos seguidos, preferencias de notificación, encuestas, puntos.</li><li><strong>Datos de soporte:</strong> mensajes al soporte, página, idioma, tipo de usuario.</li><li><strong>Datos técnicos:</strong> dispositivo, navegador, IP, registros de seguridad y depuración.</li></ul>` },
      { heading: "3. Para qué los usamos (finalidades y base legal)", body: `<ul><li><strong>Prestar el Servicio</strong> — ejecución del contrato.</li><li><strong>Mejorar y personalizar</strong> — interés legítimo.</li><li><strong>Atención al cliente</strong> — contrato / interés legítimo.</li><li><strong>Seguridad y prevención del fraude</strong> — interés legítimo / obligación legal.</li><li><strong>Marketing</strong> — solo con su consentimiento.</li></ul>` },
      { heading: "4. Con quién compartimos los datos", body: `<ul><li><strong>Proveedores / encargados:</strong> hosting (Lovable Cloud / Supabase), analítica, correo, soporte.</li><li><strong>Pagos — Paddle (Comerciante Registrado):</strong> los datos de pago son tratados por ${paddlePrivacyLink}.</li><li><strong>Asesores profesionales</strong> cuando sea necesario.</li><li><strong>Autoridades</strong> cuando lo exija la ley.</li></ul><p>Nunca vendemos sus datos personales.</p>` },
      { heading: "5. Transferencias internacionales", body: `<p>Algunos proveedores tratan datos fuera del EEE/UK. Aplicamos garantías adecuadas (cláusulas contractuales tipo o decisiones de adecuación).</p>` },
      { heading: "6. Plazo de conservación", body: `<p>Conservamos los datos solo el tiempo necesario para prestar el Servicio y cumplir obligaciones legales.</p>` },
      { heading: "7. Sus derechos", body: `<p>Conforme al RGPD, tiene derecho a acceder, rectificar, suprimir, limitar, oponerse, portabilidad y retirar el consentimiento. Puede reclamar ante la autoridad de control. Respondemos en 1 mes.</p><p>Para ejercerlos escriba a ${mail}.</p>` },
      { heading: "8. Seguridad", body: `<p>Aplicamos medidas técnicas y organizativas adecuadas (cifrado, controles de acceso, revisiones).</p>` },
      { heading: "9. Cookies", body: `<p>Usamos cookies esenciales para mantenerle conectado. Sin cookies de marketing sin su consentimiento.</p>` },
      { heading: "10. Contacto", body: `<p>¿Alguna duda de privacidad? Escríbanos a ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Términos y Condiciones",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "1. Quiénes somos", body: `<p>Estos Términos rigen el uso de ${SELLER} (el «Servicio»). Al usar el Servicio acepta estos Términos.</p>` },
      { heading: "2. El Servicio", body: `<p>${SELLER} es un servicio de información y alertas. <strong>No</strong> vendemos entradas: las compras se realizan en plataformas oficiales.</p>` },
      { heading: "3. Uso aceptable", body: `<p>No usará el Servicio de manera ilegal, fraudulenta ni abusiva, no enviará spam ni atacará la seguridad.</p>` },
      { heading: "4. Cuenta y seguridad", body: `<p>Es responsable de la confidencialidad de sus credenciales y de la actividad en su cuenta.</p>` },
      { heading: "5. Propiedad intelectual", body: `<p>${SELLER} y su software pertenecen a nosotros o a nuestros licenciantes. Le concedemos un derecho limitado, no exclusivo y no transferible de uso personal y no comercial.</p>` },
      { heading: "6. Suscripción Premium", body: `<p>${SELLER} Premium es una suscripción mensual (2,99 €) o anual (29 €) con renovación automática hasta su cancelación.</p>` },
      { heading: "7. Pagos — Paddle como Comerciante Registrado", body: `<p>El proceso de pedido lo gestiona ${paddleLink}, Comerciante Registrado de todos los pedidos. Las condiciones de pago se rigen por las ${paddleBuyerLink} de Paddle.</p>` },
      { heading: "8. Reembolsos", body: `<p>Consulte nuestra <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Política de reembolso</a>. Garantía de 30 días.</p>` },
      { heading: "9. Disponibilidad del Servicio", body: `<p>No garantizamos que el Servicio sea ininterrumpido o sin errores.</p>` },
      { heading: "10. Limitación de responsabilidad", body: `<p>El Servicio se ofrece «tal cual». Nuestra responsabilidad agregada se limita a las cantidades pagadas en los 12 meses anteriores.</p>` },
      { heading: "11. Suspensión y terminación", body: `<p>Podemos suspender o cancelar su acceso por incumplimiento grave o riesgos de seguridad/fraude.</p>` },
      { heading: "12. Cambios", body: `<p>Podemos actualizar estos Términos. El uso continuado implica aceptación.</p>` },
      { heading: "13. Contacto", body: `<p>¿Preguntas? Escriba a ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Política de reembolso",
    lastUpdatedLabel: "Última actualización",
    sections: [
      { heading: "Garantía de devolución de 30 días", body: `<p>Si no está satisfecho con su suscripción ${SELLER} Premium, puede solicitar un reembolso completo dentro de los <strong>30 días</strong>.</p>` },
      { heading: "Cómo solicitar un reembolso", body: `<p>Los reembolsos los procesa Paddle, Comerciante Registrado:</p><ul><li>Visite ${paddleNetLink} y busque su pedido, o</li><li>Escríbanos a ${mail}.</li></ul>` },
      { heading: "Después de 30 días", body: `<p>Tras 30 días pueden concederse reembolsos en circunstancias excepcionales.</p>` },
      { heading: "Contacto", body: `<p>¿Preguntas? Escríbanos a ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   GERMAN
   ============================================================ */
const de: LegalCopy = {
  privacy: {
    title: "Datenschutzerklärung",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "1. Wer wir sind", body: `<p><strong>${SELLER}</strong> betreibt die App und Website ${SELLER}. Wir sind <strong>Verantwortlicher</strong> für die personenbezogenen Daten, die wir bei der Nutzung des Dienstes erheben.</p>` },
      { heading: "2. Welche Daten wir erheben", body: `<ul><li><strong>Kontodaten:</strong> E-Mail, Anzeigename, Passwort (gehasht), Avatar.</li><li><strong>Produktnutzung:</strong> verfolgte Spiele, Benachrichtigungseinstellungen, Umfragen, Punkte.</li><li><strong>Supportdaten:</strong> Nachrichten, Seite, Sprache, Nutzertyp.</li><li><strong>Technische Daten:</strong> Gerät, Browser, IP, Logs für Sicherheit und Debugging.</li></ul>` },
      { heading: "3. Zwecke und Rechtsgrundlagen", body: `<ul><li><strong>Bereitstellung des Dienstes</strong> — Vertragserfüllung.</li><li><strong>Verbesserung und Personalisierung</strong> — berechtigte Interessen.</li><li><strong>Kundensupport</strong> — Vertrag / berechtigte Interessen.</li><li><strong>Sicherheit und Betrugsprävention</strong> — berechtigte Interessen / Rechtspflicht.</li><li><strong>Marketing</strong> — nur mit Einwilligung.</li></ul>` },
      { heading: "4. Empfänger von Daten", body: `<ul><li><strong>Auftragsverarbeiter:</strong> Hosting (Lovable Cloud / Supabase), Analytik, E-Mail, Support.</li><li><strong>Zahlungsabwicklung — Paddle (Merchant of Record):</strong> Zahlungsdaten werden von ${paddlePrivacyLink} verarbeitet.</li><li><strong>Berater</strong> bei Bedarf.</li><li><strong>Behörden</strong> wenn gesetzlich erforderlich.</li></ul><p>Wir verkaufen Ihre Daten niemals.</p>` },
      { heading: "5. Internationale Übermittlungen", body: `<p>Bei Übermittlungen außerhalb des EWR setzen wir auf geeignete Garantien (Standardvertragsklauseln, Angemessenheitsbeschlüsse).</p>` },
      { heading: "6. Speicherdauer", body: `<p>Wir speichern Daten nur so lange, wie es zur Erbringung des Dienstes und zur Erfüllung gesetzlicher Pflichten erforderlich ist.</p>` },
      { heading: "7. Ihre Rechte", body: `<p>Nach DSGVO haben Sie Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit und Widerruf der Einwilligung. Wir antworten innerhalb von 1 Monat.</p><p>Anfragen bitte an ${mail}.</p>` },
      { heading: "8. Sicherheit", body: `<p>Wir setzen geeignete technische und organisatorische Maßnahmen ein.</p>` },
      { heading: "9. Cookies", body: `<p>Wir verwenden nur essenzielle Cookies. Marketing-Cookies nur mit Einwilligung.</p>` },
      { heading: "10. Kontakt", body: `<p>Datenschutzfragen an ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Allgemeine Geschäftsbedingungen",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "1. Wer wir sind", body: `<p>Diese AGB regeln Ihre Nutzung von ${SELLER} (der „Dienst"). Mit der Nutzung akzeptieren Sie diese AGB.</p>` },
      { heading: "2. Der Dienst", body: `<p>${SELLER} ist ein Informations- und Benachrichtigungsdienst. Wir verkaufen <strong>keine</strong> Tickets — Käufe erfolgen direkt über offizielle Plattformen.</p>` },
      { heading: "3. Zulässige Nutzung", body: `<p>Sie nutzen den Dienst nicht rechtswidrig, betrügerisch oder missbräuchlich; kein Spam; keine Sicherheitsangriffe.</p>` },
      { heading: "4. Konto und Sicherheit", body: `<p>Sie sind für die Vertraulichkeit Ihrer Zugangsdaten und Aktivitäten verantwortlich.</p>` },
      { heading: "5. Geistiges Eigentum", body: `<p>${SELLER} und alle Inhalte gehören uns oder unseren Lizenzgebern. Sie erhalten ein eingeschränktes, nicht exklusives Nutzungsrecht.</p>` },
      { heading: "6. Premium-Abonnement", body: `<p>${SELLER} Premium ist ein wiederkehrendes Abo, monatlich (2,99 €) oder jährlich (29 €), mit automatischer Verlängerung bis zur Kündigung.</p>` },
      { heading: "7. Zahlungen — Paddle als Merchant of Record", body: `<p>Bestellungen werden über ${paddleLink} abgewickelt. Es gelten die ${paddleBuyerLink} von Paddle.</p>` },
      { heading: "8. Rückerstattungen", body: `<p>Siehe <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Rückerstattungsrichtlinie</a>. 30-Tage-Geld-zurück-Garantie.</p>` },
      { heading: "9. Verfügbarkeit", body: `<p>Wir garantieren keine unterbrechungsfreie oder fehlerfreie Verfügbarkeit.</p>` },
      { heading: "10. Haftung", body: `<p>Der Dienst wird „wie besehen" bereitgestellt. Unsere Haftung ist auf die in den letzten 12 Monaten gezahlten Gebühren begrenzt.</p>` },
      { heading: "11. Sperrung und Kündigung", body: `<p>Wir können den Zugang bei schweren Verstößen sperren oder kündigen.</p>` },
      { heading: "12. Änderungen", body: `<p>Wir können diese AGB aktualisieren. Fortgesetzte Nutzung gilt als Zustimmung.</p>` },
      { heading: "13. Kontakt", body: `<p>Fragen an ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Rückerstattungsrichtlinie",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    sections: [
      { heading: "30-Tage-Geld-zurück-Garantie", body: `<p>Wenn Sie mit Ihrem ${SELLER} Premium-Abo nicht zufrieden sind, erhalten Sie innerhalb von <strong>30 Tagen</strong> eine vollständige Rückerstattung — ohne Rückfragen.</p>` },
      { heading: "Rückerstattung anfordern", body: `<p>Rückerstattungen werden von Paddle abgewickelt:</p><ul><li>Besuchen Sie ${paddleNetLink} und suchen Sie Ihre Bestellung, oder</li><li>Schreiben Sie an ${mail}.</li></ul>` },
      { heading: "Nach 30 Tagen", body: `<p>Nach 30 Tagen sind Rückerstattungen in Ausnahmefällen möglich.</p>` },
      { heading: "Kontakt", body: `<p>Fragen an ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   ITALIAN
   ============================================================ */
const it: LegalCopy = {
  privacy: {
    title: "Informativa sulla privacy",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "1. Chi siamo", body: `<p><strong>${SELLER}</strong> gestisce l'app e il sito ${SELLER} e agisce come <strong>titolare del trattamento</strong> dei dati personali raccolti.</p>` },
      { heading: "2. Dati raccolti", body: `<ul><li><strong>Dati account:</strong> e-mail, nome, password (hashata), avatar.</li><li><strong>Uso del prodotto:</strong> partite seguite, preferenze, sondaggi, punti.</li><li><strong>Dati di supporto:</strong> messaggi, pagina, lingua, tipo utente.</li><li><strong>Dati tecnici:</strong> dispositivo, browser, IP, log per sicurezza e debug.</li></ul>` },
      { heading: "3. Finalità e basi giuridiche", body: `<ul><li><strong>Erogazione del Servizio</strong> — esecuzione del contratto.</li><li><strong>Miglioramento e personalizzazione</strong> — legittimo interesse.</li><li><strong>Assistenza clienti</strong> — contratto / legittimo interesse.</li><li><strong>Sicurezza e antifrode</strong> — legittimo interesse / obbligo di legge.</li><li><strong>Marketing</strong> — solo con consenso.</li></ul>` },
      { heading: "4. A chi comunichiamo i dati", body: `<ul><li><strong>Fornitori / responsabili:</strong> hosting (Lovable Cloud / Supabase), analitica, e-mail, supporto.</li><li><strong>Pagamenti — Paddle (Merchant of Record):</strong> i dati di pagamento sono trattati da ${paddlePrivacyLink}.</li><li><strong>Consulenti professionali</strong> se necessario.</li><li><strong>Autorità</strong> se richiesto dalla legge.</li></ul><p>Non vendiamo mai i tuoi dati.</p>` },
      { heading: "5. Trasferimenti internazionali", body: `<p>Per i trasferimenti fuori SEE applichiamo garanzie adeguate (Clausole Contrattuali Standard).</p>` },
      { heading: "6. Conservazione", body: `<p>Conserviamo i dati per il tempo necessario all'erogazione del Servizio e agli obblighi di legge.</p>` },
      { heading: "7. I tuoi diritti", body: `<p>Ai sensi del GDPR hai diritto di accesso, rettifica, cancellazione, limitazione, opposizione, portabilità e revoca del consenso. Rispondiamo entro 1 mese.</p><p>Per esercitare i diritti scrivi a ${mail}.</p>` },
      { heading: "8. Sicurezza", body: `<p>Adottiamo misure tecniche e organizzative adeguate.</p>` },
      { heading: "9. Cookie", body: `<p>Usiamo solo cookie essenziali. Nessun cookie di marketing senza consenso.</p>` },
      { heading: "10. Contatti", body: `<p>Domande? Scrivi a ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Termini e Condizioni",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "1. Chi siamo", body: `<p>I presenti Termini regolano l'uso di ${SELLER} (il «Servizio»). Usando il Servizio accetti i Termini.</p>` },
      { heading: "2. Il Servizio", body: `<p>${SELLER} è un servizio informativo e di alert. <strong>Non</strong> vendiamo biglietti: gli acquisti avvengono sulle piattaforme ufficiali.</p>` },
      { heading: "3. Uso accettabile", body: `<p>Non userai il Servizio in modo illegale, fraudolento o abusivo. Niente spam, niente attacchi alla sicurezza.</p>` },
      { heading: "4. Account e sicurezza", body: `<p>Sei responsabile della riservatezza delle credenziali e dell'attività sul tuo account.</p>` },
      { heading: "5. Proprietà intellettuale", body: `<p>${SELLER} e il software sono di nostra proprietà o dei nostri licenzianti. Ti concediamo un diritto limitato, non esclusivo e non trasferibile di uso personale.</p>` },
      { heading: "6. Abbonamento Premium", body: `<p>${SELLER} Premium è un abbonamento ricorrente mensile (2,99 €) o annuale (29 €) con rinnovo automatico fino alla disdetta.</p>` },
      { heading: "7. Pagamenti — Paddle Merchant of Record", body: `<p>Gli ordini sono gestiti da ${paddleLink}, Merchant of Record di tutti gli ordini. Si applicano i ${paddleBuyerLink} di Paddle.</p>` },
      { heading: "8. Rimborsi", body: `<p>Vedi la <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Politica di rimborso</a>. Garanzia 30 giorni.</p>` },
      { heading: "9. Disponibilità", body: `<p>Non garantiamo che il Servizio sia ininterrotto o privo di errori.</p>` },
      { heading: "10. Limitazione di responsabilità", body: `<p>Il Servizio è fornito «così com'è». La nostra responsabilità aggregata è limitata ai canoni pagati negli ultimi 12 mesi.</p>` },
      { heading: "11. Sospensione e risoluzione", body: `<p>Possiamo sospendere o risolvere l'accesso per gravi violazioni o rischi di sicurezza/frode.</p>` },
      { heading: "12. Modifiche", body: `<p>Possiamo aggiornare i Termini. L'uso continuato implica accettazione.</p>` },
      { heading: "13. Contatti", body: `<p>Domande? Scrivi a ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Politica di rimborso",
    lastUpdatedLabel: "Ultimo aggiornamento",
    sections: [
      { heading: "Garanzia soddisfatti o rimborsati di 30 giorni", body: `<p>Se non sei soddisfatto del tuo abbonamento ${SELLER} Premium puoi richiedere un rimborso completo entro <strong>30 giorni</strong>.</p>` },
      { heading: "Come richiedere un rimborso", body: `<p>I rimborsi sono gestiti da Paddle:</p><ul><li>Visita ${paddleNetLink} e cerca il tuo ordine, oppure</li><li>Scrivi a ${mail}.</li></ul>` },
      { heading: "Dopo 30 giorni", body: `<p>Oltre i 30 giorni i rimborsi sono possibili in casi eccezionali.</p>` },
      { heading: "Contatti", body: `<p>Domande? Scrivi a ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   PORTUGUESE
   ============================================================ */
const pt: LegalCopy = {
  privacy: {
    title: "Política de Privacidade",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "1. Quem somos", body: `<p><strong>${SELLER}</strong> opera a app e o site ${SELLER} e atua como <strong>responsável pelo tratamento</strong> dos dados pessoais recolhidos.</p>` },
      { heading: "2. Dados que recolhemos", body: `<ul><li><strong>Dados de conta:</strong> e-mail, nome, palavra-passe (com hash), avatar.</li><li><strong>Uso do produto:</strong> jogos seguidos, preferências, sondagens, pontos.</li><li><strong>Dados de suporte:</strong> mensagens, página, idioma, tipo de utilizador.</li><li><strong>Dados técnicos:</strong> dispositivo, browser, IP, registos para segurança e depuração.</li></ul>` },
      { heading: "3. Finalidades e base legal", body: `<ul><li><strong>Prestar o Serviço</strong> — execução do contrato.</li><li><strong>Melhorar e personalizar</strong> — interesse legítimo.</li><li><strong>Apoio ao cliente</strong> — contrato / interesse legítimo.</li><li><strong>Segurança e prevenção de fraude</strong> — interesse legítimo / obrigação legal.</li><li><strong>Marketing</strong> — apenas com consentimento.</li></ul>` },
      { heading: "4. Com quem partilhamos dados", body: `<ul><li><strong>Fornecedores / subcontratantes:</strong> alojamento (Lovable Cloud / Supabase), analítica, e-mail, suporte.</li><li><strong>Pagamentos — Paddle (Merchant of Record):</strong> os dados de pagamento são tratados pela ${paddlePrivacyLink}.</li><li><strong>Consultores profissionais</strong> quando necessário.</li><li><strong>Autoridades</strong> quando exigido por lei.</li></ul><p>Nunca vendemos os seus dados.</p>` },
      { heading: "5. Transferências internacionais", body: `<p>Para transferências fora do EEE aplicamos salvaguardas adequadas (Cláusulas Contratuais-Tipo).</p>` },
      { heading: "6. Prazo de conservação", body: `<p>Conservamos dados apenas pelo tempo necessário para prestar o Serviço e cumprir obrigações legais.</p>` },
      { heading: "7. Os seus direitos", body: `<p>Nos termos do RGPD tem direitos de acesso, retificação, apagamento, limitação, oposição, portabilidade e retirada do consentimento. Respondemos em 1 mês.</p><p>Para exercer escreva para ${mail}.</p>` },
      { heading: "8. Segurança", body: `<p>Aplicamos medidas técnicas e organizativas adequadas.</p>` },
      { heading: "9. Cookies", body: `<p>Usamos apenas cookies essenciais. Sem cookies de marketing sem consentimento.</p>` },
      { heading: "10. Contacto", body: `<p>Dúvidas? Escreva para ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Termos e Condições",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "1. Quem somos", body: `<p>Estes Termos regem o uso de ${SELLER} (o «Serviço»). Ao usar o Serviço aceita estes Termos.</p>` },
      { heading: "2. O Serviço", body: `<p>${SELLER} é um serviço de informação e alertas. <strong>Não</strong> vendemos bilhetes: as compras são feitas em plataformas oficiais.</p>` },
      { heading: "3. Uso aceitável", body: `<p>Não usará o Serviço de forma ilegal, fraudulenta ou abusiva, sem spam, sem ataques à segurança.</p>` },
      { heading: "4. Conta e segurança", body: `<p>É responsável pela confidencialidade das suas credenciais e pela atividade na conta.</p>` },
      { heading: "5. Propriedade intelectual", body: `<p>${SELLER} e o software são da nossa propriedade ou dos nossos licenciantes. Concedemos-lhe um direito limitado, não exclusivo e não transferível de uso pessoal.</p>` },
      { heading: "6. Subscrição Premium", body: `<p>${SELLER} Premium é uma subscrição recorrente mensal (2,99 €) ou anual (29 €) com renovação automática até cancelar.</p>` },
      { heading: "7. Pagamentos — Paddle como Merchant of Record", body: `<p>Os pedidos são processados por ${paddleLink}. Aplicam-se os ${paddleBuyerLink} da Paddle.</p>` },
      { heading: "8. Reembolsos", body: `<p>Veja a <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Política de reembolso</a>. Garantia de 30 dias.</p>` },
      { heading: "9. Disponibilidade", body: `<p>Não garantimos que o Serviço seja ininterrupto ou sem erros.</p>` },
      { heading: "10. Limitação de responsabilidade", body: `<p>O Serviço é fornecido «tal como está». A nossa responsabilidade está limitada às quantias pagas nos 12 meses anteriores.</p>` },
      { heading: "11. Suspensão e cessação", body: `<p>Podemos suspender ou cessar o acesso por violações graves ou riscos de segurança/fraude.</p>` },
      { heading: "12. Alterações", body: `<p>Podemos atualizar estes Termos. O uso continuado implica aceitação.</p>` },
      { heading: "13. Contacto", body: `<p>Dúvidas? Escreva para ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Política de Reembolso",
    lastUpdatedLabel: "Última atualização",
    sections: [
      { heading: "Garantia de devolução de 30 dias", body: `<p>Se não estiver satisfeito com a sua subscrição ${SELLER} Premium pode solicitar um reembolso integral em <strong>30 dias</strong>.</p>` },
      { heading: "Como pedir um reembolso", body: `<p>Os reembolsos são processados pela Paddle:</p><ul><li>Visite ${paddleNetLink} e procure o seu pedido, ou</li><li>Escreva para ${mail}.</li></ul>` },
      { heading: "Após 30 dias", body: `<p>Após 30 dias podem ser concedidos reembolsos em casos excecionais.</p>` },
      { heading: "Contacto", body: `<p>Dúvidas? Escreva para ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   DUTCH
   ============================================================ */
const nl: LegalCopy = {
  privacy: {
    title: "Privacyverklaring",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "1. Wie zijn wij", body: `<p><strong>${SELLER}</strong> exploiteert de ${SELLER} app en website en treedt op als <strong>verwerkingsverantwoordelijke</strong> voor de persoonsgegevens die we over u verzamelen.</p>` },
      { heading: "2. Welke gegevens we verzamelen", body: `<ul><li><strong>Accountgegevens:</strong> e-mail, weergavenaam, wachtwoord (gehasht), avatar.</li><li><strong>Productgebruik:</strong> gevolgde wedstrijden, voorkeuren, peilingen, punten.</li><li><strong>Supportgegevens:</strong> berichten, pagina, taal, gebruikerstype.</li><li><strong>Technische gegevens:</strong> apparaat, browser, IP, logs voor beveiliging en debugging.</li></ul>` },
      { heading: "3. Doeleinden en grondslagen", body: `<ul><li><strong>Levering van de Dienst</strong> — uitvoering van de overeenkomst.</li><li><strong>Verbetering en personalisatie</strong> — gerechtvaardigd belang.</li><li><strong>Klantenondersteuning</strong> — overeenkomst / gerechtvaardigd belang.</li><li><strong>Beveiliging en fraudepreventie</strong> — gerechtvaardigd belang / wettelijke plicht.</li><li><strong>Marketing</strong> — alleen met toestemming.</li></ul>` },
      { heading: "4. Met wie we gegevens delen", body: `<ul><li><strong>Verwerkers:</strong> hosting (Lovable Cloud / Supabase), analytics, e-mail, support.</li><li><strong>Betalingen — Paddle (Merchant of Record):</strong> betalingsgegevens worden verwerkt door ${paddlePrivacyLink}.</li><li><strong>Adviseurs</strong> indien nodig.</li><li><strong>Autoriteiten</strong> indien wettelijk vereist.</li></ul><p>We verkopen uw gegevens nooit.</p>` },
      { heading: "5. Internationale doorgiften", body: `<p>Bij doorgifte buiten de EER passen we passende waarborgen toe (Standaardcontractbepalingen).</p>` },
      { heading: "6. Bewaartermijn", body: `<p>We bewaren gegevens alleen zo lang als nodig is voor de Dienst en wettelijke verplichtingen.</p>` },
      { heading: "7. Uw rechten", body: `<p>Op grond van de AVG heeft u recht op inzage, rectificatie, wissing, beperking, bezwaar, dataportabiliteit en intrekking van toestemming. We reageren binnen 1 maand.</p><p>Stuur uw verzoek naar ${mail}.</p>` },
      { heading: "8. Beveiliging", body: `<p>We treffen passende technische en organisatorische maatregelen.</p>` },
      { heading: "9. Cookies", body: `<p>We gebruiken alleen essentiële cookies. Geen marketingcookies zonder toestemming.</p>` },
      { heading: "10. Contact", body: `<p>Privacyvraag? Mail ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Algemene voorwaarden",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "1. Wie zijn wij", body: `<p>Deze voorwaarden regelen uw gebruik van ${SELLER} (de „Dienst"). Door de Dienst te gebruiken aanvaardt u deze voorwaarden.</p>` },
      { heading: "2. De Dienst", body: `<p>${SELLER} is een informatie- en alerteringsdienst. We verkopen <strong>geen</strong> tickets — aankopen verlopen via officiële platforms.</p>` },
      { heading: "3. Aanvaardbaar gebruik", body: `<p>U gebruikt de Dienst niet onwettig, frauduleus of misbruikend. Geen spam, geen beveiligingsaanvallen.</p>` },
      { heading: "4. Account en beveiliging", body: `<p>U bent verantwoordelijk voor de vertrouwelijkheid van uw inloggegevens en de activiteit op uw account.</p>` },
      { heading: "5. Intellectuele eigendom", body: `<p>${SELLER} en de software zijn ons eigendom of dat van onze licentiegevers. Wij verlenen u een beperkt, niet-exclusief en niet-overdraagbaar gebruiksrecht.</p>` },
      { heading: "6. Premium-abonnement", body: `<p>${SELLER} Premium is een terugkerend abonnement maandelijks (€ 2,99) of jaarlijks (€ 29) met automatische verlenging tot opzegging.</p>` },
      { heading: "7. Betalingen — Paddle als Merchant of Record", body: `<p>Bestellingen worden verwerkt door ${paddleLink}. De ${paddleBuyerLink} van Paddle zijn van toepassing.</p>` },
      { heading: "8. Terugbetalingen", body: `<p>Zie ons <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Restitutiebeleid</a>. 30 dagen niet-goed-geld-terug.</p>` },
      { heading: "9. Beschikbaarheid", body: `<p>We garanderen geen ononderbroken of foutloze beschikbaarheid.</p>` },
      { heading: "10. Aansprakelijkheid", body: `<p>De Dienst wordt geleverd „as is". Onze totale aansprakelijkheid is beperkt tot de bedragen die u in de afgelopen 12 maanden heeft betaald.</p>` },
      { heading: "11. Schorsing en beëindiging", body: `<p>We kunnen toegang opschorten of beëindigen bij ernstige overtredingen of beveiligings-/fraude-risico's.</p>` },
      { heading: "12. Wijzigingen", body: `<p>We kunnen deze voorwaarden bijwerken. Voortgezet gebruik betekent aanvaarding.</p>` },
      { heading: "13. Contact", body: `<p>Vragen? Mail ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Restitutiebeleid",
    lastUpdatedLabel: "Laatst bijgewerkt",
    sections: [
      { heading: "30 dagen niet-goed-geld-terug", body: `<p>Als u niet tevreden bent met uw ${SELLER} Premium-abonnement kunt u binnen <strong>30 dagen</strong> volledige terugbetaling vragen.</p>` },
      { heading: "Hoe terugbetaling aanvragen", body: `<p>Terugbetalingen worden verwerkt door Paddle:</p><ul><li>Bezoek ${paddleNetLink} en zoek uw bestelling, of</li><li>Mail ${mail}.</li></ul>` },
      { heading: "Na 30 dagen", body: `<p>Na 30 dagen zijn terugbetalingen in uitzonderlijke gevallen mogelijk.</p>` },
      { heading: "Contact", body: `<p>Vragen? Mail ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   ARABIC
   ============================================================ */
const ar: LegalCopy = {
  privacy: {
    title: "إشعار الخصوصية",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "1. من نحن", body: `<p>تُشغّل <strong>${SELLER}</strong> تطبيق وموقع ${SELLER} وتعمل بصفتها <strong>المتحكم في البيانات</strong> الشخصية التي نجمعها عنك عند استخدام الخدمة.</p>` },
      { heading: "2. البيانات التي نجمعها", body: `<ul><li><strong>بيانات الحساب:</strong> البريد الإلكتروني، الاسم، كلمة المرور (مشفّرة)، الصورة الرمزية.</li><li><strong>استخدام المنتج:</strong> المباريات المتابعة، تفضيلات الإشعارات، استطلاعات الرأي، النقاط.</li><li><strong>بيانات الدعم:</strong> الرسائل، الصفحة، اللغة، نوع المستخدم.</li><li><strong>بيانات تقنية:</strong> الجهاز، المتصفح، عنوان IP، السجلات للأمان وتصحيح الأخطاء.</li></ul>` },
      { heading: "3. الأغراض والأساس القانوني", body: `<ul><li><strong>تقديم الخدمة</strong> — تنفيذ العقد.</li><li><strong>التحسين والتخصيص</strong> — المصالح المشروعة.</li><li><strong>دعم العملاء</strong> — العقد / المصالح المشروعة.</li><li><strong>الأمان ومنع الاحتيال</strong> — المصالح المشروعة / الالتزام القانوني.</li><li><strong>التسويق</strong> — فقط بموافقتك.</li></ul>` },
      { heading: "4. مع من نشارك البيانات", body: `<ul><li><strong>مزودو الخدمات:</strong> الاستضافة (Lovable Cloud / Supabase)، التحليلات، البريد، الدعم.</li><li><strong>المدفوعات — Paddle:</strong> تتم معالجة بيانات الدفع بواسطة ${paddlePrivacyLink}.</li><li><strong>المستشارون</strong> عند الحاجة.</li><li><strong>السلطات</strong> عند طلب القانون.</li></ul><p>لا نبيع بياناتك أبدًا.</p>` },
      { heading: "5. التحويلات الدولية", body: `<p>عند نقل البيانات خارج المنطقة الاقتصادية الأوروبية، نعتمد على ضمانات مناسبة (الشروط التعاقدية القياسية).</p>` },
      { heading: "6. مدة الاحتفاظ", body: `<p>نحتفظ بالبيانات فقط للمدة اللازمة لتقديم الخدمة والامتثال للقانون.</p>` },
      { heading: "7. حقوقك", body: `<p>وفقًا للقانون المعمول به (بما في ذلك GDPR)، لديك الحق في الوصول والتصحيح والمحو والتقييد والاعتراض ونقل البيانات وسحب الموافقة. نرد خلال شهر واحد.</p><p>لممارسة هذه الحقوق راسلنا على ${mail}.</p>` },
      { heading: "8. الأمان", body: `<p>نطبق تدابير تقنية وتنظيمية مناسبة (التشفير، ضوابط الوصول).</p>` },
      { heading: "9. ملفات تعريف الارتباط", body: `<p>نستخدم ملفات تعريف ارتباط أساسية فقط. لا ملفات تسويقية بدون موافقتك.</p>` },
      { heading: "10. التواصل", body: `<p>أي سؤال خصوصية؟ راسلنا على ${mail}.</p>` },
    ],
  },
  terms: {
    title: "الشروط والأحكام",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "1. من نحن", body: `<p>تنظّم هذه الشروط استخدامك لـ ${SELLER} («الخدمة»). باستخدامك للخدمة فإنك توافق على هذه الشروط.</p>` },
      { heading: "2. الخدمة", body: `<p>${SELLER} خدمة معلومات وتنبيهات. <strong>لا</strong> نبيع التذاكر — تتم جميع عمليات الشراء عبر المنصات الرسمية.</p>` },
      { heading: "3. الاستخدام المقبول", body: `<p>لن تستخدم الخدمة بشكل غير قانوني أو احتيالي، ولن ترسل رسائل مزعجة أو تهاجم الأمان.</p>` },
      { heading: "4. الحساب والأمان", body: `<p>أنت مسؤول عن سرية بيانات الاعتماد وعن النشاط على حسابك.</p>` },
      { heading: "5. الملكية الفكرية", body: `<p>${SELLER} وبرنامجه ملك لنا أو لمرخّصينا. نمنحك حقًا محدودًا غير حصري وغير قابل للتحويل للاستخدام الشخصي.</p>` },
      { heading: "6. اشتراك Premium", body: `<p>${SELLER} Premium اشتراك متكرر شهري (2.99 €) أو سنوي (29 €) مع تجديد تلقائي حتى الإلغاء.</p>` },
      { heading: "7. المدفوعات — Paddle", body: `<p>تتم معالجة الطلبات بواسطة ${paddleLink}، التاجر الرسمي. تُطبق ${paddleBuyerLink} الخاصة بـ Paddle.</p>` },
      { heading: "8. المبالغ المستردة", body: `<p>راجع <a class="text-[#2ECC71] font-semibold" href="/refund-policy">سياسة الاسترداد</a>. ضمان 30 يومًا.</p>` },
      { heading: "9. توافر الخدمة", body: `<p>لا نضمن أن تكون الخدمة دون انقطاع أو أخطاء.</p>` },
      { heading: "10. حدود المسؤولية", body: `<p>تُقدَّم الخدمة «كما هي». مسؤوليتنا الإجمالية محدودة بالرسوم المدفوعة خلال آخر 12 شهرًا.</p>` },
      { heading: "11. التعليق والإنهاء", body: `<p>يمكننا تعليق أو إنهاء الوصول عند الانتهاكات الجسيمة أو مخاطر الأمان.</p>` },
      { heading: "12. التغييرات", body: `<p>قد نقوم بتحديث هذه الشروط. الاستخدام المستمر يعني القبول.</p>` },
      { heading: "13. التواصل", body: `<p>أسئلة؟ راسلنا على ${mail}.</p>` },
    ],
  },
  refund: {
    title: "سياسة الاسترداد",
    lastUpdatedLabel: "آخر تحديث",
    sections: [
      { heading: "ضمان استرداد خلال 30 يومًا", body: `<p>إذا لم تكن راضيًا عن اشتراك ${SELLER} Premium يمكنك طلب استرداد كامل خلال <strong>30 يومًا</strong>.</p>` },
      { heading: "كيفية طلب الاسترداد", body: `<p>تتم معالجة المبالغ المستردة بواسطة Paddle:</p><ul><li>قم بزيارة ${paddleNetLink} وابحث عن طلبك، أو</li><li>راسلنا على ${mail}.</li></ul>` },
      { heading: "بعد 30 يومًا", body: `<p>بعد 30 يومًا قد تُمنح المبالغ المستردة في حالات استثنائية.</p>` },
      { heading: "التواصل", body: `<p>أسئلة؟ راسلنا على ${mail}.</p>` },
    ],
  },
};

/* ============================================================
   RUSSIAN
   ============================================================ */
const ru: LegalCopy = {
  privacy: {
    title: "Политика конфиденциальности",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "1. Кто мы", body: `<p><strong>${SELLER}</strong> управляет приложением и сайтом ${SELLER} и выступает <strong>контролёром</strong> персональных данных, которые мы собираем при использовании Сервиса.</p>` },
      { heading: "2. Какие данные мы собираем", body: `<ul><li><strong>Данные аккаунта:</strong> e-mail, отображаемое имя, пароль (хешированный), аватар.</li><li><strong>Использование продукта:</strong> отслеживаемые матчи, настройки уведомлений, опросы, очки.</li><li><strong>Данные поддержки:</strong> сообщения, страница, язык, тип пользователя.</li><li><strong>Технические данные:</strong> устройство, браузер, IP, логи безопасности и отладки.</li></ul>` },
      { heading: "3. Цели и правовые основания", body: `<ul><li><strong>Предоставление Сервиса</strong> — исполнение договора.</li><li><strong>Улучшение и персонализация</strong> — законный интерес.</li><li><strong>Поддержка клиентов</strong> — договор / законный интерес.</li><li><strong>Безопасность и защита от мошенничества</strong> — законный интерес / правовая обязанность.</li><li><strong>Маркетинг</strong> — только с вашего согласия.</li></ul>` },
      { heading: "4. С кем мы делимся данными", body: `<ul><li><strong>Поставщики услуг:</strong> хостинг (Lovable Cloud / Supabase), аналитика, e-mail, поддержка.</li><li><strong>Платежи — Paddle (Merchant of Record):</strong> платежные данные обрабатывает ${paddlePrivacyLink}.</li><li><strong>Профессиональные консультанты</strong> при необходимости.</li><li><strong>Государственные органы</strong> по требованию закона.</li></ul><p>Мы никогда не продаём ваши данные.</p>` },
      { heading: "5. Международная передача", body: `<p>При передаче данных за пределы EEA мы применяем надлежащие гарантии (стандартные договорные положения).</p>` },
      { heading: "6. Срок хранения", body: `<p>Мы храним данные только в течение срока, необходимого для оказания Сервиса и соблюдения законов.</p>` },
      { heading: "7. Ваши права", body: `<p>Согласно применимому праву (включая GDPR) у вас есть право на доступ, исправление, удаление, ограничение, возражение, переносимость данных и отзыв согласия. Мы отвечаем в течение 1 месяца.</p><p>Запросы — на ${mail}.</p>` },
      { heading: "8. Безопасность", body: `<p>Мы применяем надлежащие технические и организационные меры.</p>` },
      { heading: "9. Cookies", body: `<p>Мы используем только необходимые cookies. Маркетинговые — только с согласия.</p>` },
      { heading: "10. Контакты", body: `<p>Вопросы по конфиденциальности? Пишите на ${mail}.</p>` },
    ],
  },
  terms: {
    title: "Условия использования",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "1. Кто мы", body: `<p>Эти Условия регулируют использование ${SELLER} («Сервис»). Используя Сервис, вы соглашаетесь с этими Условиями.</p>` },
      { heading: "2. Сервис", body: `<p>${SELLER} — информационно-уведомительный сервис. Мы <strong>не</strong> продаём билеты — все покупки совершаются на официальных платформах.</p>` },
      { heading: "3. Допустимое использование", body: `<p>Не использовать Сервис в незаконных, мошеннических или злонамеренных целях, не рассылать спам, не атаковать безопасность.</p>` },
      { heading: "4. Учётная запись и безопасность", body: `<p>Вы отвечаете за конфиденциальность данных входа и активность в учётной записи.</p>` },
      { heading: "5. Интеллектуальная собственность", body: `<p>${SELLER} и ПО принадлежат нам или нашим лицензиарам. Мы предоставляем ограниченное, неисключительное, непередаваемое право личного использования.</p>` },
      { heading: "6. Подписка Premium", body: `<p>${SELLER} Premium — повторяющаяся подписка ежемесячно (2,99 €) или ежегодно (29 €) с автоматическим продлением до отмены.</p>` },
      { heading: "7. Платежи — Paddle как Merchant of Record", body: `<p>Заказы обрабатываются через ${paddleLink}. Применяются ${paddleBuyerLink} Paddle.</p>` },
      { heading: "8. Возвраты", body: `<p>Смотрите <a class="text-[#2ECC71] font-semibold" href="/refund-policy">Политику возвратов</a>. Гарантия 30 дней.</p>` },
      { heading: "9. Доступность", body: `<p>Мы не гарантируем бесперебойную или безошибочную работу Сервиса.</p>` },
      { heading: "10. Ограничение ответственности", body: `<p>Сервис предоставляется «как есть». Совокупная ответственность ограничена суммами, уплаченными за последние 12 месяцев.</p>` },
      { heading: "11. Приостановка и прекращение", body: `<p>Мы можем приостановить или прекратить доступ при серьёзных нарушениях или рисках безопасности/мошенничества.</p>` },
      { heading: "12. Изменения", body: `<p>Мы можем обновлять эти Условия. Продолжение использования означает согласие.</p>` },
      { heading: "13. Контакты", body: `<p>Вопросы? Пишите на ${mail}.</p>` },
    ],
  },
  refund: {
    title: "Политика возвратов",
    lastUpdatedLabel: "Последнее обновление",
    sections: [
      { heading: "Гарантия возврата 30 дней", body: `<p>Если вас не устроила подписка ${SELLER} Premium, вы можете запросить полный возврат в течение <strong>30 дней</strong>.</p>` },
      { heading: "Как запросить возврат", body: `<p>Возвраты обрабатывает Paddle:</p><ul><li>Зайдите на ${paddleNetLink} и найдите свой заказ, либо</li><li>Напишите на ${mail}.</li></ul>` },
      { heading: "После 30 дней", body: `<p>Спустя 30 дней возвраты возможны в исключительных случаях.</p>` },
      { heading: "Контакты", body: `<p>Вопросы? Пишите на ${mail}.</p>` },
    ],
  },
};

export const legalContent: Record<Locale, LegalCopy> = {
  en, fr, es, de, it, pt, nl, ar, ru,
};

export const getLegalCopy = (locale: Locale): LegalCopy => legalContent[locale] ?? legalContent.en;
