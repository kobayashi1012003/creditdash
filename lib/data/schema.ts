import {
  TRACKER_COLORS,
  type PointBalance,
  type TrackerPrefs,
  type UserCard,
  type Valuation,
} from "@/data/types";
import { localDate, parseLocalDate } from "@/lib/credits/autofill";
import { DEFAULT_CPP, isProgram } from "@/data/programs";
import { getCard } from "@/data/cards.seed";
import type { Plan } from "@/lib/plan";
import { currentPeriodKey } from "@/lib/credits/reset";

/**
 * The persisted shape, mirroring the tables in creditdash-plan.md section 6
 * so Phase 6 can move each key into its Supabase table without reshaping the
 * data or touching the UI.
 *
 * `version` exists so a later change can migrate rather than discard. Never
 * change the meaning of a field in place; add a version and a migration.
 */

export const STORAGE_KEY = "creditdash:v1";
export const SCHEMA_VERSION = 3;

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
  /**
   * `valuations`: the user's own values only, never a copy of a default.
   * Before version 3 this held every program, defaults included, so a
   * browser kept whatever the defaults were on its first visit and nothing
   * could tell a chosen value from an inherited one.
   */
  valuations: Valuation[];
};

/**
 * What a brand new browser gets: an empty wallet, so a visitor trying the
 * demo starts by picking their own cards (owner, 11 November 2026). Premium,
 * so the demo can hold as many cards as they like; "Delete everything" in
 * Settings clears to the Free empty state instead.
 */
export function seededState(): Persisted {
  return { ...emptyState(), profile: { plan: "premium" } };
}

