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

export type Network = "amex" | "visa" | "mastercard";

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
export type Brand = "hilton" | "marriott" | "delta" | "united" | "hyatt";

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
  /** Annual spend cap in dollars, or null when uncapped. */
  cap: number | null;
  notes?: string;
  boost?: EarnBoost;
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
  credits: CardCredit[];
  /** Percent, 0 when the card charges none. */
  foreignTransactionFee: number;
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
