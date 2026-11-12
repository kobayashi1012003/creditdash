import Link from "next/link";
import type { Metadata } from "next";
import { CardStack } from "@/components/landing/card-stack";
import { CreditDemo } from "@/components/landing/credit-demo";
import { MessyNotes } from "@/components/landing/messy-notes";
import { Button } from "@/components/ui/button";
import { AccountButton, DashboardButton } from "@/components/landing/session-buttons";
import { PlanPanels } from "@/components/landing/plan-panels";
import { getCardsById } from "@/lib/catalog";
import { PAYMENTS_LIVE, PRELAUNCH_NOTE, PREMIUM_PRICE_MONTHLY } from "@/lib/plan";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { faqPage, jsonLd, organization, pageMetadata, softwareApplication } from "@/lib/seo";
import { FAQ } from "@/components/landing/faq";

const DESCRIPTION =
  "Track every credit card benefit and perk, see which card to use, and check whether each annual fee pays for itself. Free, with no bank login.";

export const metadata: Metadata = pageMetadata({
  path: "/",
  title: "CreditDash: credit card benefits tracker and organizer",
  description: DESCRIPTION,
  social: {
    title: "CreditDash: which card to use, and every credit tracked",
    description:
      "A credit card benefits tracker and organizer. See which card earns the most, tick off every credit, and check each annual fee. No bank login.",
  },
});

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";
/** Section headings: the claim in ink, the consequence in muted. */
const H2 = "font-display text-[30px] leading-[1.08] tracking-[-0.03em] sm:text-[40px] lg:text-[44px]";

/**
 * Structured data for search (lib/seo.ts): the app and its prices, who
 * makes it, and the questions below. The FAQ block must match the visible
 * questions word for word, so both read FAQ.
 */
const JSON_LD = [softwareApplication(DESCRIPTION), organization(), faqPage(FAQ)].map(jsonLd);

