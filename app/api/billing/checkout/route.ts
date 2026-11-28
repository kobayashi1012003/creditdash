import type { NextRequest } from "next/server";
import {
  hasOpenSubscription,
  PREMIUM_LOOKUP_KEY,
  PREMIUM_YEARLY_LOOKUP_KEY,
  sortOpenCheckouts,
  type OpenCheckout,
} from "@/lib/billing/stripe";
import {
  admin,
  BillingError,
  errorResponse,
  profileOf,
  stripe,
  userFromRequest,
} from "@/lib/billing/server";

/**
 * Starts a Stripe Checkout for Premium, monthly or yearly (the body's
 * `interval`, monthly unless it says "year"), and returns its URL. The browser
 * goes there; Stripe collects the card, so CreditDash never sees one.
 *
 * Nothing here grants Premium. Only the webhook does, once Stripe says the
 * subscription is live, so returning to the success URL by hand changes
 * nothing.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    const db = admin();
    const profile = await profileOf(db, user.id);
    if (profile.plan === "premium") throw new BillingError("already_premium", 409);

    // The price first: with live keys but no price carrying the lookup key
    // (the likeliest go-live slip), every click would otherwise create a
    // Stripe customer and then fail.
    const body = (await request.json().catch(() => ({}))) as { interval?: unknown };
    const key = body.interval === "year" ? PREMIUM_YEARLY_LOOKUP_KEY : PREMIUM_LOOKUP_KEY;
    const prices = await stripe<{ data: { id: string }[] }>(
      `prices?active=true&lookup_keys[]=${encodeURIComponent(key)}`,
    );
    const price = prices.data[0]?.id;
    if (!price) throw new BillingError("no_price", 503);

    let customer = profile.stripe_customer_id;
    // Already on a customer: refuse if a subscription is still on it, and
    // tidy its open Checkouts, so at most one can be paid at a time.
    let expired: string[] = [];
    if (customer) {
      const c = encodeURIComponent(customer);
      const subs = await stripe<{ data: { status: string }[] }>(
        `subscriptions?customer=${c}&status=all&limit=20`,
      );
      if (hasOpenSubscription(subs.data)) throw new BillingError("already_subscribed", 409);

      const open = await stripe<{ data: OpenCheckout[] }>(
        `checkout/sessions?customer=${c}&status=open&limit=20`,
      );
      const { reuse, expire } = sortOpenCheckouts(open.data, price);
      if (reuse?.url) return Response.json({ url: reuse.url });
      await Promise.all(
        expire.map((id) =>
          stripe(`checkout/sessions/${encodeURIComponent(id)}/expire`, { method: "POST" }),
        ),
      );
      expired = expire;
    }
    if (!customer) {
      // The idempotency key makes a double click create one customer, not
      // two, for the 24 hours Stripe remembers it.
      const created = await stripe<{ id: string }>("customers", {
        body: { email: user.email ?? undefined, "metadata[user_id]": user.id },
        idempotencyKey: `customer-${user.id}`,
      });
      customer = created.id;
      const { error } = await db
        .from("profiles")
        .update({ stripe_customer_id: customer })
        .eq("user_id", user.id)
        .is("stripe_customer_id", null);
      if (error) throw new BillingError("db_failed", 500);
    }

    // Sign-in follows the page's own origin, and so does this.
    const origin = new URL(request.url).origin;
    // Two requests at the same moment (a double click) both find nothing
    // open, so the idempotency key makes Stripe return one session to both.
    // It names the sessions just expired, so choosing monthly, then yearly,
    // then monthly again within the minute still gets a fresh, payable one.
    const idempotencyKey = `checkout-${user.id}-${await shortHash(
      [price, Math.floor(Date.now() / 60_000), ...expired].join("|"),
    )}`;
    const session = await stripe<{ url: string }>("checkout/sessions", {
      idempotencyKey,
      body: {
        mode: "subscription",
        customer,
        "metadata[price]": price,
        client_reference_id: user.id,
        "line_items[0][price]": price,
        "line_items[0][quantity]": 1,
        "subscription_data[metadata][user_id]": user.id,
        success_url: `${origin}/settings?billing=done#plan`,
        cancel_url: `${origin}/settings#plan`,
      },
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}

async function shortHash(text: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  );
  return Array.from(digest.slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}
