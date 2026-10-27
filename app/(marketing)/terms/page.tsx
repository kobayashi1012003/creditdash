import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="27 October 2026">
      <h2>Not financial advice</h2>
      <p>
        CreditDash helps you organise cards you already hold. Nothing in it is
        financial, tax or legal advice, and no part of it is a recommendation
        to apply for, keep or cancel a card.
      </p>

      <h2>Verify with your issuer</h2>
      <p>
        Card details in the app are sample data and can be out of date or
        simply wrong. Earn rates, credits, fees and benefits change often.
        Always check anything that matters against your issuer before you act
        on it.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for what you enter. Keep it accurate if you want
        the totals to mean anything.
      </p>

      <h2>Availability</h2>
      <p>
        The service is provided as it is, without a guarantee that it will be
        available or correct at any given moment.
      </p>
    </LegalPage>
  );
}
