"use client";

import type { Card, ChosenRate, EarnRate, RotatingRate } from "@/data/types";
import { rateText } from "@/data/programs";
import { picksFor, quarterKey } from "@/lib/calculators/engine";
import { setEarnChoice } from "@/lib/data";
import { useRovingFocus } from "@/lib/use-roving-focus";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The earn rates that are not fixed: categories the cardholder picks, and
 * categories that rotate each quarter. Shown in the card details under the
 * fixed rates. Picks are saved with the wallet (prefs.earnChoices), so the
 * answer line, chips, Compare and calculators all use them.
 */

/** "Up to $2,500 a quarter in combined purchases." Empty when uncapped. */
export function capText(rate: Pick<EarnRate, "cap" | "capPeriod" | "capGroup">): string {
  if (rate.cap === null || rate.cap === undefined) return "";
  const per = rate.capPeriod === "quarter" ? "a quarter" : "a year";
  return `Up to ${usd(rate.cap)} ${per}${rate.capGroup ? " in combined purchases" : ""}.`;
}

const CHIP = cn(
  "inline-flex items-center rounded-control border px-3 py-1.5 text-[13px] font-medium",
  "transition-[background-color,border-color,color,transform] duration-[var(--cd-dur-press)] ease-out",
  "active:scale-[0.97]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "disabled:pointer-events-none disabled:opacity-40",
);
const CHIP_ON = "border-ink bg-panel text-ink";
const CHIP_OFF = "border-line bg-surface text-muted hover:border-muted hover:text-ink";

export function ChosenRateRow({
  card,
  rate,
  editable,
}: {
  card: Card;
  rate: ChosenRate;
  /** True for a card in the user's own wallet: the pick can be changed. */
  editable: boolean;
}) {
  const picked = picksFor(card, rate);
  const own = Boolean(card.picks?.[rate.id]?.length);
  const label = (id: string) => rate.options.find((o) => o.id === id)?.label ?? id;
  const unranked = picked.filter((id) => rate.options.find((o) => o.id === id)?.categories.length === 0);

  const status = own
    ? null
    : picked.length > 0
      ? `${card.issuer}'s default until you choose: ${picked.map(label).join(", ")}.`
      : "Nothing chosen yet, so this card earns its base rate here.";

  return (
    <li className="border-t border-line py-4 sm:col-span-2 lg:col-span-3">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[28px] leading-none tracking-[-0.03em] tabular-nums">
          {rateText(card.program, rate.multiplier)}
        </span>
        <span className="text-[15px] font-medium">{rate.label}</span>
      </p>
      <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-muted">
        {[
          rate.picks > 1 ? `Pick ${rate.picks}.` : null,
          capText(rate) || null,
          rate.notes ? `${rate.notes}.` : null,
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
      {editable ? (
        <OptionPicker card={card} rate={rate} picked={picked} />
      ) : (
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Choose from {rate.options.map((o) => o.label).join(", ")}.
        </p>
      )}
      {editable && status && <p className="mt-2 text-[13px] text-muted">{status}</p>}
      {unranked.length > 0 && (
        <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-muted">
          {unranked.map(label).join(" and ")} {unranked.length === 1 ? "is not a category" : "are not categories"} in
          CreditDash, so {unranked.length === 1 ? "it is" : "they are"} not used when picking a card.
        </p>
      )}
    </li>
  );
}

function OptionPicker({ card, rate, picked }: { card: Card; rate: ChosenRate; picked: string[] }) {
  const single = rate.picks === 1;
  const selectedIndex = single ? rate.options.findIndex((o) => o.id === picked[0]) : -1;
  const { onKeyDown, itemProps } = useRovingFocus(rate.options.length, selectedIndex, (i) =>
    void setEarnChoice(card.id, rate.id, [rate.options[i].id]),
  );

  if (single) {
    return (
      <div
        role="radiogroup"
        aria-label={rate.label}
        onKeyDown={onKeyDown}
        className="mt-3 flex flex-wrap gap-1.5"
      >
        {rate.options.map((o, i) => {
          const on = picked[0] === o.id;
          return (
            <button
              key={o.id}
              {...itemProps(i)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => void setEarnChoice(card.id, rate.id, [o.id])}
              className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  const full = picked.length >= rate.picks;
  return (
    <div role="group" aria-label={`${rate.label}, pick ${rate.picks}`} className="mt-3 flex flex-wrap gap-1.5">
      {rate.options.map((o) => {
        const on = picked.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            disabled={!on && full}
            onClick={() =>
              void setEarnChoice(
                card.id,
                rate.id,
                on ? picked.filter((id) => id !== o.id) : [...picked, o.id],
              )
            }
            className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The quarter after the one a date falls in, keyed like quarterKey. */
function nextQuarterKey(date: Date): string {
  return quarterKey(new Date(date.getFullYear(), date.getMonth() + 3, 1));
}

export function RotatingRateRow({ card, rate }: { card: Card; rate: RotatingRate }) {
  const now = new Date();
  const current = rate.quarters[quarterKey(now)];
  const next = rate.quarters[nextQuarterKey(now)];

  return (
    <li className="border-t border-line py-4 sm:col-span-2 lg:col-span-3">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[28px] leading-none tracking-[-0.03em] tabular-nums">
          {rateText(card.program, rate.multiplier)}
        </span>
        <span className="text-[15px] font-medium">
          {current ? `This quarter: ${current.label}` : "This quarter's categories"}
        </span>
      </p>
      <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-muted">
        {[
          current ? null : "Not in CreditDash yet, so the card earns its base rate until they are.",
          capText({ ...rate, capGroup: undefined }) || null,
          rate.activate ? `Activate with ${card.issuer} each quarter before it counts.` : null,
          rate.notes ? `${rate.notes}.` : null,
          next ? `Next quarter: ${next.label}.` : null,
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
    </li>
  );
}
