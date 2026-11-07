import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardButton } from "@/components/landing/session-buttons";
import { CalculatorDemo } from "@/components/features/calculator-demo";
import { TrackerDemo } from "@/components/features/tracker-demo";
import { WalletPreview } from "@/components/features/wallet-preview";
import { cn } from "@/lib/cn";

const DESCRIPTION =
  "Your cards and what they earn, every credit tracked by hand, and calculators for whether a card or a redemption is worth it.";

export const metadata: Metadata = {
  title: "Features",
  description: DESCRIPTION,
  alternates: { canonical: "/features" },
  openGraph: {
    type: "website",
    siteName: "CreditDash",
    locale: "en_US",
    title: "Features | CreditDash",
    description: DESCRIPTION,
    url: "/features",
    images: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "CreditDash. Which card? Answered before you pay." },
  },
};

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";
/** Feature headlines: the feature's own name, as the dashboard calls it
 *  (owner, 6 November 2026). */
const H2 =
  "font-display text-[36px] leading-[1.02] tracking-[-0.04em] sm:text-[48px] lg:text-[56px]";
const BODY = "mt-5 max-w-[42ch] text-[16px] leading-relaxed text-muted sm:text-[17px]";

/**
 * The dashboard's features by name, in the owner's order, each beside the
 * real thing: the Wallet's cards, the Tracker at work (a pointer
 * ticking several months in one slide), and the calculators. Simple on purpose (owner's brief, 2 November 2026,
 * after the Altitude reference).
 */
export default function FeaturesPage() {
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

      {/* Wallet: the cards and what they earn. The category picker is the
          home page's hero, so it is not repeated here. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
          <div>
            <h2 className={H2}>Wallet</h2>
            <p className={BODY}>
              Every card you carry in one place. See what each one earns by
              category, how much of its credits you have used, and which card
              to reach for: pick what you are buying, or search the store.
            </p>
          </div>
          <WalletPreview />
        </div>
      </section>

      {/* Tracker: the page itself, ticking months off in one slide. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,14fr)_minmax(0,10fr)]">
          <div className="rounded-widget bg-lavender p-3 sm:p-6 lg:order-1">
            <div className="rounded-inner bg-bg p-3 sm:p-5">
              <TrackerDemo />
            </div>
          </div>
          <div className="lg:order-2">
            <h2 className={H2}>Tracker</h2>
            <p className={BODY}>
              Tick each credit as you use it, or hold and slide to tick a run
              of months at once. It knows when every credit resets and what is
              about to run out. No bank login.
            </p>
          </div>
        </div>
      </section>

      {/* Calculators. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
          <div>
            <h2 className={H2}>Calculators</h2>
            <p className={BODY}>
              Is a card worth its fee, points or cash, and what your spending
              earns.
            </p>
          </div>
          <div className="rounded-widget bg-panel p-5 sm:p-7">
            <CalculatorDemo />
          </div>
        </div>
        <p className="mt-6 text-[13px] text-muted">Sample numbers, at CreditDash&apos;s default point values.</p>
      </section>

      {/* Compare. Short on purpose: the Wallet above already shows the idea. */}
      <section className={cn(SECTION, "pb-24 lg:pb-36")}>
        <div className="border-t border-line pt-10 lg:pt-14">
          <h2 className={H2}>Compare</h2>
          <p className={BODY}>
            Up to three cards side by side: fees, earn rates and credits, with
            the winner in each row marked.
          </p>
        </div>
      </section>

      <section className="bg-band text-band-ink">
        <div className={cn(SECTION, "py-20 lg:py-28")}>
          <h2 className="max-w-[16ch] font-display text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px] lg:text-[64px]">
            Start with one card.{" "}
            <span className="text-band-muted">It costs nothing.</span>
          </h2>
          <div className="mt-9 flex flex-wrap gap-2.5">
            <DashboardButton arrow className="bg-band-ink text-band hover:bg-band-ink/90" />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/pricing" />}
              className="border-band-line bg-transparent text-band-ink hover:border-band-muted"
            >
              See pricing
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
