import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do you sell tickets?",
    a: "No. Foot Ticket Finder is a discovery and alert service. We guide you to the official ticket platforms — clubs, federations, UEFA and FIFA — so you can buy directly from them.",
  },
  {
    q: "Which competitions are covered?",
    a: "Top 5 European leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1), the UEFA Champions League, plus major international competitions and finals.",
  },
  {
    q: "How do I get notified when tickets go on sale?",
    a: "Open the app, follow the matches you're interested in, and enable alerts in your profile. We'll notify you the moment the official sale opens.",
  },
  {
    q: "Is the app free?",
    a: "Yes. The core experience is free forever. Premium adds priority alerts, removes ads and unlocks early access to ticket releases.",
  },
  {
    q: "Are the ticket sources verified?",
    a: "We only list official sources: club websites, federations, UEFA and FIFA. We never recommend shady resellers.",
  },
  {
    q: "How accurate are ticket release dates?",
    a: "We monitor official announcements and update release dates as soon as they're confirmed. For unconfirmed dates we show estimates and update them when official.",
  },
];

const FAQPage = () => (
  <MarketingLayout>
    <section className="bg-gradient-to-br from-[#2C3E50] via-[#243342] to-[#1a2530] text-white">
      <div className="max-w-4xl mx-auto px-5 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Frequently asked questions</h1>
        <p className="mt-5 text-white/70 text-lg max-w-2xl mx-auto">
          Everything you need to know before opening the app.
        </p>
      </div>
    </section>

    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-5">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-bold text-[#2C3E50]">{f.q}</AccordionTrigger>
              <AccordionContent className="text-[#2C3E50]/70 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  </MarketingLayout>
);

export default FAQPage;
