import type { Brand, Card, ChosenRate, EarnRate, Program } from "@/data/types";
import type { Category } from "@/lib/categories";

/**
 * The arithmetic behind the calculators and the "use which card?" picker.
 *
 * Kept in one file with no runtime imports (the types above are erased), so
 * `node --test` can run its tests directly. Every number the app shows about
 * what a card is worth comes from here, so the panel, the Calculators tab
 * and the Wallet cannot disagree with each other.
 */

/** Cents per point, by program. The user's values, not the seed defaults. */
export type Valuations = Partial<Record<Program, number>>;

const FALLBACK_RATE: EarnRate = { category: "other", multiplier: 1, cap: null };

/**
 * Spend above a category cap earns the card's "everything else" rate. Where
 * the capped rate *is* the everything-else rate, there is no lower tier, so
 * it drops to 1x.
 */
const BASE_OVERFLOW_RATE = 1;

export function centsPerPoint(
  program: Program,
  valuations: Valuations,
): number {
  const v = valuations[program];
  return typeof v === "number" && v >= 0 ? v : 0;
}

/** The calendar quarter a date falls in, keyed like RotatingRate.quarters: "2026-Q4". Local time. */
export function quarterKey(date: Date): string {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

/**
 * The options in force for a chosen rate: the cardholder's own picks where
 * they made them (set on the card by lib/data), else the issuer's default,
 * else none. Unknown option ids are dropped and the count held to `picks`.
 */
export function picksFor(card: Card, rate: ChosenRate): string[] {
  const wanted = card.picks?.[rate.id] ?? rate.defaultPicks ?? [];
  return [...new Set(wanted)]
    .filter((id) => rate.options.some((o) => o.id === id))
    .slice(0, rate.picks);
}

/**
 * Every rate a card earns right now: its fixed rates, plus the categories
 * the cardholder picked and this quarter's rotating categories. Where a
 * bonus covers a category the card already has a rate for, the higher rate
 * wins. Everything that asks what a card earns reads through here (via
 * rateFor), so a pick or a new quarter changes every screen at once.
 */
export function effectiveEarnRates(card: Card, date: Date = new Date()): EarnRate[] {
  if (!card.chosenRates?.length && !card.rotatingRates?.length) return card.earnRates;
  const out = [...card.earnRates];
  const put = (rate: EarnRate) => {
    const i = out.findIndex((r) => r.category === rate.category);
    if (i === -1) out.push(rate);
    else if (rate.multiplier > out[i].multiplier) {
      // Keep a channel boost only where it still beats the bonus.
      const boost = out[i].boost;
      out[i] = boost && boost.multiplier > rate.multiplier ? { ...rate, boost } : rate;
    }
  };
  for (const chosen of card.chosenRates ?? []) {
    // The rate's own notes (how to change the pick) belong with the picker
    // in the card details; here a rate only says where it came from.
    const note = card.picks?.[chosen.id]?.length
      ? "Your chosen category"
      : `${card.issuer}'s default category until you choose`;
    for (const id of picksFor(card, chosen)) {
      const option = chosen.options.find((o) => o.id === id)!;
      for (const category of option.categories) {
        put({
          category,
          multiplier: chosen.multiplier,
          cap: chosen.cap,
          capPeriod: chosen.capPeriod,
          capGroup: chosen.capGroup,
          notes: note,
          source: "chosen",
        });
      }
    }
  }
  for (const rotating of card.rotatingRates ?? []) {
    const quarter = rotating.quarters[quarterKey(date)];
    for (const category of quarter?.categories ?? []) {
      put({
        category,
        multiplier: rotating.multiplier,
        cap: rotating.cap,
        capPeriod: rotating.capPeriod,
        capGroup: `rotating:${rotating.id}`,
        notes: rotating.activate ? "Activate each quarter" : rotating.notes,
        source: "rotating",
      });
    }
  }
  return out;
}

/**
 * What a card earns in a category. Falls back to its "everything else" rate,
 * then to 1x, so every card always has an answer.
 */
export function rateFor(card: Card, category: Category, date: Date = new Date()): EarnRate {
  const rates = effectiveEarnRates(card, date);
  return (
    rates.find((r) => r.category === category) ??
    rates.find((r) => r.category === "other") ??
    FALLBACK_RATE
  );
}

/** A rate's cap as a yearly figure: a quarterly cap counts four times. Null when uncapped. */
export function yearlyCap(rate: EarnRate): number | null {
  if (rate.cap === null || rate.cap === undefined) return null;
  return rate.capPeriod === "quarter" ? rate.cap * 4 : rate.cap;
}

/**
 * Points earned on a year of spend in one category, respecting the cap.
 *
 * Caps are why this is not a multiplication. Amex Gold earns 4x on groceries
 * up to $25,000 a year and 1x after that, so telling someone who spends
 * $36,000 that they earn 4x on all of it overstates the card by roughly
 * 44,000 points.
 */
export function pointsForSpend(
  card: Card,
  category: Category,
  annualSpend: number,
): number {
  if (!(annualSpend > 0)) return 0;

  const rate = rateFor(card, category);
  const cap = yearlyCap(rate);

  if (cap === null || annualSpend <= cap) {
    return annualSpend * rate.multiplier;
  }

  const base = rateFor(card, "other");
  // A capped "everything else" rate has nothing below it to fall back to.
  const overflowRate =
    rate.category === "other" ? BASE_OVERFLOW_RATE : base.multiplier;

  return cap * rate.multiplier + (annualSpend - cap) * overflowRate;
}

/** Dollar value of points, at the user's own valuation. */
export function pointsToDollars(balance: number, cpp: number): number {
  if (!(balance > 0) || !(cpp > 0)) return 0;
  return (balance * cpp) / 100;
}

/* --- award vs cash ------------------------------------------------------- */

export type AwardVerdict = "use-points" | "pay-cash" | "close-call";

export type AwardInput = {
  cashPrice: number | null;
  points: number | null;
  /** Taxes and fees on the award, in dollars. */
  fees: number | null;
  /** Rewards the cash booking would have earned, in dollars. */
  rewardsForgone: number | null;
  /** What a point in this program is worth, in cents. */
  valuation: number;
};

export type AwardResult =
  /** Not enough typed yet to say anything. */
  | { kind: "empty" }
  /** The award's own fees are at or above the cash price. */
  | { kind: "fees-exceed"; verdict: "pay-cash" }
  | {
      kind: "result";
      verdict: AwardVerdict;
      /** What this booking gets for each point, in cents. */
      centsPerPoint: number;
      /** Dollars kept by using points: cash price less fees and forgone rewards. */
      cashSaved: number;
      /** The points at the user's valuation, in dollars. */
      pointsValue: number;
      /** cashSaved minus pointsValue. Positive means the points do better. */
      difference: number;
    };

/** Points win at 10% over the valuation; cash wins at 10% under it. */
export const AWARD_MARGIN = 0.1;

/**
 * Should this booking be paid with points or cash?
 *
 * cents per point = (cash price - award fees - rewards forgone) / points x 100,
 * then judged against what a point is worth to the user. Within 10% either
 * way is a close call, because valuations are estimates and a 2% edge is
 * inside their error.
 */
export function awardVsCash(input: AwardInput): AwardResult {
  const cash = input.cashPrice ?? 0;
  const points = input.points ?? 0;
  if (!(cash > 0) || !(points > 0)) return { kind: "empty" };

  const fees = Math.max(0, input.fees ?? 0);
  if (fees >= cash) return { kind: "fees-exceed", verdict: "pay-cash" };

  const forgone = Math.max(0, input.rewardsForgone ?? 0);
  const valuation = Math.max(0, input.valuation);
  const cashSaved = cash - fees - forgone;
  const cpp = (cashSaved / points) * 100;
  const pointsValue = (points * valuation) / 100;

  // The tolerance keeps a booking at exactly 1.1 times the valuation on the
  // side the rule puts it, whatever the floating point does with 2.0 x 1.1.
  const EPSILON = 1e-9;
  let verdict: AwardVerdict;
  if (cashSaved <= 0) verdict = "pay-cash";
  else if (cpp >= valuation * (1 + AWARD_MARGIN) - EPSILON) verdict = "use-points";
  else if (cpp < valuation * (1 - AWARD_MARGIN) - EPSILON) verdict = "pay-cash";
  else verdict = "close-call";

  return {
    kind: "result",
    verdict,
    centsPerPoint: cpp,
    cashSaved,
    pointsValue,
    difference: cashSaved - pointsValue,
  };
}

/**
 * Dollars a card would earn on a cash booking: the price at the card's rate
 * for that category, at the user's valuation. `boosted` uses the rate's
 * boost, for a booking the user says went through that channel. One
 * booking never reaches an annual cap, so this is a straight multiplication.
 */
export function rewardsOnPurchase(
  card: Card,
  category: Category,
  price: number,
  cpp: number,
  boosted = false,
): number {
  if (!(price > 0)) return 0;
  const rate = rateFor(card, category);
  const multiplier = boosted && rate.boost ? rate.boost.multiplier : rate.multiplier;
  return pointsToDollars(price * multiplier, cpp);
}

/* --- is this card worth it? ---------------------------------------------- */

export type BenefitUse = {
  id: string;
  name: string;
  /**
   * The most the benefit can be worth in a year, or null for benefits with
   * no cash value (lounge access, status), which are worth whatever the
   * user says.
   */
  max: number | null;
  /** Dollars the user expects to get from it in a year. */
  used: number;
};

export type CardWorth = {
  annualFee: number;
  /** Benefits used, each held to its own maximum. */
  benefitValue: number;
  /** Rewards from spending, kept apart from the benefits. Zero when off. */
  rewardsValue: number;
  total: number;
  /** total - fee. Positive pays for itself. */
  net: number;
  /** total / fee, or null for a card with no fee. */
  covered: number | null;
  verdict: "no-fee" | "pays" | "short";
  /** Benefits with money left in them, most left first. */
  gaps: { id: string; name: string; left: number }[];
};

/**
 * Whether the benefits someone would actually use cover the annual fee.
 * Each benefit counts up to its own yearly maximum, so typing $500 against a
 * $120 credit cannot make a card look better than it is.
 */
export function cardWorth(
  annualFee: number,
  benefits: BenefitUse[],
  rewardsValue = 0,
): CardWorth {
  let benefitValue = 0;
  const gaps: CardWorth["gaps"] = [];

  for (const b of benefits) {
    const used = Math.max(0, b.used || 0);
    const counted = b.max === null ? used : Math.min(used, b.max);
    benefitValue += counted;
    if (b.max !== null && b.max - counted > 0) {
      gaps.push({ id: b.id, name: b.name, left: b.max - counted });
    }
  }
  gaps.sort((a, b) => b.left - a.left);

  const rewards = Math.max(0, rewardsValue || 0);
  const total = benefitValue + rewards;
  const fee = Math.max(0, annualFee);

  return {
    annualFee: fee,
    benefitValue,
    rewardsValue: rewards,
    total,
    net: total - fee,
    covered: fee > 0 ? total / fee : null,
    verdict: fee === 0 ? "no-fee" : total >= fee ? "pays" : "short",
    gaps,
  };
}

/* --- what is my spend worth? --------------------------------------------- */

export type Timeframe = "day" | "week" | "month" | "half" | "year";

export const TIMEFRAMES: Timeframe[] = ["day", "week", "month", "half", "year"];

/** How many of each timeframe fit in a year. Caps are yearly. */
export const PER_YEAR: Record<Timeframe, number> = {
  day: 365,
  week: 52,
  month: 12,
  half: 2,
  year: 1,
};

/**
 * The categories a card has its own rate for, then "everything else" last,
 * so the spend calculator shows one field per real rate and nothing more.
 */
export function earnCategories(card: Card, date: Date = new Date()): Category[] {
  const own = effectiveEarnRates(card, date)
    .map((r) => r.category)
    .filter((c) => c !== "other");
  return [...new Set(own), "other"];
}

export type SpendRow = {
  category: Category;
  spend: number;
  rate: EarnRate;
  points: number;
  /** True when a year at this pace passes the category's cap. */
  capReached: boolean;
  /** What spend past the cap earns. */
  overflowRate: number;
};

export type SpendWorth = {
  rows: SpendRow[];
  totalSpend: number;
  points: number;
  value: number;
  /** value / totalSpend, or null when nothing was entered. */
  effectiveReturn: number | null;
  /** The same pace for a whole year. */
  pointsPerYear: number;
};

/**
 * Points and dollars for spend over one timeframe on one card.
 *
 * Amounts mean "what I will spend in this timeframe". Caps are yearly, so
 * each amount is annualised, run through `pointsForSpend` (which applies the
 * cap and the overflow rate), and scaled back.
 */
export function spendWorth(
  card: Card,
  spend: Partial<Record<Category, number>>,
  timeframe: Timeframe,
  cpp: number,
): SpendWorth {
  const n = PER_YEAR[timeframe];
  const categories = earnCategories(card);
  const yearly = Object.fromEntries(
    categories.map((c) => [c, Math.max(0, spend[c] ?? 0) * n]),
  ) as Partial<Record<Category, number>>;
  const earned = pointsForSpends(card, yearly);

  const rows = categories.map((category) => {
    const amount = Math.max(0, spend[category] ?? 0);
    const rate = rateFor(card, category);
    return {
      category,
      spend: amount,
      rate,
      points: earned[category]!.points / n,
      capReached: earned[category]!.capReached,
      overflowRate: overflowRateFor(card, rate),
    };
  });

  const totalSpend = rows.reduce((sum, r) => sum + r.spend, 0);
  const points = rows.reduce((sum, r) => sum + r.points, 0);
  const value = pointsToDollars(points, cpp);

  return {
    rows,
    totalSpend,
    points,
    value,
    effectiveReturn: totalSpend > 0 ? value / totalSpend : null,
    pointsPerYear: points * n,
  };
}

/** What spend past a rate's cap earns: the card's everything-else rate, or 1x below a capped base. */
function overflowRateFor(card: Card, rate: EarnRate): number {
  return rate.category === "other" ? BASE_OVERFLOW_RATE : rateFor(card, "other").multiplier;
}

/**
 * Points for a year of spend in several categories at once, respecting
 * caps that categories share. Bank of America's 3% and 2% categories share
 * $2,500 a quarter: $8,000 of groceries and $8,000 of gas cannot both earn
 * their bonus in full. Spend in a shared group fills the highest rate first,
 * which is what a cardholder choosing well would get. Categories outside a
 * group are capped on their own, as in pointsForSpend.
 */
export function pointsForSpends(
  card: Card,
  spend: Partial<Record<Category, number>>,
): Partial<Record<Category, { points: number; capReached: boolean }>> {
  const out: Partial<Record<Category, { points: number; capReached: boolean }>> = {};
  const groups = new Map<string, { category: Category; amount: number; rate: EarnRate }[]>();

  for (const [category, raw] of Object.entries(spend) as [Category, number][]) {
    const amount = Math.max(0, raw || 0);
    const rate = rateFor(card, category);
    const cap = yearlyCap(rate);
    if (rate.capGroup && cap !== null) {
      const list = groups.get(rate.capGroup) ?? [];
      list.push({ category, amount, rate });
      groups.set(rate.capGroup, list);
    } else {
      out[category] = {
        points: pointsForSpend(card, category, amount),
        capReached: cap !== null && amount > cap,
      };
    }
  }

  for (const members of groups.values()) {
    let left = yearlyCap(members[0].rate)!;
    for (const m of [...members].sort((a, b) => b.rate.multiplier - a.rate.multiplier)) {
      const within = Math.min(m.amount, left);
      left -= within;
      out[m.category] = {
        points: within * m.rate.multiplier + (m.amount - within) * overflowRateFor(card, m.rate),
        capReached: m.amount > within,
      };
    }
  }
  return out;
}

/* --- which card for this purchase? --------------------------------------- */

export type Ranked = {
  card: Card;
  rate: EarnRate;
  /** The multiplier used for the ranking: the boost when it applies. */
  multiplier: number;
  /** True when the boost is the rate being used; say where, and the anywhere rate. */
  boosted: boolean;
  /** Cents back per dollar spent, at the user's valuation. */
  centsPerDollar: number;
};

/**
 * The best multiplier a purchase can earn: the boost (travel site or brand)
 * when there is one, since someone choosing a card can choose to book that
 * way (owner's rule, 2 November 2026). The one exception is a brand boost
 * when the purchase is known to be with a different brand: a Hilton card
 * earns nothing extra at Marriott. Every line that states a boosted rate
 * also states the anywhere rate, so the condition is never hidden.
 *
 * Spend totals (pointsForSpend) still use the anywhere rate.
 */
export function multiplierFor(rate: EarnRate, brand?: Brand | null): number {
  const boost = rate.boost;
  if (!boost) return rate.multiplier;
  if (boost.brand && brand && boost.brand !== brand) return rate.multiplier;
  return Math.max(rate.multiplier, boost.multiplier);
}

/**
 * Cards ordered best first for a category.
 *
 * Ranked on value, not on the multiplier. 12x Hilton points at 0.5 cents is
 * worth less than 4x Membership Rewards at 1.9, and a multiplier-only
 * ranking confidently gives the wrong answer.
 */
export function rankCards(
  cards: Card[],
  category: Category,
  valuations: Valuations,
  brand?: Brand | null,
): Ranked[] {
  return cards
    // A card added before its data has no rates to rank on.
    .filter((card) => !card.pending)
    .map((card) => {
      const rate = rateFor(card, category);
      const multiplier = multiplierFor(rate, brand);
      return {
        card,
        rate,
        multiplier,
        boosted: multiplier !== rate.multiplier,
        centsPerDollar: multiplier * centsPerPoint(card.program, valuations),
      };
    })
    .sort((a, b) => b.centsPerDollar - a.centsPerDollar);
}

export function bestCardFor(
  cards: Card[],
  category: Category,
  valuations: Valuations,
  brand?: Brand | null,
): Ranked | null {
  return rankCards(cards, category, valuations, brand)[0] ?? null;
}
