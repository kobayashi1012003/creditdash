# Rebuild the calculators, and add a Points page

A brief for one piece of work on CreditDash. **`CLAUDE.md` is the main
reference and takes priority.** If anything here conflicts with it (code
style, voice, file structure, testing, dependencies), follow `CLAUDE.md`
and say so.

Written from the owner's first draft, then revised on 30 October 2026 with
the owner's decisions, listed at the end.

## What changes

The Calculators page has three calculators that are not useful enough.
Replace them with the three below. Each answers one question, updates live
as the user types, and works well on a phone. **The calculators appear in
two places, the Calculators page and the panel docked on the Tracker
(`components/calculators/`), and both change.**

| Current | Replace with |
|---|---|
| Points to dollars | **Award vs cash** |
| Annual fee break-even | **Is this card worth it?** |
| What is my spend worth? | **What is my spend worth?** (rebuilt and simplified) |

Separately, a new **Points** page holds the user's points and miles, and
the two point sections leave Settings (see "The Points page").

## Before you write code

1. Read the existing calculators and registry, `lib/calculators/engine.ts`,
   the card catalog (`data/cards.seed.ts`, `data/types.ts`), the Tracker,
   Settings, and how valuations are stored and read (`lib/data/`,
   `useValuations()`, `lib/valuations.ts`).
2. Reply with a short plan: the files you will change, the shared pieces
   you will build, the schema and migration changes the new programs
   need, and the card data gaps (see "Card data"). **Do not invent card
   data to fill gaps.**
3. Wait for the owner's OK, then build.

## Valuations

- **Defaults are CreditDash's own numbers, never The Points Guy's or any
  other publisher's.** They are rounded estimates in line with the
  consensus, labelled "CreditDash default", and the source is never named.
  The current seven are in `DEFAULT_VALUATIONS` in `data/cards.seed.ts`;
  the new programs get defaults from the table below.
- **One source of truth.** Every calculator gets a program's value from one
  helper, which returns the user's value if they set one, else the
  CreditDash default. `useValuations()` already does this for the seven
  current programs; extend it, do not copy tables into calculators.
- **Each result shows where its number came from** in a small label, "Your
  valuation: 2.1¢" or "CreditDash default: 2.0¢".
- **The value can be adjusted right in the calculator.** Next to that
  label, an inline control changes the program's valuation. It writes the
  same stored value the Points page does, so the change shows everywhere.
- **Cents per point is shown in these calculators.** The owner held back
  cents per dollar from the Wallet answer line and Compare; that still
  stands. Cents per point here is fine.

### Programs and CreditDash defaults (cents per point)

Transferable: Amex Membership Rewards 2.0, Capital One 1.8, Chase Ultimate
Rewards 2.0, Citi ThankYou 1.8, Wells Fargo Rewards 1.6, Bilt 2.1

Airlines: Aeromexico 0.8, Air Canada Aeroplan 1.5, Alaska Atmos Rewards
1.5, American AAdvantage 1.4, ANA Mileage Club 1.4, Avianca LifeMiles 1.5,
Avios 1.4, Cathay Asia Miles 1.3, Delta SkyMiles 1.1, Emirates Skywards
1.1, Etihad Guest 1.1, Flying Blue 1.3, Frontier 1.1, JetBlue TrueBlue 1.3,
Qantas 1.2, Singapore KrisFlyer 1.3, Southwest Rapid Rewards 1.3, Turkish
Miles&Smiles 1.1, United MileagePlus 1.3, Virgin Atlantic Flying Club 1.4

Hotels: Accor Live Limitless 2.0, Best Western 0.6, Choice Privileges 0.8,
Hilton Honors 0.5, IHG One Rewards 0.5, Marriott Bonvoy 0.8, World of
Hyatt 1.7, Wyndham 0.6

