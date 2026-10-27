# CreditDash

A dashboard for the credit cards you already own. Save them, see which one to
use for a given purchase, track the credits each card gives back, and judge
whether the annual fee pays for itself.

Everything is entered by hand. No bank linking, no card numbers, no ads.

## Status

Phase 0 of `creditdash-plan.md`. The foundation is in place: design tokens,
light and dark themes, and a build that runs in the Cloudflare Workers runtime.
Pages and components come next.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. `/dev/tokens` renders the whole token system
in both themes; Phase 1 removes that route.

To run it the way Cloudflare will:

```bash
npm run preview
```

This builds through the OpenNext adapter and serves from the real Workers
runtime. The dev server and the Workers runtime do not behave identically, so
treat this as the check that matters.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind v4, Motion, Recharts, Phosphor
icons, next-themes. Deployed to Cloudflare Workers through
`@opennextjs/cloudflare`. Supabase and Stripe arrive in later phases.

## Project docs

- `creditdash-plan.md` is the build plan and its phases.
- `PRODUCT.md` is product truth: users, purpose, constraints, open decisions.
- `CLAUDE.md` is the build conventions, including the full token reference.
