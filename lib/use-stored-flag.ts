"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A boolean remembered in browser storage, read as an external store rather
 * than copied into state from an effect. That avoids the extra render on
 * mount and keeps two components reading the same key in step.
 *
 * `session` keeps it in sessionStorage, so it lasts until the tab closes or
 * the user signs out (`forgetSessionFlags`).
 *
 * Every access is wrapped: storage throws outright in some privacy modes,
 * and remembering a panel's position is a convenience, never a requirement.
 */

const listeners = new Set<() => void>();
const SESSION_PREFIX = "creditdash:";

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changing the same key should move this one too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function area(session: boolean): Storage {
  return session ? window.sessionStorage : window.localStorage;
}

function read(key: string, fallback: boolean, session: boolean): boolean {
  try {
    const v = area(session).getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

export function useStoredFlag(
  key: string,
  fallback: boolean,
  { session = false }: { session?: boolean } = {},
): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback, session),
    () => fallback,
  );

  const set = useCallback(
    (next: boolean) => {
      try {
        area(session).setItem(key, next ? "1" : "0");
      } catch {
        // Nothing to remember it in; the default stays.
      }
      emit();
    },
    [key, session],
  );

  return [value, set];
}

/** Drops every session flag, so signing out starts the next visit fresh. */
export function forgetSessionFlags() {
  try {
    const store = window.sessionStorage;
    for (const k of Object.keys(store)) {
      if (k.startsWith(SESSION_PREFIX)) store.removeItem(k);
    }
  } catch {
    // Nothing stored, nothing to forget.
  }
  emit();
}