The `Program` type today has seven ids. Adding programs means extending it,
`PROGRAM_LABELS`, the stored schema (a version bump and migration if the
persisted shape changes) and the Supabase `point_balances` and `valuations`
tables if they constrain the id. Programs no card in the catalog earns are
still valid: people hold airline and hotel points from flying and staying.

## The Points page

A new app page, `/points`, with its own tab: **Wallet, Points, Tracker,
Calculators, Compare, Settings** (`lib/nav.ts`; the phone tab bar goes from
five to six, so measure it at 375px).

- Works like a second wallet, for programs instead of cards. The user adds
  the programs they want to track from the list above (grouped
  Transferable, Airlines, Hotels, searchable), and removes them.
- Each tracked program shows its balance, its value in dollars at the
  user's valuation, and the valuation itself, editable, with a way back to
  the CreditDash default.
- Programs the user's cards earn are suggested first.
- **"Points you hold" and "What a point is worth" leave Settings**, with
  their data carried over: existing balances and valuations must still be
  there afterwards, in both browser storage and accounts.
- Free and Premium: no limit on programs unless the owner decides
  otherwise. Any limit goes through `hasFeature` in `lib/plan.ts`.

## Rules for all three calculators

- **Use the existing card catalog** for earn rates, credits and annual
  fees. Reuse the existing card picking pattern (`AddCardSheet` or a
  compact select); cards in the user's wallet are listed first.
- **Live results.** No Calculate button. Results update on every
  keystroke. Empty or zero inputs show a neutral state, never NaN or an
  error.
- **Inputs:** currency fields accept "$1,200", "1200" or "1200.50"; points
  fields accept "30,000" or "30k". Numeric keyboards on mobile.
- **Plain words** in the site's voice, a one-line verdict at the top of
  every result. Follow "Writing the interface" in `CLAUDE.md` (no em
  dashes). Use the **humanizer** skill for user-facing copy and say that
  you did.
- Keep "Not financial advice" in each calculator's footer.
- **Every formula in pure, dependency-free functions with unit tests**, in
  or next to `lib/calculators/engine.ts`, including the worked examples.
- No new dependencies unless unavoidable.

## 1. Award vs cash

**The question:** should I pay with points or with cash for this booking?

**Inputs**
- Program: a select grouped Transferable, Airlines, Hotels, with the
  user's tracked programs at the top.
- Cash price ($)
- Points required
- Taxes and fees on the award ($), default 0
- Folded away under "More detail": **rewards you would earn paying cash.**
  Pick a card from the wallet and it works out points earned as cash price
  times that card's flights or hotels rate, valued at the user's
  valuation. Or type a dollar amount directly.

**Formula**
```
cents per point = (cash price - award taxes and fees - rewards forgone) / points x 100
```

**Output**
- The verdict: **Use points** if cents per point is at least 1.1 times the
  valuation; **Pay cash** if below 0.9 times; **Close call** otherwise.
- "You're getting X¢ per point. [Program] points are worth Y¢ to you."
- What the points are worth at the valuation (points times Y¢) next to the
  cash saved, and the difference in dollars.
- If taxes and fees are at or above the cash price: "Pay cash. The award
  costs more in fees than the ticket."

**Worked example (test it):** Chase Ultimate Rewards, $600 cash, 30,000
points, $5.60 fees: (600 - 5.60) / 30,000 = **1.98¢** against the 2.0¢
default, so **Close call**. (The test passes its valuation in, so it does
not move if the default changes.)

## 2. Is this card worth it?

**The question:** will the benefits I would actually use cover the annual
fee?

**Inputs**
- Any catalog card, owned or not. It lists **every benefit the catalog
  has for it.**