export default function LandingPage() {
  const demoCards = getCardsById(["amex-gold", "csr", "venture-x", "blue-business-plus"]);
  const gold = getCardsById(["amex-gold"])[0];

  return (
    <>
      {JSON_LD.map((json, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}
      {/* Hero. The working picker, not a picture of one. */}
      <section className={cn(SECTION, "pt-10 pb-14 lg:pt-16 lg:pb-20")}>
        {/* CardStack places two grid items: its stage beside the headline,
            and its controls across the full width beneath both. */}
        <div className="grid items-center gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
          <div>
            {/* The one H1. Its first line says what the product is in the
                words people search for; the headline stays as it was. */}
            <h1 className="font-display text-[46px] leading-[0.98] tracking-[-0.04em] sm:text-[64px] lg:text-[58px] xl:text-[68px]">
              <span className="mb-5 block font-sans text-[15px] leading-snug tracking-normal text-muted">
                Credit card benefits tracker and organizer
              </span>
              Which card?
              <br />
              <span className="text-muted">
                Answered before
                <br />
                you pay.
              </span>
            </h1>
            <p className="mt-6 max-w-[40ch] text-[16px] leading-relaxed text-muted">
              Save the cards you own, pick what you are buying, and see which
              one earns the most. One tap, no bank login.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <DashboardButton />
              <Button variant="outline" nativeButton={false} render={<Link href="#credits" />}>
                See how it works
              </Button>
            </div>
            {!PAYMENTS_LIVE && <p className="mt-3 text-[13px] text-muted">{PRELAUNCH_NOTE}</p>}
          </div>

          <CardStack cards={demoCards} controlsClassName="-mt-8 sm:-mt-6 lg:col-span-2 lg:-mt-2" />
        </div>
      </section>

      {/* Credits. A pair of panels: the same year, forgotten and tracked. */}
      <section id="credits" className={cn(SECTION, "scroll-mt-32 lg:scroll-mt-24 pb-20 lg:pb-28")}>
        <h2 className={cn(H2, "max-w-[22ch]")}>
          Credits you paid for and forgot to use.{" "}
          <span className="text-muted">A benefits tracker remembers every one.</span>
        </h2>
        <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-muted">
          Tick a credit off as you use it. The Tracker keeps the running
          total, knows whether it resets in January or on your card
          anniversary, and shows what expires this month.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-widget bg-panel p-5 sm:p-7">
            <p className="text-[15px] font-medium">Left to memory</p>
            <p className="mt-1 text-[13px] text-muted">
              A notes doc, updated whenever someone happens to remember.
            </p>
            <div className="mt-8 rounded-inner border border-line bg-surface p-4 sm:p-5">
              <MessyNotes />
            </div>
          </div>
          <div className="rounded-widget bg-lavender p-5 sm:p-7">
            <p className="text-[15px] font-medium text-lavender-ink">With CreditDash</p>
            <p className="mt-1 text-[13px] text-lavender-ink/80">
              Each month gets ticked off. Try it: click any month.
            </p>
            <div className="mt-8 rounded-inner border border-lavender-ink/15 bg-surface/70 p-4 sm:p-5">
              <CreditDemo />
            </div>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted">Sample wallet. Amounts are illustrative.</p>
      </section>

      {/* Annual fee. A chart drawn from the numbers, not a stat tile. */}
      <section id="fees" className={cn(SECTION, "scroll-mt-32 lg:scroll-mt-24 pb-20 lg:pb-28")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <div>
            <h2 className={H2}>
              Every card&rsquo;s annual fee, checked every month.{" "}
              <span className="text-muted">Not once, at renewal.</span>
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-muted">
              Every card gets the same honest sum: credits you actually used,
              plus what your points are worth at your own valuation, against
              the fee. A card that is not paying for itself shows it long
              before the renewal lands.
            </p>
            <p className="mt-4 text-[15px] text-muted">
              The calculator that does this sum is one of three on the{" "}
              <Link
                href="/features"
                className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                features page
              </Link>
              .
            </p>
          </div>
          {gold && <FeeChart fee={gold.annualFee} name={gold.name} />}
        </div>
      </section>

      {/* Privacy. The one dark band in the body. */}
      <section className="bg-band text-band-ink">
        <div className={cn(SECTION, "grid gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28")}>
          <div>
            <h2 className={H2}>
              Nothing is linked to your bank.{" "}
              <span className="text-band-muted">You type in the cards you own. That is the whole setup.</span>
            </h2>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-band-muted">
              There is no field for any of these, because the app never needs
              one and would rather not be able to lose them. It also means no
              ads and no feed to sell, which is why Premium costs $
              {PREMIUM_PRICE_MONTHLY} a month rather than being free.
            </p>
          </div>
          <ul className="self-end border-t border-band-line">
            {["Card number", "Expiry date", "Security code", "Bank login"].map((field) => (
              <li
                key={field}
                className="flex items-baseline justify-between gap-6 border-b border-band-line py-4"
              >
                <span className="text-[17px] tracking-[-0.01em] text-band-muted line-through decoration-band-muted/60">
                  {field}
                </span>
                <span className="text-[13px] text-band-muted">Never asked</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing. Free and both Premium options, side by side. */}
      <section id="pricing" className={cn(SECTION, "scroll-mt-32 lg:scroll-mt-24 py-20 lg:py-28")}>
        <h2 className={H2}>
          Free, or Premium. <span className="text-muted">No ads on either.</span>
        </h2>
        <PlanPanels className="mt-10" />
        <p className="mt-5 text-[13px] text-muted">
          {!PAYMENTS_LIVE && `${PRELAUNCH_NOTE} `}The demo is the whole app. Pick any cards to try it.{" "}
          <Link
            href="/pricing"
            className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Compare the plans in full
          </Link>
          .
        </p>
      </section>

      {/* Questions people search for. Shown in full, not folded away, and
          repeated as FAQPage JSON-LD above, so the two must match. */}
      <section id="faq" className={cn(SECTION, "scroll-mt-32 lg:scroll-mt-24 pb-20 lg:pb-28")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <h2 className={cn(H2, "max-w-[18ch] lg:sticky lg:top-28 lg:self-start")}>
            Tracking credit card benefits.{" "}
            <span className="text-muted">What people ask first.</span>
          </h2>
          <dl className="border-t border-line">
            {FAQ.map(({ question, answer }) => (
              <div key={question} className="border-b border-line py-6">
                <dt className="text-[17px] font-medium tracking-[-0.01em]">{question}</dt>
                <dd className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The close. Continues straight into the dark footer. */}
      <section className="bg-band text-band-ink">
        <div className={cn(SECTION, "py-20 lg:py-28")}>
          <h2 className="max-w-[16ch] font-display text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px] lg:text-[64px]">
            Find out which card to use.{" "}
            <span className="text-band-muted">It takes one tap.</span>
          </h2>
          <div className="mt-9 flex flex-wrap gap-2.5">
            <DashboardButton arrow className="bg-band-ink text-band hover:bg-band-ink/90" />
            <AccountButton
              variant="outline"
              className="border-band-line bg-transparent text-band-ink hover:border-band-muted"
            />
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * One card's year: value earned back, month by month, against its fee.
 * Drawn from the sample numbers, so the crossing point is computed, not
 * placed by eye.
 */
function FeeChart({ fee, name }: { fee: number; name: string }) {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // $20 of monthly credits plus about $32 of points from typical spend.
  const perMonth = 52;
  const values = MONTHS.map((_, i) => perMonth * (i + 1));
  const cross = values.findIndex((v) => v >= fee);

  // The plot is drawn in SVG; its words are HTML laid over it, so they keep
  // their real size at any width instead of shrinking with the viewBox.
  const W = 600;
  const H = 240;
  const pad = { l: 8, r: 8, t: 12, b: 12 };
  const top = Math.max(...values, fee) * 1.08;
  const x = (i: number) => pad.l + (i / (MONTHS.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const pct = (px: number, of: number) => `${((px / of) * 100).toFixed(2)}%`;

  return (
    <figure className="rounded-widget bg-panel p-5 sm:p-7">
      <figcaption className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
        <span className="font-medium">{name}</span>
        <span className="flex items-center gap-2 text-muted">
          <span aria-hidden className="h-0.5 w-4 rounded-pill bg-ink" />
          Value earned back
        </span>
        <span className="flex items-center gap-2 text-muted">
          <span aria-hidden className="h-0 w-4 border-t border-dashed border-muted" />
          Annual fee, {usd(fee)}
        </span>
      </figcaption>
      <div className="relative mt-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`${name}: about ${usd(perMonth)} earned back each month, passing the ${usd(fee)} fee in ${cross >= 0 ? MONTHS[cross] : "no month this year"}.`}
      >
        {MONTHS.map((m, i) => (
          <line key={m} x1={x(i)} x2={x(i)} y1={pad.t} y2={H - pad.b} className="stroke-line" strokeWidth={1} />
        ))}
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={y(fee)}
          y2={y(fee)}
          className="stroke-muted"
          strokeWidth={1.25}
          strokeDasharray="5 5"
        />
        <path d={line} fill="none" className="stroke-ink" strokeWidth={2} strokeLinejoin="round" />
        {cross >= 0 && <circle cx={x(cross)} cy={y(values[cross])} r={5} className="fill-ink" />}
      </svg>
      {cross >= 0 && (
        // Above and left of the point, clear of the fee line beneath it.
        <p
          aria-hidden
          className="absolute -translate-x-full -translate-y-full rounded-control bg-panel px-1.5 pb-2 text-[13px] font-medium whitespace-nowrap"
          style={{ left: pct(x(cross) - 6, W), top: pct(y(values[cross]) - 4, H) }}
        >
          Paid for itself in {MONTHS[cross]}
        </p>
      )}
      </div>
      <div aria-hidden className="mt-3 flex justify-between font-mono text-[11px] text-muted">
        {MONTHS.map((m, i) => (
          <span key={m} className={cn(i % 2 === 1 && "max-sm:invisible")}>
            {m}
          </span>
        ))}
      </div>
      <p className="mt-5 text-[13px] text-muted">
        Sample card: about {usd(perMonth)} a month in credits used and points earned.
      </p>
    </figure>
  );
}
