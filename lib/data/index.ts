"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Card, PointBalance, Program, UserCard } from "@/data/types";
import { CARDS, getCard } from "@/data/cards.seed";
import { cardLimit, type Plan } from "@/lib/plan";
import { emptyState, type CreditUsage, type Persisted } from "@/lib/data/schema";
import * as remote from "@/lib/data/remote";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/data/supabase";
import {
  closeOffer,
  getAccount,
  getNotice,
  getOffer,
  getRemote,
  getServerSnapshot,
  getSnapshot,
  isLoaded,
  mutate,
  reloadAccount,
  storedLocal,
  subscribe,
  switchToLocal,
  type Account,
  type ImportOffer,
  type Notice,
} from "@/lib/data/store";

/**
 * The only data API the app uses. Pages and components never touch storage
 * or Supabase.
 *
 * Reads are hooks over an external store, so a change in one tab or one
 * component reaches every other. Writes are async, and every call site
 * awaiting them is what let Phase 6 add Supabase inside this directory
 * without touching a page.
 */

export type WalletEntry = { card: Card; userCard: UserCard };
export type { Account, ImportOffer, Notice };

/** Whether accounts are switched on for this build at all. */
export const ACCOUNTS_ENABLED = SUPABASE_CONFIGURED;

function useData() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * True until the state has been read: browser storage on the first frame,
 * or the account after a network round trip. The server cannot know either,
 * so the first paint is a skeleton rather than a guess that would be
 * replaced.
 */
export function useIsLoading(): boolean {
  return !useSyncExternalStore(
    subscribe,
    () => isLoaded(),
    () => false,
  );
}

/** What the shell must tell the user about saving, or null. */
export function useNotice(): Notice | null {
  return useSyncExternalStore(subscribe, getNotice, () => null);
}

/** The signed-in account, or null for the demo user. */
export function useAccount(): Account | null {
  return useSyncExternalStore(subscribe, getAccount, () => null);
}

/** The first-sign-in offer to copy this browser's wallet in, or null. */
export function useImportOffer(): ImportOffer | null {
  return useSyncExternalStore(subscribe, getOffer, () => null);
}

/* --- reads ---------------------------------------------------------------- */

function allEntries(data: Persisted): WalletEntry[] {
  return [...data.userCards]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((userCard) => ({ userCard, card: getCard(userCard.cardId) }))
    .filter((e): e is WalletEntry => Boolean(e.card));
}

/**
 * The cards the plan shows, in the user's order. Cards beyond the plan's
 * limit (Premium ended with more than the free limit saved) are kept but
 * left out here, so every screen agrees on which cards count. They come
 * back the moment Premium does. Memoised per snapshot so the array keeps
 * its identity between renders.
 */
const visibleMemo = new WeakMap<Persisted, WalletEntry[]>();
export function useWallet(): WalletEntry[] {
  const data = useData();
  let visible = visibleMemo.get(data);
  if (!visible) {
    visible = allEntries(data).slice(0, cardLimit(data.profile.plan));
    visibleMemo.set(data, visible);
  }
  return visible;
}

/** Every saved card, hidden or not. For the export, which must be complete. */
export function useWalletIncludingHidden(): WalletEntry[] {
  const data = useData();
  return useMemo(() => allEntries(data), [data]);
}

/** How many saved cards the plan is hiding. */
export function useHiddenCardCount(): number {
  const data = useData();
  return Math.max(0, data.userCards.length - cardLimit(data.profile.plan));
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
  let added: UserCard | null = null;
  await mutate(
    (s) => {
      if (s.userCards.some((c) => c.cardId === cardId)) return s;
      const now = new Date();
      added = {
        cardId,
        openedOn: now.toISOString().slice(0, 10),
        anniversaryMonth: now.getMonth() + 1,
        sortOrder: s.userCards.length,
      };
      return { ...s, userCards: [...s.userCards, added] };
    },
    (r) => (added ? remote.addCard(r, added) : Promise.resolve()),
  );
}

