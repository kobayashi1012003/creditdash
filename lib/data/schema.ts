import type { PointBalance, UserCard, Valuation } from "@/data/types";
import {
  DEFAULT_VALUATIONS,
  DEMO_BALANCES,
  DEMO_USAGE,
  DEMO_WALLET,
  getCard,
} from "@/data/cards.seed";
import type { Plan } from "@/lib/plan";
import { currentPeriodKey, periodWindows } from "@/lib/credits/reset";

/**
 * The persisted shape, mirroring the tables in creditdash-plan.md section 6
 * so Phase 6 can move each key into its Supabase table without reshaping the
 * data or touching the UI.
 *
 * `version` exists so a later change can migrate rather than discard. Never
 * change the meaning of a field in place; add a version and a migration.
 */

export const STORAGE_KEY = "creditdash:v1";
export const SCHEMA_VERSION = 2;

/**
 * Credit usage keyed the way `credit_usage.period_key` will be: credit id,
 * then a period key, then dollars used.
 *
 * Keys come from lib/credits/reset.ts and differ by reset basis, because
 * "the second quarter" is a different three months for a card opened in
 * November than for one that resets on the calendar.
 */
export type CreditUsage = Record<string, Record<string, number>>;

export type Persisted = {
  version: number;
  /** `profiles` */
  profile: {
    plan: Plan;
  };
  /** `user_cards` */
  userCards: UserCard[];
  /** `credit_usage` */
  creditUsage: CreditUsage;
  /** `point_balances` */
  pointBalances: PointBalance[];
  /** `valuations`, user overrides only */
  valuations: Valuation[];
};

/**
 * What a brand new browser gets. The demo wallet is seeded so the app is not
 * an empty shell on first visit; "Delete everything" in Settings clears to a
 * genuinely empty wallet rather than back to this.
 */
export function seededState(): Persisted {
  const userCards = structuredClone(DEMO_WALLET);
  return {
    version: SCHEMA_VERSION,
    profile: { plan: "premium" },
    userCards,
    creditUsage: seedUsage(userCards),
    pointBalances: structuredClone(DEMO_BALANCES),
    valuations: structuredClone(DEFAULT_VALUATIONS),
  };
}

export function emptyState(): Persisted {
  return {
    version: SCHEMA_VERSION,
    profile: { plan: "free" },
    userCards: [],
    creditUsage: {},
    pointBalances: [],
    valuations: structuredClone(DEFAULT_VALUATIONS),
  };
}

/**
 * Accepts whatever was in storage and returns something safe to render.
 *
 * Storage is not trustworthy: it can hold a half-written object, a value from
 * an older build, or something a person typed into devtools. Every field is
 * checked rather than cast, because a crash on load would lock someone out of
 * their own wallet with no way back.
 */
export function parseStored(raw: string | null): Persisted | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<Persisted>;

  if (typeof v.version !== "number" || v.version > SCHEMA_VERSION) {
    // Written by a newer build than this one. Re-seeding is safer than
    // guessing at fields that do not exist yet.
    return null;
  }

  const base = emptyState();

  const userCards = Array.isArray(v.userCards)
    ? v.userCards.filter(isUserCard)
    : base.userCards;

  let creditUsage = isUsage(v.creditUsage) ? v.creditUsage : base.creditUsage;

  if (v.version < 2) {
    creditUsage = migrateUsageV1toV2(creditUsage, userCards);
  }

  return {
    version: SCHEMA_VERSION,
    profile: {
      plan: v.profile?.plan === "premium" ? "premium" : "free",
    },
    userCards,
    creditUsage,
    pointBalances: Array.isArray(v.pointBalances)
      ? v.pointBalances.filter(isBalance)
      : base.pointBalances,
    valuations: Array.isArray(v.valuations)
      ? v.valuations.filter(isValuation)
      : base.valuations,
  };
}

/**
 * Version 1 keyed every credit on the calendar, including the ones that
 * actually reset on the card's anniversary. Those keys now look different,
 * so anything recorded against an anniversary credit has to be moved or it
 * would silently disappear from the Tracker.
 *
 * A bare `YYYY` key meant "the annual period current during that calendar
 * year". The honest target is the anniversary cycle that overlaps most of
 * that year, which is always the one containing 1 July: a cycle opening in
 * month M covers 13-M months of its own year and M-1 of the next, and those
 * cross over exactly at July.
 *
 * Using 31 December instead looks reasonable and is wrong. For a November
 * card it selects the cycle starting that November, which for most of the
 * year has not begun, and the credit silently reads as unused.
 *
 * Everything on the calendar basis keeps its key untouched, which is the
 * large majority.
 */
function migrateUsageV1toV2(
  usage: CreditUsage,
  userCards: UserCard[],
): CreditUsage {
  const anniversaryByCredit = new Map<string, number>();
  for (const userCard of userCards) {
    const card = getCard(userCard.cardId);
    if (!card) continue;
    for (const credit of card.credits) {
      if (credit.resetBasis === "anniversary" && credit.period === "annual") {
        anniversaryByCredit.set(credit.id, userCard.anniversaryMonth);
      }
    }
  }

  const out: CreditUsage = {};
  for (const [creditId, row] of Object.entries(usage)) {
    const anniversaryMonth = anniversaryByCredit.get(creditId);
    if (anniversaryMonth === undefined) {
      out[creditId] = row;
      continue;
    }

    const moved: Record<string, number> = {};
    for (const [key, amount] of Object.entries(row)) {
      const year = /^(\d{4})$/.exec(key)?.[1];
      if (!year) {
        // Already a new-style key, or a shape this version does not know.
        moved[key] = amount;
        continue;
      }
      const target = currentPeriodKey({
        period: "annual",
        resetBasis: "anniversary",
        anniversaryMonth,
        on: new Date(Number(year), 6, 1),
      });
      if (target) moved[target] = amount;
    }
    out[creditId] = moved;
  }
  return out;
}

function isUserCard(x: unknown): x is UserCard {
  if (typeof x !== "object" || x === null) return false;
  const c = x as Partial<UserCard>;
  return typeof c.cardId === "string" && typeof c.sortOrder === "number";
}

function isBalance(x: unknown): x is PointBalance {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Partial<PointBalance>;
  return typeof b.program === "string" && typeof b.balance === "number";
}

function isValuation(x: unknown): x is Valuation {
  if (typeof x !== "object" || x === null) return false;
  const val = x as Partial<Valuation>;
  return typeof val.program === "string" && typeof val.centsPerPoint === "number";
}

function isUsage(x: unknown): x is CreditUsage {
  if (typeof x !== "object" || x === null) return false;
  return Object.values(x).every(
    (row) =>
      typeof row === "object" &&
      row !== null &&
      Object.values(row).every((n) => typeof n === "number"),
  );
}

/**
 * The seed is written as slot arrays because that reads better in a data
 * file. Storage uses period keys, so the two are converted once on first run,
 * through the same window logic the Tracker uses.
 */
function seedUsage(userCards: UserCard[]): CreditUsage {
  const out: CreditUsage = {};
  for (const userCard of userCards) {
    const card = getCard(userCard.cardId);
    if (!card) continue;
    for (const credit of card.credits) {
      const slots = DEMO_USAGE[credit.id];
      if (!slots) continue;
      const windows = periodWindows({
        period: credit.period,
        resetBasis: credit.resetBasis,
        anniversaryMonth: userCard.anniversaryMonth,
      });
      const row: Record<string, number> = {};
      slots.forEach((amount, i) => {
        const window = windows[i];
        if (window && amount > 0) row[window.key] = amount;
      });
      out[credit.id] = row;
    }
  }
  return out;
}
