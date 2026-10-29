"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { PERIOD_COUNT, type CreditPeriod } from "@/data/types";

type CheckmarkRowProps = {
  period: CreditPeriod;
  /** One entry per period slot: how much of the credit was used. */
  used: number[];
  /** Full value of one period's credit. */
  amount: number;
  /** Category ink, used for the filled state. */
  tint?: string;
  onToggle?: (index: number) => void;
  /** Ringed so the period in progress is findable at a glance. */
  currentIndex?: number;
  /** Labels each slot for screen readers, e.g. "January". */
  slotLabel?: (index: number) => string;
  /** Slots fill a grid cell instead of a fixed 32px, so a row can be laid
   *  out as one deliberate line at any width. */
  fluid?: boolean;
  className?: string;
};

/**
 * One slot per period: twelve for monthly, four for quarterly, two for
 * semi-annual, one for annual. A slot is full, partly used, or untouched.
 *
 * Partial amounts are entered in the card drawer in Phase 3; tapping here
 * toggles the whole slot, which is the common case.
 */
export function CheckmarkRow({
  period,
  used,
  amount,
  tint = "var(--cd-text)",
  onToggle,
  currentIndex = -1,
  slotLabel,
  fluid = false,
  className,
}: CheckmarkRowProps) {
  const count = PERIOD_COUNT[period];

  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label={`${period} credit, ${count} ${count === 1 ? "period" : "periods"}`}
    >
      {Array.from({ length: count }, (_, i) => {
        const value = used[i] ?? 0;
        const full = value >= amount;
        const partial = value > 0 && !full;
        const label = slotLabel?.(i) ?? `Period ${i + 1}`;
        const isCurrent = i === currentIndex;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle?.(i)}
            disabled={!onToggle}
            aria-pressed={full}
            aria-label={[
              label,
              full ? "used" : partial ? "partly used" : "not used",
              isCurrent ? "current period" : null,
            ]
              .filter(Boolean)
              .join(", ")}
            title={label}
            style={full ? { backgroundColor: tint, borderColor: tint } : undefined}
            className={cn(
              "relative grid place-items-center rounded-inner border",
              fluid ? "aspect-square w-full min-w-0" : "size-8",
              "transition-[background-color,border-color,transform,color]",
              "duration-[var(--cd-dur-press)] ease-out",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              onToggle && "active:scale-[0.94] hover:border-muted",
              !onToggle && "cursor-default",
              isCurrent && "ring-1 ring-muted ring-offset-2 ring-offset-surface",
              full
                ? "text-surface"
                : partial
                  ? "border-line bg-surface"
                  : "border-line bg-bg",
            )}
          >
            {full && <CheckIcon size={15} weight="bold" />}
            {partial && (
              // A half-height bar reads as "some of it" far faster than a
              // fraction does at this size.
              <span
                aria-hidden
                className="absolute inset-x-1.5 bottom-1.5 h-1 rounded-pill"
                style={{
                  backgroundColor: tint,
                  transform: `scaleX(${Math.min(1, value / amount)})`,
                  transformOrigin: "left",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
