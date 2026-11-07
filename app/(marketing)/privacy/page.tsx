import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

const DESCRIPTION =
  "What CreditDash stores, where it is kept, and what it never asks for: no card numbers, no expiry dates, no bank logins.";

export const metadata: Metadata = {
  title: "Privacy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    siteName: "CreditDash",
    locale: "en_US",
    title: "Privacy | CreditDash",
    description: DESCRIPTION,
    url: "/privacy",
    images: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "CreditDash. Which card? Answered before you pay." },
  },
};

/**
 * Says what the app actually does, so it changes whenever that does. Phase 6
 * (accounts) once shipped with this page still claiming data never left the
 * browser; re-read it after any change to sign-in, storage or providers.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="7 November 2026">
      <p>
        CreditDash is built to need as little about you as possible. This page
        says what it holds, where, who else is involved, and what you can do
        about it.
      </p>

      <h2>What you enter</h2>
      <ul>
        <li>
          Which cards you own, any nickname you give them, when each was
          opened, and the day its anniversary falls on.
        </li>
        <li>How much of each card credit you have marked as used.</li>
        <li>
          How you arrange each card&apos;s credits in the Tracker (their order,
          which are hidden, their colours) and which credits you set to
          auto-fill.
        </li>
        <li>Your points balances, and what you think a point is worth.</li>
        <li>Your plan, your theme, and whether you left the calculator panel open.</li>
      </ul>
      <p>
        If you sign in, CreditDash also holds your email address, so it knows
        which account is yours. There are no other fields.
      </p>

      <h2>What CreditDash never asks for</h2>
      <p>
        Card numbers, expiry dates, CVVs, and bank or issuer logins. There is
        no field for any of them, and nothing is ever linked to a bank or card
        account. If a future feature would need one, it will not be built.
      </p>

      <h2>Where it is stored</h2>
      <p>
        <strong>If you have not signed in</strong>, everything you enter is
        saved in your own browser, on your own device. It is not sent to
        CreditDash or anyone else. Clearing this site&apos;s data deletes it,
        and there is no other copy.
      </p>
      <p>
        <strong>If you sign in</strong>, your wallet is saved to your account
        so it follows you between devices. It is stored in a database run by
        Supabase, CreditDash&apos;s database provider, and sent there over an
        encrypted connection. The database only lets each signed-in person
        read and change their own rows, so no other user can see your wallet.
        The person who runs CreditDash can technically access the database to
        fix problems, and does not otherwise look at anyone&apos;s wallet.
      </p>
      <p>
        When you first sign in, you are asked whether to copy a wallet already
        in that browser into your account. Nothing is copied unless you choose
        to.
      </p>

      <h2>Your controls</h2>
      <ul>
        <li>
          <strong>Export as CSV</strong> in Settings downloads a copy of your
          wallet.
        </li>
        <li>
          <strong>Delete everything</strong> in Settings empties your wallet,
          in this browser or in your account, and cannot be undone.
        </li>
        <li>
          <strong>Delete account</strong> in Settings removes your account and
          everything saved to it, immediately and for good. If you have
          Premium, it is cancelled at the same moment and you are not charged
          again.
        </li>
      </ul>

      <h2>Who else is involved</h2>
      <ul>
        <li>
          <strong>Cloudflare</strong> hosts the site. Like any website,
          loading a page sends the server your IP address, your browser type
          and the address of the page. Cloudflare uses this to deliver and
          protect the site. Short-lived logs of requests, and of errors in
          the payment and account-deletion steps, are kept to find and fix
          problems; an error from Stripe can include your Stripe customer
          reference.
        </li>
        <li>
          <strong>Supabase</strong> runs sign-in and stores signed-in
          accounts, as described above.
        </li>
        <li>
          <strong>Google</strong>, only if you choose Continue with Google.
          Google confirms who you are and shares your email address, name and
          profile picture with CreditDash&apos;s sign-in. Supabase keeps what
          Google sends with your account record; CreditDash itself only uses
          the email address.
        </li>
        <li>
          <strong>Resend</strong>, only if you ask for an emailed sign-in link or code.
          It receives your email address in order to deliver that one email.
        </li>
        <li>
          <strong>Stripe</strong>, only if you buy Premium. See Payments
          below.
        </li>
      </ul>
      <p>
        None of them is given your wallet for any purpose of their own.
      </p>

      <h2>Cookies and tracking</h2>
      <p>
        CreditDash runs no analytics, tracking pixels or advertising scripts,
        and fonts are served from the same site. When you sign in, it sets
        cookies that keep you signed in; they are strictly necessary, and
        signing out removes them. Your browser&apos;s own storage also keeps a
        few things for this device only: your theme, which calculators and
        panels you left open, which card the Tracker shows, whether you closed
        the demo banner, which card to draw first so the Wallet appears
        quickly, whether you declined to copy a browser wallet into your
        account, and, if you have not signed in, your wallet itself.
        Cloudflare may set a strictly necessary security cookie to protect
        the site from abuse.
      </p>

      <h2>Advertising</h2>
      <p>
        There is none. Your data is never sold, rented or shared for
        advertising or for anything else.
      </p>

      <h2>Payments</h2>
      <p>
        Premium is paid through Stripe. When you upgrade, you enter your
        payment details on Stripe&apos;s own checkout page; they go to Stripe
        directly and never reach CreditDash. CreditDash gives Stripe your
        email address and an account reference so the payment belongs to the
        right account, and keeps only your Stripe customer reference and what
        Stripe reports back: whether your subscription is active, and when it
        renews or ends. Stripe handles
        your payment details under its own privacy policy, and keeps payment
        records that the law requires it to keep.
      </p>

      <h2>Children</h2>
      <p>
        CreditDash is meant for adults who hold credit cards, and is not
        directed at anyone under 18.
      </p>

      <h2>Changes to this page</h2>
      <p>
        The date at the top changes whenever this page does. A change to what
        is collected or where it goes will also be noted in the app, not just
        here.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your data, or a request about it:{" "}
        <a
          href="mailto:hello@creditdash.co"
          className="rounded-inner text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          hello@creditdash.co
        </a>
        .
      </p>
    </LegalPage>
  );
}
