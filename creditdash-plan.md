# CreditDash: Build Plan (Draft v2)

> Working draft. "CreditDash" is a placeholder brand name. Items marked **[OPEN]** are decisions still to make.
> **Current focus:** the shell and base of the site, with every page, function and interaction working. Login, payments and live card data come later.

---

## 1. Product overview

**What it is:** A clean, ad-free dashboard where people save the credit cards they own and instantly see which card to use for what, track their card credits, and judge whether each card is worth its annual fee.

**Who it's for:**
- People new to points cards who don't yet remember which card earns what.
- Experienced users with 5+ cards who want a calmer, better-looking alternative to spreadsheets.

**Focus:** Points/miles cards first (Amex MR, Chase UR, Citi TY, Capital One, Bilt, hotel and airline cards). Cash-back cards supported but secondary.

**Plans:**
- **Free:** up to 2 saved cards.
- **Premium ($5/month):** unlimited cards. More premium benefits (full tracking, advanced calculators) will be decided later, so the code must make it easy to move any feature behind the premium flag.

**Principles (apply to every screen):**
1. Answer "which card should I use?" in one tap.
2. No ads, no pop-ups, no walls of text. If a sentence isn't needed, cut it.
3. Everything is entered manually. No bank linking, ever.
4. Never collect card numbers, expiry dates, CVVs, or account logins.
5. No fixed running costs at launch (see section 9).

---

## 2. Pages and features

### 2.1 Wallet (home)
- Grid of the user's saved cards, each showing:
  - Card face image (see section 4.2).
  - Below the card: top 2–3 earn rates as small pastel chips, e.g. `4x Dining` `4x Groceries` `3x Flights`.
- **"Use which card?" bar** at the top: category buttons (Dining, Groceries, Flights, Hotels, Gas, Transit, Streaming, Everything else). Tapping one highlights the best card in the wallet for that category and dims the rest. This is the core feature.
- Tapping a card opens a side drawer (bottom sheet on mobile) with full earn rates, credits, annual fee and anniversary date.
- "Add card" opens a searchable picker from the card catalog.
- **Free limit:** when a free user already has 2 cards, "Add card" shows a calm, inline upgrade panel (not a pop-up) explaining Premium. Until payments exist, its button leads to a "Premium coming soon" placeholder.
- Empty state for new users: a friendly prompt and 3 popular cards to add.

### 2.2 Tracker
- One section per card that has credits (e.g. monthly dining credit, annual travel credit).
- Each credit shows checkmarks for its period: 12 for monthly, 4 for quarterly, 2 for semi-annual, 1 for annual. Tap to mark used. Partial amounts allowed (e.g. $7 of $10).
- Credits reset on calendar year or card anniversary, whichever the issuer uses (stored per credit).
- Summary widgets at the top:
  - Credits used vs. available this year (progress ring).
  - Credits expiring this month (gentle reminder, no pop-up).
  - **Annual fee worth it?** per card: credits used + estimated points value vs. annual fee, shown as a simple bar.
- Points balances: user enters the balance per program (e.g. Amex MR: 142,000). Value is shown using adjustable cents-per-point valuations.
- **Calculator side panel** (see 2.3).

### 2.3 Calculators
Calculators exist in two places that share the same components:

**a) Calculators tab:** full-page versions of every calculator.

**b) Calculator panel inside the Tracker:**
- Desktop: a panel docked on the right side that stays in view while the Tracker scrolls (sticky). A small toggle collapses it to a slim vertical tab at the screen edge and expands it again.
- Mobile: a floating button in the corner opens the panel as a bottom sheet; swipe down to close.
- Remembers whether the user left it open or closed.
- Calculators use the user's real wallet data where relevant (e.g. pre-fills their cards).

**Calculators (first set):**
- Annual fee break-even.
- "What's my spend worth?" Monthly spend per category gives points and value per card in the wallet.
- Points to dollars converter at the user's valuation.

### 2.4 Compare
- Pick 2–3 cards from the catalog (not limited to owned cards).
- Side-by-side rows: annual fee, earn rates by category, credits, transfer program, foreign transaction fee, lounge access.
- Winner in each row gets a soft pastel tint.
- "Add to wallet" on each column (respects the free 2-card limit).

### 2.5 Settings
- Profile, theme (light/dark), points valuations, anniversary dates, plan (Free/Premium), export data (CSV), delete account.

### 2.6 Public pages
- Landing page that sells the product in one scroll.
- Temporary sign-in page (placeholder, see section 5).
- Pricing section (Free vs. Premium).
- Privacy policy and terms, including "not financial advice" and "verify benefits with your issuer."

### 2.7 Later: News widget
- Latest headlines from points/credit card news RSS feeds (e.g. The Points Guy, Doctor of Credit), linking to the original articles. Headlines and links only.

