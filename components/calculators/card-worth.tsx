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
import { toSpend, useSpendInputs, useTimeframe } from "@/lib/calculators/spend-store";
import { usedInRecentYear } from "@/lib/credits";
import { useCreditUsage, useValuation, useWallet } from "@/lib/data";
import { money, percent, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

type Benefit =
  | { kind: "periodic"; id: string; name: string; credit: CardCredit; count: number }
  | { kind: "annual"; id: string; name: string; credit: CardCredit }
  | { kind: "perk"; id: string; name: string; notes?: string; waiting: boolean };

/**
 * Everything the catalog knows a card gives back. Credits carry a cash
 * value; perks do not, so they are worth what the user says. Lounge access
 * is only a sentence in the catalog for now, so it becomes a perk row marked
 * as waiting on card data rather than disappearing.
 */
function benefitsOf(card: Card): Benefit[] {
  const credits: Benefit[] = card.credits.map((credit) =>
    credit.period === "annual"
      ? { kind: "annual", id: credit.id, name: credit.name, credit }
      : {
          kind: "periodic",
          id: credit.id,
          name: credit.name,
          credit,
          count: PERIOD_COUNT[credit.period],
        },
  );
  const perks: Benefit[] = (card.perks ?? []).map((p) => ({
    kind: "perk",
    id: p.id,
    name: p.name,
    notes: p.notes,
    waiting: false,
  }));
  if (card.loungeAccess && !perks.some((p) => p.id === "lounge")) {
    perks.unshift({
      kind: "perk",
      id: "lounge",
      name: "Lounge access",
      notes: card.loungeAccess,
      waiting: true,
    });
  }
  return [...credits, ...perks];
}

function toUse(b: Benefit, value: number): BenefitUse {
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
    case "perk":
      return { id: b.id, name: b.name, max: null, used: value };
  }
}

function defaultCard(wallet: Card[]): string {
  return (
    wallet.find((c) => c.annualFee > 0)?.id ??
    wallet[0]?.id ??
    CARDS.find((c) => c.annualFee > 0)?.id ??
    CARDS[0].id
  );
}

/** Will the benefits someone would actually use cover the annual fee? */
export function CardWorthCalculator({ cards }: { cards: Card[] }) {
  const [cardId, setCardId] = useState(() => defaultCard(cards));
  const card = getCard(cardId) ?? CARDS[0];

  return (
    <div className="@container">
      <div className="max-w-md">
        <CardSelect
          label="Card"
          hint="Any card in the catalog, yours or not."
          wallet={cards}
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
  const benefits = benefitsOf(card);
  const [values, setValues] = useState<Record<string, number>>({});
  const [withRewards, setWithRewards] = useState(false);
  const [filled, setFilled] = useState(false);
  const rewardsId = useId();

  const wallet = useWallet();
  const owned = wallet.find((e) => e.card.id === card.id);
  const usage = useCreditUsage();

  const spendInputs = useSpendInputs(card.id);
  const timeframe = useTimeframe();
  const { cpp } = useValuation(card.program);
  const spend = spendWorth(card, toSpend(spendInputs), timeframe, cpp);
  const rewardsPerYear = pointsToDollars(spend.pointsPerYear, cpp);

  const result = cardWorth(
    card.annualFee,
    benefits.map((b) => toUse(b, values[b.id] ?? 0)),
    withRewards ? rewardsPerYear : 0,
  );

  function set(id: string, value: number) {
    setValues((v) => ({ ...v, [id]: Math.max(0, value) }));
    setFilled(false);
  }

  function fillFromTracker() {
    if (!owned) return;
    const next: Record<string, number> = {};
    for (const b of benefits) {
      if (b.kind === "perk") continue;
      const used = usedInRecentYear(b.credit, owned.userCard.anniversaryMonth, usage);
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
        <WorthSummary result={result} />
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
        {owned && benefits.some((b) => b.kind !== "perk") && (
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
          <ul className="divide-y divide-line">
            {benefits.map((b) => (
              <BenefitRow
                key={b.id}
                benefit={b}
                value={values[b.id] ?? 0}
                onValue={(v) => set(b.id, v)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function WorthSummary({ result }: { result: ReturnType<typeof cardWorth> }) {
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
}: {
  benefit: Benefit;
  value: number;
  onValue: (v: number) => void;
}) {
  if (benefit.kind === "perk") {
    return (
      <li className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-start gap-3 py-3.5 first:pt-0 last:pb-0">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug">{benefit.name}</p>
          {benefit.notes && (
            <p className="mt-0.5 text-[12px] leading-snug text-muted">{benefit.notes}</p>
          )}
          {benefit.waiting && (
            <p className="mt-0.5 text-[12px] leading-snug text-muted">
              No cash value in the catalog yet.
            </p>
          )}
        </div>
        <NumberField
          kind="money"
          label="What it's worth to you"
          labelHidden={`What ${benefit.name.toLowerCase()} is worth to you a year`}
          value={value || null}
          onValue={(v) => onValue(v ?? 0)}
          inputClassName="text-right"
        />
      </li>
    );
  }

  const { credit } = benefit;
  const max = benefit.kind === "periodic" ? credit.amount * benefit.count : credit.amount;
  const head = (
    <div className="min-w-0">
      <p className="text-[14px] font-medium leading-snug">{benefit.name}</p>
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
      <PeriodStepper
        name={benefit.name}
        period={credit.period}
        count={benefit.count}
        value={value}
        onValue={onValue}
      />
    </li>
  );
}

/** Periods used, from none to all, with the three answers most people give. */
function PeriodStepper({
  name,
  period,
  count,
  value,
  onValue,
}: {
  name: string;
  period: CreditPeriod;
  count: number;
  value: number;
  onValue: (v: number) => void;
}) {
  const [one, many] = UNIT[period];
  const shown = Math.min(value, count);
  const quick = [
    { label: "None", to: 0 },
    { label: "Half", to: Math.floor(count / 2) },
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
