import type { NextRequest } from "next/server";
import { eventCustomer, PLAN_EVENTS, verifyWebhook } from "@/lib/billing/stripe";
import { errorResponse, syncCustomer } from "@/lib/billing/server";

/**
 * Stripe's webhook, and the only thing that sets a user's plan.
 *
 * The signature is checked against the raw body before anything is parsed.
 * Each event is then treated as "this customer changed": the customer's
 * subscriptions are read fresh from Stripe and written to Supabase, so a
 * late, repeated or out-of-order event still ends at the right plan.
 *
 * A failure returns 500, which makes Stripe retry for up to three days.
 *
 * STRIPE_WEBHOOK_SECRET is the endpoint's signing secret (whsec_...), a
 * runtime Secret on the Worker. Test mode and live mode have different
 * endpoints and different secrets.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const ok = await verifyWebhook(
    body,
    request.headers.get("stripe-signature"),
    process.env.STRIPE_WEBHOOK_SECRET ?? "",
  );
  if (!ok) return Response.json({ error: "bad_signature" }, { status: 400 });

  let event: { type?: string; data?: { object?: { customer?: unknown } } };
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "bad_body" }, { status: 400 });
  }

  if (!event.type || !PLAN_EVENTS.has(event.type)) {
    return Response.json({ received: true, ignored: event.type ?? null });
  }
  const customer = eventCustomer(event);
  if (!customer) return Response.json({ received: true, ignored: "no_customer" });

  try {
    const known = await syncCustomer(customer);
    return Response.json({ received: true, synced: known });
  } catch (e) {
    return errorResponse(e);
  }
}
