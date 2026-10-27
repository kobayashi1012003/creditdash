"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A boolean remembered in localStorage, read as an external store rather than
 * copied into state from an effect. That avoids the extra render on mount and
 * keeps two components reading the same key in step.
 *
 * Every access is wrapped: localStorage throws outright in some privacy modes,
 * and remembering a panel's position is a convenience, never a requirement.
 */

const listeners = new Set<() => void>();

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

function read(key: string, fallback: boolean): boolean {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

export function useStoredFlag(
  key: string,
  fallback: boolean,
): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );

  const set = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Fall through: the change still applies for this session.
      }
      emit();
    },
    [key],
  );

  return [value, set];
}
