/**
 * When a credit resets.
 *
 * Issuers do this two ways and the difference is not cosmetic. A calendar
 * credit's year runs January to December. An anniversary credit's year runs
 * from the month the card was opened, so a card opened in November has a
 * "year" of November to October, and its quarters start in November,
 * February, May and August.
 *
 * Some anniversary credits reset on the exact day (Venture X's travel
 * credit), so a card can carry an anniversary day too. Without one the
 * cycle starts on the 1st, as before. With one, every window starts on that
 * day of its month, clamped to the month's last day (an anniversary on the
 * 31st opens in February on the 28th or 29th).
 *
 * Storage keys name the cycle by the month it starts in, which a day does
 * not change, so setting a day moves the windows' edges but never their
 * keys.
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
  /** 1 to 31, the day the anniversary falls on. Defaults to the 1st. */
  anniversaryDay?: number;
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

/** Clamps an anniversary day to 1-31, defaulting to the 1st. */
function normaliseDay(day: number | undefined): number {
  if (!Number.isFinite(day)) return 1;
  const d = Math.trunc(day as number);
  if (d < 1 || d > 31) return 1;
  return d;
}

/**
 * Local midnight on `day` of a month, or on its last day when the month is
 * shorter. `monthIndex` may run past 11; Date rolls it into later years.
 */
function anchoredDate(year: number, monthIndex: number, day: number): Date {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, last));
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
  anniversaryDay,
  on = new Date(),
}: Omit<CycleOptions, "period">): Date {
  if (resetBasis === "calendar") {
    return new Date(on.getFullYear(), 0, 1);
  }

  const monthIndex = normaliseMonth(anniversaryMonth) - 1;
  const day = normaliseDay(anniversaryDay);
  const thisYear = anchoredDate(on.getFullYear(), monthIndex, day);
  return on >= thisYear ? thisYear : anchoredDate(on.getFullYear() - 1, monthIndex, day);
}

/** Every window in the cycle containing `on`, in order. */
export function periodWindows(options: CycleOptions): PeriodWindow[] {
  const { period, resetBasis } = options;
  const start = cycleStart(options);
  const count = PERIOD_COUNT[period];
  const span = PERIOD_MONTHS[period];
  const cycleYear = start.getFullYear();
  const cycleMonth = start.getMonth();
  const day = resetBasis === "anniversary" ? normaliseDay(options.anniversaryDay) : 1;

  return Array.from({ length: count }, (_, i) => {
    const from = anchoredDate(cycleYear, cycleMonth + i * span, day);
    const to = anchoredDate(cycleYear, cycleMonth + (i + 1) * span, day);
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
  // Windows that open mid-month name their days: "Jun 21 to Jul 20".
  if (from.getDate() !== 1) {
    const last = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1);
    const year = period === "annual" ? (d: Date) => ` ${d.getFullYear()}` : () => "";
    return `${MONTH_SHORT[from.getMonth()]} ${from.getDate()}${year(from)} to ${
      MONTH_SHORT[last.getMonth()]
    } ${last.getDate()}${year(last)}`;
  }

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

/**
 * A year's worth of windows ending with the one open now: the open window
 * and the ones before it, reaching back into the previous cycle where this
 * cycle has not got that far yet. Twelve for a monthly credit, one for an
 * annual one.
 *
 * "Fill in from my Tracker" reads usage through this, so a card opened in
 * November and checked in February still counts the months before its
 * anniversary.
 */
export function recentWindows(options: CycleOptions): PeriodWindow[] {
  const on = options.on ?? new Date();
  const current = periodWindows({ ...options, on });
  const index = current.findIndex((w) => on >= w.start && on < w.end);
  if (index === -1) return current;

  const start = cycleStart({ ...options, on });
  const dayBefore = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
  const previous = periodWindows({ ...options, on: dayBefore });

  const all = [...previous, ...current];
  const end = previous.length + index + 1;
  return all.slice(end - PERIOD_COUNT[options.period], end);
}

/**
 * Every window that opened after `after` and on or before `on`, oldest
 * first, across cycle boundaries. Auto-fill uses this to catch up: opened
 * on 15 March after nothing since January, a monthly credit gets February
 * and March. Both dates are compared as instants in local time.
 */
export function windowsOpenedBetween(
  options: Omit<CycleOptions, "on">,
  after: Date,
  on: Date,
): PeriodWindow[] {
  const out: PeriodWindow[] = [];
  let probe = on;
  // Twelve years of monthly windows is far more than any gap; the bound
  // only stops a bad date from looping forever.
  for (let guard = 0; guard < 150; guard++) {
    const window = currentWindow({ ...options, on: probe });
    if (!window || window.start <= after) break;
    out.push(window);
    probe = new Date(window.start.getFullYear(), window.start.getMonth(), window.start.getDate() - 1);
  }
  return out.reverse();
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
