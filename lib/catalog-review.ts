import type { Card } from "@/data/types";

/**
 * Which catalog cards are due for a fresh check against their issuer.
 *
 * Dependency-free (the type import is erased) so `node --test` runs its
 * tests directly. The admin page renders this; nothing else depends on it.
 */

/** A card unchecked for this long is flagged. Issuers change terms often. */
export const STALE_AFTER_DAYS = 90;

export type ReviewRow = {
  card: Card;
  /** Whole days since `lastVerified`, never negative. */
  daysSince: number;
  stale: boolean;
  /** The issuer terms page it was checked against, if one is recorded. */
  source: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, to: Date): number {
  const [y, m, d] = fromIso.split("-").map(Number);
  const from = Date.UTC(y, m - 1, d);
  const today = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.max(0, Math.round((today - from) / DAY_MS));
}

/** Every card, stalest first, then by name. */
export function reviewCatalog(cards: Card[], today = new Date()): ReviewRow[] {
  return cards
    .map((card) => {
      const daysSince = daysBetween(card.lastVerified, today);
      return {
        card,
        daysSince,
        stale: daysSince >= STALE_AFTER_DAYS,
        source: card.sourceUrl ?? null,
      };
    })
    .sort((a, b) => b.daysSince - a.daysSince || a.card.name.localeCompare(b.card.name));
}