- One row per benefit: name, face value and how often it renews ("$10 a
  month"), the most it is worth in a year, and how much the user expects
  to use.
  - **Monthly, quarterly or semiannual credits:** a stepper for periods
    used (for example 0 to 12 months) times the face value, with quick
    None, Half and All buttons.
  - **Annual credits:** a dollar field capped at the face value.
  - **Benefits with no cash value** (lounge access, status, insurance,
    free bags): a dollar field, "What it's worth to you", default $0.
- If the user owns the card: "Fill in from my Tracker", using their
  actual credit usage from the last 12 months (`lib/credits.ts`).

**Output** (at the top, staying visible on a phone while the list scrolls)
- Value used against the annual fee, as a bar with the fee line. Animate
  with `transform` only, as the Tracker's fee bar does.
- The verdict: "**Pays for itself, plus $X**" or "**Falls $X short**",
  with "% of fee covered".
- The biggest gaps: "Unused: $120 Uber Cash", sorted by dollars left.
- Optional, off by default: **add rewards from spending**, the yearly total
  from the spend calculator for the same card, labelled as separate from
  the benefits.

**Edge cases:** a card with no annual fee shows "No annual fee. Every
benefit is a bonus." A card with no benefit data says so plainly, never an
empty list.

## 3. What is my spend worth?

**The question:** how many points will I earn on this card, and what are
they worth? Simpler than now: one card, one timeframe, one result.

**Inputs**
- A card, defaulting to the user's first.
- Timeframe as a segmented control (a radio group through
  `lib/use-roving-focus.ts`): **Day, Week, Month, 6 months, Year**,
  default Month.
- One dollar field per earning category the card has, plus **Everything
  else** at the base rate. Each label shows its rate ("Dining, 4x") and any
  condition in small text, from the earn rate's `notes`.
- Amounts mean "what I will spend in this timeframe". Switching timeframe
  keeps the numbers as typed and recomputes; it does not rescale them.

**Formula**
- Points per category = spend x rate.
- **Earn caps are yearly.** Annualise the spend (Day x365, Week x52, Month
  x12, 6 months x2, Year x1), apply the cap, scale back to the timeframe.
  **Spend past a cap falls to the card's everything-else rate, and a capped
  everything-else rate falls to 1x**, as the engine already does. When a
  cap is hit, label the row "Cap reached. Extra spend earns [base rate]x."
- Dollar value = points x the program's valuation.
- Effective return = dollar value / total spend.

**Output**
- Headline: "**12,400 points this month, worth about $248**", with the
  valuation label.
- Per category: spend, rate, points.
- Effective return as a percent: "2.0% back on everything you entered".
- One quiet line: "At this pace: about 148,800 points a year."

**Worked example (test it):** Amex Gold, timeframe Day, $200 on hotels,
$80 on dining, $40 on everything else, at whatever rates the catalog holds
and the Amex Membership Rewards valuation passed in.

## Card data

The owner will send a large file of current card terms and conditions;
until then, **use placeholders for missing data and never guess values.**

- Structured credits exist (`CardCredit`). Lounge access is a string;
  status, insurance and bags exist only as `finePrint` text.
- For benefits with no structured value, show a "What it's worth to you"
  row at $0, marked as waiting on card data, so the layout is right now
  and fills in when the data arrives.
- List every gap found in the plan.

## Done means

- The three calculators replace the old ones on the Calculators page and
  in the Tracker's panel, and the old code is removed.
- The Points page exists with its own tab, and Settings no longer has the
  two point sections, with no balance or valuation lost.
- Changing a valuation, on the Points page or inside a calculator, changes
  the results everywhere at once.
- Unit tests pass, including both worked examples.
- At 375px nothing scrolls sideways, including the six-tab bar; every
  input is reachable by keyboard and labelled; light and dark checked;
  verified under `npm run preview`.
- The card data gaps are listed.

## Owner's decisions, 30 October 2026

1. Defaults stay CreditDash's own numbers, close to the consensus, with
   the valuation adjustable inside each calculator.
2. Programs will expand. Points and valuations move from Settings to a new
   Points page with its own tab, a separate wallet of point programs.
3. Cents per point is fine in these calculators.
4. Caps fall to the everything-else rate, the app's existing rule.
5. Placeholders for missing card data until the owner's terms file
   arrives.
6. Both the Calculators page and the Tracker's panel change.
