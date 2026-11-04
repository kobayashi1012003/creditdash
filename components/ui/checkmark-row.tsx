"use client";

import { useRef } from "react";
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
  /** Short visible text under each slot, e.g. "Jan" or "Jan to Jun". */
  caption?: (index: number) => string;
  /** Periods that open after a limited-time credit ends: shown, not usable. */
  ended?: (index: number) => boolean;
  /** Slots fill a grid cell instead of a fixed 32px, so a row can be laid
   *  out as one deliberate line at any width. */
  fluid?: boolean;
  className?: string;
};

/**
 * One slot per period: twelve for monthly, four for quarterly, two for
 * semi-annual, one for annual. A slot is full, partly used (filled from the
 * bottom in proportion), or untouched.
 *
 * Press a slot and slide across its neighbours to set them all the same
 * way: starting on an empty slot fills, starting on a full one clears. On a
 * phone this is press and slide sideways; a vertical swipe still scrolls
 * the page, so a scroll that starts on a slot changes nothing.
 */
export function CheckmarkRow({
  period,
  used,
  amount,
  tint = "var(--cd-text)",
  onToggle,
  currentIndex = -1,
  slotLabel,
  caption,
  ended,
  fluid = false,
  className,
}: CheckmarkRowProps) {
  const count = PERIOD_COUNT[period];
  const groupRef = useRef<HTMLDivElement>(null);
  // The press in progress. The first slot is only changed once the press
  // ends or slides to another slot, so a cancelled press (the page took
  // the gesture to scroll) leaves everything as it was.
  const drag = useRef<{ start: number; fill: boolean; applied: boolean; seen: Set<number> } | null>(
    null,
  );

  const isFull = (i: number) => (used[i] ?? 0) >= amount;

  function slotAt(x: number, y: number): number {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slot]");
    if (!el || !groupRef.current?.contains(el)) return -1;
    return Number(el.dataset.slot);
  }

  function applyStart() {
    const d = drag.current;
    if (!d || d.applied) return;
    d.applied = true;
    onToggle?.(d.start);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const i = slotAt(e.clientX, e.clientY);
    if (i < 0 || d.seen.has(i) || ended?.(i)) return;
    applyStart();
    d.seen.add(i);
    if (isFull(i) !== d.fill) onToggle?.(i);
  }

  function endPress() {
    applyStart();
    drag.current = null;
  }

  return (
    <div
      ref={groupRef}
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label={`${period} credit, ${count} ${count === 1 ? "period" : "periods"}`}
      onPointerMove={onPointerMove}
      onPointerUp={endPress}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const value = used[i] ?? 0;
        const full = value >= amount;
        const partial = value > 0 && !full;
        const label = slotLabel?.(i) ?? `Period ${i + 1}`;
        const isCurrent = i === currentIndex;
        const isEnded = ended?.(i) ?? false;
        const usable = onToggle && !isEnded;

        const slot = (
          <button
            key={caption ? undefined : i}
            type="button"
            data-slot={i}
            onPointerDown={(e) => {
              if (!usable || e.button !== 0) return;
              // Capture so the release lands here even off the row; moves
              // still bubble to the group, which finds the slot underneath.
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Not an active pointer; the slide still works within the row.
              }
              drag.current = { start: i, fill: !full, applied: false, seen: new Set([i]) };
            }}
            onClick={(e) => {
              // Pointer presses are handled above. A click with no pointer
              // behind it is the keyboard (Enter or Space).
              if (e.detail === 0 && usable) onToggle?.(i);
            }}
            disabled={!usable}
            aria-pressed={full}
            aria-label={[
              label,
              isEnded ? "credit has ended" : full ? "used" : partial ? "partly used" : "not used",
              isCurrent ? "current period" : null,
            ]
              .filter(Boolean)
              .join(", ")}
            title={label}
            style={full ? { backgroundColor: tint, borderColor: tint } : undefined}
            className={cn(
              "relative grid touch-pan-y place-items-center overflow-hidden rounded-inner border select-none",
              fluid ? "aspect-square w-full min-w-0" : caption && count < 12 ? "h-8 w-full" : "size-8",
              "transition-[background-color,border-color,transform,color]",
              "duration-[var(--cd-dur-press)] ease-out",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              usable && "active:scale-[0.94] hover:border-muted",
              !usable && "cursor-default",
              isEnded && "border-dashed opacity-50",
              isCurrent && "ring-1 ring-muted ring-offset-2 ring-offset-surface",
              full ? "text-surface" : "border-line bg-bg",
            )}
          >
            {full && <CheckIcon size={15} weight="bold" className="relative" />}
            {partial && (
              // Filled from the bottom by the share used, so $6 of $10
              // reads as a box a little over half full.
              <span
                aria-hidden
                className="absolute inset-0 opacity-55 transition-transform duration-[var(--cd-dur-hover)] ease-out"
                style={{
                  backgroundColor: tint,
                  transform: `scaleY(${Math.min(1, value / amount)})`,
                  transformOrigin: "bottom",
                }}
              />
            )}
          </button>
        );

        if (!caption) return slot;
        return (
          <div key={i} className="flex min-w-0 flex-col items-center gap-1">
            {slot}
            <span
              aria-hidden
              className={cn(
                "max-w-full truncate text-[11px] leading-none",
                isCurrent ? "font-medium text-ink" : "text-muted",
              )}
            >
              {caption(i)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
