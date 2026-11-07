"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Card, PointBalance, Program, TrackerPrefs, UserCard } from "@/data/types";
import { CARDS, getCard } from "@/data/cards.seed";
import { cardLimit, hasFeature, type BillingInterval, type Plan } from "@/lib/plan";
import { autoFillDue, localDate, parseLocalDate } from "@/lib/credits/autofill";
import { windowOffered } from "@/lib/credits";
import { forgetSessionFlags } from "@/lib/use-stored-flag";
import {
  mergeValuations,
  valuationOf,
  type ResolvedValuation,
} from "@/lib/valuations";
import type { Valuations } from "@/lib/calculators/engine";
import { emptyState, MAX_ASSUMED, type CreditUsage, type Persisted } from "@/lib/data/schema";
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

/**
 * Cents per point for every program: the user's own value where they set
 * one, CreditDash's default everywhere else.
 */
export function useValuations(): Valuations {
  const own = useData().valuations;
  return useMemo(() => mergeValuations(own), [own]);
}

/** One program's value and where it came from, for the "Your valuation" label. */
export function useValuation(program: Program): ResolvedValuation {
  return valuationOf(program, useData().valuations);
}

/** Programs being tracked on the Points page, in the order they were added. */
export function useTrackedPrograms(): Program[] {
  const balances = useData().pointBalances;
  return useMemo(() => balances.map((b) => b.program), [balances]);
}

/**
 * Cards matching a name or issuer, leaving out the given ids. Searches the
 * catalog with data by default; the Wallet's add sheet passes ALL_CARDS so
 * cards added before their data can be picked too.
 */
export function searchCatalog(
  query: string,
  exclude: ReadonlySet<string>,
  cards: readonly Card[] = CARDS,
): Card[] {
  const q = query.trim().toLowerCase();
  return cards.filter((c) => {
    if (exclude.has(c.id)) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.issuer.toLowerCase().includes(q)
    );
  });
}

/** Ids of every saved card, hidden or not, so nothing offers one twice. */
export function useOwnedCardIds(): ReadonlySet<string> {
  const data = useData();
  return useMemo(() => new Set(data.userCards.map((c) => c.cardId)), [data]);
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
        // The local date, not toISOString's UTC one, which is already
        // tomorrow on a US evening.
        openedOn: localDate(now),
        anniversaryMonth: now.getMonth() + 1,
        sortOrder: s.userCards.length,
      };
      return { ...s, userCards: [...s.userCards, added] };
    },
    (r) => (added ? remote.addCard(r, added) : Promise.resolve()),
  );
}

/**
 * Adds several cards in the order given. One write per card, so a refusal
 * (the free limit, a lost connection) stops at that card and keeps the
 * ones before it, with the store's usual notice explaining why.
 */
export async function addCards(cardIds: string[]): Promise<void> {
  for (const id of cardIds) {
    const before = getSnapshot().userCards.length;
    await addCard(id);
    if (getSnapshot().userCards.length === before) break;
  }
}

