import { DEFAULT_VALUATIONS } from "@/data/cards.seed";
import type { Valuations } from "@/lib/calculators/engine";

/**
 * The seed's cents-per-point values as a plain map.
 *
 * Signed-in surfaces read the user's own values through `useValuations()`.
 * This is for the public landing page, where there is no user yet and the
 * defaults are the only honest answer.
 */
export const DEFAULT_VALUATION_MAP: Valuations = Object.fromEntries(
  DEFAULT_VALUATIONS.map((v) => [v.program, v.centsPerPoint]),
) as Valuations;
