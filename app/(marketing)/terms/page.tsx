import type { Metadata } from "next";
import Link from "next/link";
import { FREE_CARD_LIMIT, PREMIUM_PRICE_MONTHLY } from "@/lib/plan";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="28 October 2026">
      <p>
        These terms cover your use of CreditDash. Using it means you accept
        them. They are short on purpose; if something here is unclear, it is
        a fault in the wording, not a trap.
      </p>

      <h2>What CreditDash is</h2>
      <p>
        A tool for organising credit cards you already hold: which one to use,
        which credits are left, and whether each annual fee pays for itself.
        CreditDash is not a bank, a card issuer or a financial adviser, and is
        not affiliated with or endorsed by any issuer. Card names and marks
        belong to their owners and are used only to identify the cards.
      </p>

      <h2>Not financial advice</h2>
      <p>
        Nothing in CreditDash is financial, tax or legal advice, and nothing
        in it is a recommendation to apply for, keep or cancel any card.
        Decisions about your cards are yours.
      </p>

      <h2>Verify with your issuer</h2>
      <p>
        Card details in the app are sample data. They can be out of date or
        simply wrong, because earn rates, credits, fees and benefits change
        often and without notice. Check anything that matters against your
        issuer before you act on it.
      </p>

      <h2>Figures are estimates</h2>
      <p>
        Dollar values for points depend on the valuation you choose, and a
        point is only worth what you eventually redeem it for. Break-even and
        spend figures are worked from the numbers you enter. Treat them as a
        guide, not a promise.
      </p>

      <h2>Your data</h2>
      <p>
        You are responsible for what you enter and for keeping it accurate.
        Without an account, your data lives only in your browser, so
        CreditDash cannot recover it if it is cleared. With an account, it is
        saved to that account, and deleting the account deletes it for good
        (see{" "}
        <Link
          href="/privacy"
          className="rounded-inner text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Privacy
        </Link>
        ). Export a copy from Settings if you want one.
      </p>

      <h2>Plans and payment</h2>
      <p>
        The free plan saves up to {FREE_CARD_LIMIT} cards. Premium, at $
        {PREMIUM_PRICE_MONTHLY} a month, saves as many as you own. Premium
        cannot be bought yet, and no one is charged for anything today.
        Billing terms, including how to cancel, will be added here before
        payment is switched on. The intent is that you can cancel at any time
        and keep Premium until the end of the month you paid for.
      </p>

      <h2>Fair use</h2>
      <p>
        Do not try to break, overload or get around the limits of the
        service, or use it to harm anyone else.
      </p>

      <h2>Availability and changes</h2>
      <p>
        CreditDash is provided as it is. It may be unavailable at times, and
        features may change or be removed. The terms may change too; the date
        at the top shows when they last did, and a change that affects what
        you pay or what happens to your data will be noted in the app.
      </p>

      <h2>Liability</h2>
      <p>
        As far as the law allows, CreditDash is not liable for losses that
        come from relying on it, including a missed credit, a fee you chose to
        pay, or points valued differently from what you received. Nothing here
        limits rights you have that the law does not allow to be limited.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of California,
        United States. If you live somewhere that gives you the right to rely
        on your own local consumer laws, nothing here takes that away.
      </p>

      <h2>Contact</h2>
      <p>
        <a
          href="mailto:hello@creditdash.co"
          className="rounded-inner text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          hello@creditdash.co
        </a>
      </p>
    </LegalPage>
  );
}
