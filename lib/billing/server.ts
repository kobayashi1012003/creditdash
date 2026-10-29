import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  form,
  planFromSubscriptions,
  subscriptionRow,
} from "@/lib/billing/stripe";

/**
 * Server-only helpers for the billing routes. Never import this from a
 * browser module: it reads STRIPE_SECRET_KEY and SUPABASE_SECRET_KEY.
 *
 * Both are runtime Secrets on the Worker (Variables and Secrets, Production
 * only), and in .env.local for `npm run preview`. Never NEXT_PUBLIC_.
 */

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export class BillingError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new BillingError("not_configured", 503);
  return value;
}

/** The Supabase client that bypasses RLS. Only ever for the proven user. */
export function admin(): SupabaseClient {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SECRET_KEY"),
    noSession,
  );
}

/**
 * The user a request's bearer token proves, checked with Supabase itself
 * rather than decoded here, so a forged or expired token is refused.
 */
export async function userFromRequest(
  request: Request,
): Promise<{ id: string; email: string | null }> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new BillingError("unauthorised", 401);
  const db = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    noSession,
  );
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new BillingError("unauthorised", 401);
  return { id: data.user.id, email: data.user.email ?? null };
}

/** One call to the Stripe API. Throws a BillingError on any refusal. */
export async function stripe<T = Record<string, unknown>>(
  path: string,
  init: {
    method?: "GET" | "POST" | "DELETE";
    body?: Record<string, string | number | boolean | undefined>;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`,
  };
  if (init.body) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers,
    body: init.body ? form(init.body) : undefined,
  });
  if (!res.ok) {
    // Stripe's message goes to the Worker's logs, never to the browser.
    console.error("stripe", path, res.status, await res.text());
    throw new BillingError("stripe_failed", 502);
  }
  return (await res.json()) as T;
}

type Profile = { plan: string; stripe_customer_id: string | null };

export async function profileOf(db: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await db
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new BillingError("no_profile", 500);
  return data;
}

/**
 * Reads every subscription a customer has from Stripe and writes the result
 * to Supabase: one `subscriptions` row each, and the plan they add up to on
 * the profile. Called for every billing event, so it never trusts an
 * event's own copy of the state.
 *
 * Returns false when no user owns the customer, which happens after an
 * account is deleted: Stripe's cancellation event arrives once the user is
 * already gone, and there is nothing left to update.
 */
export async function syncCustomer(customerId: string): Promise<boolean> {
  const db = admin();
  const { data: owner, error } = await db
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error) throw new BillingError("db_failed", 500);
  if (!owner) return false;

  const list = await stripe<{ data: Parameters<typeof subscriptionRow>[0][] }>(
    `subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=20`,
  );
  const rows = list.data.map((s) => ({ ...subscriptionRow(s), user_id: owner.user_id }));

  if (rows.length > 0) {
    const { error: upsertError } = await db
      .from("subscriptions")
      .upsert(rows, { onConflict: "stripe_subscription_id" });
    if (upsertError) throw new BillingError("db_failed", 500);
  }

  const { error: planError } = await db
    .from("profiles")
    .update({ plan: planFromSubscriptions(list.data) })
    .eq("user_id", owner.user_id);
  if (planError) throw new BillingError("db_failed", 500);
  return true;
}

/** A JSON error response for a thrown BillingError or anything else. */
export function errorResponse(e: unknown): Response {
  if (e instanceof BillingError) {
    return Response.json({ error: e.code }, { status: e.status });
  }
  console.error("billing", e);
  return Response.json({ error: "failed" }, { status: 500 });
}
