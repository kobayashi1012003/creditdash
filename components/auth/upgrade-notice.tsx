"use client";

import { useState, useSyncExternalStore } from "react";
import { SparkleIcon } from "@phosphor-icons/react";
import { clearUpgrade, pendingUpgrade } from "@/lib/upgrade-intent";

const noSubscribe = () => () => {};

/**
 * On sign-in, after "Get Premium" on a plan panel: says that Stripe opens
 * straight after signing in, with a way to drop it and just sign in.
 * Rendered by the browser only; the server version is nothing.
 */
export function UpgradeNotice() {
  const interval = useSyncExternalStore(noSubscribe, pendingUpgrade, () => null);
  const [dropped, setDropped] = useState(false);
  if (!interval || dropped) return null;
  return (
    <div className="mt-6 flex items-start gap-3 rounded-inner border border-line bg-surface px-4 py-3.5">
      <SparkleIcon size={17} weight="fill" aria-hidden className="mt-0.5 shrink-0 text-ink" />
      <p className="text-[14px] leading-relaxed">
        Next: Premium {interval === "year" ? "yearly" : "monthly"}.{" "}
        <span className="text-muted">Sign in or create your account, and Stripe opens straight after.</span>{" "}
        <button
          type="button"
          onClick={() => {
            clearUpgrade();
            setDropped(true);
          }}
          className="rounded-control text-muted underline underline-offset-4 transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Just sign in
        </button>
      </p>
    </div>
  );
}
