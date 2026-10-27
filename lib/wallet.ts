import { CARDS, DEMO_WALLET, getCard } from "@/data/cards.seed";
import type { Card, UserCard } from "@/data/types";

export type WalletEntry = { card: Card; userCard: UserCard };

/**
 * The demo wallet, resolved to full cards and sorted.
 *
 * Phase 2 replaces the body of this with a call into lib/data/, and the
 * pages that use it do not change.
 */
export function getWalletEntries(): WalletEntry[] {
  return [...DEMO_WALLET]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((userCard) => ({ userCard, card: getCard(userCard.cardId) }))
    .filter((e): e is WalletEntry => Boolean(e.card));
}

export function getWalletCards(): Card[] {
  return getWalletEntries().map((e) => e.card);
}

export function getCardsById(ids: string[]): Card[] {
  return ids
    .map((id) => CARDS.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));
}
