import { CARDS } from "@/data/cards.seed";
import type { Card } from "@/data/types";

/**
 * Catalog lookups. The catalog is public reference data, not user data, so
 * this is safe to call from a server component.
 *
 * Anything about the cards a person actually owns goes through lib/data
 * instead. There is deliberately no function here that reads a wallet.
 */
export function getCardsById(ids: string[]): Card[] {
  return ids
    .map((id) => CARDS.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));
}
