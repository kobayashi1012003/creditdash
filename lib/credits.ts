import type { Card, CardCredit, CreditPeriod } from "@/data/types";
import { PERIOD_COUNT } from "@/data/types";

/**
 * Period helpers for the Tracker.
 *
 * Phase 1 uses these for layout. The reset logic that decides which period
 * key is current, and whether a credit resets on the calendar year or the
 * card anniversary, is Phase 3 along with its unit tests.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Human label for slot `i` of a period, e.g. "March", "Q3", "Jul to Dec". */
export function slotLabel(period: CreditPeriod, i: number): string {
  switch (period) {
    case "monthly":
      return MONTHS[i];
    case "quarterly":
      return `Q${i + 1}`;
    case "semiannual":
      return i === 0 ? "Jan to Jun" : "Jul to Dec";
    case "annual":
      return "This year";
  }
}

/** Total value of a credit across a full year. */
export function annualValue(credit: CardCredit): number {
  return credit.amount * PERIOD_COUNT[credit.period];
}

/** Total value of every credit a card offers across a year. */
export function cardAnnualCreditValue(card: Card): number {
  return card.credits.reduce((sum, c) => sum + annualValue(c), 0);
}

export function usedTotal(used: number[]): number {
  return used.reduce((sum, v) => sum + v, 0);
}

/**
 * Which slot index the given date falls in. Calendar basis for now;
 * anniversary basis arrives with the rest of the reset logic in Phase 3.
 */
export function currentSlot(period: CreditPeriod, date = new Date()): number {
  const m = date.getMonth();
  switch (period) {
    case "monthly":
      return m;
    case "quarterly":
      return Math.floor(m / 3);
    case "semiannual":
      return m < 6 ? 0 : 1;
    case "annual":
      return 0;
  }
}

/** True when this credit's current period ends within the next 31 days. */
export function expiringThisMonth(
  credit: CardCredit,
  date = new Date(),
): boolean {
  if (credit.period === "monthly") return true;
  const m = date.getMonth();
  if (credit.period === "quarterly") return m % 3 === 2;
  if (credit.period === "semiannual") return m === 5 || m === 11;
  return m === 11;
}