/** Removes several cards. Each one's credit history goes with it. */
export async function removeCards(cardIds: string[]): Promise<void> {
  for (const id of cardIds) await removeCard(id);
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
      // The card is gone from the database now, so a failed renumber must
      // not roll the screen back to showing it. A gap in sort_order is
      // closed on the next load anyway (loadAccount renumbers on read).
      try {
        await remote.saveOrder(r, before.userCards, after.userCards);
      } catch {
        // Order only; nothing the user would lose.
      }
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
 * Sets the date a card was opened, from which its anniversary month and
 * day follow. Anniversary credits then reset on that day (see reset.ts).
 * `date` is a local "YYYY-MM-DD"; anything else is ignored.
 */
export async function setAnniversary(cardId: string, date: string): Promise<void> {
  const d = parseLocalDate(date);
  if (!d) return;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  await mutate(
    (s) => ({
      ...s,
      userCards: s.userCards.map((c) =>
        c.cardId === cardId ? { ...c, openedOn: date, anniversaryMonth: month, anniversaryDay: day } : c,
      ),
    }),
    (r) => remote.setAnniversary(r, cardId, date, month, day),
  );
}

/**
 * Changes how one card's Tracker is arranged. `update` gets the current
 * preferences (an empty object if none) and returns the new ones.
 */
export async function setTrackerPrefs(
  cardId: string,
  update: (prefs: TrackerPrefs) => TrackerPrefs,
): Promise<void> {
  let next: TrackerPrefs = {};
  await mutate(
    (s) => ({
      ...s,
      userCards: s.userCards.map((c) => {
        if (c.cardId !== cardId) return c;
        next = update(c.prefs ?? {});
        return { ...c, prefs: next };
      }),
    }),
    (r) => remote.setPrefs(r, cardId, next),
  );
}

/** Prefs with one credit's assumed keys changed, the entry dropped when empty. */
function withAssumed(
  prefs: TrackerPrefs,
  creditId: string,
  change: (keys: string[]) => string[],
): TrackerPrefs {
  const next = [...new Set(change(prefs.assumed?.[creditId] ?? []))].slice(-MAX_ASSUMED);
  const assumed = { ...prefs.assumed };
  if (next.length > 0) assumed[creditId] = next;
  else delete assumed[creditId];
  const out: TrackerPrefs = { ...prefs, assumed };
  if (Object.keys(assumed).length === 0) delete out.assumed;
  return out;
}

/**
 * The user vouches for periods auto-fill ticked: they stop being "assumed".
 * Also called when the user changes an assumed period by hand, since what
 * they set is then theirs, not a guess.
 */
export async function confirmCredit(cardId: string, creditId: string, keys: string[]): Promise<void> {
  const card = getSnapshot().userCards.find((c) => c.cardId === cardId);
  const current = card?.prefs?.assumed?.[creditId] ?? [];
  if (!keys.some((k) => current.includes(k))) return;
  await setTrackerPrefs(cardId, (p) => withAssumed(p, creditId, (ks) => ks.filter((k) => !keys.includes(k))));
}

let autoFilling = false;

/**
 * Ticks every auto-filled credit whose period has opened since it was last
 * filled, in this device's local time (lib/credits/autofill.ts). Premium
 * only: on Free the choices are kept but nothing is ticked. Safe to call as
 * often as you like; a run already going makes the next call return.
 *
 * Each period is written first and its `through` date moved on after, and
 * only if the write held, so a refused write is retried next time rather
 * than skipped.
 */
export async function runAutoFill(now = new Date()): Promise<void> {
  if (autoFilling || !isLoaded()) return;
  autoFilling = true;
  try {
    const state = getSnapshot();
    if (!hasFeature(state.profile.plan, "autofill")) return;
    for (const userCard of state.userCards) {
      const entries = userCard.prefs?.autofill;
      const card = getCard(userCard.cardId);
      if (!entries || !card) continue;
      for (const [creditId, entry] of Object.entries(entries)) {
        const credit = card.credits.find((c) => c.id === creditId);
        if (!credit) continue;
        const options = {
          period: credit.period,
          resetBasis: credit.resetBasis,
          anniversaryMonth: userCard.anniversaryMonth,
          anniversaryDay: userCard.anniversaryDay,
        };
        const due = autoFillDue(options, entry, now);
        if (due.windows.length === 0) continue;
        let held = true;
        // What this run ticks is a guess until the user confirms it.
        const ticked: string[] = [];
        for (const window of due.windows) {
          // A limited-time credit is not ticked for periods after it ends.
          // `through` still moves on past them, so they are not retried.
          if (!windowOffered(credit, window)) continue;
          const used = getSnapshot().creditUsage[creditId]?.[window.key] ?? 0;
          if (used >= credit.amount) continue;
          await setCreditUsed(creditId, window.key, credit.amount);
          if ((getSnapshot().creditUsage[creditId]?.[window.key] ?? 0) < credit.amount) {
            held = false;
            break;
          }
          ticked.push(window.key);
        }
        if (!held) continue;
        // Read afresh: the user may have switched it off meanwhile.
        const latest = getSnapshot().userCards.find((c) => c.cardId === userCard.cardId)?.prefs?.autofill?.[creditId];
        if (!latest) continue;
        await setTrackerPrefs(userCard.cardId, (p) => ({
          ...withAssumed(p, creditId, (keys) => [...keys, ...ticked]),
          autofill: { ...p.autofill, [creditId]: { ...latest, through: due.through } },
        }));
      }
    }
  } finally {
    autoFilling = false;
  }
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
      // The local day, as addCard records it: in the evening in the US
      // toISOString is already tomorrow.
      const updatedAt = localDate(new Date());
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

/** Back to CreditDash's default for this program. */
export async function clearValuation(program: Program): Promise<void> {
  await mutate(
    (s) => ({
      ...s,
      valuations: s.valuations.filter((v) => v.program !== program),
    }),
    (r) => remote.deleteValuation(r, program),
  );
}

/**
 * Starts tracking programs on the Points page. A tracked program is one with
 * a balance row, so adding one writes a balance of zero; programs already
 * tracked keep their balance.
 */
export async function addPrograms(programs: Program[]): Promise<void> {
  for (const program of programs) {
    if (getSnapshot().pointBalances.some((b) => b.program === program)) continue;
    await setPointBalance(program, 0);
  }
}

/**
 * Stops tracking a program and forgets its balance. Its valuation stays,
 * because the calculators still use it.
 */
export async function removeProgram(program: Program): Promise<void> {
  await mutate(
    (s) => ({
      ...s,
      pointBalances: s.pointBalances.filter((b) => b.program !== program),
    }),
    (r) => remote.deletePointBalance(r, program),
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

/**
 * Emails a one-time sign-in link and, in the same email, a 6-digit code
 * (the template prints `{{ .Token }}`). The link suits a computer; the code
 * suits a phone, where a mail app often opens the link in a different
 * browser, which cannot finish the sign-in. Returns an error, or null.
 */
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

/**
 * Signs in with the code from the sign-in email. On success the session
 * cookie is set in this browser, and the caller loads /wallet so the store
 * starts in account mode exactly as it does after the email link.
 */
export async function verifySignInCode(email: string, code: string): Promise<string | null> {
  const db = await supabase();
  if (!db) return "Accounts are not switched on in this build.";
  const token = code.replace(/\D/g, "");
  if (token.length < 6) return "Type all 6 digits of the code from the email.";
  const { error } = await db.auth.verifyOtp({ email: email.trim(), token, type: "email" });
  if (!error) return null;
  if (error.status === 429) {
    return "Too many tries just now. Wait a few minutes, then send yourself a new code.";
  }
  return "That code is wrong or has expired. Check the latest email, or send a new code.";
}

export async function signOut(): Promise<void> {
  await (await supabase())?.auth.signOut();
  forgetSessionFlags();
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
async function goToStripe(path: "checkout" | "portal", interval?: BillingInterval): Promise<string> {
  const token = await accessToken();
  if (!token) return "Sign in first, so Premium has an account to belong to.";
  try {
    const res = await fetch(`/api/billing/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(interval ? { interval } : {}),
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

/** Sends the signed-in user to Stripe Checkout for Premium, monthly or yearly. */
export function startCheckout(interval: BillingInterval = "month"): Promise<string> {
  return goToStripe("checkout", interval);
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
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

/**
 * One quoted CSV cell. A cell a spreadsheet would read as a formula (it
 * starts with = + - @, a tab or a return) gets a leading apostrophe, so a
 * nickname is always shown as text, never run.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
