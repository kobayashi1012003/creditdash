import type { Card, EarnRate, Program } from "@/data/types";
import type { Category } from "@/lib/categories";

/**
 * The arithmetic behind the calculators and the "use which card?" picker.
 *
 * Kept in one file with no runtime imports (the types above are erased), so
 * `node --test` can run its tests directly. Every number the app shows about
 * what a card is worth comes from here, so the panel, the Calculators tab
 * and the Wallet cannot disagree with each other.
 */

/** Cents per point, by program. The user's values, not the seed defaults. */
export type Valuations = Partial<Record<Program, number>>;

const FALLBACK_RATE: EarnRate = { category: "other", multiplier: 1, cap: null };

/**
 * Spend above a category cap earns the card's "everything else" rate. Where
 * the capped rate *is* the everything-else rate, there is no lower tier, so
 * it drops to 1x.
 */
const BASE_OVERFLOW_RATE = 1;

export function centsPerPoint(
  program: Program,
  valuations: Valuations,
): number {
  const v = valuations[program];
  return typeof v === "number" && v >= 0 ? v : 0;
}

/**
 * What a card earns in a category. Falls back to its "everything else" rate,
 * then to 1x, so every card always has an answer.
 */
export function rateFor(card: Card, category: Category): EarnRate {
  return (
    card.earnRates.find((r) => r.category === category) ??
    card.earnRates.find((r) => r.category === "other") ??
    FALLBACK_RATE
  );
}

/**
 * Points earned on a year of spend in one category, respecting the cap.
 *
 * Caps are why this is not a multiplication. Amex Gold earns 4x on groceries
 * up to $25,000 a year and 1x after that, so telling someone who spends
 * $36,000 that they earn 4x on all of it overstates the card by roughly
 * 44,000 points.
 */
export function pointsForSpend(
  card: Card,
  category: Category,
  annualSpend: number,
): number {
  if (!(annualSpend > 0)) return 0;

  const rate = rateFor(card, category);
  const cap = rate.cap;

  if (cap === null || cap === undefined || annualSpend <= cap) {
    return annualSpend * rate.multiplier;
  }

  const base = rateFor(card, "other");
  // A capped "everything else" rate has nothing below it to fall back to.
  const overflowRate =
    rate.category === "other" ? BASE_OVERFLOW_RATE : base.multiplier;

  return cap * rate.multiplier + (annualSpend - cap) * overflowRate;
}

/** Dollar value of points, at the user's own valuation. */
export function pointsToDollars(balance: number, cpp: number): number {
  if (!(balance > 0) || !(cpp > 0)) return 0;
  return (balance * cpp) / 100;
}

/* --- what is my spend worth? --------------------------------------------- */

export type SpendResult = {
  card: Card;
  points: number;
  value: number;
};

/**
 * A year of category spend, valued on each card. `monthlySpend` is per month;
 * caps are annual, so it is multiplied up before any cap is applied.
 */
export function valueSpend(
  cards: Card[],
  monthlySpend: Partial<Record<Category, number>>,
  valuations: Valuations,
): SpendResult[] {
  return cards
    .map((card) => {
      let points = 0;
      for (const [category, monthly] of Object.entries(monthlySpend)) {
        if (!monthly) continue;
        points += pointsForSpend(card, category as Category, monthly * 12);
      }
      return {
        card,
        points,
        value: pointsToDollars(points, centsPerPoint(card.program, valuations)),
      };
    })
    .sort((a, b) => b.value - a.value);
}

/* --- annual fee break-even ----------------------------------------------- */

export type BreakEven = {
  annualFee: number;
  /** Credit value available across a year, if every one is used. */
  creditValue: number;
  /** Fee left after credits. Zero when credits already cover it. */
  shortfall: number;
  /** Credit value beyond the fee. Zero unless the credits exceed it. */
  surplus: number;
  /** Annual spend needed to cover the shortfall, or null when impossible. */
  spendNeeded: number | null;
  /** The everything-else rate the spend figure assumes. */
  baseRate: number;
};

/**
 * How much has to go on a card before its fee pays for itself.
 *
 * Measured at the card's "everything else" rate on purpose. The bonus
 * categories are usually already spoken for by a better card, so the honest
 * question is what the card earns on spend you have not assigned elsewhere.
 */
export function breakEven(
  card: Card,
  creditValue: number,
  valuations: Valuations,
): BreakEven {
  const annualFee = card.annualFee;
  const shortfall = Math.max(0, annualFee - creditValue);
  const surplus = Math.max(0, creditValue - annualFee);

  const base = rateFor(card, "other");
  const baseRate = base.multiplier;
  const cpp = centsPerPoint(card.program, valuations);

  return {
    annualFee,
    creditValue,
    shortfall,
    surplus,
    baseRate,
    spendNeeded: spendToEarn(shortfall, base, cpp),
  };
}

/**
 * Spend needed to earn a given dollar value at a rate, crossing the cap if
 * it has to. Returns null when the points are worthless, because no amount
 * of spend would ever get there and a huge number would be a lie.
 */
function spendToEarn(
  target: number,
  rate: EarnRate,
  cpp: number,
): number | null {
  if (target <= 0) return 0;
  if (cpp <= 0 || rate.multiplier <= 0) return null;

  const valuePerDollar = (rate.multiplier * cpp) / 100;
  const cap = rate.cap;

  if (cap === null || cap === undefined) {
    return target / valuePerDollar;
  }

  const valueAtCap = cap * valuePerDollar;
  if (target <= valueAtCap) {
    return target / valuePerDollar;
  }

  // Past the cap the rate drops, so the rest takes proportionally more spend.
  const overflowPerDollar = (BASE_OVERFLOW_RATE * cpp) / 100;
  if (overflowPerDollar <= 0) return null;
  return cap + (target - valueAtCap) / overflowPerDollar;
}

/* --- which card for this purchase? --------------------------------------- */

export type Ranked = {
  card: Card;
  rate: EarnRate;
  /** Cents back per dollar spent, at the user's valuation. */
  centsPerDollar: number;
};

/**
 * Cards ordered best first for a category.
 *
 * Ranked on value, not on the multiplier. 12x Hilton points at 0.5 cents is
 * worth less than 4x Membership Rewards at 1.9, and a multiplier-only
 * ranking confidently gives the wrong answer.
 */
export function rankCards(
  cards: Card[],
  category: Category,
  valuations: Valuations,
): Ranked[] {
  return cards
    .map((card) => {
      const rate = rateFor(card, category);
      return {
        card,
        rate,
        centsPerDollar:
          rate.multiplier * centsPerPoint(card.program, valuations),
      };
    })
    .sort((a, b) => b.centsPerDollar - a.centsPerDollar);
}

export function bestCardFor(
  cards: Card[],
  category: Category,
  valuations: Valuations,
): Ranked | null {
  return rankCards(cards, category, valuations)[0] ?? null;
}
