"use client";

import { getCardsById } from "@/lib/catalog";
import { multiplierFor, rateFor } from "@/lib/calculators/engine";
import { CardFace } from "@/components/ui/card-face";
import { EarnChip } from "@/components/ui/earn-chip";

/**
 * Three cards as the Wallet shows them: the face, the fee, and the best
 * rates each one earns. Still, on purpose: the category picker is already
 * the home page's hero, so this shows the wallet itself.
 */
const IDS = ["amex-gold", "csr", "venture-x"];

export function WalletPreview() {
  const cards = getCardsById(IDS);
  return (
    <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-3">
      {cards.map((card) => {
        const base = rateFor(card, "other").multiplier;
        const top = card.earnRates
          .filter((r) => r.category !== "other")
          .map((r) => ({ rate: r, best: multiplierFor(r) }))
          .filter((r) => r.best > base)
          .sort((a, b) => b.best - a.best)
          .slice(0, 2);
        return (
          <li key={card.id}>
            <CardFace card={card} />
            <p className="mt-3 font-medium leading-snug">{card.name}</p>
            <p className="text-[13px] text-muted">${card.annualFee} a year</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {top.map(({ rate, best }) => (
                <EarnChip
                  key={rate.category}
                  category={rate.category}
                  multiplier={best}
                  where={best !== rate.multiplier ? rate.boost?.where : undefined}
                />
              ))}
            </div>
            {top.some(({ rate, best }) => best !== rate.multiplier) && (
              <p aria-hidden className="mt-1.5 text-[12px] text-muted">
                * {top.find(({ rate, best }) => best !== rate.multiplier)?.rate.boost?.where}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
