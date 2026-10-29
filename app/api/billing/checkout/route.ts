import type { NextRequest } from "next/server";
import { PREMIUM_LOOKUP_KEY } from "@/lib/billing/stripe";
import {
  admin,
  BillingError,
  errorResponse,
  profileOf,
  stripe,
  userFromRequest,
} from "@/lib/billing/server";

/**
 * Starts a Stripe Checkout for Premium and returns its URL. The browser
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

    let customer = profile.stripe_customer_id;
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

    const prices = await stripe<{ data: { id: string }[] }>(
      `prices?active=true&lookup_keys[]=${encodeURIComponent(PREMIUM_LOOKUP_KEY)}`,
    );
    const price = prices.data[0]?.id;
    if (!price) throw new BillingError("no_price", 503);

    // Sign-in follows the page's own origin, and so does this.
    const origin = new URL(request.url).origin;
    const session = await stripe<{ url: string }>("checkout/sessions", {
      body: {
        mode: "subscription",
        customer,
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
