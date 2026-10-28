import type { PointBalance, UserCard, Valuation } from "@/data/types";
import { DEFAULT_VALUATIONS, DEMO_BALANCES, DEMO_USAGE, DEMO_WALLET } from "@/data/cards.seed";
import type { Plan } from "@/lib/plan";

/**
 * The persisted shape, mirroring the tables in creditdash-plan.md section 6
 * so Phase 6 can move each key into its Supabase table without reshaping the
 * data or touching the UI.
 *
 * `version` exists so a later change can migrate rather than discard. Never
 * change the meaning of a field in place; add a version and a migration.
 */

export const STORAGE_KEY = "creditdash:v1";
export const SCHEMA_VERSION = 1;

/**
 * Credit usage keyed the way `credit_usage.period_key` will be: credit id,
 * then a period key, then dollars used. Keys look like `2026-10` for monthly,
 * `2026-Q3`, `2026-H1`, or `2026` for annual.
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
  return {
    version: SCHEMA_VERSION,
    profile: { plan: "premium" },
    userCards: structuredClone(DEMO_WALLET),
    creditUsage: slotArraysToPeriodKeys(DEMO_USAGE),
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

  if (v.version !== SCHEMA_VERSION) {
    // Only version 1 exists. A later version adds migrations here instead of
    // dropping the data.
    return null;
  }

  const base = emptyState();

  return {
    version: SCHEMA_VERSION,
    profile: {
      plan: v.profile?.plan === "premium" ? "premium" : "free",
    },
    userCards: Array.isArray(v.userCards)
      ? v.userCards.filter(isUserCard)
      : base.userCards,
    creditUsage: isUsage(v.creditUsage) ? v.creditUsage : base.creditUsage,
    pointBalances: Array.isArray(v.pointBalances)
      ? v.pointBalances.filter(isBalance)
      : base.pointBalances,
    valuations: Array.isArray(v.valuations)
      ? v.valuations.filter(isValuation)
      : base.valuations,
  };
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

/* -------------------------------------------------------------------------- */

const YEAR = new Date().getFullYear();

/** Period key for slot `i` of a credit, in the given year. */
export function periodKey(
  period: "monthly" | "quarterly" | "semiannual" | "annual",
  slot: number,
  year = YEAR,
): string {
  switch (period) {
    case "monthly":
      return `${year}-${String(slot + 1).padStart(2, "0")}`;
    case "quarterly":
      return `${year}-Q${slot + 1}`;
    case "semiannual":
      return `${year}-H${slot + 1}`;
    case "annual":
      return `${year}`;
  }
}

/**
 * The seed is written as slot arrays because that reads better in a data
 * file. Storage uses period keys because that is what the database column
 * will be, so the two are converted once on first run.
 */
function slotArraysToPeriodKeys(seed: Record<string, number[]>): CreditUsage {
  const out: CreditUsage = {};
  for (const [creditId, slots] of Object.entries(seed)) {
    const period =
      slots.length === 12
        ? "monthly"
        : slots.length === 4
          ? "quarterly"
          : slots.length === 2
            ? "semiannual"
            : "annual";
    const row: Record<string, number> = {};
    slots.forEach((amount, i) => {
      if (amount > 0) row[periodKey(period, i)] = amount;
    });
    out[creditId] = row;
  }
  return out;
}

/** Period keys back to the slot array the CheckmarkRow renders. */
export function periodKeysToSlots(
  row: Record<string, number> | undefined,
  period: "monthly" | "quarterly" | "semiannual" | "annual",
  slots: number,
  year = YEAR,
): number[] {
  return Array.from(
    { length: slots },
    (_, i) => row?.[periodKey(period, i, year)] ?? 0,
  );
}
