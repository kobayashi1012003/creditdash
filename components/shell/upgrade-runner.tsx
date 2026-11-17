"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { currentPlan, startCheckout, useAccount, whenAccountReady } from "@/lib/data";
import { clearUpgrade, pendingUpgrade } from "@/lib/upgrade-intent";

/**
 * Finishes "Get Premium" for someone who had to sign up first: once the
 * account has loaded, a fresh choice from the plan panels sends them on to
 * Stripe Checkout (lib/upgrade-intent.ts). Already Premium, or anything
 * goes wrong, and they land on Settings' plan section instead, which can
 * say why. Renders nothing; the demo user is left alone.
 */
export function UpgradeRunner() {
  const account = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!account || !pendingUpgrade()) return;
    let cancelled = false;
    void (async () => {
      await whenAccountReady();
      const interval = pendingUpgrade();
      if (cancelled || !interval) return;
      clearUpgrade();
      if (currentPlan() === "premium") {
        router.push("/settings#plan");
        return;
      }
      const problem = await startCheckout(interval);
      if (!cancelled && problem) router.push("/settings#plan");
    })();
    return () => {
      cancelled = true;
    };
  }, [account, router]);

  return null;
}
