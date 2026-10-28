"use client";

import { useSyncExternalStore } from "react";
import type { Card, PointBalance, Program, UserCard } from "@/data/types";
import { CARDS, getCard } from "@/data/cards.seed";
import type { Plan } from "@/lib/plan";
import { periodKey, type CreditUsage } from "@/lib/data/schema";
import {
  clearAll,
  getServerSnapshot,
  getSnapshot,
  isLoaded,
  mutate,
  subscribe,
} from "@/lib/data/store";

/**
 * The only data API the app uses. Pages and components never touch storage.
 *
 * Reads are hooks over an external store, so a change in one tab or one
 * component reaches every other. Writes are async because Supabase will be,
 * and that is the whole point of the indirection.
 */

export type WalletEntry = { card: Card; userCard: UserCard };

function useData() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * True until browser storage has been read. The server cannot know what is
 * stored, so the first paint is a skeleton rather than a guess that would
 * then be replaced.
 */
export function useIsLoading(): boolean {
  return !useSyncExternalStore(
    subscribe,
    () => isLoaded(),
    () => false,
  );
}

/* --- reads ---------------------------------------------------------------- */

export function useWallet(): WalletEntry[] {
  const data = useData();
  return [...data.userCards]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((userCard) => ({ userCard, card: getCard(userCard.cardId) }))
    .filter((e): e is WalletEntry => Boolean(e.card));
}

export function usePlan(): Plan {
  return useData().profile.plan;
}

export function useCreditUsage(): CreditUsage {
  return useData().creditUsage;
}

export function usePointBalances(): PointBalance[] {
  return useData().pointBalances;
}

/** Cents per point, user override falling back to the seed default. */
export function useValuations(): Record<string, number> {
  const data = useData();
  return Object.fromEntries(
    data.valuations.map((v) => [v.program, v.centsPerPoint]),
  );
}

/** Catalog cards not already in the wallet, optionally filtered by a query. */
export function useAddableCards(query = ""): Card[] {
  const owned = new Set(useData().userCards.map((c) => c.cardId));
  const q = query.trim().toLowerCase();
  return CARDS.filter((c) => {
    if (owned.has(c.id)) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.issuer.toLowerCase().includes(q)
    );
  });
}

/* --- writes --------------------------------------------------------------- */

export async function addCard(cardId: string): Promise<void> {
  await mutate((s) => {
    if (s.userCards.some((c) => c.cardId === cardId)) return s;
    const now = new Date();
    const next: UserCard = {
      cardId,
      openedOn: now.toISOString().slice(0, 10),
      anniversaryMonth: now.getMonth() + 1,
      sortOrder: s.userCards.length,
    };
    return { ...s, userCards: [...s.userCards, next] };
  });
}

export async function removeCard(cardId: string): Promise<void> {
  await mutate((s) => ({
    ...s,
    userCards: s.userCards
      .filter((c) => c.cardId !== cardId)
      // Close the gap so sortOrder stays contiguous.
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c, i) => ({ ...c, sortOrder: i })),
  }));
}

/** Moves the card at `from` to `to`, renumbering the rest. */
export async function reorderCards(from: number, to: number): Promise<void> {
  await mutate((s) => {
    const ordered = [...s.userCards].sort((a, b) => a.sortOrder - b.sortOrder);
    if (from < 0 || to < 0 || from >= ordered.length || to >= ordered.length) {
      return s;
    }
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    return {
      ...s,
      userCards: ordered.map((c, i) => ({ ...c, sortOrder: i })),
    };
  });
}

export async function setNickname(
  cardId: string,
  nickname: string,
): Promise<void> {
  const trimmed = nickname.trim();
  await mutate((s) => ({
    ...s,
    userCards: s.userCards.map((c) =>
      c.cardId === cardId
        ? { ...c, nickname: trimmed === "" ? undefined : trimmed }
        : c,
    ),
  }));
}

export async function setPlan(plan: Plan): Promise<void> {
  await mutate((s) => ({ ...s, profile: { ...s.profile, plan } }));
}

/** Records dollars used against one period of one credit. */
export async function setCreditUsed(
  creditId: string,
  period: "monthly" | "quarterly" | "semiannual" | "annual",
  slot: number,
  amount: number,
): Promise<void> {
  const key = periodKey(period, slot);
  await mutate((s) => {
    const row = { ...(s.creditUsage[creditId] ?? {}) };
    if (amount <= 0) {
      delete row[key];
    } else {
      row[key] = amount;
    }
    return { ...s, creditUsage: { ...s.creditUsage, [creditId]: row } };
  });
}

export async function setPointBalance(
  program: Program,
  balance: number,
): Promise<void> {
  await mutate((s) => {
    const updatedAt = new Date().toISOString().slice(0, 10);
    const existing = s.pointBalances.find((b) => b.program === program);
    const pointBalances = existing
      ? s.pointBalances.map((b) =>
          b.program === program ? { ...b, balance, updatedAt } : b,
        )
      : [...s.pointBalances, { program, balance, updatedAt }];
    return { ...s, pointBalances };
  });
}

export async function setValuation(
  program: Program,
  centsPerPoint: number,
): Promise<void> {
  await mutate((s) => {
    const existing = s.valuations.find((v) => v.program === program);
    const valuations = existing
      ? s.valuations.map((v) =>
          v.program === program ? { ...v, centsPerPoint } : v,
        )
      : [...s.valuations, { program, centsPerPoint }];
    return { ...s, valuations };
  });
}

export async function deleteEverything(): Promise<void> {
  await clearAll();
}

/** CSV of the wallet, for the Settings export. */
export function walletToCsv(entries: WalletEntry[]): string {
  const rows = [
    ["card", "issuer", "nickname", "annual_fee", "program", "opened_on"],
    ...entries.map(({ card, userCard }) => [
      card.name,
      card.issuer,
      userCard.nickname ?? "",
      String(card.annualFee),
      card.program,
      userCard.openedOn,
    ]),
  ];
  return rows
    .map((r) => r.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
