"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import type { Card } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/types";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { centsPerPoint, rateFor } from "@/lib/calculators/engine";
import { cardAnnualCreditValue } from "@/lib/credits";
import { usd } from "@/lib/format";
import {
  addCard,
  useIsLoading,
  usePlan,
  useValuations,
  useWallet,
} from "@/lib/data";
import { canAddCard, FREE_CARD_LIMIT } from "@/lib/plan";
import { cn } from "@/lib/cn";
import { CardFace } from "@/components/ui/card-face";
import { Button } from "@/components/ui/button";

const MAX = 3;

/** Categories worth a row. "Everything else" is the base rate, so it stays. */
const ROWS: Category[] = CATEGORIES.filter((c) => c !== "transit");

export function CompareView({ all }: { all: Card[] }) {
  const [ids, setIds] = useState<string[]>(["amex-gold", "csr"]);
  const [picking, setPicking] = useState(false);
  const wallet = useWallet();
  const plan = usePlan();
  const valuations = useValuations();
  const owned = new Set(wallet.map((e) => e.card.id));
  const roomForMore = canAddCard(plan, wallet.length);
  // Until the wallet is read, "owned" and "room for more" are both guesses.
  // The buttons stay disabled rather than offering a card already held.
  const isLoading = useIsLoading();

  const chosen = ids
    .map((id) => all.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));

  function remove(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  function add(id: string) {
    setIds((prev) => (prev.length >= MAX ? prev : [...prev, id]));
    setPicking(false);
  }

  if (chosen.length === 0) {
    return (
      <EmptyCompare
        all={all}
        onAdd={add}
        chosen={[]}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* "Add card" sits outside the table. Inside it, as a fourth column, it
          lands off the right edge of a phone and can only be found by
          discovering the table scrolls sideways. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          {chosen.length} of {MAX} cards
        </p>
        {chosen.length < MAX && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPicking((p) => !p)}
            aria-expanded={picking}
          >
            <PlusIcon size={15} />
            Add card
          </Button>
        )}
      </div>

      {/* The table scrolls sideways on a phone rather than reflowing: a
          comparison that cannot be seen side by side is not a comparison. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {/* relative so the sr-only caption below is contained by the table
            rather than by <body>, which would place it at the table's
            unclipped coordinates outside the scroller. */}
        <table className="relative w-full min-w-[520px] border-collapse text-sm">
          <caption className="sr-only">
            Comparison of {chosen.map((c) => c.name).join(", ")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-[132px] p-0 sm:w-[180px]" />
              {chosen.map((card) => (
                <th key={card.id} scope="col" className="p-0 pb-5 align-bottom">
                  <div className="px-2">
                    <div className="relative mx-auto max-w-[200px]">
                      <CardFace card={card} />
                      <button
                        type="button"
                        onClick={() => remove(card.id)}
                        aria-label={`Remove ${card.name}`}
                        className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-pill border border-line bg-surface text-muted transition-[color,border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted hover:text-ink active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        <XIcon size={14} weight="bold" />
                      </button>
                    </div>
                    <p className="mt-3 text-[15px] font-medium">{card.name}</p>
                    <p className="text-[13px] font-normal text-muted">
                      {card.issuer}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <Row
              label="Annual fee"
              cards={chosen}
              value={(c) => (c.annualFee === 0 ? "None" : usd(c.annualFee))}
              /* Lower is better here, so the winner rule flips. */
              score={(c) => -c.annualFee}
            />
            <Row
              label="Credits a year"
              cards={chosen}
              value={(c) => {
                const v = cardAnnualCreditValue(c);
                return v === 0 ? "None" : usd(v);
              }}
              score={(c) => cardAnnualCreditValue(c)}
            />

            {/* The rate is what people expect to read, but the winner is
                decided on value. Tinting Hilton's 6x over Amex Gold's 4x on
                dining would be the wrong answer stated confidently, because
                those points are worth a third as much. */}
            {ROWS.map((cat) => (
              <Row
                key={cat}
                label={CATEGORY_LABELS[cat]}
                cards={chosen}
                value={(c) => `${rateFor(c, cat).multiplier}x`}
                sublabel={(c) => `${centsFor(c, cat, valuations).toFixed(1)}c`}
                score={(c) => centsFor(c, cat, valuations)}
              />
            ))}

            <Row
              label="Points program"
              cards={chosen}
              value={(c) => PROGRAM_LABELS[c.program]}
            />
            <Row
              label="Foreign transactions"
              cards={chosen}
              value={(c) =>
                c.foreignTransactionFee === 0
                  ? "No fee"
                  : `${c.foreignTransactionFee}%`
              }
              score={(c) => -c.foreignTransactionFee}
            />
            <Row
              label="Lounges"
              cards={chosen}
              value={(c) => c.loungeAccess ?? "None"}
              score={(c) => (c.loungeAccess ? 1 : 0)}
            />
          </tbody>

          <tfoot>
            <tr>
              <td />
              {chosen.map((card) => (
                <td key={card.id} className="px-2 pt-5">
                  {owned.has(card.id) ? (
                    <p className="py-2 text-center text-[13px] text-muted">
                      In your wallet
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isLoading || !roomForMore}
                      onClick={() => addCard(card.id)}
                    >
                      Add to wallet
                    </Button>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {!isLoading && !roomForMore && chosen.some((c) => !owned.has(c.id)) && (
        <p className="text-[13px] leading-relaxed text-muted">
          Your free plan holds {FREE_CARD_LIMIT} cards and both are taken.
          Remove one in the Wallet, or move to Premium, to add another.
        </p>
      )}

      {picking && (
        <CardChooser
          all={all}
          chosen={ids}
          onAdd={add}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}

/**
 * One comparison row. The best cell gets a soft pastel tint rather than a
 * badge, so the eye can run down the table and see where each card wins.
 */
function Row({
  label,
  cards,
  value,
  sublabel,
  score,
}: {
  label: string;
  cards: Card[];
  value: (c: Card) => string;
  /** Shown under the value, e.g. what a rate is actually worth. */
  sublabel?: (c: Card) => string;
  score?: (c: Card) => number;
}) {
  const scores = score ? cards.map(score) : null;
  const best = scores ? Math.max(...scores) : null;
  // A tie between every card is not a win, so nothing is tinted.
  const allEqual = scores ? scores.every((s) => s === scores[0]) : true;

  return (
    <tr className="border-t border-line">
      <th
        scope="row"
        className="py-3 pr-4 text-left align-middle text-[13px] font-normal text-muted"
      >
        {label}
      </th>
      {cards.map((card, i) => {
        const wins = !allEqual && scores !== null && scores[i] === best;
        return (
          <td key={card.id} className="px-2 py-3 align-middle">
            <span
              className={cn(
                // `relative` is load-bearing: sr-only is position:absolute,
                // and without a positioned ancestor inside the scrolling
                // table its containing block is <body>. It then sits at the
                // table's unclipped x and widens the whole page.
                "relative inline-block rounded-inner px-2.5 py-1",
                wins && "bg-mint text-mint-ink",
              )}
            >
              {value(card)}
              {sublabel && (
                <span className="ml-1.5 text-[12px] opacity-70">
                  {sublabel(card)}
                </span>
              )}
              {wins && <span className="sr-only"> (best)</span>}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

function CardChooser({
  all,
  chosen,
  onAdd,
  onCancel,
}: {
  all: Card[];
  chosen: string[];
  onAdd: (id: string) => void;
  onCancel?: () => void;
}) {
  const available = all.filter((c) => !chosen.includes(c.id));

  return (
    <section className="rounded-widget border border-line bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg">Add a card</h2>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {available.map((card) => (
          <li key={card.id}>
            <button
              type="button"
              onClick={() => onAdd(card.id)}
              className="flex w-full items-center justify-between gap-3 rounded-inner border border-line px-3.5 py-3 text-left transition-[border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{card.name}</span>
                <span className="block text-[13px] text-muted">
                  {card.issuer}
                </span>
              </span>
              <PlusIcon size={16} className="shrink-0 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyCompare({
  all,
  chosen,
  onAdd,
}: {
  all: Card[];
  chosen: string[];
  onAdd: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-6 max-w-[52ch] text-[15px] leading-relaxed text-muted">
        Pick two or three cards and every row shows which one wins. You do not
        have to own them.
      </p>
      <CardChooser all={all} chosen={chosen} onAdd={onAdd} />
    </div>
  );
}

/** Cents back per dollar in a category, at the user's valuation. */
function centsFor(
  card: Card,
  category: Category,
  valuations: ReturnType<typeof useValuations>,
): number {
  return rateFor(card, category).multiplier * centsPerPoint(card.program, valuations);
}
