"use client";

import { useSyncExternalStore } from "react";
import type { Category } from "@/lib/categories";
import type { Timeframe } from "@/lib/calculators/engine";

/**
 * What has been typed into "What is my spend worth?", per card, held in
 * memory for this visit.
 *
 * Shared rather than local so "Is this card worth it?" can add the same
 * card's rewards from spending, and so the Tracker panel's tabs keep their
 * numbers when switched. Not saved: these are what-ifs, not records.
 */

export type SpendInputs = Partial<Record<Category, number | null>>;

type State = {
  timeframe: Timeframe;
  byCard: Record<string, SpendInputs>;
};

let state: State = { timeframe: "month", byCard: {} };
const listeners = new Set<() => void>();
const EMPTY: SpendInputs = {};

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setSpendInput(cardId: string, category: Category, value: number | null) {
  state = {
    ...state,
    byCard: {
      ...state.byCard,
      [cardId]: { ...state.byCard[cardId], [category]: value },
    },
  };
  emit();
}

export function setTimeframe(timeframe: Timeframe) {
  state = { ...state, timeframe };
  emit();
}

export function useSpendInputs(cardId: string): SpendInputs {
  return useSyncExternalStore(
    subscribe,
    () => state.byCard[cardId] ?? EMPTY,
    () => EMPTY,
  );
}

export function useTimeframe(): Timeframe {
  return useSyncExternalStore(
    subscribe,
    () => state.timeframe,
    () => "month" as const,
  );
}

/** Drops blanks, for the engine. */
export function toSpend(inputs: SpendInputs): Partial<Record<Category, number>> {
  const out: Partial<Record<Category, number>> = {};
  for (const [k, v] of Object.entries(inputs)) {
    if (typeof v === "number" && v > 0) out[k as Category] = v;
  }
  return out;
}