---

## 3. Design system

### 3.1 Direction
Black and white base, soft pastel accents, large rounded widgets, generous white space. References:
- **X Money** (money.x.com): monochrome, confident type, products shown as clean floating objects, a card that flips front to back.
- **Behance "Clean Web App Dashboard"**: soft pastel widget tiles, rounded corners, colorful but calm.

### 3.2 Avoid the "AI-generated site" look
Before building any UI, check which design skills are installed and read the relevant ones for guidance. Examples worth checking for:
- **Emil Kowalski's skill:** animation and interaction polish (easing, timing, micro-interactions).
- **Impeccable:** design quality and avoiding generic AI-looking interfaces.
- **frontend-design** or similar design skills.

These are references, not requirements. Use whatever helps, and where a skill conflicts with this plan, follow this plan. Then follow these rules:
- No purple/blue gradient hero, no gradient text, no glowing blobs in the background.
- No generic phrases like "Unlock the power of…", "Elevate your…", "Seamless", "Revolutionize".
- No emoji as icons. No three identical feature cards in a row with an icon on top.
- Don't center everything. Use deliberate, slightly asymmetric layouts with clear hierarchy.
- No default shadcn look: restyle every component to match the tokens below.
- Real-feeling sample data (specific amounts, dates, card names), never "Lorem ipsum" or "$XX.XX".
- Each screen should have one clear focal point, with type size and weight doing most of the work.
- Every interactive element has hover, press, focus and disabled states.

### 3.3 Tokens (starting point, all in one theme file)
| Token | Light | Dark |
|---|---|---|
| Background | `#FAFAF9` | `#0B0B0C` |
| Surface (widgets) | `#FFFFFF` | `#151517` |
| Text primary | `#0B0B0C` | `#F5F5F4` |
| Text secondary | `#6B6B70` | `#9A9AA0` |
| Border | `#ECECEA` | `#232326` |
| Pastel mint | `#D7F2E3` | muted at 20% opacity |
| Pastel lavender | `#E4DDFB` | muted at 20% opacity |
| Pastel peach | `#FDE3D3` | muted at 20% opacity |
| Pastel sky | `#D8E9FB` | muted at 20% opacity |
| Pastel butter | `#FBF1C7` | muted at 20% opacity |

- Each spend category keeps one pastel everywhere (Dining = peach, Travel = sky, Groceries = mint, etc.).
- Corner radius: 24px widgets, 16px inner elements, 999px chips.
- Shadows: very soft, single layer; rely on borders and spacing more than shadows.

### 3.4 Typography
- UI and numbers: **Geist Sans** (tabular numbers for money).
- Display headings: **Instrument Serif**, used sparingly for large headings.
- Fonts are defined once as tokens (`--font-sans`, `--font-display`) so they can be swapped in one place later.

### 3.5 Motion
- Library: Framer Motion (Motion).
- Card faces: subtle 3D tilt and a moving light sheen on hover (desktop), gentle press on tap (mobile).
- Category picker: best card lifts and glows softly; others fade to 40% opacity.
- Checkmarks: smooth fill with a small count-up of the "used" total.
- Calculator panel: smooth slide in and out.
- Page transitions: short fades and slides (200–300ms). Respect `prefers-reduced-motion`.
- No confetti, no bouncing, nothing gamey.

### 3.6 Layout
- Desktop: slim left sidebar (Wallet, Tracker, Calculators, Compare, Settings), content max-width ~1200px.
- Mobile: bottom tab bar, cards in a single swipeable column. Built mobile-first, since a phone app is the long-term goal.

---

## 4. Card data and images

### 4.1 Card catalog (for now)
- Card details (earn rates, credits, fees) are **sample data for now**, stored in one seed file (`data/cards.seed.ts`) and clearly labeled as sample. The real data source will be decided later.
- Each card has a `lastVerified` date field so the UI is ready to show "Last verified" once real data exists.
- Structure the data so it can later move into the database (section 6) without changing the UI.

### 4.2 Card images
- Card images will be provided manually and placed in `public/cards/`, named by card id (e.g. `public/cards/amex-gold.webp`). Recommended size 1536×969, WebP.
- **Fallback:** a `CardFace` component that renders an elegant card from data (issuer color/gradient or metal texture, card name, chip, network mark area). It is used automatically whenever an image file is missing, so the app never shows a broken image.
- **Licensing note:** cardart.cc's terms limit downloaded art to personal, non-commercial use unless the creator gives permission. Since CreditDash will charge for Premium, get each creator's permission (and credit them) before publishing their designs, or use the generated `CardFace` for those cards.
- Later: users can upload an image of their own card (private storage).

