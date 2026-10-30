import type { Program, Valuation } from "@/data/types";
import { DEFAULT_CPP } from "@/data/programs";
import type { Valuations } from "@/lib/calculators/engine";

/**
 * The one place a program's value is decided: the user's own number if they
 * set one, else CreditDash's default. Every surface that states a dollar
 * figure reads through here (via `useValuations()` and `useValuation()` in
 * lib/data), so the Points page and the calculators cannot disagree.
 */

export type ValuationSource = "yours" | "default";

export type ResolvedValuation = {
  cpp: number;
  source: ValuationSource;
  /** CreditDash's default, for "Use default" and for comparison. */
  defaultCpp: number;
};

export function valuationOf(
  program: Program,
  userValues: readonly Valuation[],
): ResolvedValuation {
  const own = userValues.find((v) => v.program === program);
  const defaultCpp = DEFAULT_CPP[program];
  return own
    ? { cpp: own.centsPerPoint, source: "yours", defaultCpp }
    : { cpp: defaultCpp, source: "default", defaultCpp };
}

/** Defaults with the user's values laid over them, as a plain map. */
export function mergeValuations(userValues: readonly Valuation[]): Valuations {
  const out: Valuations = { ...DEFAULT_CPP };
  for (const v of userValues) out[v.program] = v.centsPerPoint;
  return out;
}

/**
 * The defaults alone. For the public landing page, where there is no user
 * yet and the defaults are the only honest answer.
 */
export const DEFAULT_VALUATION_MAP: Valuations = { ...DEFAULT_CPP };