export async function removeCard(cardId: string): Promise<void> {
  const creditIds = new Set(getCard(cardId)?.credits.map((c) => c.id));
  await mutate(
    (s) => ({
      ...s,
      userCards: s.userCards
        .filter((c) => c.cardId !== cardId)
        // Close the gap so sortOrder stays contiguous.
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c, i) => ({ ...c, sortOrder: i })),
      // A removed card's credit history goes with it, as the database
      // cascade does, so both modes behave the same.
      creditUsage: Object.fromEntries(
        Object.entries(s.creditUsage).filter(([id]) => !creditIds.has(id)),
      ),
    }),
    async (r, before, after) => {
      await remote.removeCard(r, cardId);
      await remote.saveOrder(r, before.userCards, after.userCards);
    },
  );
}

/** Moves the card at `from` to `to`, renumbering the rest. */
export async function reorderCards(from: number, to: number): Promise<void> {
  await mutate(
    (s) => {
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
    },
    (r, before, after) => remote.saveOrder(r, before.userCards, after.userCards),
  );
}

export async function setNickname(
  cardId: string,
  nickname: string,
): Promise<void> {
  const trimmed = nickname.trim();
  const value = trimmed === "" ? undefined : trimmed;
  await mutate(
    (s) => ({
      ...s,
      userCards: s.userCards.map((c) =>
        c.cardId === cardId ? { ...c, nickname: value } : c,
      ),
    }),
    (r) => remote.setNickname(r, cardId, value),
  );
}

/**
 * The dev toggle in Settings. Demo user only: a signed-in account's plan is
 * set by the server, and the database refuses any change from here.
 */
export async function setPlan(plan: Plan): Promise<void> {
  if (getAccount()) return;
  await mutate((s) => ({ ...s, profile: { ...s.profile, plan } }));
}

/**
 * Records dollars used against one period of one credit.
 *
 * The caller passes the period key because working it out needs the credit's
 * reset basis and the card's anniversary month, which belong to the Tracker's
 * view of a credit, not to storage. lib/credits/reset.ts produces it.
 */
export async function setCreditUsed(
  creditId: string,
  key: string,
  amount: number,
): Promise<void> {
  await mutate(
    (s) => {
      const row = { ...(s.creditUsage[creditId] ?? {}) };
      if (amount <= 0) {
        delete row[key];
      } else {
        row[key] = amount;
      }
      return { ...s, creditUsage: { ...s.creditUsage, [creditId]: row } };
    },
    (r, before) => remote.setCreditUsed(r, before.userCards, creditId, key, amount),
  );
}

export async function setPointBalance(
  program: Program,
  balance: number,
): Promise<void> {
  await mutate(
    (s) => {
      const updatedAt = new Date().toISOString().slice(0, 10);
      const existing = s.pointBalances.find((b) => b.program === program);
      const pointBalances = existing
        ? s.pointBalances.map((b) =>
            b.program === program ? { ...b, balance, updatedAt } : b,
          )
        : [...s.pointBalances, { program, balance, updatedAt }];
      return { ...s, pointBalances };
    },
    (r) => remote.setPointBalance(r, program, balance),
  );
}

export async function setValuation(
  program: Program,
  centsPerPoint: number,
): Promise<void> {
  await mutate(
    (s) => {
      const existing = s.valuations.find((v) => v.program === program);
      const valuations = existing
        ? s.valuations.map((v) =>
            v.program === program ? { ...v, centsPerPoint } : v,
          )
        : [...s.valuations, { program, centsPerPoint }];
      return { ...s, valuations };
    },
    (r) => remote.setValuation(r, program, centsPerPoint),
  );
}

/**
 * Empties the wallet, balances and valuations. Signed in, the account itself
 * remains and keeps its plan; deleteAccount removes the account too.
 */
export async function deleteEverything(): Promise<void> {
  await mutate(
    (s) => ({ ...emptyState(), profile: s.profile }),
    (r) => remote.clearAccount(r),
  );
}

/* --- accounts ------------------------------------------------------------- */

/** Where sign-in returns to. Must be in Supabase's Redirect URLs. */
function callbackUrl() {
  return `${window.location.origin}/auth/callback`;
}

/**
 * Starts downloading the Supabase client without using it, so a sign-in
 * button pressed a moment later does not wait on it. For the sign-in page
 * only; every other page leaves signed-out visitors without it.
 */
export function prepareSignIn(): void {
  void supabase();
}

/** Sends the browser to Google. Resolves only if it could not. */
export async function signInWithGoogle(): Promise<string | null> {
  const db = await supabase();
  if (!db) return "Accounts are not switched on in this build.";
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl() },
  });
  return error ? "Google sign-in could not start. Try again in a moment." : null;
}

