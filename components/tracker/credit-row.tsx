"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import type { CardCredit } from "@/data/types";
import { categoryStyle } from "@/lib/categories";
import { creditState } from "@/lib/credits";
import type { CreditUsage } from "@/lib/data/schema";
import { setCreditUsed } from "@/lib/data";
import { money, usd, usdExact } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CheckmarkRow } from "@/components/ui/checkmark-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * One credit: the period slots, what has been used, and when it resets.
 *
 * Tapping a slot marks the whole credit used, which is the common case.
 * Partial amounts get their own view rather than a long-press or a popover,
 * because they are typed, not tapped, and typing wants a real input.
 */
export function CreditRow({
  credit,
  anniversaryMonth,
  usage,
}: {
  credit: CardCredit;
  anniversaryMonth: number;
  usage: CreditUsage;
}) {
  const [editing, setEditing] = useState(false);
  const state = creditState(credit, anniversaryMonth, usage);
  const tint = credit.category
    ? categoryStyle(credit.category).color
    : "var(--cd-text)";

  const resetsOn =
    credit.resetBasis === "calendar"
      ? "the calendar year"
      : "the card anniversary";

  return (
    <li>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-[15px]">{credit.name}</p>
          <p className="text-[13px] text-muted">
            {usd(credit.amount)} per period, resets on {resetsOn}
            {state.expiringSoon && state.currentIndex !== -1 && (
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
          onSet={(key, amount) => setCreditUsed(credit.id, key, amount)}
        />
      ) : (
        <CheckmarkRow
          period={credit.period}
          used={state.used}
          amount={credit.amount}
          tint={tint}
          currentIndex={state.currentIndex}
          onToggle={(i) =>
            setCreditUsed(
              credit.id,
              state.windows[i].key,
              state.used[i] >= credit.amount ? 0 : credit.amount,
            )
          }
          slotLabel={(i) => state.windows[i]?.label ?? `Period ${i + 1}`}
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
