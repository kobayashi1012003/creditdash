import type { NextRequest } from "next/server";
import {
  admin,
  BillingError,
  errorResponse,
  profileOf,
  stripe,
  userFromRequest,
} from "@/lib/billing/server";

/**
 * Opens Stripe's Customer Portal for the signed-in user, where they cancel,
 * change their card or download invoices. Stripe hosts all of it, so there
 * is no billing UI here to get wrong.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    const profile = await profileOf(admin(), user.id);
    if (!profile.stripe_customer_id) throw new BillingError("no_customer", 404);

    const origin = new URL(request.url).origin;
    const session = await stripe<{ url: string }>("billing_portal/sessions", {
      body: {
        customer: profile.stripe_customer_id,
        return_url: `${origin}/settings?billing=back#plan`,
      },
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}
