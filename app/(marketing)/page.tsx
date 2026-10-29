import Link from "next/link";
import type { Metadata } from "next";
import { CardStack } from "@/components/landing/card-stack";
import { CreditDemo, ForgottenCredits } from "@/components/landing/credit-demo";
import { Button } from "@/components/ui/button";
import { AccountButton, DashboardButton } from "@/components/landing/session-buttons";
import { PlanPanels } from "@/components/landing/plan-panels";
import { CARDS } from "@/data/cards.seed";
import { getCardsById } from "@/lib/catalog";
import { PREMIUM_PRICE_MONTHLY } from "@/lib/plan";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "CreditDash",
  description:
    "Save the cards you own and see which one to use, what credits are left, and whether the annual fee pays for itself.",
};

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";
/** Section headings: the claim in ink, the consequence in muted. */
const H2 = "font-display text-[30px] leading-[1.08] tracking-[-0.03em] sm:text-[40px] lg:text-[44px]";

const ISSUERS = [...new Set(CARDS.map((c) => c.issuer))];

export default function LandingPage() {
  const demoCards = getCardsById(["amex-gold", "csr", "venture-x", "blue-business-plus"]);
  const gold = getCardsById(["amex-gold"])[0];

  return (
    <>
      {/* Hero. The working picker, not a picture of one. */}
      <section className={cn(SECTION, "pt-10 pb-14 lg:pt-16 lg:pb-20")}>
        {/* CardStack places two grid items: its stage beside the headline,
            and its controls across the full width beneath both. */}
        <div className="grid items-center gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
          <div>
            <h1 className="font-display text-[46px] leading-[0.98] tracking-[-0.04em] sm:text-[64px] lg:text-[58px] xl:text-[68px]">
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
          </div>

          <CardStack cards={demoCards} controlsClassName="-mt-8 sm:-mt-6 lg:col-span-2 lg:-mt-2" />
        </div>
      </section>

      {/* What the catalog covers. Names only, no logos: these are issuers
          the app knows about, not partners. */}
      <section className={cn(SECTION, "pb-16 lg:pb-24")}>
        <div className="flex flex-col gap-4 border-y border-line py-6 sm:flex-row sm:items-center sm:gap-10">
          <p className="shrink-0 text-[13px] text-muted">Cards from</p>
          <ul className="flex flex-wrap gap-x-9 gap-y-2 text-[17px] font-medium tracking-[-0.02em] text-muted">
            {ISSUERS.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Credits. A pair of panels: the same year, forgotten and tracked. */}
      <section id="credits" className={cn(SECTION, "scroll-mt-32 lg:scroll-mt-24 pb-20 lg:pb-28")}>
        <h2 className={cn(H2, "max-w-[22ch]")}>
          Credits you paid for and forgot to use.{" "}
          <span className="text-muted">The Tracker remembers every one.</span>
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
              Two $10 credits a month, used when someone happened to remember.
            </p>
            <div className="mt-8 rounded-inner border border-line bg-surface p-4 sm:p-5">
              <ForgottenCredits />
            </div>
          </div>
          <div className="rounded-widget bg-lavender p-5 sm:p-7">
            <p className="text-[15px] font-medium text-lavender-ink">With the Tracker</p>
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
              The annual fee, checked every month.{" "}
              <span className="text-muted">Not once, at renewal.</span>
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-muted">
              Every card gets the same honest sum: credits you actually used,
              plus what your points are worth at your own valuation, against
              the fee. A card that is not paying for itself shows it long
              before the renewal lands.
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
              {PREMIUM_PRICE_MONTHLY} instead of nothing.
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

      {/* Pricing. Two plans, side by side. */}
      <section id="pricing" className={cn(SECTION, "scroll-mt-32 lg:scroll-mt-24 py-20 lg:py-28")}>
        <h2 className={H2}>
          Two plans. <span className="text-muted">Both without ads.</span>
        </h2>
        <PlanPanels className="mt-10 lg:max-w-[880px]" />
        <p className="mt-5 text-[13px] text-muted">
          Payments are not switched on yet. The demo is the whole app, with
          a sample wallet.{" "}
          <Link
            href="/pricing"
            className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Compare the plans in full
          </Link>
          .
        </p>
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
