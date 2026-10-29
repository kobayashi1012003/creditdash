---
name: CreditDash
description: A calm, ad-free dashboard for the credit cards you already own.
colors:
  bg: "#f7f7f4"
  bg-dark: "#12110f"
  surface: "#fcfcfa"
  surface-dark: "#1b1a17"
  panel: "#efefea"
  panel-dark: "#22211d"
  ink: "#16150f"
  ink-dark: "#f4f3ee"
  muted: "#65645f"
  muted-dark: "#a3a29b"
  line: "#e4e3de"
  line-dark: "#2c2a26"
  band: "#26231e"
  band-dark: "#1f1d19"
  band-ink: "#f4f3ee"
  band-muted: "#a39f95"
  band-line: "#3a362f"
  band-line-dark: "#34312b"
  destructive: "#a32b1c"
  destructive-dark: "#f08c7d"
  mint: "#d7f2e3"
  mint-ink: "#0e5138"
  mint-dark: "#15271f"
  mint-ink-dark: "#8fd9b4"
  lavender: "#e4ddfb"
  lavender-ink: "#3b2e7a"
  lavender-dark: "#1f1b33"
  lavender-ink-dark: "#bfb2f2"
  peach: "#fde3d3"
  peach-ink: "#7a3a14"
  peach-dark: "#2b1c12"
  peach-ink-dark: "#f2b98e"
  sky: "#d8e9fb"
  sky-ink: "#14456f"
  sky-dark: "#14222f"
  sky-ink-dark: "#9cc9f0"
  butter: "#fbf1c7"
  butter-ink: "#5e4a0b"
  butter-dark: "#272015"
  butter-ink-dark: "#e8d38a"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.25rem"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
    fontFeature: "tnum"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  measure:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "0em"
rounded:
  widget: "12px"
  card: "12px"
  inner: "8px"
  control: "6px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "16px"
  panel: "20px"
  widget: "24px"
  panel-lg: "28px"
  section: "80px"
  section-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  button-primary-sm:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "32px"
  button-on-band:
    backgroundColor: "{colors.band-ink}"
    textColor: "{colors.band}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  category-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  category-chip-selected:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.peach-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  earn-chip:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.peach-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
  widget:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.widget}"
    padding: "24px"
  demo-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.widget}"
    padding: "28px"
  band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-ink}"
    padding: "112px 40px"
  input:
    textColor: "{colors.ink}"
    rounded: "{rounded.inner}"
    padding: "4px 10px"
    height: "32px"
  checkmark-slot:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.inner}"
    size: "32px"
  card-face:
    rounded: "{rounded.card}"
---

# Design System: CreditDash

Normative source: `app/globals.css`. The tokens above mirror it; if the two
ever disagree, the CSS is right and this file is stale.

## Overview

**Creative North Star: "The Product Sheet"**

A clean editorial product page laid on near-white paper. The ground is never
pure white, headlines are a sans set tight and in two tones, controls are
small and square-shouldered, and the only colour in the room belongs to the
real credit cards and the five category pastels. The owner pinned the world
to the Zaro reference on 28 October 2026: near-white ground, grey and
lavender demo panels, a warm charcoal band near the end, a dark footer.

The system has two kinds of surface and treats them differently.
**Persuade** (landing, sign in) proves the answer instead of describing it:
the hero's right half is the working category picker, drawn as an isometric
stack of the real card faces, and the credits section is the real
CheckmarkRow being ticked by a pointer. **Operate** (wallet, tracker,
calculators, compare, settings) keeps its layouts and inherits the same
tokens; there, scanability and consistency outrank expression and the brand
lives in type, spacing and radius, not decoration.

Density is calm. Sections breathe (80px, 112px at desktop), panels pad at
20px to 28px, and grouping comes from hairline borders and tonal steps
before it comes from shadow.

**Key Characteristics:**
- Near-white ground in three tonal steps (page, raised surface, demo panel).
- Geist at every size; display is weight 500 with negative tracking.
- Two-tone headlines: the claim in ink, the consequence in muted.
- Square-shouldered radii (12 / 8 / 6); pill only for tracks and dots.
- One warm charcoal band that closes the marketing pages.
- Colour belongs to cards and categories; there is no brand accent hue.
- The real components do the demonstrating, in motion.

