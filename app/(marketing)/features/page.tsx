import type { Metadata } from "next";
import { DashboardButton } from "@/components/landing/session-buttons";
import { CardStack } from "@/components/landing/card-stack";
import { CreditDemo } from "@/components/landing/credit-demo";
import { CalculatorDemo } from "@/components/features/calculator-demo";
import { getCardsById } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Your cards and what they earn, every credit tracked by hand, and calculators for whether a card or a redemption is worth it.",
};

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";
/** Feature headlines: large, the claim in ink, the consequence in muted. */
const H2 =
  "font-display text-[36px] leading-[1.02] tracking-[-0.04em] sm:text-[48px] lg:text-[56px]";
const BODY = "mt-5 max-w-[42ch] text-[16px] leading-relaxed text-muted sm:text-[17px]";

/**
 * Three features, in the owner's order, each a large two-tone headline and
 * a working animation of the real thing: the Wallet's picker, the Tracker,
 * the calculators. Simple on purpose (owner's brief, 2 November 2026,
 * after the Altitude reference).
 */
export default function FeaturesPage() {
  const demoCards = getCardsById(["amex-gold", "csr", "venture-x", "blue-business-plus"]);

  return (
    <>
      <section className={cn(SECTION, "pt-14 pb-16 lg:pt-24 lg:pb-24")}>
        <h1 className="max-w-[16ch] font-display text-[46px] leading-[0.98] tracking-[-0.045em] sm:text-[64px] lg:text-[80px]">
          Every card.
          <br />
          Every credit.
          <br />
          <span className="text-muted">Every time.</span>
        </h1>
      </section>

      {/* Wallet: the hero's picker, which steps through categories itself. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="grid items-center gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
          <div>
            <h2 className={H2}>
              Your wallet, sorted.{" "}
              <span className="text-muted">Know which card to reach for.</span>
            </h2>
            <p className={BODY}>
              Save the cards you carry and see what each one earns. Pick
              what you are buying, or search the store, and the best card
              comes to the top.
            </p>
          </div>
          <CardStack cards={demoCards} controlsClassName="-mt-6 lg:col-span-2 lg:-mt-2" />
        </div>
      </section>

      {/* Tracker: the animated widget from the home page. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,13fr)_minmax(0,11fr)]">
          <div className="rounded-widget bg-lavender p-5 sm:p-7 lg:order-1">
            <div className="rounded-inner border border-lavender-ink/15 bg-surface/70 p-4 sm:p-5">
              <CreditDemo />
            </div>
          </div>
          <div className="lg:order-2">
            <h2 className={H2}>
              Never lose a credit.{" "}
              <span className="text-muted">Tick it off, and it remembers.</span>
            </h2>
            <p className={BODY}>
              Mark each credit as you use it, in full or in part. CreditDash
              knows when every one resets and what is about to run out. You
              type it in yourself, so there is no bank login.
            </p>
          </div>
        </div>
      </section>

      {/* Calculators. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
          <div>
            <h2 className={H2}>
              Do the maths.{" "}
              <span className="text-muted">Before you pay, book or renew.</span>
            </h2>
            <p className={BODY}>
              See whether a card is worth its fee on your own spending,
              whether to pay with points or cash, and how many points your
              spending will earn.
            </p>
          </div>
          <div className="rounded-widget bg-panel p-5 sm:p-7">
            <CalculatorDemo />
          </div>
        </div>
        <p className="mt-6 text-[13px] text-muted">Sample numbers, at CreditDash&apos;s default point values.</p>
      </section>

      <section className="bg-band text-band-ink">
        <div className={cn(SECTION, "py-20 lg:py-28")}>
          <h2 className="max-w-[16ch] font-display text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px] lg:text-[64px]">
            Try it with your cards.{" "}
            <span className="text-band-muted">No sign-up needed.</span>
          </h2>
          <div className="mt-9">
            <DashboardButton arrow className="bg-band-ink text-band hover:bg-band-ink/90" />
          </div>
        </div>
      </section>
    </>
  );
}