### 4.3 Points valuations
- Default cents-per-point values per program in the seed file, editable per user in Settings.

---

## 5. Accounts and login (deferred)

**For now (build phases 0–5):**
- No real login. The app runs as a demo user, with data saved in the browser (localStorage).
- All data access goes through one data layer (`lib/data/`), so switching from browser storage to Supabase later means changing that layer only, not the pages.
- A temporary sign-in page exists with the final design, a "Continue as demo user" button, and disabled Google/email buttons labeled "coming soon."
- A dev-only toggle switches the demo user between Free and Premium to test the 2-card limit.

**Later (phase 6), guided step by step by Claude Code:**
- **Supabase Auth** with Google sign-in and email magic link. No Apple sign-in for now.
- The user has a Supabase account but has never set up auth. Claude Code must walk through each dashboard step (creating the project, Google OAuth setup in Google Cloud, redirect URLs, environment variables) and explain what each one does.
- Row Level Security on every user table; a test confirms user A cannot read user B's data.
- Account deletion removes all user data.
- No card numbers, CVVs or bank logins anywhere.

---

## 6. Data model (for the Supabase phase)

| Table | Purpose | Key fields |
|---|---|---|
| `cards` | Catalog | id, name, issuer, network, annual_fee, currency_program, face_style, image_path, issuer_url, last_verified |
| `card_earn_rates` | Earn rate per category | card_id, category, multiplier, cap, notes |
| `card_credits` | Credits a card offers | card_id, name, amount, period, reset_basis (calendar/anniversary), category |
| `user_cards` | Cards a user owns | user_id, card_id, nickname, opened_on, anniversary_month, sort_order |
| `credit_usage` | Checkmarks | user_id, user_card_id, credit_id, period_key (e.g. `2026-10`), amount_used |
| `point_balances` | Balance per program | user_id, program, balance, updated_at |
| `valuations` | User overrides | user_id, program, cents_per_point |
| `profiles` | User settings | user_id, display_name, theme, plan (free/premium), stripe_customer_id, is_admin |
| `subscriptions` | Stripe status | user_id, stripe_subscription_id, status, current_period_end |

The local (browser) data layer uses the same shapes so the switch is painless.

---

## 7. Premium and payments

**Now:**
- One config file defines plans and limits, e.g. `FREE_CARD_LIMIT = 2`, and a `hasFeature(user, feature)` helper. Every premium check goes through this helper so features can be moved between Free and Premium later by editing one file.
- Upgrade panel and pricing section are built, but the button goes to a "coming soon" page.

**Later (phase 7):**
- **Stripe Checkout** for the $5/month subscription, plus the **Stripe Customer Portal** so users can cancel or update their payment method themselves (no custom billing UI to build).
- A Stripe webhook (server route) updates the user's plan in Supabase when they subscribe, renew or cancel.
- The card limit is enforced on the server too, not just in the UI.
- **Optional donations:** a Stripe Payment Link ("Support CreditDash") needs almost no code. **[OPEN: include donations alongside Premium or not?]**
- Use Stripe test mode until everything is verified.

---

## 8. Tech stack and deployment

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Standard, well supported |
| Styling | Tailwind CSS + shadcn/ui (fully restyled) | Fast, fully customizable |
| Motion | Framer Motion | Smooth, premium interactions |
| Charts | Recharts | Simple rings and bars |
| Icons | Lucide | Clean line icons |
| Database, auth, storage (later) | Supabase | All-in-one, free tier |
| Payments (later) | Stripe | Checkout, Customer Portal, webhooks |
| Hosting | Cloudflare (free plan, commercial use allowed) | Connected to GitHub, custom domain |
| Mobile (later) | PWA first, native app later | No app store fees to start |

**Deployment notes:**
- Set up for Cloudflare from day one using the **OpenNext Cloudflare adapter** (`@opennextjs/cloudflare`). Plain Cloudflare Pages static hosting can't run the server parts this app will need later (auth callbacks, Stripe webhooks); the OpenNext adapter runs the full Next.js app on Cloudflare Workers.
- Use the Node.js runtime only (no `export const runtime = "edge"`), as OpenNext requires.
- Flow: local project → GitHub repo → Cloudflare connected to the repo → every push to `main` deploys, every branch gets a preview URL → custom domain added when ready to go public.
- Keep the deployed bundle small and check its size against Cloudflare's free-plan Worker limit during setup.
- Secrets (Supabase keys, Stripe keys) only in environment variables, never committed. Add `.env.example` with names only.

---

## 9. Cost check

