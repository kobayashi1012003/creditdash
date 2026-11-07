import type { Card } from "@/data/types";

/**
 * Which catalog cards are due for a fresh check against their issuer.
 *
 * Dependency-free (the type import is erased) so `node --test` runs its
 * tests directly. The admin page renders this; nothing else depends on it.
 */

/** A card unchecked for this long is flagged. Issuers change terms often. */
export const STALE_AFTER_DAYS = 90;

/**
 * Cards with a big fee are refreshed most often (Platinum, Sapphire
 * Reserve, Bilt), and a wrong credit on them costs the most, so they are
 * due sooner.
 */
export const HIGH_FEE = 400;
export const HIGH_FEE_STALE_AFTER_DAYS = 60;

/** Days after its last check that a card is due again. */
export function staleAfterDays(card: Pick<Card, "annualFee">): number {
  return card.annualFee >= HIGH_FEE ? HIGH_FEE_STALE_AFTER_DAYS : STALE_AFTER_DAYS;
}

export type ReviewRow = {
  card: Card;
  /** Whole days since `lastVerified`, never negative. */
  daysSince: number;
  stale: boolean;
  /** The issuer terms page it was checked against, if one is recorded. */
  source: string | null;
  /** Limited-time credits whose end date has passed: due for removal. */
  ended: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, to: Date): number {
  const [y, m, d] = fromIso.split("-").map(Number);
  const from = Date.UTC(y, m - 1, d);
  const today = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.max(0, Math.round((today - from) / DAY_MS));
}

/** True once the whole of `endsOn` (an ISO date, its last day) is past. */
export function endedBy(endsOn: string, today = new Date()): boolean {
  const [y, m, d] = endsOn.split("-").map(Number);
  return today.getTime() >= new Date(y, m - 1, d + 1).getTime();
}

/** Every card, stalest first, then by name. */
export function reviewCatalog(cards: Card[], today = new Date()): ReviewRow[] {
  return cards
    .map((card) => {
      const daysSince = daysBetween(card.lastVerified, today);
      const ended = (card.credits ?? [])
        .filter((c) => c.endsOn && endedBy(c.endsOn, today))
        .map((c) => c.name);
      return {
        card,
        daysSince,
        stale: daysSince >= staleAfterDays(card) || ended.length > 0,
        source: card.sourceUrl ?? null,
        ended,
      };
    })
    .sort((a, b) => b.daysSince - a.daysSince || a.card.name.localeCompare(b.card.name));
}
