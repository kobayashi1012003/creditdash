/**
 * Plans and limits. Every premium check in the app goes through `hasFeature`
 * against this file, so a feature moves between Free and Premium by editing
 * one line here and nothing else.
 *
 * Which features sit behind Premium beyond unlimited cards is deliberately
 * undecided (creditdash-plan.md section 12, question 2).
 */

export type Plan = "free" | "premium";

export const FREE_CARD_LIMIT = 2;

export const PREMIUM_PRICE_MONTHLY = 5;

/** Features that can be gated. Add to this union rather than inventing strings. */
export type Feature = "unlimited-cards";

const PREMIUM_ONLY: ReadonlySet<Feature> = new Set<Feature>(["unlimited-cards"]);

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
