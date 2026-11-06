"use client";

import { useId } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { Card } from "@/data/types";
import { Widget } from "@/components/ui/widget";
import { CALCULATORS } from "@/components/calculators/registry";
import { useIsLoading, useWallet } from "@/lib/data";
import { useStoredFlag } from "@/lib/use-stored-flag";
import { cn } from "@/lib/cn";

export function CalculatorsList() {
  // Cards added before their data have nothing to calculate with.
  const cards = useWallet()
    .map((e) => e.card)
    .filter((c) => !c.pending);
  const isLoading = useIsLoading();

  // Without this the cards would default to the catalog for a frame and then
  // jump to the wallet's own once it arrives.
  if (isLoading) return <CalculatorsSkeleton />;

  // No empty-wallet gate: two of the three work on any card or program, and
  // the third falls back to the catalog.
  return (
    <div className="space-y-5">
      {CALCULATORS.map((calc) => (
        <CalculatorSection key={calc.id} calc={calc} cards={cards} />
      ))}
    </div>
  );
}

/**
 * One calculator that folds away to its title, so someone can keep only the
 * one they use open (owner, 3 November 2026). Remembered in this browser.
 *
 * The body folds on grid rows (0fr to 1fr), the one place a size animates:
 * it is a single deliberate action, and the alternative, the page below
 * jumping by a calculator's height, is worse. The content fades with it,
 * and goes inert when folded so the keyboard skips it.
 */
function CalculatorSection({
  calc: { id, title, blurb, Component },
  cards,
}: {
  calc: (typeof CALCULATORS)[number];
  cards: Card[];
}) {
  const [open, setOpen] = useStoredFlag(`creditdash:calc-open:${id}`, true);
  const bodyId = useId();

  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-widget border border-line bg-surface shadow-soft"
    >
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(!open)}
          className="group flex w-full items-start justify-between gap-4 rounded-widget p-6 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        >
          <span className="min-w-0">
            <span className="block font-display text-xl leading-tight">{title}</span>
            <span className="mt-1.5 block max-w-[58ch] text-sm leading-relaxed text-muted">
              {blurb}
            </span>
          </span>
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-pill border border-line text-muted transition-[border-color,color,transform] duration-[var(--cd-dur-hover)] ease-out group-hover:border-muted group-hover:text-ink group-active:scale-[0.94]"
          >
            <CaretDownIcon
              size={15}
              weight="bold"
              className={cn(
                "transition-transform duration-[var(--cd-dur-panel)] ease-drawer",
                open && "rotate-180",
              )}
            />
          </span>
        </button>
      </h2>
      <div
        id={bodyId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-[var(--cd-dur-panel)] ease-drawer",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        {/* clip, not hidden: hidden would make a scroll container and stop the
            calculators' sticky verdicts from sticking. */}
        <div className="min-h-0 overflow-clip">
          <div className="px-6 pb-6">
            <Component cards={cards} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CalculatorsSkeleton() {
  return (
    <div aria-busy aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading your calculators</span>
      {CALCULATORS.map(({ id, title }) => (
        // Titles are static, so they render for real and only the body,
        // which depends on the wallet, is a placeholder.
        <Widget key={id} title={title}>
          <div className="h-4 w-3/5 rounded-pill bg-bg" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-inner bg-bg" />
            ))}
          </div>
          <div className="mt-5 h-24 rounded-inner bg-bg" />
        </Widget>
      ))}
    </div>
  );
}