## Colors

A warm neutral paper palette with no accent of its own, so the cards and the
category pastels carry all the colour.

### Primary
- **Warm Ink** (`ink`): text, the primary button fill, chart strokes, the
  focus ring. A primary action is ink on the page, the strongest contrast
  available, with no hue.

### Secondary
- **Warm Charcoal Band** (`band`): the privacy section, the closing call
  and the footer on marketing pages. It stays dark in both themes (a step
  lifted from the dark page so it still reads as a band) and carries its
  own text pair: `band-ink` for headlines and `band-muted` for the
  consequence half and body (5.9:1 on the band), with `band-line` for
  hairlines.

### Tertiary: the category pastels
- **Mint, Lavender, Peach, Sky, Butter**, each with a `-ink` companion
  legible on it. In light the pastel is the fill and the ink a deep
  hue-matched tone. In dark the relationship inverts: the fill is a deep
  tint of the surface and the ink carries the colour, because a low-alpha
  pastel on a dark surface leaves chip text under WCAG AA. Every pairing is
  verified AA or better in both themes.
- A spend category owns one pastel and keeps it on every screen: wallet
  chip, tracker slots, compare column, calculator row, the landing's credit
  demo. Eight categories share five pastels along family lines (travel
  shares sky, media shares lavender); "everything else" is deliberately
  uncoloured. The mapping lives in `lib/categories.ts` and nowhere else.
- Lavender also fills the landing's "With the Tracker" demo panel, with
  lavender ink at 80% for its secondary text (5.2:1).

### Neutral
- **Paper** (`bg`): the page.
- **Raised Paper** (`surface`): anything raised onto the page; widgets,
  outline buttons, unselected chips, the plan panels.
- **Demo Grey** (`panel`): demo and chart panels on the landing, one step
  darker than the page. Muted text holds 5.1:1 on it.
- **Stone** (`muted`): secondary text and the consequence half of every
  headline, 5.5:1 on the page.
- **Hairline** (`line`): borders, dividers, chart gridlines.
- **Brick** (`destructive`): destructive actions only, as text and border on
  a surface button, never as a fill.

### Named Rules
**The Near-White Rule.** Never pure white, never pure black. The page is
`bg`, raised is `surface`, a demo sits on `panel`; depth is a tonal step
first.

**The Cards Are The Colour Rule.** No accent hue exists. Saturated colour
comes from card art and category pastels only, so a pastel always means a
category.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui)
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace), marketing layout only

**Character:** One sans family doing every job, set tight at display sizes
so it reads as an editorial product sheet rather than an app default. Mono
appears only where something is measured.

### Hierarchy
- **Display** (500, 46px mobile to 68px at xl, 0.98, -0.04em): the hero
  headline, three lines. The closing call on the band uses the same voice at
  40px to 64px.
- **Headline** (500, 30px / 40px / 44px, 1.08, -0.03em): section headings,
  always two-tone.
- **Page title** (500, 32px to 40px, 1): the app's page headers.
- **Figure** (500, 40px, 1, -0.03em, tabular): running totals and prices,
  with a 15px muted unit beside them at normal tracking.
- **Title** (500, 20px, 1.25, -0.03em): widget headings.
- **Body** (400, 15px, 1.625): body copy, measure capped at 40ch to 56ch.
  The hero lead runs at 16px.
- **Label** (500 for names, 400 for notes, 13px): panel titles, chip text,
  captions, footer links.
- **Measure** (Geist Mono 400, 11px): chart month axes and reset dates.
  Nothing else.

### Named Rules
**The Two-Tone Rule.** A headline states its claim in ink and its
consequence in muted (`band-muted` on the band). One sentence, two weights
of attention.

**The Mono Measures Rule.** Geist Mono is for measurements and axis labels
only, and loads only in the marketing layout, so the app never pays for it.

**The Tabular Rule.** Numerals are tabular everywhere by default, so money
and point balances line up in a column.

## Layout

