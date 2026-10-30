"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PointBalance, Program, UserCard } from "@/data/types";
import { getCard } from "@/data/cards.seed";
import { DEFAULT_CPP, isProgram } from "@/data/programs";
import { SCHEMA_VERSION, type CreditUsage, type Persisted } from "@/lib/data/schema";

/**
 * The Supabase side of lib/data: reading an account into the same Persisted
 * shape browser storage uses, and one function per kind of write.
 *
 * Every query names its user_id even though Row Level Security would refuse
 * anything else. RLS is the guarantee; the filter keeps each query's intent
 * readable and lets Postgres use the index.
 */

export type Remote = {
  db: SupabaseClient;
  userId: string;
  /** cardId to user_cards.id. The UI knows cards by catalog id only. */
  rowIds: Map<string, string>;
};

/** A write the database refused, worded for the person who made it. */
export class SyncError extends Error {}

function check(error: { message: string; hint?: string | null } | null) {
  if (!error) return;
  if (error.hint === "card_limit") {
    throw new SyncError(
      "The free plan holds 2 cards, so that card was not added. Remove one first, or move to Premium.",
    );
  }
  throw new SyncError(
    "That change did not save to your account. Check your connection and try again.",
  );
}

export async function loadAccount(db: SupabaseClient, userId: string) {
  const [profile, cards, usage, balances, valuations, subs] = await Promise.all([
    // "*" rather than naming premium_gift, so a database that has not had
    // that migration yet still loads the account.
    db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    db
      .from("user_cards")
      .select("id, card_id, nickname, opened_on, anniversary_month, sort_order")
      .eq("user_id", userId)
      .order("sort_order"),
    db
      .from("credit_usage")
      .select("credit_id, period_key, amount_used")
      .eq("user_id", userId),
    db
      .from("point_balances")
      .select("program, balance, updated_at")
      .eq("user_id", userId),
    db.from("valuations").select("program, cents_per_point").eq("user_id", userId),
    db
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .order("current_period_end", { ascending: false, nullsFirst: false })
      .limit(1),
  ]);
  for (const r of [profile, cards, usage, balances, valuations]) check(r.error);

  const rowIds = new Map<string, string>();
  const userCards: UserCard[] = (cards.data ?? []).map((c, i) => {
    rowIds.set(c.card_id, c.id);
    return {
      cardId: c.card_id,
      nickname: c.nickname ?? undefined,
      openedOn: c.opened_on,
      anniversaryMonth: c.anniversary_month,
      // Renumbered on read, so a gap left by a failed write cannot leak into
      // the drag-and-drop indices.
      sortOrder: i,
    };
  });

  const creditUsage: CreditUsage = {};
  for (const u of usage.data ?? []) {
    (creditUsage[u.credit_id] ??= {})[u.period_key] = Number(u.amount_used);
  }

  // A row for a program this build does not know is skipped, not shown
  // with no name.
  const pointBalances: PointBalance[] = (balances.data ?? [])
    .filter((b) => isProgram(b.program))
    .map((b) => ({
      program: b.program as Program,
      balance: Number(b.balance),
      updatedAt: String(b.updated_at).slice(0, 10),
    }));

  // The table holds the user's own values only, as browser storage now does;
  // defaults are filled in at read time by lib/valuations.ts.
  const ownValuations = (valuations.data ?? [])
    .filter((v) => isProgram(v.program))
    .map((v) => ({
      program: v.program as Program,
      centsPerPoint: Number(v.cents_per_point),
    }));
  const state: Persisted = {
    version: SCHEMA_VERSION,
    profile: { plan: profile.data?.plan === "premium" ? "premium" : "free" },
    userCards,
    creditUsage,
    pointBalances,
    valuations: ownValuations,
  };
  // Billing is shown, never relied on: a failed read leaves Settings
  // without a renewal date, not the account unloadable.
  const sub = subs.error ? null : subs.data?.[0];
  const billing: Billing | null = sub
    ? {
        status: sub.status,
        periodEnd: sub.current_period_end ? String(sub.current_period_end).slice(0, 10) : null,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      }
    : null;
  const gifted = profile.data?.premium_gift === true;
  return { state, rowIds, billing, gifted };
}

