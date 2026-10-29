import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Deletes the signed-in user's account. Every row of theirs goes with it,
 * by the foreign key cascade from auth.users, so nothing is left behind,
 * and any Premium subscription is cancelled first.
 *
 * Deleting an auth user needs the secret key, which bypasses Row Level
 * Security, so this is the only code that holds it and it acts only on the
 * user the bearer token proves to be. The token is checked with Supabase
 * itself, not decoded here, so a forged or expired one is refused.
 *
 * SUPABASE_SECRET_KEY is a runtime secret: set it in Cloudflare under the
 * Worker's Variables and Secrets, never as a NEXT_PUBLIC_ build variable.
 */
export async function DELETE(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishable || !secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

  const { data, error } = await createClient(url, publishable, noSession).auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const admin = createClient(url, secret, noSession);

  // A Premium account must stop being charged. Deleting the Stripe customer
  // cancels every subscription on it at once. If Stripe refuses, the account
  // stays, because deleting it anyway would leave a charge running with no
  // account left to cancel it from.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (profile?.stripe_customer_id) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    const res = await fetch(
      `https://api.stripe.com/v1/customers/${encodeURIComponent(profile.stripe_customer_id)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${key}` } },
    );
    // 404: already gone at Stripe, so nothing is left to charge.
    if (!res.ok && res.status !== 404) {
      console.error("stripe customer delete", res.status, await res.text());
      return NextResponse.json({ error: "billing_cancel_failed" }, { status: 502 });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
