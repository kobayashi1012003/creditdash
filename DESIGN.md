---
name: CreditDash
description: A calm, ad-free dashboard for the credit cards you already own.
colors:
  bg: "#fafaf9"
  bg-dark: "#0b0b0c"
  surface: "#ffffff"
  surface-dark: "#151517"
  ink: "#0b0b0c"
  ink-dark: "#f5f5f4"
  muted: "#6b6b70"
  muted-dark: "#9a9aa0"
  line: "#ececea"
  line-dark: "#232326"
  mint: "#d7f2e3"
  mint-ink: "#0e5138"
  lavender: "#e4ddfb"
  lavender-ink: "#3b2e7a"
  peach: "#fde3d3"
  peach-ink: "#7a3a14"
  sky: "#d8e9fb"
  sky-ink: "#14456f"
  butter: "#fbf1c7"
  butter-ink: "#5e4a0b"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.875rem"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  heading:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0em"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  widget: "24px"
  inner: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "40px"
  widget:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.widget}"
    padding: "24px"
  earn-chip:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.peach-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inner}"
    padding: "0 12px"
    height: "40px"
---

# Design

Normative source: `app/globals.css`. The tokens above mirror it; if the two
ever disagree, the CSS is right and this file is stale.

## Overview

Black and white base, soft pastel accents, large rounded surfaces, generous
space. The references pinned in `creditdash-plan.md` section 3.1 are X Money
for its monochrome confidence and products shown as clean floating objects,
and the Behance "Clean Web App Dashboard" for calm pastel tiles.

Two modes of surface, and they are designed differently:

- **Persuade** (landing, sign in): the product's own components do the
  arguing. The hero is a working category picker, not a picture of one.
- **Operate** (wallet, tracker, calculators, compare, settings): scanability
  and consistency outrank expression. Brand lives in the type and the
  spacing, not in decoration.

The credit cards are the only saturated colour in the product. Everything
around them is neutral so they read as physical objects on a quiet surface.

## Colors

Neutral base in both themes, never pure black or pure white. `bg` is the page,
`surface` is anything raised onto it, `line` separates, `muted` is secondary
text at 5:1 or better.

Five pastels, each paired with an ink that is legible on it. The relationship
inverts by theme: in light, the pastel is the fill and the ink is a deep
hue-matched tone; in dark, the fill is a deep tint of the surface and the ink
carries the colour. A literal low-alpha pastel on `#151517` puts chip text
under WCAG AA, which is why dark is not the light value with opacity. Every
pairing is verified AA or better in both themes.

A spend category owns one pastel and keeps it on every screen: wallet chip,
tracker checkmarks, compare column, calculator row. Eight categories share
five pastels along family lines (travel shares sky, media shares lavender),
and "everything else" is deliberately uncoloured so the coloured categories
keep their meaning. The mapping lives in `lib/categories.ts`.

There is no accent colour beyond the pastels. A primary button is ink on
background, which is the strongest contrast available and needs no hue.

## Typography

Two families. **Newsreader** for display and widget headings, chosen for
optical sizing so one face serves a 52px hero and a 20px panel title.
**Geist** for everything else, with tabular numerals on globally so money and
point balances line up in a column.

Display type is set tight (`-0.015em`) and close-leaded (1.06). Body runs at
15px with relaxed leading and a measure capped under 65 characters.

Never Instrument Serif or Fraunces: they are the two most recognisable
generated-site display serifs and would undercut the whole point of the
system.

No uppercase wide-tracking eyebrow labels above headings, anywhere. The
heading carries its own weight.

## Layout

Desktop is a 232px fixed sidebar with the content column capped at 1200px.
Mobile is a bottom tab bar with content in a single column, built first
because the core job happens on a phone at a checkout.

Composition is deliberately asymmetric where there is room: the landing hero
is a 6/6 split with the live demo on the right, and app pages lead with a
display title over a single line of context.

Where available width depends on something other than the viewport, use
container queries rather than breakpoints. The Tracker's summary widgets are
the worked example: their width depends on whether the calculator panel is
docked, which no media query can know.

## Elevation & Depth

One soft shadow, tinted to the background hue, and a second lifted variant
for things that genuinely float. Grouping comes from borders and spacing
before it comes from shadow. No stacked shadows, no coloured halos.

Cards get a 1px inset ring so a dark card face does not dissolve into a dark
page.

## Shapes

One radius scale, applied without exception:

| Radius | Used for |
|---|---|
| `widget` 24px | Panels, page-level containers |
| `inner` 16px | Inputs, inner surfaces, card faces, checkmark slots |
| `pill` 999px | Buttons, chips, category selectors |

Buttons are pills, matching the chips. Nothing picks a radius outside this
scale.

## Components

**CardFace** renders the image at `public/cards/<id>.webp` when one exists and
otherwise draws a face from the card's own `faceStyle`, so the app never shows
a broken image. The generated face is not a placeholder; it is what most cards
will use until art is licensed. It is a container-query context, so its type
and chip scale with its own width rather than needing size variants. Metal and
matte finishes differ by one diagonal highlight.

**CategoryBar** and **AnswerLine** are shared by the landing hero and the
wallet, so the thing the landing page demonstrates is literally the thing the
app ships. Ranking is by cents per dollar, not raw multiplier, because 12x
Hilton points is worth less than 4x Membership Rewards.

**CheckmarkRow** gives one slot per period: twelve monthly, four quarterly,
two semi-annual, one annual. A part-used slot shows a scaled bar rather than a
fraction, which reads faster at 32px.

**CalculatorPanel** docks sticky on the right at desktop and collapses to a
slim vertical tab; on mobile it is a floating button opening a bottom sheet.
Its open state is remembered per browser, defaulting open on desktop and
closed on mobile, where it would otherwise cover the page the user came for.

**ProgressRing** does not animate on mount. The number is being read, not
changed, and motion on load makes it harder to read.

### Motion

Curves and durations are tokens, picked by element type: press 140ms, hover
180ms, popovers 200ms, menus 220ms, drawers and panels 280ms. Nothing routine
runs over 300ms.

`ease-in` is never used on UI; it delays the first frame, which is the moment
the user is watching. Only `transform` and `opacity` animate. Nothing enters
from `scale(0)`. Every pressable element scales to 0.97 on press. Motion's
`x`/`y` shorthands are avoided in favour of full transform strings, which stay
hardware accelerated under load.

The card tilt and sheen use spring-interpolated motion values rather than
React state, so a pointer move does not re-render the tree. Both are gated to
mouse input and disabled under reduced motion.

`prefers-reduced-motion` is handled globally in `globals.css` and again in JS
where motion is driven by script. Reduced motion means gentler, not none:
opacity and colour still carry meaning, movement does not.

## Do's and Don'ts

**Do**

- Put every colour, radius, duration and curve in `app/globals.css` and
  reference the token.
- Give every interactive element hover, press, focus and disabled states.
- Check both themes before calling a screen done.
- Write real sample data: actual card names, real amounts, real dates.
- Say the answer in words next to any visual that encodes it. A highlighted
  card alone leaves the user to work out why it won.
- Use container queries when the available width is not the viewport's.

**Don't**

- Use an em dash or en dash in any visible string. Not one, anywhere.
- Put an uppercase tracking label above a heading.
- Nest a widget inside a widget.
- Use a decorative dot that the reader cannot decode.
- Number sections, add scroll cues, or add a gradient as decoration.
- Build a fake product screenshot out of divs. The real component is
  available; use it.
- Centre everything. Reach for a deliberate asymmetry instead.
- Ship a shadcn component in its default styling.
