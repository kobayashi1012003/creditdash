"use client";

import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Widget } from "@/components/ui/widget";
import { CALCULATORS } from "@/components/calculators/registry";
import { useIsLoading, useWallet } from "@/lib/data";

export function CalculatorsList() {
  const cards = useWallet().map((e) => e.card);
  const isLoading = useIsLoading();

  // Without this the page says "add a card" for a frame before the wallet
  // arrives, which reads as the wallet having been lost.
  if (isLoading) return <CalculatorsSkeleton />;

  // One invitation rather than three widgets each saying the same thing.
  if (cards.length === 0) {
    return (
      <Widget title="Nothing to work out yet">
        <p className="max-w-[56ch] text-[15px] leading-relaxed text-muted">
          Every calculator here runs on the cards in your wallet: whether a
          fee pays for itself, what a month of spending earns, and what your
          points are worth.
        </p>
        <Button className="mt-5" nativeButton={false} render={<Link href="/wallet" />}>
          <PlusIcon size={17} />
          Add a card
        </Button>
      </Widget>
    );
  }

  return (
    <div className="space-y-5">
      {CALCULATORS.map(({ id, title, blurb, Component }) => (
        <Widget key={id} title={title} id={id} className="scroll-mt-6">
          <p className="mb-5 max-w-[58ch] text-sm leading-relaxed text-muted">
            {blurb}
          </p>
          <Component cards={cards} />
        </Widget>
      ))}
    </div>
  );
}

function CalculatorsSkeleton() {
  return (
    <div aria-busy aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading your calculators</span>
      {CALCULATORS.map(({ id, title }) => (
        // Titles are static, so they render for real and only the body,
        // which depends on the wallet, is a placeholder.
        <Widget key={id} title={title}>
          <div className="h-4 w-3/5 rounded-pill bg-bg" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-inner bg-bg" />
            ))}
          </div>
          <div className="mt-5 h-24 rounded-inner bg-bg" />
        </Widget>
      ))}
    </div>
  );
}
