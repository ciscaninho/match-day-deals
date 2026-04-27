import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const SELLER_NAME = "Foot Ticket Finder";

const TermsPage = () => (
  <MarketingLayout>
    <section className="py-16 bg-white">
      <article className="max-w-3xl mx-auto px-5 prose prose-slate">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-[#2C3E50]/60">
          Last updated: {new Date().toLocaleDateString("en-GB")}
        </p>

        <h2 className="mt-8 text-xl font-bold">1. Who we are</h2>
        <p>
          These Terms govern your use of {SELLER_NAME} (the "Service"), operated by{" "}
          <strong>{SELLER_NAME}</strong> ("we", "us", "our"). By accessing or using the Service you
          agree to these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 className="mt-6 text-xl font-bold">2. The Service</h2>
        <p>
          {SELLER_NAME} is an information and alert service that helps fans discover when official
          football tickets go on sale. We do <strong>not</strong> sell tickets ourselves — all
          purchases are made directly on official platforms.
        </p>

        <h2 className="mt-6 text-xl font-bold">3. Acceptable use</h2>
        <p>You agree not to misuse the Service. You will not:</p>
        <ul>
          <li>use the Service for any unlawful, fraudulent or abusive purpose;</li>
          <li>send spam or attempt to interfere with other users;</li>
          <li>infringe intellectual property rights or post infringing content;</li>
          <li>
            interfere with the security of the Service (including malware, probing, scanning,
            scraping or circumventing technical limits).
          </li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">4. Account &amp; security</h2>
        <p>
          You are responsible for keeping your account credentials confidential and for all
          activity under your account. Provide accurate information and keep it up to date.
        </p>

        <h2 className="mt-6 text-xl font-bold">5. Intellectual property</h2>
        <p>
          {SELLER_NAME} and all related software, content, branding, and documentation are owned by
          us or our licensors. We grant you a limited, non-exclusive, non-transferable right to use
          the Service for your personal, non-commercial use within your selected plan. You may not
          copy, resell, redistribute, reverse-engineer or sub-licence the Service.
        </p>

        <h2 className="mt-6 text-xl font-bold">6. Premium subscription</h2>
        <p>
          {SELLER_NAME} Premium is a recurring subscription billed monthly (€2.99) or yearly
          (€29). Subscriptions renew automatically at the end of each period until you cancel. You
          can cancel at any time from your account; cancellation takes effect at the end of the
          current billing period.
        </p>

        <h2 className="mt-6 text-xl font-bold">7. Payments — Paddle as Merchant of Record</h2>
        <p>
          Our order process is conducted by our online reseller{" "}
          <a
            className="text-[#2ECC71] font-semibold"
            href="https://www.paddle.com"
            target="_blank"
            rel="noreferrer"
          >
            Paddle.com
          </a>
          . Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer
          service inquiries and handles returns. Payment, billing, tax, cancellation and refund
          mechanics are governed by Paddle's{" "}
          <a
            className="text-[#2ECC71] font-semibold"
            href="https://www.paddle.com/legal/checkout-buyer-terms"
            target="_blank"
            rel="noreferrer"
          >
            Checkout / Buyer Terms
          </a>
          .
        </p>

        <h2 className="mt-6 text-xl font-bold">8. Refunds</h2>
        <p>
          See our{" "}
          <a className="text-[#2ECC71] font-semibold" href="/legal/refund">
            Refund Policy
          </a>{" "}
          for details. We offer a 30-day money-back guarantee on Premium subscriptions.
        </p>

        <h2 className="mt-6 text-xl font-bold">9. Service availability</h2>
        <p>
          We make best efforts to keep ticket release dates and availability accurate, but we do
          not guarantee that the Service will be uninterrupted or error-free, or that ticket
          information will always be exact or up to date.
        </p>

        <h2 className="mt-6 text-xl font-bold">10. Disclaimer &amp; liability</h2>
        <p>
          To the fullest extent permitted by law, the Service is provided "as is" and we disclaim
          all implied warranties including merchantability and fitness for a particular purpose.
          Our aggregate liability is capped at the fees you paid us in the 12 months preceding the
          claim. We are not liable for indirect, consequential or special damages (loss of profits,
          data or goodwill). Nothing excludes liability for fraud, death or personal injury where
          required by law.
        </p>

        <h2 className="mt-6 text-xl font-bold">11. Suspension &amp; termination</h2>
        <p>
          We may suspend or terminate your access to the Service for material breach of these
          Terms, non-payment, security or fraud risk, or repeated/serious policy violations. On
          termination, your right to use the Service ends.
        </p>

        <h2 className="mt-6 text-xl font-bold">12. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. We will post the updated version on this
          page with a new "Last updated" date. Continued use after changes means you accept them.
        </p>

        <h2 className="mt-6 text-xl font-bold">13. Contact</h2>
        <p>
          Questions? Email{" "}
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

export default TermsPage;
