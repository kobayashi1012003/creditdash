"use client";

import { useSyncExternalStore } from "react";

/**
 * Today's local date as `YYYY-MM-DD`, changing at the device's own
 * midnight. A Tracker left open across New Year's Eve moves on to the new
 * year by itself, and a phone that slept through midnight catches up when
 * it comes back to the foreground. One timer for the whole app.
 *
 * The device's local time is the right clock here: issuers reset credits on
 * the cardholder's statement dates, which follow where they live, and every
 * other date in the app (reset windows, auto-fill) is local too.
 */

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const listeners = new Set<() => void>();
let timer = 0;

function schedule() {
  window.clearTimeout(timer);
  const now = new Date();
  // A second past midnight, so a timer that fires a touch early still lands
  // in the new day.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  timer = window.setTimeout(tick, next.getTime() - now.getTime());
}

function tick() {
  for (const l of listeners) l();
  schedule();
}

function onVisible() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    schedule();
    document.addEventListener("visibilitychange", onVisible);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

export function useToday(): string {
  return useSyncExternalStore(subscribe, today, () => "");
}
