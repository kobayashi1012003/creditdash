import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="27 October 2026">
      <p>
        CreditDash is built to need as little about you as possible. This page
        says what it holds, where, and what you can do about it.
      </p>

      <h2>What you enter</h2>
      <ul>
        <li>Which cards you own, any nickname you give them, and when each was opened.</li>
        <li>How much of each card credit you have marked as used.</li>
        <li>Your points balances, and what you think a point is worth.</li>
        <li>Your plan, your theme, and whether you left the calculator panel open.</li>
      </ul>
      <p>That is all of it. There are no other fields.</p>

      <h2>What CreditDash never asks for</h2>
      <p>
        Card numbers, expiry dates, CVVs, and bank or issuer logins. There is
        no field for any of them, and nothing is ever linked to a bank or card
        account. If a future feature would need one, it will not be built.
      </p>

      <h2>Where it is stored</h2>
      <p>
        Today, everything you enter is saved in your own browser, on your own
        device, using the browser&apos;s local storage. It is not sent to
        CreditDash or anyone else, and CreditDash cannot see it. Another
        browser or device starts with its own separate copy.
      </p>
      <p>
        Clearing this site&apos;s data in your browser deletes it, and so does{" "}
        <strong>Delete everything</strong> in Settings. Neither can be undone,
        because there is no other copy. <strong>Export as CSV</strong> in
        Settings gives you one to keep.
      </p>

      <h2>What the server sees</h2>
      <p>
        CreditDash is hosted on Cloudflare. Like any website, loading a page
        sends the server your IP address, your browser type and the address
        of the page. Cloudflare uses this to deliver and protect the site, and
        short-lived request logs are kept to find and fix errors. None of what
        you enter is part of these requests.
      </p>

      <h2>Cookies and tracking</h2>
      <p>
        CreditDash sets no cookies of its own and runs no analytics, tracking
        pixels or third-party scripts. Fonts are served from the same site, so
        loading a page does not contact a font provider. Cloudflare may set a
        strictly necessary security cookie to protect the site from abuse.
      </p>

      <h2>Advertising</h2>
      <p>
        There is none. Your data is never sold, rented or shared for
        advertising or for anything else.
      </p>

      <h2>When accounts arrive</h2>
      <p>
        Signing in, and saving your wallet to a server so it follows you
        between devices, are planned. Before any of your data leaves your
        browser, this page will be updated to say what moves, where it is
        stored and who can read it, and you will be asked first. The plan is
        that only you can read your data, and that deleting your account
        deletes all of it.
      </p>
      <p>
        If Premium is paid for, payment is handled by Stripe. Your card
        details go to Stripe directly and never reach CreditDash.
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
      <p>A contact address will be published here before launch.</p>
    </LegalPage>
  );
}
