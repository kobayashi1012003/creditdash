"use client";

import { useId, useState } from "react";
import type { Card } from "@/data/types";
import { PROGRAM_LABELS } from "@/data/types";
import { valuationFor } from "@/data/cards.seed";
import { cardAnnualCreditValue } from "@/lib/credits";
import { rateFor } from "@/lib/best-card";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { pts, usd, usdExact } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The three calculators from the plan. Each one is a self-contained client
 * component so the Tracker panel and the Calculators tab render exactly the
 * same thing rather than two implementations that drift.
 *
 * `dense` is the panel variant: smaller type, tighter rows, no own heading.
 */

type CalcProps = {
  cards: Card[];
  dense?: boolean;
  className?: string;
};

/* -------------------------------------------------------------------------- */

export function BreakEvenCalculator({ cards, dense, className }: CalcProps) {
  const [cardId, setCardId] = useState(
    cards.find((c) => c.annualFee > 0)?.id ?? cards[0]?.id ?? "",
  );
  const card = cards.find((c) => c.id === cardId) ?? cards[0];
  const selectId = useId();

  if (!card) return <NoCards />;

  const credits = cardAnnualCreditValue(card);
  const shortfall = Math.max(0, card.annualFee - credits);
  const cpp = valuationFor(card.program);
  // Everything-else rate is the honest basis: it is what the card earns on
  // spend you have not already assigned to a better card.
  const baseRate = rateFor(card, "other").multiplier;
  const spendNeeded = baseRate * cpp > 0 ? (shortfall * 100) / (baseRate * cpp) : 0;

  return (
    <div className={className}>
      <Field label="Card" htmlFor={selectId} dense={dense}>
        <CardSelect id={selectId} cards={cards} value={cardId} onChange={setCardId} />
      </Field>

      <Rows dense={dense}>
        <Row label="Annual fee" value={usd(card.annualFee)} />
        <Row label="Credits, if you use them all" value={`- ${usd(credits)}`} />
        <Row
          label="Left to cover"
          value={usd(shortfall)}
          emphasis
        />
      </Rows>

      <Result dense={dense}>
        {card.annualFee === 0 ? (
          <>This card has no annual fee, so there is nothing to break even on.</>
        ) : shortfall === 0 ? (
          <>
            The credits alone cover the fee, with {usd(credits - card.annualFee)}{" "}
            to spare.
          </>
        ) : (
          <>
            Spend about <strong className="font-medium">{usd(spendNeeded)}</strong>{" "}
            a year on this card at {baseRate}x to cover the rest.
          </>
        )}
      </Result>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const DEFAULT_SPEND: Partial<Record<Category, number>> = {
  dining: 450,
  groceries: 600,
  flights: 200,
  other: 900,
};

export function SpendCalculator({ cards, dense, className }: CalcProps) {
  const [spend, setSpend] = useState<Partial<Record<Category, number>>>(DEFAULT_SPEND);
  const shown: Category[] = dense
    ? ["dining", "groceries", "flights", "other"]
    : [...CATEGORIES];

  const results = cards
    .map((card) => {
      const cpp = valuationFor(card.program);
      let points = 0;
      for (const c of shown) {
        const monthly = spend[c] ?? 0;
        points += monthly * 12 * rateFor(card, c).multiplier;
      }
      return { card, points, value: (points * cpp) / 100 };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className={className}>
      <div className={cn("grid gap-3", dense ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
        {shown.map((c) => (
          <MoneyInput
            key={c}
            label={CATEGORY_LABELS[c]}
            value={spend[c] ?? 0}
            onChange={(v) => setSpend((s) => ({ ...s, [c]: v }))}
            dense={dense}
          />
        ))}
      </div>

      <Rows dense={dense} className="mt-5">
        {results.map(({ card, points, value }, i) => (
          <Row
            key={card.id}
            label={card.name}
            sublabel={`${pts(Math.round(points))} points a year`}
            value={usd(value)}
            emphasis={i === 0}
          />
        ))}
      </Rows>

      {results.length > 1 && (
        <Result dense={dense}>
          Putting that spend on {results[0].card.name} is worth{" "}
          <strong className="font-medium">
            {usd(results[0].value - results[results.length - 1].value)}
          </strong>{" "}
          a year more than your weakest card.
        </Result>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function PointsCalculator({ cards, dense, className }: CalcProps) {
  const programs = Array.from(new Set(cards.map((c) => c.program)));
  const [program, setProgram] = useState(programs[0] ?? "amex-mr");
  const [balance, setBalance] = useState(142000);
  const cpp = valuationFor(program);
  const selectId = useId();

  return (
    <div className={className}>
      <div className={cn("grid gap-3", dense ? "grid-cols-1" : "grid-cols-2")}>
        <Field label="Program" htmlFor={selectId} dense={dense}>
          <select
            id={selectId}
            value={program}
            onChange={(e) => setProgram(e.target.value as typeof program)}
            className="h-10 w-full rounded-inner border border-line bg-surface px-3 text-sm transition-colors duration-[var(--cd-dur-hover)] ease-out hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {programs.map((p) => (
              <option key={p} value={p}>
                {PROGRAM_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
        <MoneyInput
          label="Points"
          value={balance}
          onChange={setBalance}
          prefix=""
          dense={dense}
        />
      </div>

      <Result dense={dense}>
        {pts(balance)} points at {cpp} cents each is{" "}
        <strong className="font-medium">{usdExact((balance * cpp) / 100)}</strong>.
      </Result>
      <p className={cn("mt-2 text-muted", dense ? "text-[12px]" : "text-[13px]")}>
        Change what a point is worth to you in Settings.
      </p>
    </div>
  );
}

/* --- shared pieces -------------------------------------------------------- */

function NoCards() {
  return (
    <p className="text-sm text-muted">
      Add a card to your wallet and this calculator fills in.
    </p>
  );
}

function Field({
  label,
  htmlFor,
  dense,
  children,
}: {
  label: string;
  htmlFor: string;
  dense?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Label htmlFor={htmlFor} className={cn("mb-1.5 block text-muted", dense ? "text-[12px]" : "text-[13px]")}>
        {label}
      </Label>
      {children}
    </div>
  );
}

function CardSelect({
  id,
  cards,
  value,
  onChange,
}: {
  id: string;
  cards: Card[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-inner border border-line bg-surface px-3 text-sm transition-colors duration-[var(--cd-dur-hover)] ease-out hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {cards.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  prefix = "$",
  dense,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  dense?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} className={cn("mb-1.5 block text-muted", dense ? "text-[12px]" : "text-[13px]")}>
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm text-muted">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={cn("h-10 rounded-inner tabular-nums", prefix && "pl-7")}
        />
      </div>
    </div>
  );
}

function Rows({
  children,
  dense,
  className,
}: {
  children: React.ReactNode;
  dense?: boolean;
  className?: string;
}) {
  return (
    <dl className={cn("divide-y divide-line", dense ? "text-[13px]" : "text-sm", className)}>
      {children}
    </dl>
  );
}

function Row({
  label,
  sublabel,
  value,
  emphasis,
}: {
  label: string;
  sublabel?: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className={cn("min-w-0", emphasis && "font-medium")}>
        <span className="block truncate">{label}</span>
        {sublabel && (
          <span className="block text-[12px] text-muted">{sublabel}</span>
        )}
      </dt>
      <dd className={cn("shrink-0 tabular-nums", emphasis && "font-medium")}>
        {value}
      </dd>
    </div>
  );
}

function Result({
  children,
  dense,
}: {
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <p
      className={cn(
        "mt-5 leading-relaxed",
        dense ? "text-[13px]" : "text-[15px]",
      )}
    >
      {children}
    </p>
  );
}