The marketing pages run in a 1200px container with 16px / 24px / 40px side
padding. The hero is an asymmetric 11/13 split: headline, one sentence and
two buttons on the left, the card stack with its chips and answer line on
the right. Other sections alternate a 5/7 split (fee chart), a 2-up panel
pair (credits, pricing capped at 880px) and the full-bleed band. A hairline
strip under the hero lists the issuers the catalog covers, as plain names.
The header is sticky, 76px, with the wordmark at 32px tall, centred anchor
links at desktop, and the theme toggle, Sign in and the primary button
right.

The app is a 232px fixed sidebar with the content column capped at 1200px
at desktop, and a bottom tab bar over a single column on mobile, built first
because the core job happens at a checkout.

Where available width depends on something other than the viewport, use
container queries rather than breakpoints. The Tracker's summary widgets
(width depends on whether the calculator panel is docked) and CardFace (type
scales with its own width) are the worked examples.

## Elevation & Depth

A hybrid that leans flat. Grouping comes from hairline borders and the
three tonal steps; shadow is one soft layer on widgets and a lifted layer
only for things that genuinely float.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 2px 8px rgb(38 35 30 / 0.05)`; dark
  `0 2px 8px rgb(0 0 0 / 0.4)`): the resting widget. It does no work alone.
- **Lifted** (`box-shadow: 0 18px 40px -12px rgb(38 35 30 / 0.22)`; dark
  `0 8px 24px rgb(0 0 0 / 0.55)`): card faces in the isometric stack and
  the mobile calculator button.

Card faces carry a 1px inset ring so a dark card does not dissolve into a
dark page. The isometric stack sits on a dotted floor plate with a blurred
contact shadow beneath it; that is the stack's own material, not a general
elevation device.

### Named Rules
**The Border Before Shadow Rule.** Separate with a hairline or a tonal step
first. No stacked shadows, no coloured halos.

## Shapes

Square-shouldered, not soft.

| Radius | Used for |
|---|---|
| `widget` 12px | Widgets, demo panels, plan panels, the calculator panel |
| `card` 12px | Card faces, a real card's corner |
| `inner` 8px | Inputs, inner surfaces, checkmark slots, sidebar items, the focus ring |
| `control` 6px | Buttons, category chips, earn chips, inline labels |
| `pill` 999px | Tracks, progress bars, dots, switches, round icon buttons |

The wordmark is the owner's CREDIT DASH lettering: black on transparency
used as a CSS mask and painted with `currentColor`, so one file serves both
themes and the band, and the knocked-out DASH shows whatever ground is
behind it. Size it by height; the width follows its 5.78:1 ratio.

### Named Rules
**The Square Shoulder Rule.** Nothing picks a radius outside this scale,
and pill is never a button or chip shape.

## Components

### Buttons
Small, square-shouldered, decisive.
- **Shape:** gently squared (6px).
- **Primary:** ink fill, page-colour text, 40px tall with 20px sides (32px
  and 14px at `sm`, used in the header). One per screen.
- **Hover / Focus:** hover drops the fill to 90%; focus is the global 2px
  ink outline offset 2px. Press scales to 0.97 over 140ms. Disabled is 40%
  opacity.
- **Outline:** surface fill, hairline border that darkens to muted on hover.
- **Ghost:** muted text, surface fill on hover (Sign in in the header).
- **On the band:** colours invert (band-ink fill, band text); the outline
  variant there is transparent with a `band-line` border.

### Chips
- **Category chips:** 6px, surface fill, hairline border, muted text;
  selected takes the category's pastel and ink. A radio group with one tab
  stop and arrow keys; clicking the selected chip clears it.
- **Earn chip:** the category pastel and ink, 13px medium, "4x Dining". The
  uncoloured "everything else" chip gets a hairline border instead.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `surface` for app widgets; `panel` or a category pastel
  for landing demo panels, with an 8px inner surface inside.
- **Shadow Strategy:** soft layer on widgets, none on landing panels.
- **Border:** 1px hairline on widgets and plan panels; the featured plan
  takes an ink border.
- **Internal Padding:** 24px for widgets, 20px to 28px for panels.
- Never nest a widget inside a widget.

### Inputs / Fields
- **Style:** 8px, hairline border, transparent fill, 32px tall.
- **Focus:** border shifts to the focus colour with a soft ring.
- **Error / Disabled:** destructive border and ring; disabled at 50%.

### Navigation
- **Marketing header:** 14px muted anchor links that turn ink with an
  underline on hover; footer link columns in `band-muted` turning
  `band-ink`.
- **App sidebar:** 15px items, 8px radius; active is surface fill, medium
  weight and a filled Phosphor icon; idle is muted with a 60% surface hover.
  Mobile uses a bottom tab bar whose items can shrink (`min-w-0`, truncating
  label).

### CardFace
Renders `public/cards/<id>.webp` when the art exists (8 cards today) and
otherwise draws a face from the card's own `faceStyle`, so no card ever
shows a broken image. A container-query context: type and marks scale with
its own width. Tilt and sheen are spring-driven motion values, mouse only,
off under reduced motion.

### CardStack (signature)
The hero picker as an isometric stack of four real card faces on a dotted
floor. Picking a category runs the real ranking (by value, never by
multiplier): the winner slides out sideways, rises, and settles on top, so
it never passes through the cards above it; the others stay in place under
a 50% veil of the page colour (a veil, not opacity, so lower cards do not
show through). The winner's travel is about 0.9s on the drawer curve and
the others settle in 0.5s on ease-out. It tours four categories by itself
every 2.8s until first touched, pauses off screen, and does not move under
reduced motion. The CategoryBar and AnswerLine beneath it are the Wallet's
own components.

### CheckmarkRow
One slot per period: twelve monthly, four quarterly, two semi-annual, one
annual. A full slot fills with the category ink and a check; a part-used
slot shows a scaled bar, which reads faster than a fraction at 32px; the
current period carries a muted ring. `fluid` lets the slots fill a grid so a
row is one deliberate line at any width.

### CreditDemo (signature)
On the landing, a pointer ticks this year's monthly slots one by one and the
running total keeps up; it pauses off screen, loops, and the first click on
any slot hands control to the visitor. A greyed "Left to memory" twin shows
the same year with credits lapsed. The pointer is decoration; the slots
carry the state.

### CalculatorPanel
Docks sticky on the right at desktop (360px, 12px radius) and collapses to
a slim vertical tab; on mobile it is a floating lifted button opening a
bottom sheet. Its open state is remembered per browser, open on desktop and
closed on mobile.

### ProgressRing
Does not animate on mount. The number is being read, not changed.

### Motion
Curves and durations are tokens, picked by element type: press 140ms, hover
180ms, popovers 200ms, menus 220ms, drawers and panels 280ms. Nothing
routine runs over 300ms; the two signature demos above are the only longer
movements, and both stop for good on interaction and never run under
reduced motion. Never `ease-in` on UI. Only `transform` and `opacity`
animate. Nothing enters from `scale(0)`. Every pressable element scales to
0.97. Full transform strings, not Motion's `x`/`y` shorthands. Reduced
motion means gentler, not none: opacity and colour still carry meaning,
movement does not.

## Do's and Don'ts

### Do:
- **Do** put every colour, radius, duration and curve in `app/globals.css` and reference the token.
- **Do** write headlines two-tone: claim in ink, consequence in muted.
- **Do** keep the ground near-white in three steps (`bg`, `surface`, `panel`).
- **Do** demonstrate with the real component, in motion if it helps, rather than a picture of it.
- **Do** say the answer in words next to any visual that encodes it; a highlighted card alone leaves the user to work out why it won.
- **Do** give every interactive element hover, press, focus and disabled states, and check both themes.
- **Do** use container queries when the available width is not the viewport's.
- **Do** write real sample data and label it as sample on the page.

### Don't:
- **Don't** use an em dash or en dash in any visible string. Not one, anywhere.
- **Don't** introduce an accent hue, a gradient fill, gradient text or a glowing blob; colour belongs to cards and categories.
- **Don't** use a pill radius on a button or chip, or any radius outside the scale.
- **Don't** use Geist Mono for anything but measurements and axis labels, or load it in the app layout.
- **Don't** put an uppercase wide-tracking eyebrow above a heading; the two-tone headline carries the section.
- **Don't** use Instrument Serif or Fraunces.
- **Don't** nest a widget inside a widget.
- **Don't** use a status dot the reader cannot decode, number sections, or add scroll cues.
- **Don't** build a fake product screenshot out of divs.
- **Don't** centre everything; reach for a deliberate asymmetry.
- **Don't** ship a shadcn component in its default styling.
