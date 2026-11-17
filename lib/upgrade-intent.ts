import type { BillingInterval } from "@/lib/plan";

/**
 * "This visitor pressed Get Premium before they had an account." Set on
 * the plan panels, read once by UpgradeRunner after sign-in, which then
 * sends them on to Stripe Checkout, so choosing a plan and paying for it
 * is one journey (owner, 17 November 2026).
 *
 * localStorage rather than sessionStorage: the email link often opens a
 * new tab. An hour old and it is ignored, so a forgotten click never
 * opens a checkout days later. A per-browser convenience, never user
 * data, so it sits beside lib/use-stored-* outside lib/data.
 */

const KEY = "creditdash:upgrade-intent";
const MAX_AGE_MS = 60 * 60 * 1000;

export function rememberUpgrade(interval: BillingInterval): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ interval, at: Date.now() }));
  } catch {
    // Not remembered: after sign-in they choose again in Settings.
  }
}

/** The waiting interval, if one is fresh. Does not clear it. */
export function pendingUpgrade(): BillingInterval | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as { interval?: unknown; at?: unknown } | null;
    if (!v || typeof v.at !== "number" || Date.now() - v.at > MAX_AGE_MS) return null;
    return v.interval === "year" || v.interval === "month" ? v.interval : null;
  } catch {
    return null;
  }
}

export function clearUpgrade(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
}
