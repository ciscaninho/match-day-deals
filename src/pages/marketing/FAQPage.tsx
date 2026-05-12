import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEffect } from "react";
import type { Locale } from "@/i18n/translations";
import { PageHero, PageSection } from "@/components/layout/Page";

type FaqItem = { q: string; a: string };

const FAQS: Record<Locale, { title: string; subtitle: string; items: FaqItem[] }> = {
  en: {
    title: "Frequently asked questions",
    subtitle: "Everything you need to know before opening the app.",
    items: [
      { q: "Do you sell tickets?", a: "No. Foot Ticket Finder is a discovery and alert service. We guide you to the official ticket platforms — clubs, federations, UEFA and FIFA — so you can buy directly from them." },
      { q: "Which competitions are covered?", a: "Top 5 European leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), the UEFA Champions League, plus major international competitions and finals." },
      { q: "How do I get notified when tickets go on sale?", a: "Open the app, follow the matches you're interested in, and enable alerts in your profile. We'll notify you the moment the official sale opens." },
      { q: "Is the app free?", a: "Yes. The core experience is free forever. Premium adds priority alerts, removes ads and unlocks early access to ticket releases." },
      { q: "Are the ticket sources verified?", a: "We only list official sources: club websites, federations, UEFA and FIFA. We never recommend shady resellers." },
      { q: "How accurate are ticket release dates?", a: "We monitor official announcements and update release dates as soon as they're confirmed. For unconfirmed dates we show estimates and update them when official." },
    ],
  },
  fr: {
    title: "Questions fréquentes",
    subtitle: "Tout ce qu'il faut savoir avant d'ouvrir l'application.",
    items: [
      { q: "Vendez-vous des billets ?", a: "Non. Foot Ticket Finder est un service de découverte et d'alertes. Nous vous orientons vers les plateformes officielles — clubs, fédérations, UEFA et FIFA — pour acheter directement chez elles." },
      { q: "Quelles compétitions sont couvertes ?", a: "Les 5 grands championnats européens (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), la Ligue des Champions de l'UEFA, ainsi que les grandes compétitions internationales et finales." },
      { q: "Comment être prévenu lors de la mise en vente ?", a: "Ouvrez l'application, suivez les matchs qui vous intéressent et activez les alertes dans votre profil. Vous serez notifié dès l'ouverture officielle de la billetterie." },
      { q: "L'application est-elle gratuite ?", a: "Oui. L'expérience principale est gratuite à vie. Premium ajoute des alertes prioritaires, supprime les pubs et offre un accès anticipé aux mises en vente." },
      { q: "Les sources de billets sont-elles vérifiées ?", a: "Nous ne référençons que des sources officielles : sites de clubs, fédérations, UEFA et FIFA. Jamais de revendeurs douteux." },
      { q: "Les dates de mise en vente sont-elles fiables ?", a: "Nous suivons les annonces officielles et mettons à jour les dates dès leur confirmation. Pour les dates non confirmées, nous affichons des estimations actualisées dès l'officialisation." },
    ],
  },
  es: {
    title: "Preguntas frecuentes",
    subtitle: "Todo lo que necesitas saber antes de abrir la aplicación.",
    items: [
      { q: "¿Vendéis entradas?", a: "No. Foot Ticket Finder es un servicio de descubrimiento y alertas. Te guiamos a las plataformas oficiales — clubes, federaciones, UEFA y FIFA — para comprar directamente." },
      { q: "¿Qué competiciones se cubren?", a: "Las 5 grandes ligas europeas (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), la UEFA Champions League y grandes competiciones internacionales." },
      { q: "¿Cómo recibo aviso cuando salen las entradas?", a: "Abre la app, sigue los partidos que te interesen y activa las alertas en tu perfil. Te avisamos en cuanto se abra la venta oficial." },
      { q: "¿La app es gratuita?", a: "Sí. La experiencia principal es gratis para siempre. Premium añade alertas prioritarias, sin anuncios y acceso anticipado." },
      { q: "¿Las fuentes están verificadas?", a: "Solo listamos fuentes oficiales: webs de clubes, federaciones, UEFA y FIFA. Nunca revendedores dudosos." },
      { q: "¿Son fiables las fechas de venta?", a: "Seguimos los anuncios oficiales y actualizamos las fechas cuando se confirman. Mostramos estimaciones para las no confirmadas." },
    ],
  },
  de: {
    title: "Häufig gestellte Fragen",
    subtitle: "Alles, was du wissen musst, bevor du die App öffnest.",
    items: [
      { q: "Verkauft ihr Tickets?", a: "Nein. Foot Ticket Finder ist ein Such- und Benachrichtigungsdienst. Wir leiten dich zu den offiziellen Plattformen — Vereine, Verbände, UEFA und FIFA." },
      { q: "Welche Wettbewerbe sind abgedeckt?", a: "Die Top-5-Ligen Europas (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), die UEFA Champions League und große internationale Wettbewerbe." },
      { q: "Wie werde ich beim Verkaufsstart benachrichtigt?", a: "Öffne die App, folge deinen Spielen und aktiviere Benachrichtigungen in deinem Profil. Wir informieren dich bei offiziellem Verkaufsstart." },
      { q: "Ist die App kostenlos?", a: "Ja. Die Kernfunktionen sind für immer kostenlos. Premium bietet priorisierte Alerts, keine Werbung und frühzeitigen Zugang." },
      { q: "Sind die Quellen verifiziert?", a: "Wir listen ausschließlich offizielle Quellen: Vereins-Websites, Verbände, UEFA und FIFA. Keine zwielichtigen Wiederverkäufer." },
      { q: "Wie genau sind die Verkaufstermine?", a: "Wir überwachen offizielle Ankündigungen und aktualisieren die Termine, sobald sie bestätigt sind." },
    ],
  },
  it: {
    title: "Domande frequenti",
    subtitle: "Tutto ciò che devi sapere prima di aprire l'app.",
    items: [
      { q: "Vendete biglietti?", a: "No. Foot Ticket Finder è un servizio di ricerca e avvisi. Ti indirizziamo alle piattaforme ufficiali — club, federazioni, UEFA e FIFA." },
      { q: "Quali competizioni sono coperte?", a: "I 5 maggiori campionati europei (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), la UEFA Champions League e le principali competizioni internazionali." },
      { q: "Come ricevo l'avviso quando aprono le vendite?", a: "Apri l'app, segui le partite che ti interessano e attiva gli avvisi nel profilo. Ti notifichiamo all'apertura ufficiale." },
      { q: "L'app è gratuita?", a: "Sì. L'esperienza principale è gratis per sempre. Premium aggiunge avvisi prioritari, niente pubblicità e accesso anticipato." },
      { q: "Le fonti sono verificate?", a: "Elenchiamo solo fonti ufficiali: siti dei club, federazioni, UEFA e FIFA. Mai rivenditori sospetti." },
      { q: "Le date di vendita sono affidabili?", a: "Monitoriamo gli annunci ufficiali e aggiorniamo le date appena confermate." },
    ],
  },
  pt: {
    title: "Perguntas frequentes",
    subtitle: "Tudo o que precisa saber antes de abrir a aplicação.",
    items: [
      { q: "Vendem bilhetes?", a: "Não. Foot Ticket Finder é um serviço de descoberta e alertas. Encaminhamo-lo para as plataformas oficiais — clubes, federações, UEFA e FIFA." },
      { q: "Que competições estão cobertas?", a: "As 5 grandes ligas europeias (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), a UEFA Champions League e grandes competições internacionais." },
      { q: "Como sou notificado quando os bilhetes saem?", a: "Abra a app, siga os jogos que lhe interessam e ative os alertas no perfil. Avisamos no momento da abertura oficial." },
      { q: "A app é gratuita?", a: "Sim. A experiência principal é grátis para sempre. Premium adiciona alertas prioritários, sem anúncios e acesso antecipado." },
      { q: "As fontes são verificadas?", a: "Listamos apenas fontes oficiais: sites de clubes, federações, UEFA e FIFA. Nunca revendedores suspeitos." },
      { q: "As datas de venda são fiáveis?", a: "Acompanhamos os anúncios oficiais e atualizamos as datas assim que confirmadas." },
    ],
  },
  nl: {
    title: "Veelgestelde vragen",
    subtitle: "Alles wat je moet weten voordat je de app opent.",
    items: [
      { q: "Verkopen jullie tickets?", a: "Nee. Foot Ticket Finder is een ontdek- en meldingsdienst. We leiden je naar de officiële platforms — clubs, federaties, UEFA en FIFA." },
      { q: "Welke competities zijn gedekt?", a: "De top 5 Europese competities (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), de UEFA Champions League en grote internationale toernooien." },
      { q: "Hoe word ik gewaarschuwd bij ticketverkoop?", a: "Open de app, volg de wedstrijden die je interesseren en activeer meldingen in je profiel. We waarschuwen je bij de officiële opening." },
      { q: "Is de app gratis?", a: "Ja. De kernervaring is voor altijd gratis. Premium biedt prioriteitsmeldingen, geen advertenties en vroege toegang." },
      { q: "Zijn de bronnen geverifieerd?", a: "We tonen alleen officiële bronnen: clubwebsites, federaties, UEFA en FIFA. Nooit dubieuze doorverkopers." },
      { q: "Hoe nauwkeurig zijn de verkoopdata?", a: "We volgen officiële aankondigingen en werken data bij zodra ze bevestigd zijn." },
    ],
  },
  ar: {
    title: "الأسئلة الشائعة",
    subtitle: "كل ما تحتاج معرفته قبل فتح التطبيق.",
    items: [
      { q: "هل تبيعون التذاكر؟", a: "لا. Foot Ticket Finder هو خدمة اكتشاف وتنبيهات. نوجّهك إلى المنصّات الرسمية — الأندية والاتحادات و UEFA و FIFA — للشراء مباشرة." },
      { q: "ما هي المسابقات المغطّاة؟", a: "الدوريات الأوروبية الخمسة الكبرى (البريميرليغ، لاليغا، السيري آ، البوندسليغا، الليغ 1) ودوري أبطال أوروبا والمسابقات الدولية الكبرى." },
      { q: "كيف أتلقّى إشعار البيع؟", a: "افتح التطبيق، تابع المباريات التي تهمّك وفعّل التنبيهات في ملفك. سنخبرك فور فتح البيع الرسمي." },
      { q: "هل التطبيق مجاني؟", a: "نعم. التجربة الأساسية مجانية للأبد. Premium يضيف تنبيهات أولوية، يزيل الإعلانات ويمنح وصولاً مبكراً." },
      { q: "هل المصادر موثّقة؟", a: "نعرض فقط المصادر الرسمية: مواقع الأندية، الاتحادات، UEFA و FIFA. لا وسطاء مشبوهين." },
      { q: "ما مدى دقة تواريخ البيع؟", a: "نتابع الإعلانات الرسمية ونحدّث التواريخ فور تأكيدها." },
    ],
  },
  ru: {
    title: "Часто задаваемые вопросы",
    subtitle: "Всё, что нужно знать перед использованием приложения.",
    items: [
      { q: "Вы продаёте билеты?", a: "Нет. Foot Ticket Finder — сервис поиска и уведомлений. Мы направляем вас на официальные платформы — клубы, федерации, UEFA и FIFA." },
      { q: "Какие соревнования охвачены?", a: "Топ-5 европейских лиг (АПЛ, Ла Лига, Серия А, Бундеслига, Лига 1), Лига чемпионов UEFA и крупные международные турниры." },
      { q: "Как получить уведомление о продаже?", a: "Откройте приложение, отслеживайте интересные матчи и включите уведомления в профиле. Мы сообщим в момент открытия официальных продаж." },
      { q: "Приложение бесплатное?", a: "Да. Базовый функционал бесплатен навсегда. Premium добавляет приоритетные уведомления, убирает рекламу и даёт ранний доступ." },
      { q: "Источники проверены?", a: "Мы показываем только официальные источники: сайты клубов, федерации, UEFA и FIFA. Никаких сомнительных перекупщиков." },
      { q: "Насколько точны даты продаж?", a: "Мы отслеживаем официальные анонсы и обновляем даты сразу после подтверждения." },
    ],
  },
};

const FAQPage = () => {
  const { locale, dir } = useLanguage();
  const data = FAQS[locale] || FAQS.en;

  useEffect(() => {
    document.title = `${data.title} · Foot Ticket Finder`;
    const desc = data.subtitle.slice(0, 155);
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [data]);

  return (
    <MarketingLayout>
      <div dir={dir}>
        <PageHero title={data.title} subtitle={data.subtitle} />

        <PageSection tone="white" width="narrow">
          <Accordion type="single" collapsible className="w-full">
            {data.items.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-bold text-[#2C3E50]">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[#2C3E50]/70 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PageSection>
      </div>
    </MarketingLayout>
  );
};

export default FAQPage;