/** Emails a one-time sign-in link. Returns an error to show, or null. */
export async function sendSignInLink(email: string): Promise<string | null> {
  const db = await supabase();
  if (!db) return "Accounts are not switched on in this build.";
  const { error } = await db.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: callbackUrl() },
  });
  if (!error) return null;
  if (error.status === 429) {
    return "Too many links were sent just now. Wait a few minutes, then try again.";
  }
  return "That link could not be sent. Check the address and try again.";
}

export async function signOut(): Promise<void> {
  await (await supabase())?.auth.signOut();
  switchToLocal();
}

/**
 * Copies this browser's wallet into the signed-in account, up to the plan's
 * card limit. Returns how many cards came across and how many did not fit.
 */
export async function importBrowserWallet(): Promise<
  { imported: number; skipped: number } | { error: string }
> {
  const r = getRemote();
  const local = storedLocal();
  if (!r || !local) return { error: "There is nothing in this browser to bring over." };
  try {
    const plan = getSnapshot().profile.plan;
    const result = await remote.importState(r, local, cardLimit(plan));
    closeOffer(true);
    await reloadAccount();
    return result;
  } catch (e) {
    // A partial import is still worth showing; reload whatever landed.
    await reloadAccount();
    return {
      error:
        e instanceof remote.SyncError
          ? e.message
          : "The import did not finish. Check your connection and try again.",
    };
  }
}

/** Declines the import for this account, in this browser. */
export function declineImport() {
  closeOffer(true);
}

/**
 * Deletes the account and everything in it. The database removes every row
 * by cascade when the auth user goes, which only the server can do, so this
 * asks the server route to do it on the signed-in user's behalf.
 */
export async function deleteAccount(): Promise<string | null> {
  const token = await accessToken();
  if (!token) return "You are not signed in.";

  const res = await fetch("/api/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 502) {
    return "Your Premium subscription could not be cancelled just now, so the account was kept. Nothing was removed. Try again in a moment.";
  }
  if (!res.ok) {
    return "Your account could not be deleted just now. Nothing was removed. Try again in a moment.";
  }
  await signOut();
  return null;
}

/* --- billing -------------------------------------------------------------- */

/** The signed-in user's access token, for the server routes. */
async function accessToken(): Promise<string | null> {
  const db = await supabase();
  const { data } = (await db?.auth.getSession()) ?? { data: { session: null } };
  return data.session?.access_token ?? null;
}

const BILLING_ERRORS: Record<string, string> = {
  already_premium: "This account already has Premium. Reload the page to see it.",
  not_configured: "Payments are not switched on yet.",
  no_price: "Payments are not switched on yet.",
  no_customer: "There is no billing on this account yet.",
};

/**
 * Asks the server for a Stripe page (Checkout or the Customer Portal) and
 * sends the browser there. Resolves only if it could not, with the reason.
 */
async function goToStripe(path: "checkout" | "portal"): Promise<string> {
  const token = await accessToken();
  if (!token) return "Sign in first, so Premium has an account to belong to.";
  try {
    const res = await fetch(`/api/billing/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && body.url) {
      window.location.assign(body.url);
      // Never resolves on success: the page is leaving.
      return new Promise<string>(() => {});
    }
    return (
      (body.error && BILLING_ERRORS[body.error]) ??
      "Stripe could not be reached just now. Nothing was charged. Try again in a moment."
    );
  } catch {
    return "Stripe could not be reached just now. Check your connection and try again.";
  }
}

/** Sends the signed-in user to Stripe Checkout for Premium. */
export function startCheckout(): Promise<string> {
  return goToStripe("checkout");
}

/** Sends the signed-in user to Stripe's portal to cancel or change their card. */
export function openBillingPortal(): Promise<string> {
  return goToStripe("portal");
}

/**
 * After Checkout, Stripe tells the server by webhook, which usually lands
 * within a few seconds of the browser coming back. Re-reads the account
 * until the plan shows Premium, or gives up after about 20 seconds.
 */
export async function waitForPremium(): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    await reloadAccount();
    if (getSnapshot().profile.plan === "premium") return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

/** Re-reads the account, after coming back from the billing portal. */
export async function refreshAccount(): Promise<void> {
  await reloadAccount();
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
