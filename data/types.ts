import type { Category } from "@/lib/categories";
import type { Program } from "@/data/programs";
import type { CreditPeriod, ResetBasis } from "@/lib/credits/reset";
import type { AutoFillEntry } from "@/lib/credits/autofill";

/**
 * Shapes mirror the tables in creditdash-plan.md section 6, so Phase 6 can
 * move this into Supabase without the UI changing. Field names are camelCase
 * here and snake_case in the database; the data layer maps between them.
 */

/** The program list, labels and defaults live in data/programs.ts. */
export type { Program } from "@/data/programs";
export { PROGRAM_LABELS } from "@/data/programs";

export type Network = "amex" | "visa" | "mastercard" | "discover";

/**
 * The period model lives with the reset logic in lib/credits/reset.ts, which
 * is dependency-free so `node --test` can run its tests directly. It is
 * re-exported here so the rest of the app has one place to import card types
 * from.
 */
export type { CreditPeriod, ResetBasis } from "@/lib/credits/reset";
export { PERIOD_COUNT } from "@/lib/credits/reset";

/**
 * Drives the generated card face used when no image exists in public/cards/.
 * These are card brand colours, which are data about the card rather than
 * design tokens, so they live here and not in app/globals.css.
 */
export type FaceStyle = {
  /** Base card colour. */
  base: string;
  /** Second colour, used for the subtle vertical shift across the face. */
  shade: string;
  /** Foil, text and chip colour. Must be legible on `base`. */
  foil: string;
  finish: "metal" | "matte";
};

/**
 * Brands a card can earn extra with. A merchant in data/merchants.ts with
 * the same brand switches the ranking to the boosted rate, so "Hilton" in
 * the store search picks the Hilton card.
 */
export type Brand = "hilton" | "marriott" | "delta" | "united" | "hyatt" | "american";

/**
 * A higher rate on a narrower channel: the issuer's travel site, or the
 * card's own airline or hotel. Shown as a note; ranking uses it only when
 * the purchase is known to be on that channel (a brand the user searched).
 */
export type EarnBoost = {
  multiplier: number;
  /** Reads after the rate: "5x prepaid through Amex Travel", "12x at Hilton". */
  where: string;
  brand?: Brand;
};

export type EarnRate = {
  category: Category;
  /**
   * What a purchase in this category earns anywhere, including booking
   * direct with any airline or hotel. This is the rate every ranking and
   * total uses unless a brand says otherwise.
   */
  multiplier: number;
  /** Spend cap in dollars over `capPeriod`, or null when uncapped. */
  cap: number | null;
  /**
   * What the cap is counted over. Absent means a year. A quarterly cap
   * ("$2,500 each quarter") is treated as four times that a year, spread
   * evenly, since the app takes spend as a yearly figure.
   */
  capPeriod?: CapPeriod;
  /**
   * Rates with the same group share one cap between them ("$2,500 in
   * combined purchases"). Every rate in a group carries the same cap and
   * period. Spend in the group fills the highest rate first.
   */
  capGroup?: string;
  notes?: string;
  boost?: EarnBoost;
  /**
   * Set only on rates worked out from a ChosenRate or RotatingRate (see
   * effectiveEarnRates in lib/calculators/engine.ts), never in the catalog,
   * so screens can say "your pick" or "this quarter, activate first".
   */
  source?: "chosen" | "rotating";
};

export type CapPeriod = "year" | "quarter";

/**
 * A bonus on categories the cardholder picks (Bank of America Customized
 * Cash, US Bank Cash+). The pick is the user's (UserCard.prefs.earnChoices);
 * until they make one, `defaultPicks` applies, else no bonus at all.
 */
export type ChosenRate = {
  /** Stable: user picks are stored under it. */
  id: string;
  /** Reads before the options: "Your 3% category". */
  label: string;
  multiplier: number;
  cap: number | null;
  capPeriod?: CapPeriod;
  capGroup?: string;
  /** How many options the cardholder picks for this rate. */
  picks: number;
  /**
   * What can be picked. An option can name spend the app has no category
   * for (drugstores, home improvement): its `categories` is then empty and
   * the pick is stated in words but never ranked.
   */
  options: { id: string; label: string; categories: Category[] }[];
  /** The issuer's choice when the cardholder makes none. */
  defaultPicks?: string[];
  /** One sentence: how often the pick can change, enrollment. */
  notes?: string;
};

/**
 * A bonus on categories that change each calendar quarter (Discover it,
 * Chase Freedom Flex). The catalog holds each quarter's categories; the app
 * uses the current one. Quarters are keyed like the reset keys, "2026-Q4".
 */
export type RotatingRate = {
  id: string;
  multiplier: number;
  cap: number | null;
  capPeriod?: CapPeriod;
  /** Needs activating each quarter. Said wherever the rate is stated. */
  activate: boolean;
  quarters: Record<string, { label: string; categories: Category[] }>;
  notes?: string;
};

export type CardCredit = {
  id: string;
  name: string;
  /** Dollar value of one period's credit. */
  amount: number;
  period: CreditPeriod;
  resetBasis: ResetBasis;
  category?: Category;
  /** The condition most likely to cost someone the credit. */
  notes?: string;
  /** Needs enrolling in the issuer's account before the purchase. */
  enroll?: boolean;
  /** Only paid after this much spend on the card in a calendar year. */
  spendToUnlock?: number;
  /**
   * A limited-time credit's last day (ISO). It ends then and does not
   * renew, so it is labelled everywhere it appears. Absent for credits that
   * come with the card for as long as the card has them.
   */
  endsOn?: string;
  /** This credit's own terms page, when it differs from the card's sourceUrl. */
  sourceUrl?: string;
  /** ISO date this credit was last checked, when later than the card's. */
  lastVerified?: string;
};

