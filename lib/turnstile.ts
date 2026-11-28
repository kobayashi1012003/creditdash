"use client";

/**
 * Cloudflare Turnstile on email sign-in (security review SEC-01, 28
 * November 2026). Sending a sign-in email goes straight from the browser to
 * Supabase, so Cloudflare's rate limit on /api/* never sees it; without a
 * check, a script could spend the whole email allowance and lock everyone
 * out of email sign-in. Supabase verifies each token on its own servers
 * once CAPTCHA protection is switched on in its Auth settings.
 *
 * - The site key is public by design (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` in
 *   .env.production). Without it nothing loads and no token is sent.
 * - The script loads only when someone starts on the email form, never on
 *   other pages and not for Google sign-in.
 * - It runs invisibly and shows a box only when Cloudflare wants a click.
 * - A token works once, so a fresh one is fetched after every use.
 */

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let scriptLoad: Promise<Turnstile> | null = null;
let widgetId: string | null = null;
let token: string | null = null;
let failed = false;
let waiters: ((t: string | null) => void)[] = [];

function settle(t: string | null) {
  token = t;
  failed = t === null;
  for (const w of waiters) w(t);
  waiters = [];
}

function loadScript(): Promise<Turnstile> {
  scriptLoad ??= new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    s.onerror = () => {
      scriptLoad = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return scriptLoad;
}

/**
 * Starts the check inside `container` (once; later calls do nothing).
 * Called when someone focuses the email field.
 */
export async function startBotCheck(container: HTMLElement | null): Promise<void> {
  if (!TURNSTILE_SITE_KEY || !container || widgetId !== null) return;
  try {
    const ts = await loadScript();
    if (widgetId !== null) return;
    widgetId = ts.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      action: "signin",
      appearance: "interaction-only",
      size: "flexible",
      theme: "auto",
      callback: (t: string) => settle(t),
      "expired-callback": () => {
        token = null;
      },
      "error-callback": () => {
        settle(null);
        // Let Turnstile retry on its own; returning true marks it handled.
        return true;
      },
    });
  } catch {
    settle(null);
  }
}

/** Forgets the widget when the form goes away, so a return starts afresh. */
export function stopBotCheck() {
  if (widgetId !== null) window.turnstile?.remove(widgetId);
  widgetId = null;
  token = null;
  failed = false;
}

/**
 * A token for one sign-in request: undefined when Turnstile is not set up
 * (nothing to send), null when the check could not be passed. Waits up to
 * 20 seconds for Cloudflare, including any click it asks for.
 */
export async function botCheckToken(container: HTMLElement | null): Promise<string | null | undefined> {
  if (!TURNSTILE_SITE_KEY) return undefined;
  await startBotCheck(container);
  if (token) {
    const t = token;
    spendToken();
    return t;
  }
  if (failed && widgetId === null) return null;
  const t = await new Promise<string | null>((resolve) => {
    waiters.push(resolve);
    window.setTimeout(() => resolve(null), 20_000);
  });
  if (t) spendToken();
  return t;
}

/** A token only if one is ready now, for requests that must not wait. */
export function readyBotCheckToken(): string | undefined {
  if (!token) return undefined;
  const t = token;
  spendToken();
  return t;
}

/** A token is single use: drop it and ask Turnstile for the next one. */
function spendToken() {
  token = null;
  failed = false;
  if (widgetId !== null) window.turnstile?.reset(widgetId);
}