export function emptyState(): Persisted {
  return {
    version: SCHEMA_VERSION,
    profile: { plan: "free" },
    userCards: [],
    creditUsage: {},
    pointBalances: [],
    valuations: [],
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
    ? v.userCards.filter(isUserCard).map(cleanUserCard)
    : base.userCards;

  let creditUsage = isUsage(v.creditUsage) ? cleanUsage(v.creditUsage) : base.creditUsage;

  if (v.version < 2) {
    creditUsage = migrateUsageV1toV2(creditUsage, userCards);
  }

  let valuations = Array.isArray(v.valuations)
    ? v.valuations.filter(isValuation)
    : base.valuations;

  if (v.version < 3) {
    valuations = migrateValuationsV2toV3(valuations);
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
    valuations,
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

/**
 * The defaults before 30 October 2026. A version 2 browser holds these as if
 * the user had chosen them, because every program's value was copied in on
 * first visit.
 */
const PRE_V3_DEFAULTS: Record<string, number> = {
  "amex-mr": 1.9,
  "chase-ur": 1.9,
  "citi-ty": 1.6,
  "capital-one": 1.7,
  bilt: 1.8,
  hilton: 0.5,
  united: 1.3,
};

/**
 * The defaults from 30 October to 5 November 2026, before the 1 cent
 * baseline. A version 2 browser last opened in that window holds these as
 * copies, so they must still count as inherited, not chosen.
 */
const OCT_30_DEFAULTS: Record<string, number> = {
  "amex-mr": 2.0,
  "capital-one": 1.8,
  "chase-ur": 2.0,
  "citi-ty": 1.8,
  "wells-fargo": 1.6,
  bilt: 2.1,
  aeroplan: 1.5,
  "alaska-atmos": 1.5,
  aadvantage: 1.4,
  ana: 1.4,
  lifemiles: 1.5,
  avios: 1.4,
  "asia-miles": 1.3,
  delta: 1.1,
  emirates: 1.1,
  etihad: 1.1,
  "flying-blue": 1.3,
  frontier: 1.1,
  jetblue: 1.3,
  qantas: 1.2,
  krisflyer: 1.3,
  southwest: 1.3,
  turkish: 1.1,
  united: 1.3,
  "virgin-atlantic": 1.4,
  accor: 2.0,
  hyatt: 1.7,
};

/**
 * Keeps only the values a person actually chose. Anything equal to an old
 * or the current default is taken to be inherited and dropped, so it follows
 * CreditDash's default from now on. Someone who deliberately typed exactly
 * an old default loses that choice; there is no way to tell them apart.
 */
function migrateValuationsV2toV3(valuations: Valuation[]): Valuation[] {
  return valuations.filter(
    (v) =>
      v.centsPerPoint !== PRE_V3_DEFAULTS[v.program] &&
      v.centsPerPoint !== OCT_30_DEFAULTS[v.program] &&
      v.centsPerPoint !== DEFAULT_CPP[v.program],
  );
}

function isUserCard(x: unknown): x is UserCard {
  if (typeof x !== "object" || x === null) return false;
  const c = x as Partial<UserCard>;
  return (
    isId(c.cardId) &&
    typeof c.sortOrder === "number" &&
    Number.isFinite(c.sortOrder) &&
    c.sortOrder >= 0
  );
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Keeps a stored card's fields within what the database allows, repairing
 * rather than dropping the card: a bad nickname goes, a bad date or month
 * falls back, so one odd value never costs someone a card.
 */
export function cleanUserCard(c: UserCard): UserCard {
  const out: UserCard = { ...c };
  if (typeof c.openedOn !== "string" || !ISO_DATE.test(c.openedOn)) {
    out.openedOn = localDate(new Date());
  }
  const month = c.anniversaryMonth;
  if (!(typeof month === "number" && Number.isInteger(month) && month >= 1 && month <= 12)) {
    out.anniversaryMonth = Number(out.openedOn.slice(5, 7)) || 1;
  }
  if (typeof c.nickname !== "string" || c.nickname.trim() === "") delete out.nickname;
  else out.nickname = c.nickname.slice(0, 40);
  const day = c.anniversaryDay;
  if (!(typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 31)) {
    delete out.anniversaryDay;
  }
  const prefs = cleanPrefs(c.prefs);
  if (prefs) out.prefs = prefs;
  else delete out.prefs;
  return out;
}

const isId = (x: unknown): x is string => typeof x === "string" && x.length > 0 && x.length <= 64;

/**
 * Assumed period keys kept per credit: two years of a monthly credit. Older
 * ones fall off, which keeps `credit_prefs` well under its 16 KB check.
 */
export const MAX_ASSUMED = 24;

/**
 * Tracker preferences from storage or the database, with anything malformed
 * dropped field by field, so one bad value never loses the rest.
 */
export function cleanPrefs(x: unknown): TrackerPrefs | undefined {
  if (typeof x !== "object" || x === null || Array.isArray(x)) return undefined;
  const p = x as Record<string, unknown>;
  const out: TrackerPrefs = {};
  if (Array.isArray(p.order)) out.order = [...new Set(p.order.filter(isId))];
  if (Array.isArray(p.hidden)) out.hidden = [...new Set(p.hidden.filter(isId))];
  if (typeof p.colors === "object" && p.colors !== null) {
    const colors: TrackerPrefs["colors"] = {};
    for (const [id, c] of Object.entries(p.colors)) {
      if (isId(id) && (TRACKER_COLORS as readonly unknown[]).includes(c)) {
        colors[id] = c as (typeof TRACKER_COLORS)[number];
      }
    }
    out.colors = colors;
  }
  if (typeof p.autofill === "object" && p.autofill !== null) {
    const autofill: TrackerPrefs["autofill"] = {};
    for (const [id, e] of Object.entries(p.autofill)) {
      const entry = e as { since?: unknown; through?: unknown } | null;
      if (
        isId(id) &&
        entry &&
        typeof entry.since === "string" &&
        typeof entry.through === "string" &&
        parseLocalDate(entry.through)
      ) {
        autofill[id] = { since: entry.since, through: entry.through };
      }
    }
    out.autofill = autofill;
  }
  if (typeof p.assumed === "object" && p.assumed !== null && !Array.isArray(p.assumed)) {
    const assumed: Record<string, string[]> = {};
    for (const [id, keys] of Object.entries(p.assumed)) {
      if (!isId(id) || !Array.isArray(keys)) continue;
      const clean = [...new Set(keys.filter(isId))].slice(-MAX_ASSUMED);
      if (clean.length > 0) assumed[id] = clean;
    }
    if (Object.keys(assumed).length > 0) out.assumed = assumed;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function isBalance(x: unknown): x is PointBalance {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Partial<PointBalance>;
  return isProgram(b.program) && typeof b.balance === "number" && b.balance >= 0;
}

function isValuation(x: unknown): x is Valuation {
  if (typeof x !== "object" || x === null) return false;
  const val = x as Partial<Valuation>;
  return (
    isProgram(val.program) &&
    typeof val.centsPerPoint === "number" &&
    val.centsPerPoint > 0 &&
    val.centsPerPoint < 100
  );
}

/** Drops any amount the database would refuse (NaN, Infinity, negative). */
function cleanUsage(usage: CreditUsage): CreditUsage {
  const out: CreditUsage = {};
  for (const [creditId, row] of Object.entries(usage)) {
    if (!isId(creditId)) continue;
    const clean: Record<string, number> = {};
    for (const [key, n] of Object.entries(row)) {
      if (key.length >= 1 && key.length <= 32 && Number.isFinite(n) && n >= 0) clean[key] = n;
    }
    out[creditId] = clean;
  }
  return out;
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
