---
version: 1
slug: "app-marketing-page-tsx"
primary_target: "app/(marketing)/page.tsx"
related_targets: ["app/(marketing)/layout.tsx"]
---

Scope: the landing page (Persuade), plus the site-wide look it sets (ground, radius, type, wordmark). App page layouts unchanged.

Audience: people choosing a card at a checkout, and people who track five or more cards in a spreadsheet. Action: open the demo (the whole app, no sign-up).

Pinned by the owner (28 October 2026): match the Zaro reference closely (clean editorial product page, near-white ground, two-tone sans headlines, small square-cornered controls, grey and lavender demo panels, a dark band near the end, dark footer); the supplied CREDIT/DASH wordmark, large in the header; the which-card widget animated in 3D (Motion and CSS 3D, not Three.js, to keep Lighthouse 100); the monthly credits showing clicking and tracking in motion; headlines in a sans, Newsreader retired.

## Direction contract

THESIS: The page proves the answer instead of describing it. Refuses the split hero with a screenshot and a row of equal feature cards: the hero's right half is the working picker, rendered as an isometric stack of the real cards.

OWN-WORLD: Near-white ground #F7F7F4, raised surfaces #FCFCFA, grey demo panels #EFEFEA, a warm charcoal band #26231E. Geist at display sizes, tight tracking, two-tone headlines (ink then muted). Geist Mono only for measurements and axis labels (chart months, the reset date). 6px controls, 12px panels, hairline borders. Category pastels are the only colour besides the cards.

STORY: Which card, answered (hero). The issuers the catalog covers, as plain names in a hairline strip (the reference's logo row, made factual: names only, no logos, so it reads as coverage, not partnership). Credits you would have forgotten, ticked off live (pair of panels). Whether the fee pays for itself (chart). Nothing linked to a bank (dark band). Two plans. Close on the demo.

FIRST VIEWPORT: Header: wordmark 32px tall left, four anchor links centred (one per section the visitor can jump to, Pricing included), the site-wide theme toggle, Sign in and a black Open the demo button right. Left 5 columns: three-line headline about 72px, one sentence, two buttons. Right 7 columns: the card stack over a dotted isometric floor, category chips and the answer line under it.

FORM: Brief-pinned (Zaro reference). The concept roll was skipped, not unavailable: the owner named the direction in their own words, which beats any roll. seed: none (skipped, owner-pinned)

Signature interaction: picking a category pulls the winning card out of the isometric stack and sets it on top, the rest sink and dim; it auto-cycles until touched. Second: a cursor ticks monthly credit slots and the running total counts up; clicking a slot takes over.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
