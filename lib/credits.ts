import type { Card, CardCredit } from "@/data/types";
import { PERIOD_COUNT, periodWindows, expiresWithin } from "@/lib/credits/reset";
import type { CreditUsage } from "@/lib/data/schema";

/**
 * Credit arithmetic for the Tracker.
 *
 * The reset rules themselves live in lib/credits/reset.ts, which is pure and
 * unit tested. This file turns those windows into the numbers a screen shows.
 */

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
 * The windows of a credit's current cycle, with how much of each was used.
 *
 * Everything the Tracker renders for one credit comes from here, so the
 * period labels, the storage keys and the totals cannot disagree with each
 * other.
 */
export type CreditState = {
  windows: ReturnType<typeof periodWindows>;
  /** Dollars used, one entry per window. */
  used: number[];
  usedTotal: number;
  available: number;
  currentIndex: number;
  expiringSoon: boolean;
};

export function creditState(
  credit: CardCredit,
  anniversaryMonth: number,
  usage: CreditUsage,
  on = new Date(),
): CreditState {
  const options = {
    period: credit.period,
    resetBasis: credit.resetBasis,
    anniversaryMonth,
    on,
  } as const;

  const windows = periodWindows(options);
  const row = usage[credit.id] ?? {};
  const used = windows.map((w) => row[w.key] ?? 0);

  return {
    windows,
    used,
    usedTotal: usedTotal(used),
    available: annualValue(credit),
    currentIndex: windows.findIndex((w) => on >= w.start && on < w.end),
    expiringSoon: expiresWithin(options),
  };
}
