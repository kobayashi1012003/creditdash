"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  emptyState,
  parseStored,
  SCHEMA_VERSION,
  seededState,
  STORAGE_KEY,
  type Persisted,
} from "@/lib/data/schema";
import { hasSessionCookie, supabase } from "@/lib/data/supabase";
import { FIRST_CARD_KEY } from "@/lib/data/first-card";
import { loadAccount, SyncError, type Remote } from "@/lib/data/remote";

/**
 * The backing for lib/data, in one of two modes:
 *
 * - **local**: signed out. Browser storage, read synchronously on the first
 *   frame, exactly as before accounts existed. The demo user lives here.
 * - **account**: signed in. The account is read from Supabase once, held in
 *   the same cache, and every write updates the cache first and the
 *   database second. A refused write rolls the cache back and raises a
 *   notice, so the screen never claims something the database does not hold.
 *
 * Nothing outside lib/data imports this. Pages see the same snapshot shape
 * in both modes and cannot tell which they are in, except through
 * useAccount().
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Cached so getSnapshot can return a stable reference. useSyncExternalStore
 * compares snapshots by identity and would loop forever if this rebuilt the
 * state on every call.
 */
let cache: Persisted | null = null;

/** Set once the state has actually been read, so the UI can show a skeleton. */
let loaded = false;

let started = false;
let mode: "local" | "account" = "local";

export type Account = { userId: string; email: string | null };
let account: Account | null = null;
let remote: Remote | null = null;

/**
 * Something the shell must tell the user. "unsaved": this browser refuses
 * to store anything, so nothing survives a reload. "sync": the account
 * refused or never received a change. Both are inline notices, never a
 * pop-up.
 */
export type Notice = { kind: "unsaved" | "sync"; message: string };
let notice: Notice | null = null;

const UNSAVED: Notice = {
  kind: "unsaved",
  message:
    "This browser is not saving your changes. They will be lost when you close or reload the page. Private browsing or blocked site data usually causes this; allow site data for CreditDash and reload to fix it.",
};

function emit() {
  rememberFirstCard();
  for (const l of listeners) l();
}

/**
 * Keeps the pre-start script's hint current, so the next page load can show
 * this wallet's first card before the app has started (see first-card.ts).
 * Cheap, and only written when it changes.
 */
let firstCard: string | null = null;
function rememberFirstCard() {
  if (!cache) return;
  const first =
    [...cache.userCards].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.cardId ?? "";
  if (first === firstCard) return;
  firstCard = first;
  try {
    window.localStorage.setItem(FIRST_CARD_KEY, first);
  } catch {
    // Only a hint. Without it the next load shows a plain skeleton.
  }
}

/* --- local mode ----------------------------------------------------------- */

/** Reads browser storage. Used directly in local mode and for the import. */
export function readLocal(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = parseStored(raw);
    if (stored) {
      // parseStored may have migrated an older payload. Write the result
      // back, or every future load would migrate the same stale data again
      // and the stored version would never move forward.
      if (!raw?.includes(`"version":${SCHEMA_VERSION}`)) persist(stored);
      return stored;
    }
    // First visit, or storage held something unusable. Seed rather than
    // show an empty shell.
    const seeded = seededState();
    persist(seeded);
    return seeded;
  } catch {
    // Private mode, blocked site data, or a quota error. The app still works
    // for this session; it just will not be remembered.
    notice = UNSAVED;
    return seededState();
  }
}

function persist(state: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // A later write succeeding means the problem has cleared, for example
    // after space was freed.
    if (notice?.kind === "unsaved") notice = null;
  } catch {
    // Losing a save is better than crashing on it, but it is not silent:
    // the shell reads the notice and tells the user.
    notice = UNSAVED;
  }
}

function enterLocal() {
  mode = "local";
  account = null;
  remote = null;
  offer = null;
  cache = readLocal();
  loaded = true;
  rememberFirstCard();
}

/* --- account mode --------------------------------------------------------- */

/**
 * The first-sign-in offer to bring this browser's wallet into an empty
 * account. Worked out once per load, so its snapshot is stable. Declining
 * is remembered per account, in this browser.
 */
export type ImportOffer = { cards: number };
let offer: ImportOffer | null = null;

const declinedKey = (userId: string) => `creditdash:import-declined:${userId}`;

function computeOffer(userId: string, state: Persisted): ImportOffer | null {
  if (state.userCards.length > 0) return null;
  try {
    if (window.localStorage.getItem(declinedKey(userId))) return null;
    // Only a wallet someone has actually stored here. A browser that never
    // ran the demo would otherwise be offered the seed it just generated.
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const local = parseStored(raw);
    return local && local.userCards.length > 0 ? { cards: local.userCards.length } : null;
  } catch {
    return null;
  }
}