/** The latest Stripe subscription, as Settings shows it. Written by the webhook only. */
export type Billing = {
  status: string;
  /** ISO date Premium renews or, when cancelling, ends. */
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

/* --- writes --------------------------------------------------------------- */

export async function addCard(r: Remote, card: UserCard) {
  const { data, error } = await r.db
    .from("user_cards")
    .insert({
      user_id: r.userId,
      card_id: card.cardId,
      opened_on: card.openedOn,
      anniversary_month: card.anniversaryMonth,
      sort_order: card.sortOrder,
    })
    .select("id")
    .single();
  check(error);
  r.rowIds.set(card.cardId, data!.id);
}

export async function removeCard(r: Remote, cardId: string) {
  const id = r.rowIds.get(cardId);
  if (!id) return;
  // credit_usage rows go with it, by foreign key cascade.
  const { error } = await r.db.from("user_cards").delete().eq("id", id);
  check(error);
  r.rowIds.delete(cardId);
}

/** Writes sort_order for every card whose position changed. */
export async function saveOrder(r: Remote, before: UserCard[], after: UserCard[]) {
  const was = new Map(before.map((c) => [c.cardId, c.sortOrder]));
  const changed = after.filter((c) => was.get(c.cardId) !== c.sortOrder);
  const results = await Promise.all(
    changed.map((c) =>
      r.db
        .from("user_cards")
        .update({ sort_order: c.sortOrder })
        .eq("id", r.rowIds.get(c.cardId) ?? ""),
    ),
  );
  for (const res of results) check(res.error);
}

export async function setNickname(r: Remote, cardId: string, nickname: string | undefined) {
  const { error } = await r.db
    .from("user_cards")
    .update({ nickname: nickname ?? null })
    .eq("id", r.rowIds.get(cardId) ?? "");
  check(error);
}

/** The card a credit belongs to, among the cards this user holds. */
function cardForCredit(cards: UserCard[], creditId: string) {
  return cards.find((c) =>
    getCard(c.cardId)?.credits.some((credit) => credit.id === creditId),
  );
}

export async function setCreditUsed(
  r: Remote,
  cards: UserCard[],
  creditId: string,
  key: string,
  amount: number,
) {
  const owner = cardForCredit(cards, creditId);
  const userCardId = owner && r.rowIds.get(owner.cardId);
  if (!userCardId) return;

  const { error } =
    amount <= 0
      ? await r.db
          .from("credit_usage")
          .delete()
          .match({ user_card_id: userCardId, credit_id: creditId, period_key: key })
      : await r.db.from("credit_usage").upsert(
          {
            user_id: r.userId,
            user_card_id: userCardId,
            credit_id: creditId,
            period_key: key,
            amount_used: amount,
          },
          { onConflict: "user_card_id,credit_id,period_key" },
        );
  check(error);
}

export async function setPointBalance(r: Remote, program: Program, balance: number) {
  const { error } = await r.db
    .from("point_balances")
    .upsert({ user_id: r.userId, program, balance }, { onConflict: "user_id,program" });
  check(error);
}

export async function setValuation(r: Remote, program: Program, centsPerPoint: number) {
  const { error } = await r.db
    .from("valuations")
    .upsert(
      { user_id: r.userId, program, cents_per_point: centsPerPoint },
      { onConflict: "user_id,program" },
    );
  check(error);
}

/** Stops tracking a program: its balance row goes, its valuation stays. */
export async function deletePointBalance(r: Remote, program: Program) {
  const { error } = await r.db
    .from("point_balances")
    .delete()
    .eq("user_id", r.userId)
    .eq("program", program);
  check(error);
}

/** Back to CreditDash's default. */
export async function deleteValuation(r: Remote, program: Program) {
  const { error } = await r.db
    .from("valuations")
    .delete()
    .eq("user_id", r.userId)
    .eq("program", program);
  check(error);
}

/** Empties the account's data. The account itself stays; see deleteAccount. */
export async function clearAccount(r: Remote) {
  const results = await Promise.all([
    r.db.from("user_cards").delete().eq("user_id", r.userId),
    r.db.from("point_balances").delete().eq("user_id", r.userId),
    r.db.from("valuations").delete().eq("user_id", r.userId),
  ]);
  for (const res of results) check(res.error);
  r.rowIds.clear();
}

/**
 * Copies a browser wallet into an empty account. Cards beyond the plan's
 * limit are left out rather than failing the whole import, and the caller
 * says so. Valuations are copied only where they differ from the defaults.
 */
export async function importState(r: Remote, local: Persisted, limit: number) {
  const cards = [...local.userCards]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit);

  if (cards.length > 0) {
    const { data, error } = await r.db
      .from("user_cards")
      .insert(
        cards.map((c, i) => ({
          user_id: r.userId,
          card_id: c.cardId,
          nickname: c.nickname ?? null,
          opened_on: c.openedOn,
          anniversary_month: c.anniversaryMonth,
          sort_order: i,
        })),
      )
      .select("id, card_id");
    check(error);
    for (const row of data ?? []) r.rowIds.set(row.card_id, row.id);
  }

  const usageRows = Object.entries(local.creditUsage).flatMap(([creditId, row]) => {
    const owner = cardForCredit(cards, creditId);
    const userCardId = owner && r.rowIds.get(owner.cardId);
    if (!userCardId) return [];
    return Object.entries(row)
      .filter(([, amount]) => amount > 0)
      .map(([period_key, amount_used]) => ({
        user_id: r.userId,
        user_card_id: userCardId,
        credit_id: creditId,
        period_key,
        amount_used,
      }));
  });

  const valuationRows = local.valuations
    .filter((v) => DEFAULT_CPP[v.program] !== v.centsPerPoint)
    .map((v) => ({ user_id: r.userId, program: v.program, cents_per_point: v.centsPerPoint }));

  const balanceRows = local.pointBalances.map((b) => ({
    user_id: r.userId,
    program: b.program,
    balance: b.balance,
  }));

  const results = await Promise.all([
    usageRows.length ? r.db.from("credit_usage").insert(usageRows) : null,
    balanceRows.length
      ? r.db.from("point_balances").upsert(balanceRows, { onConflict: "user_id,program" })
      : null,
    valuationRows.length
      ? r.db.from("valuations").upsert(valuationRows, { onConflict: "user_id,program" })
      : null,
  ]);
  for (const res of results) if (res) check(res.error);

  return { imported: cards.length, skipped: local.userCards.length - cards.length };
}
