import type { Category } from "@/lib/categories";
import type { Program } from "@/data/programs";
import type { CreditPeriod, ResetBasis } from "@/lib/credits/reset";

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

export type EarnRate = {
  category: Category;
  multiplier: number;
  /** Annual spend cap in dollars, or null when uncapped. */
  cap: number | null;
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
};

/**
 * A benefit with no regular cash value: lounge access, status, insurance,
 * free bags. Worth whatever the user says it is to them. Empty across the
 * catalog until the owner's terms file arrives; the calculator shows a
 * placeholder row for lounge access meanwhile.
 */
export type CardPerk = {
  id: string;
  name: string;
  notes?: string;
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
  earnRates: EarnRate[];
  credits: CardCredit[];
  /** Percent, 0 when the card charges none. */
  foreignTransactionFee: number;
  loungeAccess: string | null;
  /** Benefits with no cash value. See CardPerk. */
  perks?: CardPerk[];
  /**
   * Details that are easy to miss and change what the card is worth:
   * enrollment, spend thresholds, recent and announced changes. One
   * sentence each.
   */
  finePrint?: string[];
};

/** A card the demo user owns. Mirrors `user_cards`. */
export type UserCard = {
  cardId: string;
  nickname?: string;
  openedOn: string;
  anniversaryMonth: number;
  sortOrder: number;
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
