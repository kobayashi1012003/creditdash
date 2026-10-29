import type { Metadata } from "next";
import { DashboardButton } from "@/components/landing/session-buttons";
import { PREMIUM_PRICE_MONTHLY } from "@/lib/plan";

export const metadata: Metadata = {
  title: "About",
  description: "Who makes CreditDash, and why.",
};

/** A short first version; the owner will expand it. */
export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-[68ch] px-4 pt-14 pb-20 sm:px-6 lg:pt-20 lg:pb-28">
      <h1 className="font-display text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
        About CreditDash
      </h1>
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-muted">
        <p>
          CreditDash is made by Steven, a college student who got tired of
          guessing which card to use and losing credits that were already
          paid for.
        </p>
        <p>
          It does three things: tells you which card to use, keeps track of
          the credits you have left, and shows whether each annual fee is
          paying for itself. You type in the cards you own. It never asks for
          a card number or links to a bank, and it has no ads.
        </p>
        <p>
          Premium is ${PREMIUM_PRICE_MONTHLY} a month. It keeps CreditDash
          running, and helps pay for tuition.
        </p>
        <p>
          Questions or ideas:{" "}
          <a
            href="mailto:hello@creditdash.co"
            className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            hello@creditdash.co
          </a>
        </p>
      </div>
      <div className="mt-10">
        <DashboardButton arrow />
      </div>
    </article>
  );
}
