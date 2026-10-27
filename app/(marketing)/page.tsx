import Link from "next/link";
import type { Metadata } from "next";
import { CardPicker } from "@/components/wallet/card-picker";
import { CheckmarkRow } from "@/components/ui/checkmark-row";
import { Button } from "@/components/ui/button";
import { getCardsById } from "@/lib/wallet";
import { FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY } from "@/lib/plan";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "CreditDash",
  description:
    "Save the cards you own and see which one to use, what credits are left, and whether the annual fee pays for itself.",
};

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";

export default function LandingPage() {
  const demoCards = getCardsById(["amex-gold", "csr", "venture-x"]);

  return (
    <>
      {/* 1. Hero. The characteristic thing in this product's world is the
          decision itself, so the hero is the working picker, not a picture
          of one. */}
      <section className={cn(SECTION, "pt-14 pb-20 lg:pt-20 lg:pb-28")}>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-14">
          <div>
            {/* Scale is planned against the column width, not chosen first:
                at 60px this runs to three lines in a 5fr column. */}
            <h1 className="font-display text-[38px] leading-[1.06] tracking-[-0.015em] sm:text-[48px] lg:text-[46px] xl:text-[52px]">
              Which card? Answered before you pay.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-muted">
              Save the cards you own, pick what you are buying, and get the
              answer in one tap.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/wallet" />}
              >
                Open the demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="#pricing" />}
              >
                See pricing
              </Button>
            </div>
          </div>

          <div className="rounded-widget border border-line bg-surface p-5 sm:p-7">
            <CardPicker cards={demoCards} />
          </div>
        </div>
      </section>

      {/* 2. A full-width data band. Different shape to the hero: the content
          runs horizontally and the real component carries it. */}
      <section className="border-y border-line bg-surface py-16 lg:py-20">
        <div className={SECTION}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-16">
            <h2 className="font-display text-[30px] leading-[1.1] sm:text-[38px]">
              Credits you paid for and forgot to use.
            </h2>
            <div>
              <div className="space-y-6">
                <CreditStrip
                  name="Dining credit"
                  detail="$10 each month, Amex Gold"
                  used={[10, 10, 10, 10, 10, 10, 10, 10, 10, 4, 0, 0]}
                  amount={10}
                  tint="var(--cd-peach-ink)"
                />
                <CreditStrip
                  name="The Edit hotel credit"
                  detail="$250 twice a year, Sapphire Reserve"
                  used={[250, 0]}
                  amount={250}
                  tint="var(--cd-lavender-ink)"
                />
              </div>
              <p className="mt-7 max-w-[58ch] text-[15px] leading-relaxed text-muted">
                Tick one off as you use it. The Tracker keeps the running
                total, knows whether a credit resets in January or on your
                anniversary, and tells you what is about to expire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. A single statement, measured across the full width. No columns,
          no cards; the number is the whole section. */}
      <section className={cn(SECTION, "py-16 lg:py-24")}>
        <p className="max-w-[20ch] font-display text-[clamp(2.5rem,7vw,4.75rem)] leading-[1.02] tracking-[-0.02em]">
          {usd(655)} of {usd(1040)} earned back so far.
        </p>
        <div className="mt-8 h-2.5 w-full max-w-3xl overflow-hidden rounded-pill bg-surface">
          <div className="h-full w-[63%] rounded-pill bg-ink" />
        </div>
        <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-muted">
          Every card gets the same honest sum: credits you actually used, plus
          what your points are really worth, against the fee. If a card is not
          paying for itself, you will see it long before the renewal lands.
        </p>
      </section>

      {/* 4. Narrow editorial column. The positioning claim deserves prose,
          not a feature grid. */}
      <section className="border-t border-line bg-surface py-16 lg:py-20">
        <div className={SECTION}>
          <div className="max-w-[58ch]">
            <h2 className="font-display text-[30px] leading-[1.1] sm:text-[38px]">
              Nothing is linked to your bank.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-muted">
              You type in which cards you own. That is the whole setup. There
              is no field for a card number, an expiry date, a CVV or a bank
              login, because the app never needs one and we would rather not
              be able to lose them.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted">
              It also means no ads and no feed to sell, which is why Premium
              costs ${PREMIUM_PRICE_MONTHLY} instead of nothing.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Pricing. Two plans, two columns. */}
      <section id="pricing" className={cn(SECTION, "scroll-mt-20 py-16 lg:py-24")}>
        <h2 className="font-display text-[30px] leading-[1.1] sm:text-[38px]">
          Two plans.
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:max-w-4xl">
          <PlanPanel
            name="Free"
            price="No cost"
            note="Enough to answer the question for the cards you use most."
            points={[
              `Up to ${FREE_CARD_LIMIT} saved cards`,
              "The full Tracker and every calculator",
              "Compare any cards in the catalog",
            ]}
          />
          <PlanPanel
            name="Premium"
            price={`$${PREMIUM_PRICE_MONTHLY} a month`}
            note="For wallets that outgrew a spreadsheet."
            featured
            points={[
              "As many cards as you own",
              "Everything in Free",
              "Cancel whenever you like",
            ]}
          />
        </div>
        <p className="mt-6 text-[13px] text-muted">
          Payments are not switched on yet. The demo is the whole app, with
          sample data.
        </p>
      </section>
    </>
  );
}

function CreditStrip({
  name,
  detail,
  used,
  amount,
  tint,
}: {
  name: string;
  detail: string;
  used: number[];
  amount: number;
  tint: string;
}) {
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[15px]">{name}</p>
        <p className="text-[13px] text-muted">{detail}</p>
      </div>
      <CheckmarkRow
        period={used.length === 12 ? "monthly" : "semiannual"}
        used={used}
        amount={amount}
        tint={tint}
      />
    </div>
  );
}

function PlanPanel({
  name,
  price,
  note,
  points,
  featured,
}: {
  name: string;
  price: string;
  note: string;
  points: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-widget border p-6 sm:p-7",
        featured ? "border-ink bg-surface" : "border-line",
      )}
    >
      <h3 className="font-display text-2xl leading-none">{name}</h3>
      <p className="mt-3 text-[17px]">{price}</p>
      <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted">
        {note}
      </p>
      <ul className="mt-5 space-y-2 text-[15px]">
        {points.map((p) => (
          <li key={p} className="text-muted">
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
