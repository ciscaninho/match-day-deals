import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const TermsPage = () => (
  <MarketingLayout>
    <section className="py-16 bg-white">
      <article className="max-w-3xl mx-auto px-5 prose prose-slate">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-[#2C3E50]/60">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <h2 className="mt-8 text-xl font-bold">1. About the service</h2>
        <p>Foot Ticket Finder is an information and alert service. We do not sell tickets. All purchases are made directly on official platforms.</p>

        <h2 className="mt-6 text-xl font-bold">2. Use of the app</h2>
        <p>You agree to use the app for personal, lawful purposes. Don't attempt to scrape, abuse or disrupt the service.</p>

        <h2 className="mt-6 text-xl font-bold">3. Premium subscription</h2>
        <p>Premium is billed monthly. You can cancel at any time. No refunds for partial periods.</p>

        <h2 className="mt-6 text-xl font-bold">4. Disclaimer</h2>
        <p>Ticket release dates and availability are provided for information only. We make best efforts to keep them accurate but cannot guarantee availability on official platforms.</p>

        <h2 className="mt-6 text-xl font-bold">5. Contact</h2>
        <p>Questions? Email <a className="text-[#2ECC71] font-semibold" href="mailto:support@footticketfinder.com">support@footticketfinder.com</a>.</p>
      </article>
    </section>
  </MarketingLayout>
);

export default TermsPage;
