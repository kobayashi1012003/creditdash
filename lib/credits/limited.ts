/**
 * Limited-time credits: a credit with `endsOn`, the last day it is offered,
 * as an ISO date ("2026-12-31").
 *
 * A period counts only if it opens on or before that day. Once the day has
 * passed the credit is gone from every screen and every sum, rather than
 * shown as still available, which would be the confident wrong answer this
 * product exists to prevent. /admin flags it so it leaves the catalog too.
 *
 * Dependency-free like reset.ts, so `node --test` runs its tests directly.
 */
import { PERIOD_COUNT, periodWindows, type CreditPeriod, type ResetBasis } from "./reset.ts";

export type LimitedCredit = {
  amount: number;
  period: CreditPeriod;
  resetBasis: ResetBasis;
  endsOn?: string;
};

export type AnniversaryOptions = { anniversaryMonth: number; anniversaryDay?: number };

/** Local midnight after the last day, or null for a credit with no end. */
function endsAt(credit: { endsOn?: string }): Date | null {
  if (!credit.endsOn) return null;
  const [y, m, d] = credit.endsOn.split("-").map(Number);
  return new Date(y, m - 1, d + 1);
}

/** True once the whole of the credit's last day has passed. */
export function creditEnded(credit: { endsOn?: string }, on = new Date()): boolean {
  const end = endsAt(credit);
  return end !== null && on >= end;
}

/** Whether a period of this credit opens before the credit ends. */
export function windowOffered(credit: { endsOn?: string }, window: { start: Date }): boolean {
  const end = endsAt(credit);
  return end === null || window.start < end;
}

/**
 * How many periods of the current cycle the credit is offered for. Without
 * an anniversary (catalog views, Compare) the cycle is the calendar year,
 * which is the basis of every limited-time credit in the catalog.
 */
export function offeredPeriods(
  credit: LimitedCredit,
  anniversary?: AnniversaryOptions,
  on = new Date(),
): number {
  if (!credit.endsOn) return PERIOD_COUNT[credit.period];
  if (creditEnded(credit, on)) return 0;
  return periodWindows({
    period: credit.period,
    resetBasis: anniversary ? credit.resetBasis : "calendar",
    anniversaryMonth: anniversary?.anniversaryMonth,
    anniversaryDay: anniversary?.anniversaryDay,
    on,
  }).filter((w) => windowOffered(credit, w)).length;
}
