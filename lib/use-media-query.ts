"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query without writing state from an effect, so there
 * is no extra render pass on mount and no hydration mismatch: the server
 * snapshot is always `false` and the client corrects on the first paint.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Matches the `lg` breakpoint, where the sidebar replaces the tab bar. */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
