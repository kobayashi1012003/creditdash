import type { Card } from "@/data/types";
import type { Category } from "@/lib/categories";
import { centsPerPoint, rateFor } from "@/lib/calculators/engine";
import { cardAnnualCreditValue } from "@/lib/credits";

/**
 * Sort and filter for the Wallet grid. View options only: they change what
 * the grid shows, never the saved order, which only Edit changes.
 */

export type WalletSort =
  | { by: "yours" }
  | { by: "category"; category: Category }
  | { by: "fee-low" }
  | { by: "credits" };

export type WalletFilter = {
  issuers: ReadonlySet<string>;
  /** Cards earning above 1x in every one of these. */
  bonus: ReadonlySet<Category>;
  fee: "any" | "none" | "paid";
};

export const NO_FILTER: WalletFilter = { issuers: new Set(), bonus: new Set(), fee: "any" };

export function activeFilterCount(f: WalletFilter): number {
  return f.issuers.size + f.bonus.size + (f.fee === "any" ? 0 : 1);
}

/** Within a group the choices widen (Amex or Chase); across groups they narrow. */
export function matchesFilter(card: Card, f: WalletFilter): boolean {
  if (f.issuers.size > 0 && !f.issuers.has(card.issuer)) return false;
  for (const c of f.bonus) if (rateFor(card, c).multiplier <= 1) return false;
  if (f.fee === "none" && card.annualFee > 0) return false;
  if (f.fee === "paid" && card.annualFee === 0) return false;
  return true;
}

/**
 * Sorts by value, not multiplier, for a category, exactly as the "which
 * card" answer does: 12x Hilton points is not worth more than 4x Amex.
 * Ties keep the user's own order.
 */
export function sortCards<T extends { card: Card }>(
  entries: readonly T[],
  sort: WalletSort,
  valuations: Record<string, number>,
): T[] {
  const key = (card: Card): number => {
    switch (sort.by) {
      case "category":
        return -rateFor(card, sort.category).multiplier * centsPerPoint(card.program, valuations);
      case "fee-low":
        return card.annualFee;
      case "credits":
        return -cardAnnualCreditValue(card);
      default:
        return 0;
    }
  };
  if (sort.by === "yours") return [...entries];
  return entries
    .map((e, i) => ({ e, i, k: key(e.card) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.e);
}
