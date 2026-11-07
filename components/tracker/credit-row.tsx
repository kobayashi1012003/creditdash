"use client";

import { useState } from "react";
import { LightningIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import type { CardCredit } from "@/data/types";
import { creditState, resetPhrase, type Anniversary } from "@/lib/credits";
import type { CreditUsage } from "@/lib/data/schema";
import { confirmCredit, setCreditUsed } from "@/lib/data";
import { money, usd, usdExact } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CheckmarkRow } from "@/components/ui/checkmark-row";
import { CreditConditions } from "@/components/ui/credit-conditions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Months sit in a tight grid, a row of twelve once there is room. Longer
 * periods get wider slots spread across the row, each captioned with the
 * months it covers.
 */
const SLOT_LAYOUT: Record<CardCredit["period"], string> = {
  monthly: "grid grid-cols-[repeat(6,minmax(0,2.5rem))] gap-x-1.5 gap-y-3 md:grid-cols-[repeat(12,minmax(0,2.5rem))]",
  quarterly: "grid max-w-md grid-cols-4 gap-2",
  semiannual: "grid max-w-xs grid-cols-2 gap-3",
  annual: "grid max-w-[12rem] grid-cols-1",
};

/**
 * One credit: the period slots, what has been used, and when it resets.
 *
 * Tapping a slot marks the whole credit used, which is the common case.
 * Partial amounts get their own view rather than a long-press or a popover,
 * because they are typed, not tapped, and typing wants a real input.
 */
export function CreditRow({
  cardId,
  credit,
  anniversary,
  usage,
  tint,
  autoFill = false,
}: {
  cardId: string;
  credit: CardCredit;
  /** The UserCard: its anniversary, and its prefs for auto-filled periods. */
  anniversary: Anniversary;
  usage: CreditUsage;
  /** Filled slots' colour: the user's choice or the category's. */
  tint: string;
  /** Ticked automatically as each period opens (Premium). */
  autoFill?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const state = creditState(credit, anniversary, usage);
  const assumedKeys = state.windows.filter((_, i) => state.assumed[i]).map((w) => w.key);

  // A period set by hand is the user's own record, no longer a guess.
  const set = (key: string, amount: number) => {
    void setCreditUsed(credit.id, key, amount);
    if (assumedKeys.includes(key)) void confirmCredit(cardId, credit.id, [key]);
  };

  return (
    <li>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-[15px]">
            {credit.name} <CreditConditions credit={credit} className="ml-1" />
            {autoFill && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-control bg-panel px-1.5 py-px align-middle text-[11.5px] leading-snug text-muted">
                <LightningIcon size={11} weight="fill" aria-hidden />
                Auto-fill
              </span>
            )}
          </p>
          <p className="text-[13px] text-muted">
            {usd(credit.amount)} {resetPhrase(credit, anniversary)}
            {/* Only while something is left to use: a period already marked
                used, by hand or by auto-fill, needs no warning. */}
            {state.expiringSoon &&
              state.currentIndex !== -1 &&
              (state.used[state.currentIndex] ?? 0) < credit.amount && (
              <>
                {". "}
                <span className="text-ink">
                  {state.windows[state.currentIndex].label} ends soon
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-baseline gap-3">
          <p className="text-[13px] tabular-nums text-muted">
            {money(state.usedTotal)} of {usd(state.available)}
            {state.assumedTotal > 0 && <>, including {money(state.assumedTotal)} auto-filled</>}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing((e) => !e)}
            aria-pressed={editing}
            aria-label={
              editing
                ? `Finish editing amounts for ${credit.name}`
                : `Enter exact amounts for ${credit.name}`
            }
          >
            <PencilSimpleIcon size={14} />
            {editing ? "Done" : "Amounts"}
          </Button>
        </div>
      </div>

      {editing ? (
        <AmountGrid
          credit={credit}
          state={state}
          onSet={set}
        />
      ) : (
        <CheckmarkRow
          assumed={(i) => state.assumed[i]}
          period={credit.period}
          used={state.used}
          amount={credit.amount}
          tint={tint}
          currentIndex={state.currentIndex}
          // An auto-filled box unticks like any other: the easy way to say
          // "I did not use this one". Its auto-filled mark goes with it.
          onToggle={(i) =>
            set(state.windows[i].key, state.used[i] >= credit.amount ? 0 : credit.amount)
          }
          ended={(i) => state.offered[i] === false}
          slotLabel={(i) => state.windows[i]?.label ?? `Period ${i + 1}`}
          caption={(i) => {
            const label = state.windows[i]?.label ?? "";
            return credit.period === "monthly" ? label.slice(0, 3) : label;
          }}
          className={SLOT_LAYOUT[credit.period]}
        />
      )}

    </li>
  );
}

/**
 * A labelled input per period. Partial amounts are the point of this view, so
 * it shows dollars rather than a checkbox, and the current period is marked
 * because that is the one someone is almost always editing.
 */
function AmountGrid({
  credit,
  state,
  onSet,
}: {
  credit: CardCredit;
  state: ReturnType<typeof creditState>;
  onSet: (key: string, amount: number) => void;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        credit.period === "monthly"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : credit.period === "quarterly"
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {state.windows.map((window, i) => {
        const isCurrent = i === state.currentIndex;
        return (
          <div key={window.key}>
            <label
              htmlFor={`amt-${credit.id}-${window.key}`}
              className={cn(
                "mb-1 block text-[12px]",
                isCurrent ? "text-ink" : "text-muted",
              )}
            >
              {window.label}
              {isCurrent && " · now"}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 grid place-items-center text-[13px] text-muted">
                $
              </span>
              <Input
                id={`amt-${credit.id}-${window.key}`}
                type="number"
                inputMode="decimal"
                min={0}
                max={credit.amount}
                step="0.01"
                value={state.used[i] || ""}
                placeholder="0"
                aria-label={`${window.label}, of ${usdExact(credit.amount)}`}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const clamped = Math.min(
                    credit.amount,
                    Math.max(0, Number.isFinite(raw) ? raw : 0),
                  );
                  onSet(window.key, clamped);
                }}
                className={cn(
                  "h-9 rounded-inner pl-6 tabular-nums",
                  isCurrent && "border-muted",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
