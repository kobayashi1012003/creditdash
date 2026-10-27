# Product

<!-- impeccable:product-schema 1 -->

Source of truth: `creditdash-plan.md`, written by the project owner. Every fact
below is confirmed there. Nothing here is inferred. Open decisions are recorded
as open rather than resolved.

## Platform

web

## Users

Two groups, both managing their own credit cards by hand today.

- People new to points cards who do not yet remember which card earns what, and
  who want an answer at the moment of paying.
- People with five or more cards who already track this in a spreadsheet and
  want something calmer and better looking.

The job is the same for both: decide which card to use, keep track of the
credits a card gives back, and judge whether each annual fee is still worth
paying.

## Product Purpose

A dashboard where someone saves the cards they own and immediately sees which
card to use for a given purchase, how much of each card's credits they have
used, and whether the annual fee pays for itself. Points and miles cards are
the focus. Cash back is supported but secondary.

Success is answering "which card should I use?" in one tap.

## Positioning

Everything is entered by hand and nothing is ever linked to a bank. The product
holds no card numbers, expiry dates, CVVs or account logins, by design and not
as a limitation to be removed later. That is the difference from every
aggregator in the category, and it is why the product can be calm: there is no
account-linking flow to sell, no transaction feed to monetise, and no ads.

## Operating Context

The decision moment is at a checkout, on a phone, in seconds. Tracking credits
is a slower monthly or quarterly habit, often at a desk. The product is built
mobile first because the first job happens on a phone, and a native app is the
long-term direction.

Credits reset on either the calendar year or the card anniversary, depending on
what the issuer does, so reset basis is stored per credit rather than assumed.

## Capabilities and Constraints

Surfaces: Wallet (home), Tracker, Calculators, Compare, Settings, a landing
page, a temporary sign-in page, and legal pages.

- **Wallet:** saved cards with their top earn rates, and a category picker that
  highlights the best card for a category and dims the rest.
- **Tracker:** per-credit checkmarks by period, partial amounts, credits used
  against available, credits expiring this month, an annual-fee-worth-it bar
  per card, and points balances valued at adjustable cents per point.
- **Calculators:** annual fee break-even, what a month of category spend is
  worth per owned card, and points to dollars. They exist as full pages and as
  a panel docked inside the Tracker, sharing the same components.
- **Compare:** two or three cards from the catalog side by side, with the
  winner of each row tinted.

Plans: Free is capped at two saved cards. Premium is $5 per month for unlimited
cards. Which further features sit behind Premium is deliberately undecided, so
every premium check goes through one `hasFeature` helper and one limits config,
and a feature can move between plans by editing one file.

Deferred by design, in this order: real accounts and a database (Supabase, with
row level security), then payments (Stripe Checkout and Customer Portal), then
real card data. Until accounts exist the app runs as a demo user with data in
browser storage, behind a single data layer so the swap touches that layer only.

Hosting is Cloudflare on the free plan, via the OpenNext adapter so server
routes work later. There are no fixed running costs at launch beyond a domain.

## Brand Commitments

- "CreditDash" is a placeholder name and may change.
- No ads, no pop-ups, no walls of text.
- Not financial advice. Benefits must be verified with the issuer.

## Evidence on Hand

None yet, and none may be invented.

- Card details are sample data in one clearly labelled seed file. The real
  source is undecided. Every card carries a `lastVerified` date so the UI is
  ready for real data without a rewrite.
- Card face images are supplied by hand into `public/cards/`. Where an image is
  missing, a generated card face is drawn from data instead.
- Card art downloaded from cardart.cc is licensed for personal, non-commercial
  use. Because Premium is paid, any such art needs the creator's permission and
  credit before it ships, or the generated face is used instead.
- There are no customers, testimonials, reviews or usage numbers. Do not write
  any.

## Product Principles

1. Answer "which card should I use?" in one tap. Every other feature is
   secondary to that.
2. Cut any sentence that is not needed. No ads, no pop-ups, no walls of text.
3. Everything is entered manually. Never link a bank, ever.
4. Never collect card numbers, expiry dates, CVVs or account logins.
5. Keep fixed running costs at zero, so the product can stay ad-free.

## Accessibility & Inclusion

No standard was named by the owner. The working floor is WCAG AA contrast in
both themes, visible keyboard focus on every interactive element, full keyboard
navigation, and `prefers-reduced-motion` respected. Phase 5 targets a
Lighthouse accessibility score of 90 or better.

## Open Decisions

Carried from `creditdash-plan.md` section 12. Do not resolve these in passing.

1. Donations alongside Premium, or Premium only?
2. Which features beyond unlimited cards become Premium?
3. Where real card data comes from.
