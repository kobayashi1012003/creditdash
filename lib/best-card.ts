import type { Card, EarnRate } from "@/data/types";
import { valuationFor } from "@/data/cards.seed";
import type { Category } from "@/lib/categories";

const FALLBACK: EarnRate = { category: "other", multiplier: 1, cap: null };

/**
 * What a card earns in a category. Falls back to the card's "everything else"
 * rate, then to 1x, so every card always has an answer.
 */
export function rateFor(card: Card, category: Category): EarnRate {
  return (
    card.earnRates.find((r) => r.category === category) ??
    card.earnRates.find((r) => r.category === "other") ??
    FALLBACK
  );
}

/**
 * Cents back per dollar spent, at the user's valuation of that card's points.
 *
 * Comparing raw multipliers is the obvious approach and it is wrong: 12x
 * Hilton points is worth less than 4x Membership Rewards. Value per dollar is
 * what actually answers "which card should I use?", so that is what the
 * picker ranks on.
 */
export function valuePerDollar(card: Card, category: Category): number {
  return rateFor(card, category).multiplier * valuationFor(card.program);
}

export type Ranked = {
  card: Card;
  rate: EarnRate;
  centsPerDollar: number;
};

/** Cards ordered best first for a category. */
export function rankCards(cards: Card[], category: Category): Ranked[] {
  return cards
    .map((card) => ({
      card,
      rate: rateFor(card, category),
      centsPerDollar: valuePerDollar(card, category),
    }))
    .sort((a, b) => b.centsPerDollar - a.centsPerDollar);
}

export function bestCardFor(cards: Card[], category: Category): Ranked | null {
  return rankCards(cards, category)[0] ?? null;
}
