/**
 * Plans and limits. Every premium check in the app goes through `hasFeature`
 * against this file, so a feature moves between Free and Premium by editing
 * one line here and nothing else.
 *
 * Which features sit behind Premium beyond unlimited cards is deliberately
 * undecided (creditdash-plan.md section 12, question 2).
 */

export type Plan = "free" | "premium";

/**
 * Free is one card with everything else (owner, 2 November 2026). Also in
 * the database's limit trigger; change both.
 */
export const FREE_CARD_LIMIT = 1;

export const PREMIUM_PRICE_MONTHLY = 5;
/** Two months free against paying monthly. */
export const PREMIUM_PRICE_YEARLY = 50;

export type BillingInterval = "month" | "year";

/** "1 card", "3 cards". */
export function cardCount(n: number): string {
  return `${n} ${n === 1 ? "card" : "cards"}`;
}

/** Features that can be gated. Add to this union rather than inventing strings. */
export type Feature = "unlimited-cards" | "autofill";

const PREMIUM_ONLY: ReadonlySet<Feature> = new Set<Feature>(["unlimited-cards", "autofill"]);

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return plan === "premium" || !PREMIUM_ONLY.has(feature);
}

/** How many cards this plan may save. Infinity for Premium. */
export function cardLimit(plan: Plan): number {
  return hasFeature(plan, "unlimited-cards") ? Infinity : FREE_CARD_LIMIT;
}

export function canAddCard(plan: Plan, currentCount: number): boolean {
  return currentCount < cardLimit(plan);
}
