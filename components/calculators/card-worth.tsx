"use client";

import { useId, useState } from "react";
import { ArrowsClockwiseIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import type { Card, CardCredit, CreditPeriod } from "@/data/types";
import { PERIOD_COUNT } from "@/data/types";
import { CARDS, getCard } from "@/data/cards.seed";
import {
  cardWorth,
  pointsToDollars,
  spendWorth,
  type BenefitUse,
} from "@/lib/calculators/engine";
import { toSpend, useSpendInputs } from "@/lib/calculators/spend-store";
import { annualValue, liveCredits, usedInRecentYear } from "@/lib/credits";
import { useCreditUsage, useValuation, useWallet } from "@/lib/data";
import { money, percent, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditConditions } from "@/components/ui/credit-conditions";
import {
  CardSelect,
  NotAdvice,
  NumberField,
  Verdict,
} from "@/components/calculators/fields";
import { friendlyMoney } from "@/components/calculators/spend-worth";

/** "$10 a month". */
const RENEWS: Record<CreditPeriod, string> = {
  monthly: "a month",
  quarterly: "a quarter",
  semiannual: "every six months",
  annual: "a year",
};

/** The unit the stepper counts in: "6 of 12 months". */
const UNIT: Record<CreditPeriod, [string, string]> = {
  monthly: ["month", "months"],
  quarterly: ["quarter", "quarters"],
  semiannual: ["half-year", "half-years"],
  annual: ["year", "years"],
};

type Unit = [one: string, many: string];

type Benefit =
  | { kind: "periodic"; id: string; name: string; credit: CardCredit; count: number }
  | { kind: "annual"; id: string; name: string; credit: CardCredit }
  /** Posts by itself (anniversary miles): always counted, nothing to enter. */
  | { kind: "bonus"; id: string; name: string; notes: string; dollars: number }
  /** A certificate with a cash worth: how many used, times what one is worth. */
  | {
      kind: "valued";
      id: string;
      name: string;
      notes?: string;
      perYear: number;
      unit: Unit;
      /** One's worth prefilled from its points cap, or null to ask. */
      prefill: number | null;
    }
  /** Counted but never dollars (elite nights, lounge visits). */
  | { kind: "usage"; id: string; name: string; notes?: string; perYear: number; unit: Unit }
  /** Comes with the card, not counted (status, unlimited lounges). */
  | { kind: "included"; id: string; name: string; notes?: string };

/**
 * Everything the catalog knows a card gives back, and how each counts
 * (owner, 5 November 2026). Credits and anniversary points carry cash
 * value. Free nights and companion fares count as many as will be used,
 * at a worth prefilled from the points cap where there is one. Status,
 * elite nights and lounges are never a dollar figure: counted ones show
 * how many would go unused, the rest are listed as included. Protections
 * and insurance are left out, since they are not why anyone keeps a card.
 */
function benefitsOf(card: Card, cpp: number): Benefit[] {
  // Ended credits drop out, and a limited-time credit only counts the
  // periods that open before it ends.
  const credits: Benefit[] = liveCredits(card.credits).map((credit) =>
    credit.period === "annual"
      ? { kind: "annual", id: credit.id, name: credit.name, credit }
      : {
          kind: "periodic",
          id: credit.id,
          name: credit.name,
          credit,
          count: credit.endsOn
            ? Math.round(annualValue(credit) / credit.amount)
            : PERIOD_COUNT[credit.period],
        },
  );
  const bonus: Benefit[] = card.anniversaryBonus
    ? [
        {
          kind: "bonus",
          id: `${card.id}-anniversary-bonus`,
          name: `${card.anniversaryBonus.points.toLocaleString("en-US")} anniversary ${card.anniversaryBonus.unit}`,
          notes: "Posts on its own every card anniversary, so it always counts.",
          dollars: pointsToDollars(card.anniversaryBonus.points, cpp),
        },
      ]
    : [];
  const perks: Benefit[] = (card.perks ?? [])
    .filter((p) => p.kind !== "protection")
    .map((p): Benefit => {
      if (p.count && (p.kind === "free-night" || p.kind === "companion")) {
        return {
          kind: "valued",
          id: p.id,
          name: p.name,
          notes: p.notes,
          perYear: p.count.perYear,
          unit: p.count.unit,
          prefill: p.pointsCap ? Math.round(pointsToDollars(p.pointsCap, cpp)) : null,
        };
      }
      if (p.count) {
        return { kind: "usage", id: p.id, name: p.name, notes: p.notes, perYear: p.count.perYear, unit: p.count.unit };
      }
      return { kind: "included", id: p.id, name: p.name, notes: p.notes };
    });
  return [...credits, ...bonus, ...perks];
}

/** Counted perks that would go unused: "11 elite nights". */
function unusedCounts(benefits: Benefit[], values: Record<string, number>): string[] {
  return benefits.flatMap((b) => {
    if (b.kind !== "usage" && b.kind !== "valued") return [];
    const left = b.perYear - Math.min(values[b.id] ?? 0, b.perYear);
    if (left <= 0) return [];
    return [`${formatCount(left)} ${left === 1 ? b.unit[0] : b.unit[1]}`];
  });
}

/** One certificate's worth: what the user typed, else the prefill. */
function eachOf(b: Extract<Benefit, { kind: "valued" }>, each: Record<string, number>): number {
  return each[b.id] ?? b.prefill ?? 0;
}

function toUse(b: Benefit, value: number, each: Record<string, number>): BenefitUse | null {
  switch (b.kind) {
    case "periodic":
      return {
        id: b.id,
        name: b.name,
        max: b.credit.amount * b.count,
        used: Math.min(value, b.count) * b.credit.amount,
      };
    case "annual":
      return { id: b.id, name: b.name, max: b.credit.amount, used: value };
    case "bonus":
      return { id: b.id, name: b.name, max: b.dollars, used: b.dollars };
    case "valued":
      // No dollar gap: what is left is named in units by unusedCounts.
      return { id: b.id, name: b.name, max: null, used: Math.min(value, b.perYear) * eachOf(b, each) };
    case "usage":
    case "included":
      return null;
  }
}

/** Only cards with a fee: "is it worth it?" has no question to answer at $0. */
const hasFee = (c: Card) => c.annualFee > 0;

function defaultCard(wallet: Card[]): string {
  return wallet.find(hasFee)?.id ?? CARDS.find(hasFee)!.id;
}

/** Will the benefits someone would actually use cover the annual fee? */
export function CardWorthCalculator({ cards }: { cards: Card[] }) {
  const [cardId, setCardId] = useState(() => defaultCard(cards));
  const found = getCard(cardId);
  const card = found && hasFee(found) ? found : getCard(defaultCard(cards))!;

  return (
    <div className="@container">
      <div className="max-w-md">
        <CardSelect
          label="Card"
          hint="Any card with an annual fee, yours or not."
          wallet={cards}
          include={hasFee}
          value={card.id}
          onChange={setCardId}
        />
      </div>
      {/* Keyed so a new card starts from a clean slate rather than
          carrying one card's usage onto another's benefits. */}
      <CardWorthBody key={card.id} card={card} />
      <NotAdvice>
        Credits often need enrolling or have conditions. Check them with the issuer.
      </NotAdvice>
    </div>
  );
}

function CardWorthBody({ card }: { card: Card }) {
  const { cpp } = useValuation(card.program);
  const benefits = benefitsOf(card, cpp);
  const [values, setValues] = useState<Record<string, number>>({});
  // What one free night or companion fare is worth, where the user changed it.
  const [each, setEach] = useState<Record<string, number>>({});
  const [withRewards, setWithRewards] = useState(false);
  const [filled, setFilled] = useState(false);
  const rewardsId = useId();

  const wallet = useWallet();
  const owned = wallet.find((e) => e.card.id === card.id);
  const usage = useCreditUsage();

  const spendInputs = useSpendInputs(card.id);
  // The spend calculator has no timeframe, so its amounts count as a year.
  const spend = spendWorth(card, toSpend(spendInputs), "year", cpp);
  const rewardsPerYear = pointsToDollars(spend.pointsPerYear, cpp);

  const result = cardWorth(
    card.annualFee,
    benefits.flatMap((b) => toUse(b, values[b.id] ?? 0, each) ?? []),
    withRewards ? rewardsPerYear : 0,
  );
  const unused = unusedCounts(benefits, values);
  const counted = benefits.filter((b) => b.kind !== "included");
  const included = benefits.filter((b) => b.kind === "included");

  function set(id: string, value: number) {
    setValues((v) => ({ ...v, [id]: Math.max(0, value) }));
    setFilled(false);
  }

  function fillFromTracker() {
    if (!owned) return;
    const next: Record<string, number> = {};
    for (const b of benefits) {
      if (b.kind !== "periodic" && b.kind !== "annual") continue;
      const used = usedInRecentYear(b.credit, owned.userCard, usage);
      next[b.id] =
        b.kind === "periodic" ? Math.round((used / b.credit.amount) * 10) / 10 : used;
    }
    setValues((v) => ({ ...v, ...next }));
    setFilled(true);
  }

  return (
    // Narrow: verdict (sticky), then the gaps and the switch, then the
    // list. Wide: the list on the left; verdict, gaps and switch on the
    // right. The verdict is a direct grid child either way, because a
    // sticky element only sticks within its own parent.
    <div className="mt-5 grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:grid-rows-[auto_auto_1fr] @2xl:gap-x-8">
      <div className="sticky top-0 z-10 -mx-1 bg-surface px-1 pb-1 @2xl:top-4 @2xl:col-start-2 @2xl:row-start-1 @2xl:mx-0 @2xl:self-start @2xl:px-0">
        <WorthSummary result={result} unused={unused} />
      </div>

      <div className="space-y-3 @2xl:col-start-2 @2xl:row-start-2">
        <Gaps gaps={result.gaps} />
        <div className="flex items-start gap-3">
          <Switch
            checked={withRewards}
            onCheckedChange={setWithRewards}
            aria-labelledby={rewardsId}
            aria-describedby={`${rewardsId}-note`}
            className="mt-0.5 data-checked:bg-ink data-unchecked:bg-line"
          />
          <div className="min-w-0 text-[13px] leading-snug">
            {/* Base UI's switch is a span, so a <label for> cannot reach it;
                the text toggles it directly and names it by id. */}
            <span
              id={rewardsId}
              onClick={() => setWithRewards((on) => !on)}
              className="cursor-pointer text-ink select-none"
            >
              Add rewards from spending
            </span>
            <p id={`${rewardsId}-note`} className="text-muted">
              {spend.totalSpend > 0
                ? `${friendlyMoney(rewardsPerYear)} a year from what you entered in "What is my spend worth?", counted apart from the benefits.`
                : `Enter this card's spending in "What is my spend worth?" and it counts here.`}
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 @2xl:col-start-1 @2xl:row-span-3 @2xl:row-start-1">
        {owned && benefits.some((b) => b.kind === "periodic" || b.kind === "annual") && (
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button variant="outline" size="sm" onClick={fillFromTracker}>
              <ArrowsClockwiseIcon size={15} />
              Fill in from my Tracker
            </Button>
            {filled && (
              <span className="text-[12px] text-muted" aria-live="polite">
                Filled in from the last 12 months.
              </span>
            )}
          </div>
        )}

        {benefits.length === 0 ? (
          <p className="rounded-inner border border-line px-4 py-3.5 text-[14px] leading-relaxed text-muted">
            The catalog has no credits or perks for this card yet, so only rewards
            from spending can count toward it.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {counted.map((b) => (
                <BenefitRow
                  key={b.id}
                  benefit={b}
                  value={values[b.id] ?? 0}
                  onValue={(v) => set(b.id, v)}
                  each={b.kind === "valued" ? eachOf(b, each) : 0}
                  onEach={(v) => setEach((e) => ({ ...e, [b.id]: Math.max(0, v) }))}
                />
              ))}
            </ul>
            {included.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-[13px] font-medium">Also included, not counted in dollars</p>
                <ul className="mt-2 space-y-1.5">
                  {included.map((b) => (
                    <li key={b.id} className="text-[13px] leading-snug">
                      {b.name}
                      {b.notes && <span className="text-muted">. {b.notes}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WorthSummary({
  result,
  unused,
}: {
  result: ReturnType<typeof cardWorth>;
  unused: string[];
}) {
  if (result.verdict === "no-fee") {
    return (
      <Verdict title="No annual fee">
        Every benefit is a bonus. {result.total > 0 && <>You&apos;d get {friendlyMoney(result.total)} a year.</>}
      </Verdict>
    );
  }

  const title =
    result.verdict === "pays" ? (
      <>Pays for itself, plus {friendlyMoney(result.net)}</>
    ) : (
      <>Falls {friendlyMoney(-result.net)} short</>
    );

  return (
    <Verdict title={title}>
      <FeeBar total={result.total} fee={result.annualFee} />
      <p className="mt-2 flex flex-wrap justify-between gap-x-4 text-[13px]">
        <span>
          {friendlyMoney(result.total)} against the {usd(result.annualFee)} fee
        </span>
        <span className="tabular-nums text-ink">
          {percent(result.covered ?? 0)} of fee covered
        </span>
      </p>
      {/* Perks paid for in the fee but left on the table. Elite nights and
          lounge visits have no dollar figure, so the fee sum cannot show
          them; naming them is how an unused perk counts against the card. */}
      {unused.length > 0 && (
        <p className="mt-2 text-[13px] leading-snug">
          <span className="text-muted">Unused: </span>
          {unused.join(", ")}
        </p>
      )}
    </Verdict>
  );
}

/** The three benefits with the most money left in them. */
function Gaps({ gaps }: { gaps: ReturnType<typeof cardWorth>["gaps"] }) {
  if (gaps.length === 0) return null;
  return (
    <ul className="space-y-0.5 text-[13px] text-muted">
      {gaps.slice(0, 3).map((g) => (
        <li key={g.id}>
          Unused: <span className="tabular-nums text-ink">{money(g.left)}</span> {g.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * Value used against the fee. The scale stretches past the fee when the
 * card more than pays for itself, so the fee line moves left rather than
 * the bar overflowing. Both move by transform only.
 */
function FeeBar({ total, fee }: { total: number; fee: number }) {
  const scale = Math.max(total, fee);
  const fill = scale > 0 ? total / scale : 0;
  const line = scale > 0 ? (fee / scale) * 100 : 100;
  const covered = total >= fee;

  return (
    <div
      role="img"
      aria-label={`${Math.round((total / fee) * 100)} percent of the annual fee covered`}
      className="relative mt-3 h-2.5 w-full overflow-x-clip"
    >
      <div className="absolute inset-0 overflow-hidden rounded-pill bg-panel">
        <div
          className={cn(
            "h-full origin-left rounded-pill transition-transform duration-[var(--cd-dur-panel)] ease-out",
            covered ? "bg-[var(--cd-mint-ink)]" : "bg-ink",
          )}
          style={{ transform: `scaleX(${total > 0 ? Math.max(0.02, fill) : 0})` }}
        />
      </div>
      {/* The fee line. A full-width layer translated, because a transform
          percentage is of the element's own width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-[-3px] left-0 w-full transition-transform duration-[var(--cd-dur-panel)] ease-out"
        style={{ transform: `translateX(${line}%)` }}
      >
        <div className="h-full w-0.5 -translate-x-1/2 rounded-pill bg-ink" />
      </div>
    </div>
  );
}

function BenefitRow({
  benefit,
  value,
  onValue,
  each,
  onEach,
}: {
  benefit: Benefit;
  value: number;
  onValue: (v: number) => void;
  /** One certificate's worth, for a "valued" benefit. */
  each: number;
  onEach: (v: number) => void;
}) {
  if (benefit.kind === "included") return null;

  if (benefit.kind === "bonus") {
    return (
      <li className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug">{benefit.name}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">{benefit.notes}</p>
        </div>
        <span className="shrink-0 pt-0.5 text-[14px] tabular-nums">{money(benefit.dollars)}</span>
      </li>
    );
  }

  if (benefit.kind === "valued" || benefit.kind === "usage") {
    const used = Math.min(value, benefit.perYear);
    return (
      <li className="py-3.5 first:pt-0 last:pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-snug">{benefit.name}</p>
            {benefit.notes && (
              <p className="mt-0.5 text-[12px] leading-snug text-muted">{benefit.notes}</p>
            )}
          </div>
          {benefit.kind === "valued" ? (
            <span className="shrink-0 pt-0.5 text-[14px] tabular-nums">{money(used * each)}</span>
          ) : (
            <span className="shrink-0 pt-0.5 text-[12px] text-muted">No dollar value</span>
          )}
        </div>
        <CountStepper
          name={benefit.name}
          unit={benefit.unit}
          count={benefit.perYear}
          value={value}
          onValue={onValue}
        />
        {benefit.kind === "valued" && (
          <div className="mt-2.5 grid max-w-[16rem] grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3">
            <p className="text-[12px] leading-snug text-muted">
              {benefit.prefill === null
                ? `What one ${benefit.unit[0]} is worth to you`
                : `One ${benefit.unit[0]}, at most`}
            </p>
            <NumberField
              kind="money"
              label={`Worth of one ${benefit.unit[0]}`}
              labelHidden={`What one ${benefit.unit[0]} from ${benefit.name} is worth`}
              value={each || null}
              onValue={(v) => onEach(v ?? 0)}
              inputClassName="text-right"
            />
          </div>
        )}
      </li>
    );
  }

  const { credit } = benefit;
  const max = benefit.kind === "periodic" ? credit.amount * benefit.count : credit.amount;
  const head = (
    <div className="min-w-0">
      <p className="text-[14px] font-medium leading-snug">{benefit.name}</p>
      <CreditConditions credit={credit} className="mt-1" />
      <p className="mt-0.5 text-[12px] leading-snug text-muted">
        {money(credit.amount)} {RENEWS[credit.period]}
        {benefit.kind === "periodic" && <>, up to {money(max)} a year</>}
      </p>
      {credit.notes && (
        <p className="mt-0.5 text-[12px] leading-snug text-muted">{credit.notes}</p>
      )}
    </div>
  );

  if (benefit.kind === "annual") {
    const over = value > max;
    return (
      <li className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-start gap-3 py-3.5 first:pt-0 last:pb-0">
        {head}
        <div>
          <NumberField
            kind="money"
            label="Expect to use"
            labelHidden={`${benefit.name}, dollars you expect to use, up to ${money(max)}`}
            value={value || null}
            onValue={(v) => onValue(v ?? 0)}
            inputClassName="text-right"
          />
          <p className={cn("mt-1 text-right text-[12px]", over ? "text-ink" : "text-muted")}>
            {over ? `Counts as ${money(max)}` : `of ${money(max)}`}
          </p>
        </div>
      </li>
    );
  }

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        {head}
        <span className="shrink-0 pt-0.5 text-[14px] tabular-nums">
          {money(Math.round(Math.min(value, benefit.count) * credit.amount * 100) / 100)}
        </span>
      </div>
      <CountStepper
        name={benefit.name}
        unit={UNIT[credit.period]}
        count={benefit.count}
        value={value}
        onValue={onValue}
      />
    </li>
  );
}

/**
 * How many used, from none to all, with the answers most people give.
 * Periods of a credit, or a perk's nights, visits or certificates.
 */
function CountStepper({
  name,
  unit,
  count,
  value,
  onValue,
}: {
  name: string;
  unit: Unit;
  count: number;
  value: number;
  onValue: (v: number) => void;
}) {
  const [one, many] = unit;
  const shown = Math.min(value, count);
  // "Half" of one certificate is "None" again, so it only shows from two.
  const quick = [
    { label: "None", to: 0 },
    ...(count >= 2 ? [{ label: "Half", to: Math.floor(count / 2) }] : []),
    { label: "All", to: count },
  ];

  const step =
    "grid size-8 place-items-center rounded-control border border-line bg-surface text-ink transition-[border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2" role="group" aria-label={`${name}, ${many} used`}>
        <button
          type="button"
          className={step}
          disabled={shown <= 0}
          onClick={() => onValue(Math.max(0, Math.ceil(shown) - 1))}
          aria-label={`One ${one} fewer`}
        >
          <MinusIcon size={14} />
        </button>
        <span className="min-w-[7.5rem] text-center text-[13px] tabular-nums" aria-live="polite">
          {formatCount(shown)} of {count} {count === 1 ? one : many}
        </span>
        <button
          type="button"
          className={step}
          disabled={shown >= count}
          onClick={() => onValue(Math.min(count, Math.floor(shown) + 1))}
          aria-label={`One ${one} more`}
        >
          <PlusIcon size={14} />
        </button>
      </div>
      <div className="flex gap-1">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            aria-pressed={shown === q.to}
            aria-label={`${q.label}: ${q.to} of ${count} ${many} for ${name}`}
            onClick={() => onValue(q.to)}
            className={cn(
              "h-8 rounded-control px-2.5 text-[13px] transition-[background-color,color,border-color,transform] duration-[var(--cd-dur-press)] ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              shown === q.to
                ? "bg-ink font-medium text-bg"
                : "border border-line text-muted hover:border-muted hover:text-ink",
            )}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "6", or "4.5" when the Tracker recorded part of a period. */
function formatCount(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