export function getOffer() {
  return offer;
}

/** Hides the offer, for good when `remember` is set. */
export function closeOffer(remember: boolean) {
  if (remember && account) {
    try {
      window.localStorage.setItem(declinedKey(account.userId), "1");
    } catch {
      // Not remembered; it will be offered again next time, which is harmless.
    }
  }
  offer = null;
  emit();
}

/** The browser's stored wallet, or null if there is none to import. */
export function storedLocal(): Persisted | null {
  try {
    return parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

async function enterAccount(db: SupabaseClient) {
  const { data } = await db.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    // A cookie that no longer holds a valid session: carry on signed out.
    enterLocal();
    emit();
    return;
  }

  try {
    const { state, rowIds } = await loadAccount(db, user.id);
    mode = "account";
    account = { userId: user.id, email: user.email ?? null };
    remote = { db, userId: user.id, rowIds };
    cache = state;
    offer = computeOffer(user.id, state);
  } catch {
    // Signed in but unreachable. Showing the browser's demo wallet here would
    // look like the account had been replaced, so show an empty one and say
    // why. Nothing is written in this state.
    mode = "account";
    account = { userId: user.id, email: user.email ?? null };
    remote = null;
    cache = emptyState();
    notice = {
      kind: "sync",
      message:
        "Your account could not be loaded. Check your connection and reload the page. Nothing has been changed.",
    };
  }
  loaded = true;
  emit();
}

/**
 * Decides the mode the first time anything asks for state. Signed-out
 * visitors resolve synchronously and never download the Supabase client; a
 * session cookie means loading it and reading the account, and the skeleton
 * shows until that lands.
 */
function start() {
  if (started) return;
  started = true;

  if (!hasSessionCookie()) {
    enterLocal();
    return;
  }

  void supabase().then(async (db) => {
    if (!db) {
      enterLocal();
      emit();
      return;
    }
    // Signing out in another tab, or a session that cannot be refreshed,
    // should not leave this tab writing to an account it no longer holds.
    db.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && mode === "account") {
        enterLocal();
        emit();
      }
    });
    await enterAccount(db);
  });
}

/* --- the store interface -------------------------------------------------- */

export function subscribe(listener: Listener) {
  listeners.add(listener);
  // Another tab writing the same key should move this one too, but only
  // while this tab is reading browser storage.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && mode === "local") {
      cache = readLocal();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The server has no storage and no session, so it renders the loading
 * state. A stable frozen object keeps the snapshot identity constant.
 */
const SERVER_SNAPSHOT = Object.freeze(emptyState());

export function getSnapshot(): Persisted {
  start();
  return cache ?? SERVER_SNAPSHOT;
}

export function getServerSnapshot(): Persisted {
  return SERVER_SNAPSHOT;
}

export function isLoaded() {
  start();
  return loaded;
}

export function getNotice() {
  return notice;
}

export function getAccount() {
  start();
  return account;
}

/**
 * Apply a change. The cache moves first so the screen answers at once. In
 * account mode `save` then writes it to Supabase; if that throws, the cache
 * goes back to where it was, unless another change has landed since, in
 * which case the next load reconciles it.
 */
export async function mutate(
  fn: (current: Persisted) => Persisted,
  save?: (r: Remote, before: Persisted, after: Persisted) => Promise<void>,
): Promise<void> {
  start();
  // Still reading the account: there is nothing yet to change.
  const before = cache;
  if (!before) return;
  const after = fn(before);
  if (after === before) return;

  if (mode === "local") {
    cache = after;
    persist(after);
    emit();
    return;
  }

  if (!remote) return; // account unreachable: say so, change nothing
  cache = after;
  emit();
  try {
    await save?.(remote, before, after);
    if (notice?.kind === "sync") notice = null;
  } catch (e) {
    if (cache === after) cache = before;
    notice = {
      kind: "sync",
      message:
        e instanceof SyncError
          ? e.message
          : "That change did not save to your account. Check your connection and try again.",
    };
  }
  emit();
}

/** The account connection, for writes that are not a simple state change. */
export function getRemote() {
  return mode === "account" ? remote : null;
}

/** Re-reads the account, after a bulk write changes many rows at once. */
export async function reloadAccount() {
  const db = await supabase();
  if (db) await enterAccount(db);
}

/** Back to browser storage after signing out. */
export function switchToLocal() {
  enterLocal();
  emit();
}
