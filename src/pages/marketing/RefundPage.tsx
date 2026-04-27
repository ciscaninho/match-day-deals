import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const SELLER_NAME = "Foot Ticket Finder";

const RefundPage = () => (
  <MarketingLayout>
    <section className="py-16 bg-white">
      <article className="max-w-3xl mx-auto px-5 prose prose-slate">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Refund Policy</h1>
        <p className="text-sm text-[#2C3E50]/60">
          Last updated: {new Date().toLocaleDateString("en-GB")}
        </p>

        <h2 className="mt-8 text-xl font-bold">30-day money-back guarantee</h2>
        <p>
          We want you to be fully satisfied with your {SELLER_NAME} Premium subscription. If you
          are not happy with your purchase, you can request a full refund within{" "}
          <strong>30 days</strong> of your order date — no questions asked.
        </p>

        <h2 className="mt-6 text-xl font-bold">How to request a refund</h2>
        <p>
          Refunds for {SELLER_NAME} are processed by our payment provider, Paddle, who acts as the
          Merchant of Record for all our orders. To request a refund:
        </p>
        <ul>
          <li>
            Visit{" "}
            <a
              className="text-[#2ECC71] font-semibold"
              href="https://paddle.net"
              target="_blank"
              rel="noreferrer"
            >
              paddle.net
            </a>{" "}
            and look up your order using the email address you used at checkout, or
          </li>
          <li>
            Email us at{" "}
            <a
              className="text-[#2ECC71] font-semibold"
              href="mailto:support.footticket@gmail.com"
            >
              support.footticket@gmail.com
            </a>{" "}
            and we will help you with the refund.
          </li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">After 30 days</h2>
        <p>
          After 30 days, refunds may still be granted in exceptional circumstances at our
          discretion. Cancelling your subscription stops future renewals, and you keep access until
          the end of the current billing period.
        </p>

        <h2 className="mt-6 text-xl font-bold">Contact</h2>
        <p>
          Questions about a refund? Reach us at{" "}
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

export default RefundPage;
