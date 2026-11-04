import type { Card, CardCredit } from "@/data/types";
import { expiresWithin, periodWindows, recentWindows } from "@/lib/credits/reset";
import { creditEnded, offeredPeriods, windowOffered } from "@/lib/credits/limited";
import type { CreditUsage } from "@/lib/data/schema";

/**
 * Credit arithmetic for the Tracker.
 *
 * The reset rules themselves live in lib/credits/reset.ts, which is pure and
 * unit tested. This file turns those windows into the numbers a screen shows.
 */

export { creditEnded, windowOffered };

/** A card's credits without the ones that have ended (lib/credits/limited.ts). */
export function liveCredits(credits: CardCredit[], on = new Date()): CardCredit[] {
  return credits.filter((c) => !creditEnded(c, on));
}

/**
 * What a credit is worth across its current cycle: every period, less the
 * periods that open after a limited-time credit ends.
 */
export function annualValue(
  credit: CardCredit,
  anniversary?: Anniversary,
  on = new Date(),
): number {
  return credit.amount * offeredPeriods(credit, anniversary, on);
}

/** Total value of every credit a card offers across a year. */
export function cardAnnualCreditValue(card: Card, on = new Date()): number {
  return card.credits.reduce((sum, c) => sum + annualValue(c, undefined, on), 0);
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
  /** Per window: false once the credit has ended before it opens. */
  offered: boolean[];
  available: number;
  currentIndex: number;
  expiringSoon: boolean;
};

/** Where a card's anniversary falls: a UserCard has both fields. */
export type Anniversary = { anniversaryMonth: number; anniversaryDay?: number };

export function creditState(
  credit: CardCredit,
  anniversary: Anniversary,
  usage: CreditUsage,
  on = new Date(),
): CreditState {
  const options = {
    period: credit.period,
    resetBasis: credit.resetBasis,
    anniversaryMonth: anniversary.anniversaryMonth,
    anniversaryDay: anniversary.anniversaryDay,
    on,
  } as const;

  const windows = periodWindows(options);
  const row = usage[credit.id] ?? {};
  const used = windows.map((w) => row[w.key] ?? 0);

  return {
    windows,
    used,
    usedTotal: usedTotal(used),
    offered: windows.map((w) => windowOffered(credit, w)),
    available: annualValue(credit, anniversary, on),
    currentIndex: windows.findIndex((w) => on >= w.start && on < w.end),
    expiringSoon: expiresWithin(options),
  };
}

/**
 * Dollars of a credit used across the most recent year of its periods, this
 * one included. What "Fill in from my Tracker" puts in the card calculator.
 */
export function usedInRecentYear(
  credit: CardCredit,
  anniversary: Anniversary,
  usage: CreditUsage,
  on = new Date(),
): number {
  const row = usage[credit.id] ?? {};
  const windows = recentWindows({
    period: credit.period,
    resetBasis: credit.resetBasis,
    anniversaryMonth: anniversary.anniversaryMonth,
    anniversaryDay: anniversary.anniversaryDay,
    on,
  }).filter((w) => windowOffered(credit, w));
  const used = windows.reduce((sum, w) => sum + (row[w.key] ?? 0), 0);
  return Math.min(used, credit.amount * windows.length);
}
