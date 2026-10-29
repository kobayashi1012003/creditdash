"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A string remembered in localStorage, read as an external store, like
 * useStoredFlag. For per-browser conveniences only (which card the Tracker
 * last showed); nothing that must survive or follow the account.
 */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useStoredValue(key: string): [string | null, (next: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);

  const set = useCallback(
    (next: string | null) => {
      try {
        if (next === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, next);
      } catch {
        // Not remembered, but the choice still applies until reload.
      }
      for (const l of listeners) l();
    },
    [key],
  );

  return [value, set];
}