| Item | Cost | Notes |
|---|---|---|
| Cloudflare free plan | $0 | Commercial use allowed |
| Supabase free | $0 | Free projects pause after 7 days without activity; a free GitHub Actions job pings it every few days. Add a weekly backup job (no automatic backups on free). |
| GitHub | $0 | Repo and Actions |
| Fonts, icons, libraries | $0 | Open source |
| Stripe | No monthly fee | Takes a small percentage plus a fixed fee per payment, only when someone pays |
| Domain name | ~$10–15/yr | Only unavoidable cost; can launch on the free Cloudflare subdomain first |

---

## 10. Build phases (instructions for Claude Code)

Work one phase at a time. At the end of each phase: run the app, check every "Done when" item on desktop and mobile widths, commit, and stop for review before the next phase.

**Phase 0: Setup**
- Check available design skills (e.g. Emil Kowalski's skill, Impeccable, frontend-design) and read the relevant ones for guidance (see 3.2). Re-check them when building animations (Phase 1) and polish (Phase 5).
- Create the Next.js + TypeScript + Tailwind + shadcn/ui project, configured for Cloudflare with the OpenNext adapter. Add Framer Motion, Lucide, Recharts.
- Initialize git with a sensible `.gitignore` and `.env.example`.
- Set up design tokens (3.3), font tokens (3.4), light/dark theme.
- Create `CLAUDE.md` containing the principles (section 1), the anti-AI-look rules (3.2), and the design tokens.
- Done when: the app runs locally, `npm run preview` runs it in the Cloudflare runtime, the theme toggle works, and a sample widget and chip render with the correct tokens.

**Phase 1: Design system and app shell**
- Components: `CardFace` (with image + generated fallback), `EarnChip`, `Widget`, `ProgressRing`, `CheckmarkRow`, `CalculatorPanel`, sidebar, mobile tab bar, drawer/bottom sheet.
- All pages laid out with sample data: Wallet, Tracker, Calculators, Compare, Settings, landing page, temporary sign-in page.
- Done when: every page looks finished on desktop and mobile, navigation works, animations work, and reduced-motion is respected.

**Phase 2: Local data layer and Wallet**
- Build `lib/data/` with browser storage behind it and the shapes from section 6.
- Seed file with ~10 sample cards; card images load from `public/cards/` with fallback.
- Add, remove and reorder cards; card detail drawer; "Use which card?" picker.
- Plan config and `hasFeature` helper; free 2-card limit with the inline upgrade panel; dev toggle for Free/Premium.
- Done when: a free demo user can add 2 cards and sees the upgrade panel on the 3rd; Premium can add more; the picker highlights the right card for every category; data survives a refresh.

**Phase 3: Tracker and calculator panel**
- Credit checkmarks with correct periods and reset logic (calendar vs. anniversary), partial amounts.
- Summary widgets, annual fee value bar, points balances with valuations.
- Sticky, collapsible calculator panel (desktop) and bottom sheet (mobile) that remembers its state.
- Done when: marking credits updates totals instantly and survives a refresh, reset logic has unit tests, and the panel stays usable while scrolling the whole Tracker.

**Phase 4: Calculators tab and Compare**
- Full-page calculators sharing components with the panel.
- Compare page with per-row winner highlighting and "Add to wallet."
- Done when: all calculators give correct results (unit tested) and comparing any 2–3 cards works on mobile and desktop.

**Phase 5: Polish and first deploy**
- Empty states, loading skeletons, error states, focus states, keyboard navigation.
- Privacy policy and terms (placeholder text, clearly marked for review), pricing section.
- PWA manifest and icons.
- Push to GitHub and connect the repo to Cloudflare (Claude Code guides each step).
- Done when: the live preview URL works on a phone, and Lighthouse scores 90+ for performance and accessibility.

**Phase 6: Login and database (guided)**
- Walk the user through Supabase project setup and Google OAuth step by step.
- Create tables with RLS; swap `lib/data/` from browser storage to Supabase; offer to import demo data on first sign-in.
- Done when: a real user can sign in with Google or email link, their data saves to Supabase, and the RLS test passes.

**Phase 7: Premium payments**
- Stripe Checkout, Customer Portal, webhook, server-side card limit; optional donation link.
- Done when: in Stripe test mode, subscribing unlocks Premium, cancelling returns the user to Free at period end, and the free limit can't be bypassed.

**Phase 8: Real card data (to be planned)**
- Decide the data source, build an admin page for the catalog, and optionally automate change alerts from news RSS feeds.

---

## 11. Later ideas
- News headlines widget.
- Native iOS/Android app.
- Signup bonus progress tracker.
- Anniversary and credit-expiry email reminders.
- Shareable "my wallet" image.
- Affiliate links on Compare.

---

## 12. Open questions
1. Donations alongside Premium, or Premium only?
2. Which features beyond unlimited cards become Premium? (Can wait.)
3. Real card data source. (Phase 8.)
