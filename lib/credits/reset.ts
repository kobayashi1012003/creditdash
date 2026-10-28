/**
 * When a credit resets.
 *
 * Issuers do this two ways and the difference is not cosmetic. A calendar
 * credit's year runs January to December. An anniversary credit's year runs
 * from the month the card was opened, so a card opened in November has a
 * "year" of November to October, and its quarters start in November,
 * February, May and August.
 *
 * Getting this wrong tells someone a credit is still available when it has
 * already reset, or that they have lost one they still have. It is the piece
 * of this product most worth being correct, so it lives here on its own with
 * no dependencies and is unit tested.
 *
 * This module is deliberately self-contained: no imports, no framework, no
 * path aliases, so `node --test` can run its tests directly.
 */

export type CreditPeriod = "monthly" | "quarterly" | "semiannual" | "annual";

export type ResetBasis = "calendar" | "anniversary";

/** How many times a credit resets within one cycle year. */
export const PERIOD_COUNT: Record<CreditPeriod, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

/** Months covered by one period of each kind. */
const PERIOD_MONTHS: Record<CreditPeriod, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type PeriodWindow = {
  /**
   * Stable identity for this window, used as the storage key.
   *
   * Calendar windows keep the plain format (`2026`, `2026-H1`, `2026-Q2`,
   * `2026-03`). Anniversary windows are prefixed with the cycle start
   * (`a2026-11`, `a2026-11:Q2`) because "the second quarter" means a
   * different three months depending on when the card was opened.
   */
  key: string;
  /** For the slot's label and tooltip, e.g. "March" or "Nov to Jan". */
  label: string;
  /** Inclusive, local midnight. */
  start: Date;
  /** Exclusive, local midnight. */
  end: Date;
};

export type CycleOptions = {
  period: CreditPeriod;
  resetBasis: ResetBasis;
  /** 1 to 12. Ignored on the calendar basis. */
  anniversaryMonth?: number;
  /** Defaults to now. Pass a fixed date in tests. */
  on?: Date;
};

/** Clamps an anniversary month to 1-12, defaulting to January. */
function normaliseMonth(month: number | undefined): number {
  if (!Number.isFinite(month)) return 1;
  const m = Math.trunc(month as number);
  if (m < 1 || m > 12) return 1;
  return m;
}

/**
 * The first day of the cycle that contains `on`.
 *
 * Calendar: 1 January of that year. Anniversary: the anniversary month of
 * that year, or of the year before when the anniversary has not come round
 * yet.
 */
export function cycleStart({
  resetBasis,
  anniversaryMonth,
  on = new Date(),
}: Omit<CycleOptions, "period">): Date {
  if (resetBasis === "calendar") {
    return new Date(on.getFullYear(), 0, 1);
  }

  const anniversary = normaliseMonth(anniversaryMonth);
  const monthIndex = anniversary - 1;
  const year =
    on.getMonth() >= monthIndex ? on.getFullYear() : on.getFullYear() - 1;
  return new Date(year, monthIndex, 1);
}

/** Every window in the cycle containing `on`, in order. */
export function periodWindows(options: CycleOptions): PeriodWindow[] {
  const { period, resetBasis } = options;
  const start = cycleStart(options);
  const count = PERIOD_COUNT[period];
  const span = PERIOD_MONTHS[period];
  const cycleYear = start.getFullYear();
  const cycleMonth = start.getMonth();

  return Array.from({ length: count }, (_, i) => {
    const from = new Date(cycleYear, cycleMonth + i * span, 1);
    const to = new Date(cycleYear, cycleMonth + (i + 1) * span, 1);
    return {
      key: windowKey(period, resetBasis, start, i),
      label: windowLabel(period, from, to),
      start: from,
      end: to,
    };
  });
}

function windowKey(
  period: CreditPeriod,
  resetBasis: ResetBasis,
  start: Date,
  index: number,
): string {
  if (resetBasis === "calendar") {
    const year = start.getFullYear();
    switch (period) {
      case "annual":
        return `${year}`;
      case "semiannual":
        return `${year}-H${index + 1}`;
      case "quarterly":
        return `${year}-Q${index + 1}`;
      case "monthly":
        return `${year}-${pad(index + 1)}`;
    }
  }

  const prefix = `a${start.getFullYear()}-${pad(start.getMonth() + 1)}`;
  switch (period) {
    case "annual":
      return prefix;
    case "semiannual":
      return `${prefix}:H${index + 1}`;
    case "quarterly":
      return `${prefix}:Q${index + 1}`;
    case "monthly":
      return `${prefix}:M${pad(index + 1)}`;
  }
}

/**
 * Derived from the months the window actually covers, so the same function
 * labels both bases. An anniversary quarter reads "Nov to Jan" rather than
 * "Q1", which would be meaningless to someone looking at a calendar.
 */
function windowLabel(period: CreditPeriod, from: Date, to: Date): string {
  if (period === "monthly") {
    return MONTH_LONG[from.getMonth()];
  }

  const lastMonth = new Date(to.getFullYear(), to.getMonth() - 1, 1);

  if (period === "annual") {
    // A calendar year is just the year; an anniversary year has to name both
    // ends or it is ambiguous.
    if (from.getMonth() === 0) return `${from.getFullYear()}`;
    return `${MONTH_SHORT[from.getMonth()]} ${from.getFullYear()} to ${
      MONTH_SHORT[lastMonth.getMonth()]
    } ${lastMonth.getFullYear()}`;
  }

  return `${MONTH_SHORT[from.getMonth()]} to ${MONTH_SHORT[lastMonth.getMonth()]}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Index of the window containing `on`, or -1 if somehow outside the cycle.
 * Windows are built from the cycle containing `on`, so -1 should not happen;
 * callers that get it should treat the credit as not currently open.
 */
export function currentWindowIndex(options: CycleOptions): number {
  const on = options.on ?? new Date();
  const windows = periodWindows(options);
  return windows.findIndex((w) => on >= w.start && on < w.end);
}

export function currentWindow(options: CycleOptions): PeriodWindow | null {
  const i = currentWindowIndex(options);
  return i === -1 ? null : periodWindows(options)[i];
}

/** The storage key for the window that is open right now. */
export function currentPeriodKey(options: CycleOptions): string | null {
  return currentWindow(options)?.key ?? null;
}

/**
 * True when the open window closes within `days`. Drives the "expiring this
 * month" reminder, which is the whole reason a user would open the Tracker
 * unprompted.
 */
export function expiresWithin(options: CycleOptions, days = 31): boolean {
  const on = options.on ?? new Date();
  const window = currentWindow(options);
  if (!window) return false;
  const msLeft = window.end.getTime() - on.getTime();
  return msLeft > 0 && msLeft <= days * 24 * 60 * 60 * 1000;
}

/** Days until the open window closes, rounded up. */
export function daysUntilReset(options: CycleOptions): number | null {
  const on = options.on ?? new Date();
  const window = currentWindow(options);
  if (!window) return null;
  return Math.ceil((window.end.getTime() - on.getTime()) / 86_400_000);
}
