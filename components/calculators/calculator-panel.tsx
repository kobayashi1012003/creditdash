"use client";

import { useId, useState } from "react";
import { CalculatorIcon, CaretRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useRovingFocus } from "@/lib/use-roving-focus";
import { useIsDesktop } from "@/lib/use-media-query";
import { useStoredFlag } from "@/lib/use-stored-flag";
import { useIsLoading, useWallet } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { CALCULATORS } from "@/components/calculators/registry";

const STORAGE_KEY = "creditdash:calc-panel-open";

/**
 * The calculator panel that lives beside the Tracker.
 *
 * Desktop: docked on the right and sticky, so it stays in view while the
 * Tracker scrolls. A slim tab at the edge collapses and restores it.
 * Mobile: a floating button opens it as a bottom sheet, swipe down to close.
 *
 * Whether it was left open is remembered per browser.
 */
export function CalculatorPanel() {
  const cards = useWallet().map((e) => e.card);
  const isDesktop = useIsDesktop();
  // Open by default where it costs nothing (a docked desktop column) and
  // closed by default where it would cover the page the user came for.
  const [open, persist] = useStoredFlag(STORAGE_KEY, isDesktop);
  const [active, setActive] = useState<string>(CALCULATORS[0].id);
  const isLoading = useIsLoading();

  // With no cards every calculator is empty, and the Tracker beside it
  // already says what to do. Not hidden while loading: the docked column
  // appearing a frame late would shift the whole Tracker sideways.
  if (!isLoading && cards.length === 0) return null;

  const body = (
    <CalculatorBody cards={cards} active={active} onActiveChange={setActive} />
  );

  if (!isDesktop) {
    return (
      <>
        <Button
          size="lg"
          onClick={() => persist(true)}
          className="fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] z-20 shadow-lifted"
        >
          <CalculatorIcon size={18} weight="fill" />
          Calculators
        </Button>

        <Drawer open={open} onOpenChange={persist} swipeDirection="down" showSwipeHandle>
          <DrawerContent>
            <DrawerTitle className="px-5 pt-1 pb-3 font-display text-xl">
              Calculators
            </DrawerTitle>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {body}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Collapsed: a slim vertical tab at the edge of the content column.
  if (!open) {
    return (
      <div className="sticky top-10 h-fit">
        <button
          type="button"
          onClick={() => persist(true)}
          aria-expanded={false}
          className="flex h-auto flex-col items-center gap-3 rounded-inner border border-line bg-surface px-2.5 py-5 text-muted transition-[color,border-color,transform] duration-[var(--cd-dur-press)] ease-out hover:border-muted hover:text-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <CalculatorIcon size={19} />
          <span className="[writing-mode:vertical-rl] text-[13px] font-medium tracking-wide">
            Calculators
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Calculators"
      className="sticky top-10 h-fit max-h-[calc(100dvh-5rem)] w-[360px] overflow-y-auto rounded-widget border border-line bg-surface"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-display text-xl leading-none">Calculators</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => persist(false)}
          aria-label="Collapse calculators"
          aria-expanded
        >
          <CaretRightIcon size={16} />
        </Button>
      </div>
      <div className="px-5 py-5">{body}</div>
    </aside>
  );
}

function CalculatorBody({
  cards,
  active,
  onActiveChange,
}: {
  cards: import("@/data/types").Card[];
  active: string;
  onActiveChange: (id: string) => void;
}) {
  const current = CALCULATORS.find((c) => c.id === active) ?? CALCULATORS[0];
  const Body = current.Component;
  const baseId = useId();
  const { onKeyDown, itemProps } = useRovingFocus(
    CALCULATORS.length,
    CALCULATORS.indexOf(current),
    (i) => onActiveChange(CALCULATORS[i].id),
  );

  return (
    <>
      <div
        role="tablist"
        aria-label="Calculator"
        onKeyDown={onKeyDown}
        className="mb-5 flex flex-wrap gap-1.5"
      >
        {CALCULATORS.map((c, i) => {
          const selected = c === current;
          return (
            <button
              key={c.id}
              {...itemProps(i)}
              id={`${baseId}-tab-${c.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              onClick={() => onActiveChange(c.id)}
              className={cn(
                "rounded-pill border px-3 py-1.5 text-[13px] font-medium",
                "transition-[background-color,border-color,color,transform]",
                "duration-[var(--cd-dur-press)] ease-out active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                selected
                  ? "border-transparent bg-ink text-bg"
                  : "border-line text-muted hover:border-muted hover:text-ink",
              )}
            >
              {c.title}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${current.id}`}
      >
        <Body cards={cards} dense />
      </div>
    </>
  );
}
