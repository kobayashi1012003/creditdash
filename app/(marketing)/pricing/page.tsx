import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react/ssr";
import { PlanPanels } from "@/components/landing/plan-panels";
import { DashboardButton } from "@/components/landing/session-buttons";
import { FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY } from "@/lib/plan";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Free for up to ${FREE_CARD_LIMIT} cards. Premium is $${PREMIUM_PRICE_MONTHLY} a month for as many as you own.`,
};

const SECTION = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";

/** true: included. false: not. A string: included, with that detail. */
const ROWS: { label: string; free: boolean | string; premium: boolean | string }[] = [
  { label: "Saved cards", free: `Up to ${FREE_CARD_LIMIT}`, premium: "As many as you own" },
  { label: "Which card to use, by category or store", free: true, premium: true },
  { label: "Credit Tracker", free: true, premium: true },
  { label: "Annual fee check", free: true, premium: true },
  { label: "Calculators", free: true, premium: true },
  { label: "Compare any cards", free: true, premium: true },
  { label: "Sync across devices", free: "With an account", premium: "With an account" },
  { label: "Ads", free: "None", premium: "None" },
];

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Can I cancel?",
    a: "Any time, from Settings. Premium stays on until the end of the month you paid for, and you are not charged again.",
  },
  {
    q: "What happens to my cards if I go back to Free?",
    a: `Nothing is deleted. Your first ${FREE_CARD_LIMIT} cards show, the rest are kept out of sight with their credits and history, and they come back if you return to Premium.`,
  },
  {
    q: "Who handles the payment?",
    a: "Stripe. You pay on Stripe's own page, so your card details never reach CreditDash.",
  },
  {
    q: "Do I need an account?",
    a: "Not to try it. The demo is the whole app in your browser. An account keeps your wallet on every device, and Premium needs one.",
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <>
        <CheckIcon size={16} weight="bold" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <MinusIcon size={16} aria-hidden className="text-muted" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <>{value}</>;
}

export default function PricingPage() {
  return (
    <>
      <section className={cn(SECTION, "pt-14 pb-10 lg:pt-20")}>
        <h1 className="max-w-[16ch] font-display text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
          Two plans. <span className="text-muted">Both without ads.</span>
        </h1>
        <PlanPanels className="mt-10 lg:max-w-[880px]" />
        <p className="mt-5 text-[13px] text-muted">
          Payments are not switched on yet. The demo is the whole app, with a sample wallet.
        </p>
      </section>

      <section className={cn(SECTION, "pb-16 lg:pb-24")}>
        <h2 className="font-display text-[26px] leading-tight sm:text-[30px]">Side by side</h2>
        {/* relative: the sr-only labels in the cells need a positioned
            ancestor inside the scroller, or they widen the page. */}
        <div className="relative mt-6 lg:max-w-[880px]">
          <table className="w-full table-fixed border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-muted">
                <th scope="col" className="w-[46%] pb-3 font-normal">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="pb-3 font-medium text-ink">Free</th>
                <th scope="col" className="pb-3 font-medium text-ink">Premium</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-t border-line align-top">
                  <th scope="row" className="py-3.5 pr-4 text-left font-normal text-muted">
                    {r.label}
                  </th>
                  <td className="relative py-3.5 pr-3">
                    <Cell value={r.free} />
                  </td>
                  <td className="relative py-3.5">
                    <Cell value={r.premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cn(SECTION, "pb-20 lg:pb-28")}>
        <h2 className="font-display text-[26px] leading-tight sm:text-[30px]">Questions</h2>
        <dl className="mt-6 border-b border-line lg:max-w-[880px]">
          {QUESTIONS.map(({ q, a }) => (
            <div key={q} className="border-t border-line py-5">
              <dt className="text-[16px] font-medium">{q}</dt>
              <dd className="mt-1.5 max-w-[64ch] text-[15px] leading-relaxed text-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-[13px] text-muted">
          The full billing terms are in the{" "}
          <Link
            href="/terms"
            className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Terms
          </Link>
          .
        </p>
        <div className="mt-10">
          <DashboardButton arrow />
        </div>
      </section>
    </>
  );
}
