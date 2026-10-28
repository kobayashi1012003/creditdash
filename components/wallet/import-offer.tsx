"use client";

import { useState } from "react";
import { ArrowDownIcon } from "@phosphor-icons/react";
import { cardLimit } from "@/lib/plan";
import {
  declineImport,
  importBrowserWallet,
  useImportOffer,
  usePlan,
} from "@/lib/data";
import { Button } from "@/components/ui/button";

/**
 * Shown once, on an empty account, when this browser still holds the wallet
 * from before sign-in. Inline at the top of the Wallet, never a pop-up.
 * Declining is remembered, so it does not come back on every visit.
 */
export function ImportOffer() {
  const offer = useImportOffer();
  const plan = usePlan();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!offer) return null;

  const limit = cardLimit(plan);
  const over = offer.cards > limit;
  const cards = offer.cards === 1 ? "1 card" : `${offer.cards} cards`;

  async function bringOver() {
    setBusy(true);
    setError(null);
    const result = await importBrowserWallet();
    setBusy(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <section
      aria-labelledby="import-heading"
      className="mb-8 rounded-widget border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="import-heading" className="font-display text-xl leading-tight">
        Bring over the {cards} from this browser?
      </h2>
      <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-muted">
        This browser still has the wallet you used before signing in, with its
        credits and points balances.
        {over &&
          ` Your free plan holds ${limit}, so the first ${limit} in your order come across.`}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-[var(--cd-peach-ink)]">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={bringOver} disabled={busy}>
          <ArrowDownIcon size={16} weight="bold" />
          {busy ? "Bringing them over" : "Bring them over"}
        </Button>
        <Button variant="ghost" onClick={declineImport} disabled={busy}>
          Start fresh
        </Button>
      </div>
    </section>
  );
}
