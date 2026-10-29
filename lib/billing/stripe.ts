/**
 * The Stripe logic that decides anything: whether a webhook really came from
 * Stripe, and which plan a customer's subscriptions add up to.
 *
 * Like lib/credits/reset.ts this has no imports and no path aliases, so
 * `node --test` runs its tests directly. The routes that call Stripe live in
 * lib/billing/server.ts and app/api/billing/.
 *
 * There is no Stripe SDK. The app makes four kinds of request (customer,
 * price lookup, checkout session, portal session) plus a subscription list,
 * and fetch with a form body covers all of them without adding to the
 * Worker bundle.
 */

/**
 * The Premium price is found by this lookup key, not by id, so test mode
 * and live mode each carry their own price and no price id is configured
 * anywhere. Set it on the price in the Stripe dashboard.
 */
export const PREMIUM_LOOKUP_KEY = "creditdash_premium_monthly";

/**
 * Statuses that keep Premium on. `past_due` is included: Stripe is still
 * retrying the card, and taking Premium away during a retry would punish a
 * bank's delay. Stripe moves the subscription to `canceled` or `unpaid` once
 * its retries run out, and that ends Premium.
 */
const PREMIUM_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "trialing",
  "past_due",
]);

export type SubscriptionLike = { status: string };

/** Premium if any subscription is in a live state, otherwise Free. */
export function planFromSubscriptions(
  subs: readonly SubscriptionLike[],
): "free" | "premium" {
  return subs.some((s) => PREMIUM_STATUSES.has(s.status)) ? "premium" : "free";
}

/**
 * The row stored in `subscriptions` for one Stripe subscription.
 *
 * Newer Stripe API versions moved `current_period_end` from the
 * subscription onto each item, so both places are read.
 */
export type SubscriptionRow = {
  stripe_subscription_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
};

export function subscriptionRow(sub: StripeSubscription): SubscriptionRow {
  const end = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
  return {
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    // The portal can schedule a cancellation either way: the flag, or a
    // `cancel_at` date. Both mean Premium ends at a known time.
    cancel_at_period_end: Boolean(sub.cancel_at_period_end || sub.cancel_at),
  };
}

/**
 * Encodes Stripe's form body. Keys are passed already bracketed
 * (`line_items[0][price]`), which keeps this flat and obvious. Undefined
 * values are left out.
 */
export function form(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) body.append(key, String(value));
  }
  return body.toString();
}

/** How old a signed webhook may be, in seconds. Stripe's own default. */
export const WEBHOOK_TOLERANCE = 300;

/**
 * Checks a `Stripe-Signature` header against the raw body, as Stripe's SDK
 * does: HMAC-SHA256 of `${timestamp}.${body}` keyed with the endpoint
 * secret, compared in constant time against every `v1` signature (there are
 * two while a secret is being rolled), and refused if older than the
 * tolerance, so a captured request cannot be replayed later.
 *
 * The body must be the exact bytes Stripe sent. Parsing and re-serialising
 * the JSON first changes them and every check fails.
 */
export async function verifyWebhook(
  body: string,
  header: string | null,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!header || !secret) return false;

  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") timestamp = Number(value);
    else if (key === "v1") signatures.push(value);
  }
  if (timestamp === null || !Number.isFinite(timestamp) || signatures.length === 0) {
    return false;
  }
  if (Math.abs(nowSeconds - timestamp) > WEBHOOK_TOLERANCE) return false;

  const expected = await hmacHex(secret, `${timestamp}.${body}`);
  return signatures.some((s) => constantTimeEqual(s, expected));
}

/** Signs a payload the way Stripe does. Exported for the tests. */
export async function signWebhook(
  body: string,
  secret: string,
  timestamp: number,
): Promise<string> {
  return `t=${timestamp},v1=${await hmacHex(secret, `${timestamp}.${body}`)}`;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * The events that can change a customer's plan. Each one only says *that*
 * something changed; the handler then reads the customer's subscriptions
 * fresh from Stripe, so events arriving late, twice or out of order still
 * end at the right plan.
 */
export const PLAN_EVENTS: ReadonlySet<string> = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

/** The customer id an event is about, or null. */
export function eventCustomer(event: {
  type?: string;
  data?: { object?: { customer?: unknown } };
}): string | null {
  const c = event.data?.object?.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "id" in c && typeof c.id === "string") return c.id;
  return null;
}
