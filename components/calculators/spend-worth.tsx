"use client";

import { useState } from "react";
import type { Card } from "@/data/types";
import { CARDS, getCard } from "@/data/cards.seed";
import { spendWorth, type SpendRow } from "@/lib/calculators/engine";
import { setSpendInput, toSpend, useSpendInputs } from "@/lib/calculators/spend-store";
import { useValuation } from "@/lib/data";
import { isCashBack } from "@/data/programs";
import { CATEGORY_LABELS } from "@/lib/categories";
import { EarnChip } from "@/components/ui/earn-chip";
import { cn } from "@/lib/cn";
import { money, percent, pts, usd } from "@/lib/format";
import {
  CardSelect,
  NotAdvice,
  NumberField,
  Verdict,
} from "@/components/calculators/fields";
import { ValuationTag } from "@/components/points/valuation-tag";

/** Dollars at a size that reads: "$27.20", "$248". */
export function friendlyMoney(n: number) {
  return n >= 100 ? usd(n) : money(Math.round(n * 100) / 100);
}

/**
 * One card, one answer. No timeframe (owner, 3 November 2026): the amounts
 * are whatever spending someone has in mind, and the points follow. Caps
 * are yearly, so the engine reads the amounts as a year's spending.
 */
export function SpendWorthCalculator({ cards }: { cards: Card[] }) {
  const [cardId, setCardId] = useState(cards[0]?.id ?? CARDS[0].id);
  // The wallet's own copy first: it carries the cardholder's category picks.
  const card = cards.find((c) => c.id === cardId) ?? getCard(cardId) ?? cards[0] ?? CARDS[0];
  const cash = isCashBack(card.program);
  const inputs = useSpendInputs(card.id);
  const { cpp } = useValuation(card.program);
  const result = spendWorth(card, toSpend(inputs), "year", cpp);

  return (
    <div className="@container">
      <div className="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:gap-8">
        <div className="space-y-4">
          <CardSelect label="Card" wallet={cards} value={card.id} onChange={setCardId} />
        </div>

        {/* On a narrow screen the answer sits above the fields and stays in
            view while they scroll; wide, it holds the right column. */}
        <div className="sticky top-0 z-10 -mx-1 bg-surface px-1 pb-1 @2xl:row-span-2 @2xl:top-4 @2xl:mx-0 @2xl:self-start @2xl:px-0">
          <SpendResult result={result} cash={cash} />
          <ValuationTag program={card.program} className="mt-2" />
        </div>

        <fieldset className="min-w-0">
          <legend className="mb-3 text-[13px] text-muted">
            What you will spend on this card
          </legend>
          <ul className="divide-y divide-line">
            {result.rows.map((row) => (
              <SpendField
                key={row.category}
                row={row}
                cash={cash}
                value={inputs[row.category] ?? null}
                onValue={(v) => setSpendInput(card.id, row.category, v)}
              />
            ))}
          </ul>
        </fieldset>
      </div>

      <NotAdvice>Earn rates come from the card catalog. Check them with the issuer.</NotAdvice>
    </div>
  );
}

function SpendResult({ result, cash }: { result: ReturnType<typeof spendWorth>; cash: boolean }) {
  if (result.totalSpend === 0) {
    return (
      <Verdict title="What will this spending earn?">
        Type what you expect to spend in any category. The total updates as you type.
      </Verdict>
    );
  }

  const points = Math.round(result.points);
  return (
    <Verdict
      title={
        cash ? (
          <>{friendlyMoney(result.value)} cash back</>
        ) : (
          <>
            {pts(points)} points, worth about{" "}
            {friendlyMoney(result.value)}
          </>
        )
      }
    >
      {result.effectiveReturn !== null && (
        <p>{percent(result.effectiveReturn)} back on everything you entered.</p>
      )}
    </Verdict>
  );
}

function SpendField({
  row,
  cash,
  value,
  onValue,
}: {
  row: SpendRow;
  cash: boolean;
  value: number | null;
  onValue: (v: number | null) => void;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 pt-0.5">
        <EarnChip category={row.category} multiplier={row.rate.multiplier} percent={cash} />
        {row.rate.notes && (
          <p className="mt-1.5 text-[12px] leading-snug text-muted">{row.rate.notes}</p>
        )}
        {row.rate.boost && (
          <p className="mt-0.5 text-[12px] leading-snug text-muted">
            {row.rate.boost.multiplier}
            {cash ? "%" : "x"} {row.rate.boost.where}, not counted here
          </p>
        )}
        {row.capReached && (
          <p className="mt-0.5 text-[12px] font-medium leading-snug text-ink">
            Cap reached. Extra spend earns {row.overflowRate}
            {cash ? "%" : "x"}.
          </p>
        )}
      </div>
      {/* The points line is always there, so typing never moves the
          fields below it. */}
      <div>
        <NumberField
          kind="money"
          label={CATEGORY_LABELS[row.category]}
          labelHidden={`${CATEGORY_LABELS[row.category]} spend, earns ${row.rate.multiplier}${cash ? "%" : "x"}`}
          value={value}
          onValue={onValue}
          inputClassName="text-right"
        />
        <p
          className={cn(
            "mt-1 text-right text-[12px] tabular-nums",
            row.spend > 0 ? "text-ink" : "text-muted",
          )}
        >
          {cash ? `${friendlyMoney(row.points / 100)} back` : `${pts(Math.round(row.points))} points`}
        </p>
      </div>
    </li>
  );
}
