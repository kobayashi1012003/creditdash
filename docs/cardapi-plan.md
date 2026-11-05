# CardAPI as the card catalog: plan

Status: proposal, 5 November 2026. Nothing in the app has changed yet.
`@cardapi/client` 0.4.0 is installed but not imported anywhere.

Goal: card facts (fees, earn rates, credits, perks) come from CardAPI
instead of hand-reading issuer terms pages, so the `creditcarddata` links
folder is no longer needed.

## What I found

### CardAPI

- 356 US and Canadian cards from 39 issuers. Data is **scraped
  automatically** from issuer sites; the terms disclaim accuracy ("Always
  verify critical information directly with the card issuer").
- One maintainer, first published March 2026, no public source repo. The
  SDK itself is small (36 KB, no dependencies, no install scripts) and is
  just `fetch` calls to `https://api.cardapi.dev`.
- **Plans** (cardapi.dev/pricing):

  | Plan | Price | Calls | What we would get |
  |---|---|---|---|
  | Free | $0 | 100/day | Name, fee, currency, **best 3 earn rates only** |
  | Starter | $29/mo | 500/day | All rates, **statement credits, perks**, benefits |
  | Pro | $79/mo | 2,000/day | + change history, transfer partners |
  | Enterprise | $249/mo | 20,000/day | + card art, webhooks |

  Fields above the plan are silently left out of responses.
- **Terms** (cardapi.dev/terms): we may store and display the data in our
  app while a plan is active. We may **not** re-serve it as a bulk export,
  feed or spreadsheet, or give the dataset to others. **When the plan ends,
  stored data must be deleted within 30 days.** Data from the free trial is
  for evaluation only.

### Our side

- The catalog is a typed array (`data/cards.seed.ts`, 20 cards) read
  **synchronously** through `CARDS` / `getCard` in 36 places, including
  the data layer's schema validation, ranking, Compare, calculators, the
  landing page and the pre-hydration first-card script.
- Users' stored data refers to **our text ids**: `user_cards.card_id`
  (`amex-gold`) and `credit_usage.credit_id` (`gold-resy-50`), plus credit
  ids inside `credit_prefs` (order, hidden, colours, auto-fill). There is
  no foreign key, so ids can stay ours whatever the source is.
- Every page is prerendered and served from the static cache, because a
  per-request render blows the Workers free plan's 10 ms CPU limit.

## What CardAPI does not have (and we rely on)

| Our field | Why it matters | In CardAPI? |
|---|---|---|
| Credit `resetBasis` (calendar vs anniversary) | The reset logic, the thing most worth getting right | **No.** Only `credit_period` as free text |
| Credit `category`, `spendToUnlock`, `endsOn` | Tracker colour, conditions, "Limited, ends ..." | No (`enrollment_required` and `notes` only) |
| Perk `kind`, `count`, `pointsCap` | Is this card worth it? | Partly (`perk_type`, `perk_value`), no counts |
| `multiplier` vs `boost` with `brand` | Anywhere rate vs travel site or co-brand | Yes, via `booking_channel` and `merchant`, needs mapping |
| Our 8 categories | Pastels, chips, ranking | Their own finer slugs; needs a mapping table |
| `program` ids, valuations | Every dollar figure | `reward_currency` codes; mapping needed. Valuations stay ours (owner's 1 cent baseline) |
| `anniversaryBonus`, `finePrint` | Tracker, drawer | No |
| `faceStyle`, card art | Card faces | `color_from`/`color_to`; art is Enterprise only. Keep our own art |

So CardAPI cannot be the *only* source. It can supply the facts that
change (fees, rates, caps, credit amounts, perks), while a small curated
file of our own supplies the modelling it does not carry.

## Decisions the owner needs to make first

1. **Cost.** Credits and perks need Starter, $29 a month. That breaks
   principle 5 (no fixed running costs at launch). The free plan cannot
   drive the Tracker at all. Options: pay; or use the free plan only to
   *flag changes* in fees and top rates while credits stay hand-checked.
2. **Where the data may live.** This repo is public, and committing a
   CardAPI snapshot would very likely count as the bulk redistribution the
   terms forbid. Options:
   - **A. Make the repo private**, then commit a reviewed snapshot (best
     for reviewing changes; the ops backup encryption still stands).
   - **B. Fetch at build time** with the key as a Workers Builds secret,
     into a gitignored file. No snapshot in git, so changes cannot be
     reviewed before they go live, and a lost build variable (it happened
     once) fails the build.
   Either way, the transformed catalog still ships to browsers as part of
   the JavaScript, as the current one does. Ask CardAPI support whether
   that counts as "displaying to users"; it is the whole dataset we use.
3. **Lock-in.** If the subscription lapses, everything that came from
   CardAPI must be deleted within 30 days. Keep the current hand-written
   seed (our own work, which we may keep) as the fallback, frozen, rather
   than deleting it.
4. **Accuracy.** Our Amex data was checked against the terms pages on
   1 November. Scraped data may be worse for some cards. Phase 1 measures
   this before anything switches.

## Architecture (if we go ahead)

```
CardAPI ──(sync script, key never leaves it)──> raw snapshot (JSON)
                                                     │
data/cards.overlay.ts (ours, committed) ─────────────┤
  our id ↔ CardAPI slug, credit id map,              │
  resetBasis, categories, brand, perk counts,        ▼
  finePrint, faceStyle, anniversaryBonus    lib/cardapi/map.ts (pure, tested)
                                                     │
                                                     ▼
                                   data/cards.generated.ts  (same Card type)
                                                     │
                                   CARDS / getCard  (call sites unchanged)
```

- **The app never calls CardAPI.** No request path, no browser, no Worker
  at runtime. Reasons: the API key would leak or need a server route, every
  page would stop being static (CPU limit), and a CardAPI outage or quota
  429 would break the Wallet. Calls happen only in the sync script.
- **Our ids stay.** The overlay maps `amex-gold` to
  `american-express-gold-card`, and each of our credit ids to a CardAPI
  credit. Users' wallets, usage history and Tracker preferences are
  untouched; no migration.
- **The `Card` type does not change**, so the 36 call sites, the engine
  tests and the reset logic keep working. The swap is one import in
  `data/cards.seed.ts` / `lib/catalog.ts`.
- **A credit CardAPI adds that the overlay has not mapped** is held back
  until it is given an id and a reset basis. It is never guessed: a wrong
  reset basis tells someone a credit is available after it has reset.

## Phases

Each phase ends green on `npm test`, `npm run typecheck`, `npm run lint`
and `npm run preview`, and nothing reaches `main` before then.

### Phase A: evaluate (no app changes)

- Owner gets a key (Starter trial, 7 days, evaluation use is what the trial
  allows). Key goes in `.env.local` as `CARDAPI_API_KEY`; never in chat.
- `scripts/cardapi-compare.mjs` pulls our 20 cards and writes a report to a
  gitignored folder: per card, fee, each rate and cap, each credit amount
  and period, against our seed.
- Owner reads the report. **Go / no-go**: if CardAPI is wrong on cards we
  hand-verified, it should not overwrite them.
- Also confirm with real responses: are credit ids stable between calls,
  how `credit_period` is written, which fields Starter actually returns.

### Phase B: mapping, tested

- `lib/cardapi/map.ts`, dependency-free like `reset.ts` and `engine.ts`:
  CardAPI card + overlay to our `Card`. Category table, program table,
  `booking_channel`/`merchant` to `boost`, period text to `CreditPeriod`.
- `data/cards.overlay.ts` for the 20 cards, written in our own words.
- Tests: every current card maps to the same ids, credits and reset
  bases it has today; unknown periods or categories are rejected, not
  defaulted; `catalog-review` checks still pass.

### Phase C: sync with guardrails

- `npm run cards:sync` fetches, validates (like `schema.ts`: never cast
  what comes back), maps, and writes the snapshot. About 4 to 25 calls per
  run, well inside any plan.
- **It refuses to write**, and lists why, when: a mapped card or credit
  disappears, a fee or credit amount changes by more than a set share, the
  card count drops, or validation fails. The previous snapshot stays.
- Where it runs depends on decision 2: a weekly GitHub Action opening a
  pull request (private repo), or the Workers build (gitignored file,
  build fails closed on any refusal so the live site keeps its last good
  deploy).

### Phase D: switch over

- Point `CARDS` at the generated catalog. `lastVerified` becomes the
  sync date; `sourceUrl` becomes CardAPI's `source_url`/`tc_url`.
- `/admin` shows the last sync, held-back credits and refused changes,
  instead of the 90-day "check the terms page" flags.
- Verify with `npm run preview`: Wallet, Tracker, Compare, every
  calculator, the landing card stack, `x-opennext-cache: HIT` on every
  page, Lighthouse on `/wallet` against the baseline, worker bundle size.
- Update `CLAUDE.md` (Card data, Phase 8 section) and the Terms page
  (card data comes from a third party and may be wrong; check with the
  issuer). Privacy does not change, because no user data goes to CardAPI.

### Phase E: more cards (later, separate)

356 cards is 18 times today's catalog. Before adding them:
- Keep the full catalog out of the first-load bundle (the Wallet already
  carries about 350 KB of JavaScript and sits below the 90 Lighthouse
  target live). A small search index for the add sheet, details loaded per
  card.
- Each new card still needs an overlay entry for its credits' reset basis
  before its credits show; until then it can be added with earn rates only.

## Risks and how the plan handles them

| Risk | Handling |
|---|---|
| API key leaks | Used only by the sync script. Never `NEXT_PUBLIC_`, never in the Worker, never committed. GitHub or Workers secret plus `.env.local` |
| API key in client bundle | `@cardapi/client` becomes a devDependency imported only from `scripts/` (or replaced with plain `fetch`, as with Stripe) |
| Malicious or broken data from the API | Validated against a schema; strings rendered as text only; URLs kept only if `https`; `image_url`, `affiliate_url`, `apply_url` and referral links ignored (no ads, CSP stays as it is) |
| Supply chain (young package, one maintainer) | Pin the exact version; it never runs in the browser or Worker; review the diff before any upgrade |
| Users lose credit history | Our ids stay; nothing in Supabase changes; no migration |
| Wrong reset basis | Never inferred; an unmapped credit is held back |
| Silent bad sync | Guardrails refuse large or destructive changes; last good snapshot stays |
| CardAPI down or out of quota | Only the sync fails; the live site is unaffected |
| Pages stop being static / CPU 503s | Catalog stays compiled in; no runtime calls; checked with `curl -I` |
| Licence breach | Decision 2 before any data is committed; trial data used only for Phase A |
| Plan lapses | Frozen hand-written seed kept as fallback |
| Monthly cost | Decision 1 |

## The `creditcarddata` folder

It lives in the owner's Downloads, outside the repo, so no code depends on
it. Keep it until Phase D has passed on the live site; after that it can be
deleted by hand. `sourceUrl` fields and the `/admin` terms-page checks that
reflect it are replaced in Phase D.

## Alternative considered: credit-card-bonuses-api (5 November 2026)

`github.com/andenacitelli/credit-card-bonuses-api`, the free JSON behind
Offer Optimist. 179 cards. **Not usable as our source:**

- **No earn rates.** Only `universalCashbackPercent`. Ranking, chips,
  Compare and every calculator need per-category rates and caps.
- **Credits have no period or reset basis.** Each is an annual total
  with a free-text description ("Resy Credit ($100/qtr)") and a
  usability `weight`, and perks are mixed in with credits ("Lounge
  Access", 850). The Tracker cannot be built from that.
- **Stale.** Last updated 8 June 2026 despite "synced daily". It still
  lists the Platinum's Saks credit (ended 1 July 2026), Goldbelly and
  Wine.com on the Gold's dining credit (removed 1 July), and Bilt as the
  old Wells Fargo card (relaunched 7 February).
- **Licence.** MIT plus the Commons Clause: no selling a product whose
  value comes substantially from it; the README says "do not resell as a
  substantial part of a commercial product". The catalog is the core of
  CreditDash and Premium is paid, so this is a real risk.
- Its strength is sign-up offers and their history, which CreditDash does
  not show.

## My recommendation

Do Phase A first; it costs nothing but a trial and answers whether the data
is good enough. If it is, and the owner accepts the $29 a month, go with a
**private repo and weekly reviewed pull requests** (option A): it is the
only setup where a bad scrape is seen before users see it. If the cost is
not acceptable, use the free plan as a change detector for fees and top
rates and keep credits hand-checked.

**Free-only path (no running cost):** keep `data/cards.seed.ts` as the
source, and add `npm run cards:check`, a local script that calls
CardAPI's free plan for our cards and reports where the annual fee or the
top three rates differ from ours. The report is printed, never stored or
committed, so the licence questions do not arise, and about 20 calls a run
fits the 100 a day. The owner then checks only the cards it flags,
instead of re-reading every terms page on a schedule. Credits stay hand
checked, which is where our data is already better than either source.
