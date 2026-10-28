"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser's Supabase client, or null when the project is not configured
 * (a fork, or a build without the env vars). Without it the app runs as the
 * demo user on browser storage, exactly as before Phase 6.
 *
 * The session lives in cookies, not localStorage, so the sign-in callback
 * route on the server can complete the PKCE exchange that this client
 * started. There is deliberately no proxy.ts refreshing it on each request:
 * OpenNext cannot run a Node proxy yet, and nothing here reads the session
 * on the server except that callback. This client refreshes its own token.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_CONFIGURED = Boolean(url && key);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  client ??= createBrowserClient(url!, key!);
  return client;
}

/**
 * Whether a session cookie is present, checked synchronously. A signed-out
 * visitor, the common case, can then read browser storage on the first
 * frame as before instead of waiting on a network round trip to learn
 * there is no account. A stale cookie is handled when the session is
 * actually read.
 */
export function hasSessionCookie(): boolean {
  if (!SUPABASE_CONFIGURED || typeof document === "undefined") return false;
  const ref = new URL(url!).hostname.split(".")[0];
  // Large sessions are split into chunks: sb-<ref>-auth-token.0, .1, ...
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`sb-${ref}-auth-token`));
}
