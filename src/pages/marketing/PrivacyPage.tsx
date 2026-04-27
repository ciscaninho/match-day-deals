import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const SELLER_NAME = "Foot Ticket Finder";

const PrivacyPage = () => (
  <MarketingLayout>
    <section className="py-16 bg-white">
      <article className="max-w-3xl mx-auto px-5 prose prose-slate">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Notice</h1>
        <p className="text-sm text-[#2C3E50]/60">
          Last updated: {new Date().toLocaleDateString("en-GB")}
        </p>

        <h2 className="mt-8 text-xl font-bold">1. Who we are</h2>
        <p>
          <strong>{SELLER_NAME}</strong> ("we", "us", "our") operates the {SELLER_NAME} app and
          website. We act as the <strong>data controller</strong> for the personal data we collect
          about you when you use the Service.
        </p>

        <h2 className="mt-6 text-xl font-bold">2. Data we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> email address, display name, password (hashed), avatar.
          </li>
          <li>
            <strong>Product usage:</strong> matches you follow, notification preferences, polls
            answered, points earned.
          </li>
          <li>
            <strong>Support data:</strong> messages you send to our support, the page you were on,
            language and user type.
          </li>
          <li>
            <strong>Technical data:</strong> device, browser, IP address, log data needed for
            security, fraud prevention and debugging.
          </li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">3. Why we use it (purpose &amp; legal basis)</h2>
        <ul>
          <li>
            <strong>Provide the Service</strong> (account creation, ticket alerts, follow lists) —
            performance of contract.
          </li>
          <li>
            <strong>Improve the product and personalise it</strong> — legitimate interests.
          </li>
          <li>
            <strong>Customer support</strong> — performance of contract / legitimate interests.
          </li>
          <li>
            <strong>Security &amp; fraud prevention</strong> — legitimate interests / legal
            obligation.
          </li>
          <li>
            <strong>Marketing communications</strong> — only if you opt in (consent).
          </li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">4. Who we share data with</h2>
        <ul>
          <li>
            <strong>Service providers / subprocessors:</strong> hosting (Lovable Cloud / Supabase),
            analytics, email delivery, support tooling.
          </li>
          <li>
            <strong>Payment processing — Paddle (Merchant of Record):</strong> when you subscribe
            to Premium, payment data is collected and processed by{" "}
            <a
              className="text-[#2ECC71] font-semibold"
              href="https://www.paddle.com/legal/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Paddle
            </a>
            , who acts as the seller of record and handles payments, tax, invoicing and
            subscription management.
          </li>
          <li>
            <strong>Professional advisers</strong> (legal, accounting) where necessary.
          </li>
          <li>
            <strong>Authorities</strong> when required by law.
          </li>
        </ul>
        <p>We never sell your personal data.</p>

        <h2 className="mt-6 text-xl font-bold">5. International transfers</h2>
        <p>
          Some of our service providers process data outside the UK/EEA. When we transfer personal
          data internationally, we rely on appropriate safeguards (Standard Contractual Clauses or
          adequacy decisions).
        </p>

        <h2 className="mt-6 text-xl font-bold">6. How long we keep it</h2>
        <p>
          We keep personal data only as long as needed to provide the Service and comply with our
          legal obligations. When data is no longer needed, it is deleted or anonymised.
        </p>

        <h2 className="mt-6 text-xl font-bold">7. Your rights</h2>
        <p>
          Subject to applicable law (including GDPR for users in the UK/EEA), you have the right to
          access, rectify, erase, restrict processing, object to processing, request portability of
          your data, and withdraw consent at any time. You also have the right to lodge a complaint
          with your local supervisory authority. We respond to requests within 1 month.
        </p>
        <p>
          To exercise any of these rights, email{" "}
          <a
            className="text-[#2ECC71] font-semibold"
            href="mailto:support.footticket@gmail.com"
          >
            support.footticket@gmail.com
          </a>
          .
        </p>

        <h2 className="mt-6 text-xl font-bold">8. Security</h2>
        <p>
          We use appropriate technical and organisational measures (encryption in transit,
          access controls, regular reviews) to protect your data.
        </p>

        <h2 className="mt-6 text-xl font-bold">9. Cookies</h2>
        <p>
          We use a small number of essential cookies needed to keep you signed in and operate the
          Service. We do not use marketing cookies without your consent.
        </p>

        <h2 className="mt-6 text-xl font-bold">10. Contact</h2>
        <p>
          Any privacy question? Reach us at{" "}
          <a
            className="text-[#2ECC71] font-semibold"
            href="mailto:support.footticket@gmail.com"
          >
            support.footticket@gmail.com
          </a>
          .
        </p>
      </article>
    </section>
  </MarketingLayout>
);

export default PrivacyPage;
