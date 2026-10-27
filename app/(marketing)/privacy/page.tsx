import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="27 October 2026">
      <h2>What we hold</h2>
      <p>
        Which cards you have told us you own, how much of each credit you have
        marked as used, your points balances, and what you think a point is
        worth. That is all of it.
      </p>

      <h2>What we never ask for</h2>
      <p>
        Card numbers, expiry dates, CVVs, and bank or issuer logins. There is
        no field for any of them anywhere in the app, and nothing is ever
        linked to a bank account.
      </p>

      <h2>Where it lives</h2>
      <p>
        Today your data is stored in your own browser and never leaves your
        device. When accounts arrive it will move to a database that only you
        can read, and deleting your account will delete all of it.
      </p>

      <h2>Advertising</h2>
      <p>
        There is none, and your data is never sold or shared for it.
      </p>
    </LegalPage>
  );
}
