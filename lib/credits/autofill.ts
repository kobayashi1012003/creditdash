/**
 * Auto-fill: a credit someone always uses is ticked for them as each period
 * opens (Premium; owner, 3 November 2026).
 *
 * Everything here runs on the device, in its local time. A period opens at
 * local midnight on its first day, exactly as the Tracker draws it, so the
 * Dunkin' credit is ticked from 00:00 on the 1st wherever the person is.
 * There is no server clock involved and no timezone conversion: dates are
 * stored as plain local calendar dates ("2026-11-01") and read back as local
 * midnight.
 *
 * Each auto-filled credit remembers `through`: the first day of the last
 * period it filled. A check fills every period that opened after that and
 * no later than now, then moves `through` on. So:
 *   - turning it on fills the period open now, and nothing before it;
 *   - a phone left off for two months catches up both months on next open;
 *   - unticking a filled period sticks, because `through` has moved past it;
 *   - two devices checking at once write the same values, which is harmless.
 *
 * Like reset.ts this has no runtime imports beyond it, so `node --test`
 * runs its tests directly.
 */

import {
  currentWindow,
  windowsOpenedBetween,
  type CycleOptions,
  type PeriodWindow,
} from "./reset.ts";

export type AutoFillEntry = {
  /** The local date auto-fill was turned on. Shown, not used for maths. */
  since: string;
  /** The first day of the last period filled, as a local date. */
  through: string;
};

/** A local calendar date as "YYYY-MM-DD". Never toISOString, which is UTC. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" back to local midnight, or null if it is not a real date. */
export function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return localDate(d) === s ? d : null;
}

/**
 * The entry to store when auto-fill is switched on at `now`: `through` is
 * the day before the open period began, so that period is due at once and
 * none before it.
 */
export function startAutoFill(options: Omit<CycleOptions, "on">, now: Date): AutoFillEntry {
  const open = currentWindow({ ...options, on: now });
  const start = open?.start ?? now;
  const dayBefore = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
  return { since: localDate(now), through: localDate(dayBefore) };
}

/**
 * The periods to tick now, oldest first, and the `through` to store after
 * ticking them. Nothing due returns an empty list and the same `through`.
 * An unreadable entry is treated as switched on now.
 */
export function autoFillDue(
  options: Omit<CycleOptions, "on">,
  entry: AutoFillEntry,
  now: Date,
): { windows: PeriodWindow[]; through: string } {
  const after = parseLocalDate(entry.through);
  if (!after) {
    const fresh = startAutoFill(options, now);
    return autoFillDue(options, fresh, now);
  }
  const windows = windowsOpenedBetween(options, after, now);
  const last = windows[windows.length - 1];
  return { windows, through: last ? localDate(last.start) : entry.through };
}

/**
 * When to look again: the next local midnight. Periods only ever open at
 * a local midnight, so checking then (and whenever the app comes back to
 * the foreground) never misses one. Built from calendar fields, so a
 * daylight saving change does not shift it by an hour.
 */
export function nextCheck(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
