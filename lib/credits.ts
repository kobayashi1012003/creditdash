import type { Card, CardCredit, TrackerPrefs } from "@/data/types";
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
  /** Dollars used, one entry per window, assumed or confirmed. */
  used: number[];
  usedTotal: number;
  /** Per window: ticked by auto-fill and not yet confirmed by the user. */
  assumed: boolean[];
  /** The part of usedTotal that is assumed, not recorded by the user. */
  assumedTotal: number;
  /** Per window: false once the credit has ended before it opens. */
  offered: boolean[];
  available: number;
  currentIndex: number;
  expiringSoon: boolean;
};

/**
 * Where a card's anniversary falls: a UserCard has both fields. Passing the
 * UserCard itself also brings its prefs, so assumed (auto-filled) periods
 * are marked without every caller having to look them up.
 */
export type Anniversary = {
  anniversaryMonth: number;
  anniversaryDay?: number;
  prefs?: Pick<TrackerPrefs, "assumed">;
};

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
  const assumedKeys = anniversary.prefs?.assumed?.[credit.id] ?? [];
  const assumed = windows.map((w, i) => used[i] > 0 && assumedKeys.includes(w.key));

  return {
    windows,
    used,
    usedTotal: usedTotal(used),
    assumed,
    assumedTotal: usedTotal(used.filter((_, i) => assumed[i])),
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

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

function list(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/**
 * How often a credit comes round and when it next starts again, in words:
 * "a month, resets on the 1st of each month", "twice a year, resets in Jan
 * and Jul". Read from the windows themselves, so an anniversary credit names
 * its own months and day instead of the calendar's. Replaces "resets on the
 * calendar year", which read wrongly on a monthly credit.
 */
export function resetPhrase(credit: CardCredit, anniversary: Anniversary, on = new Date()): string {
  const windows = periodWindows({
    period: credit.period,
    resetBasis: credit.resetBasis,
    anniversaryMonth: anniversary.anniversaryMonth,
    anniversaryDay: anniversary.anniversaryDay,
    on,
  });
  const first = windows[0]?.start;
  if (!first) return "";
  const day = first.getDate();
  const onDay = day === 1 ? "" : `the ${ordinal(day)} of `;
  const months = windows.map((w) => SHORT_MONTHS[w.start.getMonth()]);
  switch (credit.period) {
    case "monthly":
      return `a month, resets on the ${ordinal(day)} of each month`;
    case "quarterly":
      return `a quarter, resets ${day === 1 ? "in" : "on"} ${onDay}${list(months)}`;
    case "semiannual":
      return `twice a year, resets ${day === 1 ? "in" : "on"} ${onDay}${list(months)}`;
    case "annual":
      return credit.resetBasis === "calendar"
        ? "a year, resets each January"
        : `a year, resets each ${LONG_MONTHS[first.getMonth()]} ${day} (your card anniversary)`;
  }
}
