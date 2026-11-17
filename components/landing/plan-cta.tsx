"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { PAYMENTS_LIVE, type BillingInterval } from "@/lib/plan";
import { rememberUpgrade } from "@/lib/upgrade-intent";
import { useSignedIn } from "@/components/landing/session-buttons";
import { Button } from "@/components/ui/button";

/**
 * The button at the foot of a plan panel (owner, 17 November 2026).
 *
 * Free: create an account, or open the dashboard once signed in.
 * Premium: signed in, straight to Stripe Checkout; signed out, to sign-in
 * first, remembering the choice so the account carries on to Checkout by
 * itself (UpgradeRunner). The data layer loads only on press, so the
 * marketing pages keep their small bundle.
 */
export function PlanCta({ plan, primary = false }: { plan: "free" | BillingInterval; primary?: boolean }) {
  const signedIn = useSignedIn();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (plan === "free") {
    return (
      <Button
        variant={primary ? "default" : "outline"}
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href={signedIn ? "/wallet" : "/signin"} />}
      >
        {signedIn ? "Open your dashboard" : "Create a free account"}
      </Button>
    );
  }

  if (!PAYMENTS_LIVE) {
    return (
      <Button variant="outline" size="lg" className="w-full" disabled>
        Opens after launch
      </Button>
    );
  }

  async function start(interval: BillingInterval) {
    setProblem(null);
    if (!signedIn) {
      rememberUpgrade(interval);
      router.push("/signin");
      return;
    }
    setBusy(true);
    const { startCheckout } = await import("@/lib/data");
    const reason = await startCheckout(interval);
    // Only reached when Stripe could not be opened.
    setBusy(false);
    setProblem(reason);
  }

  return (
    <div>
      <Button
        variant={primary ? "default" : "outline"}
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => void start(plan)}
      >
        {busy ? "Opening Stripe" : plan === "year" ? "Get Premium yearly" : "Get Premium monthly"}
        {!busy && <ArrowRightIcon size={15} weight="bold" />}
      </Button>
      {problem && (
        <p role="alert" className="mt-2.5 text-[13px] leading-relaxed text-muted">
          {problem}{" "}
          <Link
            href="/settings#plan"
            className="rounded-control text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Your plan in Settings
          </Link>
        </p>
      )}
    </div>
  );
}
