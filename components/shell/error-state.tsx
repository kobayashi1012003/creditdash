"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/**
 * What a route error boundary shows. Shared by the app shell's boundary,
 * which keeps the sidebar and tab bar around it, and the root one, which
 * catches anything above that.
 *
 * The reassurance is true, not decorative: a render error cannot write to
 * storage, so whatever was saved before is still there.
 */
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // No reporting service yet (no running costs). The console is where a
    // developer reproducing it will look.
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <section
      role="alert"
      className="max-w-[56ch] rounded-widget border border-line bg-surface p-6 sm:p-7"
    >
      <h1 className="font-display text-[28px] leading-tight sm:text-[32px]">
        This page stopped working.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Something on it failed to load. Nothing you saved has been changed.
        Try again, and if it keeps happening, reloading the page usually
        clears it.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>
          <ArrowClockwiseIcon size={17} />
          Try again
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/wallet" />}>
          Go to Wallet
        </Button>
      </div>
      {digest && (
        <p className="mt-6 text-[12px] text-muted">Reference {digest}</p>
      )}
    </section>
  );
}
