import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const PrivacyPage = () => (
  <MarketingLayout>
    <section className="py-16 bg-white">
      <article className="max-w-3xl mx-auto px-5 prose prose-slate">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-[#2C3E50]/60">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <h2 className="mt-8 text-xl font-bold">1. Who we are</h2>
        <p>Foot Ticket Finder helps fans discover when official football tickets go on sale. We do not sell tickets ourselves.</p>

        <h2 className="mt-6 text-xl font-bold">2. Data we collect</h2>
        <p>We only collect data needed to operate the service: account info (email, display name) and product usage (matches followed, notification preferences).</p>

        <h2 className="mt-6 text-xl font-bold">3. How we use your data</h2>
        <p>To send you ticket alerts, personalize your experience, and improve the app. We never sell your data.</p>

        <h2 className="mt-6 text-xl font-bold">4. Your rights</h2>
        <p>You can access, correct or delete your data at any time by contacting support@footticketfinder.com.</p>

        <h2 className="mt-6 text-xl font-bold">5. Contact</h2>
        <p>Any privacy question? Reach us at <a className="text-[#2ECC71] font-semibold" href="mailto:support@footticketfinder.com">support@footticketfinder.com</a>.</p>
      </article>
    </section>
  </MarketingLayout>
);

export default PrivacyPage;
