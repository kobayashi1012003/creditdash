"use client";

import { useEffect } from "react";
import { nextCheck } from "@/lib/credits/autofill";
import { runAutoFill, useIsLoading, usePlan } from "@/lib/data";

/**
 * Runs auto-fill (lib/credits/autofill.ts) on this device: once the data
 * has loaded, again just after each local midnight while the app stays
 * open, and whenever it comes back to the foreground, since a phone that
 * slept through midnight fires no timers. Renders nothing.
 */
export function AutoFillRunner() {
  const isLoading = useIsLoading();
  const plan = usePlan();

  useEffect(() => {
    if (isLoading || plan !== "premium") return;
    let timer = 0;

    const schedule = () => {
      window.clearTimeout(timer);
      const now = new Date();
      // A second past midnight, so a timer that fires a touch early still
      // lands in the new day.
      const wait = nextCheck(now).getTime() - now.getTime() + 1000;
      timer = window.setTimeout(check, wait);
    };
    const check = () => {
      void runAutoFill(new Date());
      schedule();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoading, plan]);

  return null;
}