export type PerkKind =
  | "lounge"
  | "status"
  | "free-night"
  | "companion"
  | "bags"
  | "protection"
  | "other";

/**
 * A benefit with no regular cash value: lounge access, status, a free
 * night, a companion ticket, travel and purchase protection. Worth
 * whatever the user says it is to them, so it has no dollar figure.
 */
export type CardPerk = {
  id: string;
  name: string;
  kind: PerkKind;
  notes?: string;
  /**
   * A perk that comes as a number of things a year: elite night credits,
   * lounge visits, a free night, a companion fare. "Is this card worth it?"
   * asks how many will be used rather than a dollar figure, and names what
   * would go unused ("11 elite nights unused").
   */
  count?: { perYear: number; unit: [one: string, many: string] };
  /**
   * For a free night: the most it can be redeemed for, in points of the
   * card's own program, so one night's value is prefilled at the user's
   * valuation. Absent where there is no cap; the user then enters a value.
   */
  pointsCap?: number;
};

export type Card = {
  id: string;
  name: string;
  issuer: string;
  network: Network;
  annualFee: number;
  /** The fee in the first year when the issuer waives or lowers it. Shown, not used in sums. */
  firstYearFee?: number;
  program: Program;
  faceStyle: FaceStyle;
  /** Relative to public/. Falls back to the generated face when absent. */
  imagePath?: string;
  issuerUrl: string;
  /** ISO date. Shown as "Last verified" once the data is real. */
  lastVerified: string;
  /** The issuer's own terms page this card was checked against. */
  sourceUrl?: string;
  earnRates: EarnRate[];
  /** Bonus categories the cardholder picks. See ChosenRate. */
  chosenRates?: ChosenRate[];
  /** Bonus categories that rotate each quarter. See RotatingRate. */
  rotatingRates?: RotatingRate[];
  /**
   * Set by lib/data for a card in the user's wallet: their picks for each
   * ChosenRate, by its id. Never in the catalog.
   */
  picks?: Record<string, string[]>;
  credits: CardCredit[];
  /**
   * Percent, 0 when the card charges none. Null when the issuer's pages do
   * not state it: shown as "Not stated", never guessed.
   */
  foreignTransactionFee: number | null;
  loungeAccess: string | null;
  /** Benefits with no cash value. See CardPerk. */
  perks?: CardPerk[];
  /**
   * Points or miles that post by themselves every card anniversary (the
   * Venture X's 10,000 miles). Nothing to spend or tick, so not a credit:
   * the Tracker shows it as received, and every fee sum counts it at the
   * user's valuation of the card's program.
   */
  anniversaryBonus?: { points: number; unit: "points" | "miles" };
  /**
   * Details that are easy to miss and change what the card is worth:
   * enrollment, spend thresholds, recent and announced changes. One
   * sentence each.
   */
  finePrint?: string[];
  /**
   * Added before its data (data/cards.pending.ts): art and a name only.
   * Never ranked, compared or counted; screens say "Details coming soon".
   */
  pending?: true;
};

/** Colours a tracked credit can be drawn in, besides its category's. */
export const TRACKER_COLORS = ["mint", "lavender", "peach", "sky", "butter", "ink"] as const;
export type TrackerColor = (typeof TRACKER_COLORS)[number];

/**
 * How someone has arranged one card's Tracker. Every field is optional; an
 * empty object is the catalog's order, everything shown, category colours,
 * nothing auto-filled. Keys are credit ids.
 */
export type TrackerPrefs = {
  /** Credit ids in the order to show them. Credits not listed follow, in catalog order. */
  order?: string[];
  hidden?: string[];
  colors?: Record<string, TrackerColor>;
  /** Premium. See lib/credits/autofill.ts. */
  autofill?: Record<string, AutoFillEntry>;
  /**
   * Period keys auto-fill ticked that the user has not confirmed, per credit
   * id. Shown as "assumed used", apart from usage the user recorded. Kept
   * apart from `autofill` so switching auto-fill off does not quietly turn
   * its guesses into confirmed usage.
   */
  assumed?: Record<string, string[]>;
  /**
   * The cardholder's picks for each of the card's ChosenRates, by rate id:
   * option ids, at most that rate's `picks`. Kept here because this object
   * is the one per-card settings store (user_cards.credit_prefs).
   */
  earnChoices?: Record<string, string[]>;
};

/** A card the demo user owns. Mirrors `user_cards`. */
export type UserCard = {
  cardId: string;
  nickname?: string;
  openedOn: string;
  anniversaryMonth: number;
  /** 1 to 31, for credits that reset on the exact anniversary. Absent means the 1st. */
  anniversaryDay?: number;
  sortOrder: number;
  prefs?: TrackerPrefs;
};

export type PointBalance = {
  program: Program;
  balance: number;
  updatedAt: string;
};

/** User-editable cents per point. Mirrors `valuations`. */
export type Valuation = {
  program: Program;
  centsPerPoint: number;
};
