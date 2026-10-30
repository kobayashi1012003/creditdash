import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  awardVsCash,
  bestCardFor,
  cardWorth,
  centsPerPoint,
  earnCategories,
  pointsForSpend,
  pointsToDollars,
  rankCards,
  rateFor,
  rewardsOnPurchase,
  spendWorth,
} from "./engine.ts";
import type { Card } from "../../data/types.ts";
import { CARDS } from "../../data/cards.seed.ts";

/** Minimal cards, built here so a seed edit cannot quietly change a result. */
function card(partial: Partial<Card> & Pick<Card, "id">): Card {
  return {
    name: partial.id,
    issuer: "Test",
    network: "visa",
    annualFee: 0,
    program: "amex-mr",
    faceStyle: { base: "#000", shade: "#000", foil: "#fff", finish: "matte" },
    issuerUrl: "https://example.test",
    lastVerified: "2026-01-01",
    earnRates: [],
    credits: [],
    foreignTransactionFee: 0,
    loungeAccess: null,
    ...partial,
  } as Card;
}

const VALUATIONS = { "amex-mr": 1.9, "chase-ur": 1.9, hilton: 0.5, "capital-one": 1.7 };

describe("rateFor", () => {
  const gold = card({
    id: "gold",
    earnRates: [
      { category: "dining", multiplier: 4, cap: 50_000 },
      { category: "other", multiplier: 1, cap: null },
    ],
  });

  test("finds the category rate", () => {
    assert.equal(rateFor(gold, "dining").multiplier, 4);
  });

  test("falls back to everything else", () => {
    assert.equal(rateFor(gold, "gas").multiplier, 1);
  });

  test("falls back to 1x when a card lists no rates at all", () => {
    assert.equal(rateFor(card({ id: "bare" }), "dining").multiplier, 1);
  });
});

describe("pointsForSpend", () => {
  const gold = card({
    id: "gold",
    earnRates: [
      { category: "groceries", multiplier: 4, cap: 25_000 },
      { category: "dining", multiplier: 4, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
  });

  test("multiplies when the spend is under the cap", () => {
    assert.equal(pointsForSpend(gold, "groceries", 10_000), 40_000);
  });

  test("the cap itself is still fully bonused", () => {
    assert.equal(pointsForSpend(gold, "groceries", 25_000), 100_000);
  });

  test("spend past the cap drops to the everything-else rate", () => {
    // 25,000 at 4x plus 11,000 at 1x.
    assert.equal(pointsForSpend(gold, "groceries", 36_000), 100_000 + 11_000);
  });

  test("an uncapped rate keeps multiplying", () => {
    assert.equal(pointsForSpend(gold, "dining", 36_000), 144_000);
  });

  test("a capped everything-else rate drops to 1x, not to itself", () => {
    const bbp = card({
      id: "bbp",
      earnRates: [{ category: "other", multiplier: 2, cap: 50_000 }],
    });
    // 50,000 at 2x plus 10,000 at 1x, not 60,000 at 2x.
    assert.equal(pointsForSpend(bbp, "gas", 60_000), 110_000);
  });

  test("zero and negative spend earn nothing", () => {
    assert.equal(pointsForSpend(gold, "dining", 0), 0);
    assert.equal(pointsForSpend(gold, "dining", -500), 0);
  });
});

describe("pointsToDollars", () => {
  test("converts at the given rate", () => {
    assert.equal(pointsToDollars(142_000, 1.9), 2698);
  });

  test("a zero balance or valuation is worth nothing, not NaN", () => {
    assert.equal(pointsToDollars(0, 1.9), 0);
    assert.equal(pointsToDollars(142_000, 0), 0);
  });
});

describe("centsPerPoint", () => {
  test("uses the user's value when set", () => {
    assert.equal(centsPerPoint("amex-mr", { "amex-mr": 1.2 }), 1.2);
  });

  test("an unset program is worth nothing rather than silently 1", () => {
    assert.equal(centsPerPoint("bilt", {}), 0);
  });

  test("a user override actually changes the answer", () => {
    assert.equal(centsPerPoint("amex-mr", { "amex-mr": 1.9 }), 1.9);
    assert.equal(centsPerPoint("amex-mr", { "amex-mr": 0.8 }), 0.8);
  });
});

describe("awardVsCash", () => {
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

  test("worked example: Chase, $600, 30,000 points, $5.60 fees is a close call", () => {
    const r = awardVsCash({
      cashPrice: 600,
      points: 30_000,
      fees: 5.6,
      rewardsForgone: 0,
      valuation: 2.0,
    });
    assert.equal(r.kind, "result");
    if (r.kind !== "result") return;
    assert.ok(close(r.centsPerPoint, 1.98133333333), String(r.centsPerPoint));
    assert.equal(Number(r.centsPerPoint.toFixed(2)), 1.98);
    assert.equal(r.verdict, "close-call");
    assert.ok(close(r.cashSaved, 594.4));
    assert.ok(close(r.pointsValue, 600));
    assert.ok(close(r.difference, -5.6));
  });

  test("10% over the valuation says use points, 10% under says pay cash", () => {
    const at = (cash: number) =>
      awardVsCash({ cashPrice: cash, points: 10_000, fees: 0, rewardsForgone: 0, valuation: 2 });
    // 2.2 cents is exactly 1.1 times 2.0.
    assert.equal((at(220) as { verdict: string }).verdict, "use-points");
    assert.equal((at(219) as { verdict: string }).verdict, "close-call");
    // 1.8 cents is exactly 0.9 times: still close.
    assert.equal((at(180) as { verdict: string }).verdict, "close-call");
    assert.equal((at(179) as { verdict: string }).verdict, "pay-cash");
  });

  test("rewards forgone come off what the points save", () => {
    const r = awardVsCash({
      cashPrice: 500,
      points: 25_000,
      fees: 0,
      rewardsForgone: 50,
      valuation: 1.5,
    });
    assert.equal(r.kind, "result");
    if (r.kind !== "result") return;
    assert.ok(close(r.centsPerPoint, 1.8));
    assert.equal(r.verdict, "use-points");
  });

  test("fees at or above the cash price means pay cash", () => {
    const r = awardVsCash({ cashPrice: 80, points: 5_000, fees: 80, rewardsForgone: 0, valuation: 1.4 });
    assert.deepEqual(r, { kind: "fees-exceed", verdict: "pay-cash" });
  });

  test("forgone rewards that wipe out the saving mean pay cash", () => {
    const r = awardVsCash({ cashPrice: 100, points: 5_000, fees: 60, rewardsForgone: 50, valuation: 0 });
    assert.equal(r.kind, "result");
    if (r.kind !== "result") return;
    assert.equal(r.verdict, "pay-cash");
  });

  test("blank or zero inputs are empty, never NaN", () => {
    for (const input of [
      { cashPrice: null, points: 30_000 },
      { cashPrice: 600, points: null },
      { cashPrice: 0, points: 30_000 },
      { cashPrice: 600, points: 0 },
    ]) {
      const r = awardVsCash({ ...input, fees: null, rewardsForgone: null, valuation: 2 });
      assert.deepEqual(r, { kind: "empty" });
    }
  });

  test("rewards on a purchase use the card's category rate", () => {
    const csr = card({
      id: "csr",
      program: "chase-ur",
      earnRates: [
        { category: "flights", multiplier: 8, cap: null },
        { category: "other", multiplier: 1, cap: null },
      ],
    });
    assert.ok(close(rewardsOnPurchase(csr, "flights", 600, 2.0), 96));
    assert.equal(rewardsOnPurchase(csr, "flights", 0, 2.0), 0);
  });
});

describe("cardWorth", () => {
  test("pays for itself when used benefits pass the fee", () => {
    const r = cardWorth(325, [
      { id: "dining", name: "Dining credit", max: 120, used: 120 },
      { id: "uber", name: "Uber Cash", max: 120, used: 120 },
      { id: "resy", name: "Resy credit", max: 100, used: 100 },
    ]);
    assert.equal(r.verdict, "pays");
    assert.equal(r.net, 15);
    assert.equal(r.gaps.length, 0);
  });

  test("falls short, with the biggest gap first", () => {
    const r = cardWorth(325, [
      { id: "dining", name: "Dining credit", max: 120, used: 60 },
      { id: "uber", name: "Uber Cash", max: 120, used: 0 },
      { id: "dunkin", name: "Dunkin'", max: 84, used: 84 },
    ]);
    assert.equal(r.verdict, "short");
    assert.equal(r.net, -181);
    assert.ok(Math.abs((r.covered ?? 0) - 144 / 325) < 1e-9);
    assert.deepEqual(
      r.gaps.map((g) => [g.name, g.left]),
      [["Uber Cash", 120], ["Dining credit", 60]],
    );
  });

  test("a benefit cannot count for more than its yearly maximum", () => {
    const r = cardWorth(95, [{ id: "hotel", name: "Hotel credit", max: 100, used: 500 }]);
    assert.equal(r.benefitValue, 100);
  });

  test("benefits with no cash value count what the user says", () => {
    const r = cardWorth(395, [{ id: "lounge", name: "Lounge access", max: null, used: 250 }]);
    assert.equal(r.benefitValue, 250);
    assert.equal(r.gaps.length, 0);
  });

  test("rewards from spending are added but kept separate", () => {
    const r = cardWorth(95, [], 120);
    assert.equal(r.benefitValue, 0);
    assert.equal(r.rewardsValue, 120);
    assert.equal(r.verdict, "pays");
  });

  test("a card with no fee has no coverage ratio", () => {
    const r = cardWorth(0, []);
    assert.equal(r.verdict, "no-fee");
    assert.equal(r.covered, null);
  });
});

describe("spendWorth", () => {
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const daySpend = { hotels: 200, dining: 80, other: 40 };

  test("worked example: Amex Gold for a day, at the catalog's rates", () => {
    const gold = CARDS.find((c) => c.id === "amex-gold");
    assert.ok(gold);
    const r = spendWorth(gold, daySpend, "day", 2.0);

    // Derived from whatever the catalog holds, so a rate change moves the
    // expectation with it rather than failing for the wrong reason.
    const rate = (c: "hotels" | "dining" | "other") => rateFor(gold, c).multiplier;
    const expected = 200 * rate("hotels") + 80 * rate("dining") + 40 * rate("other");
    assert.ok(close(r.points, expected), `${r.points} vs ${expected}`);
    assert.ok(close(r.value, (expected * 2.0) / 100));
    assert.equal(r.totalSpend, 320);
    assert.ok(close(r.pointsPerYear, expected * 365));
  });

  test("the same day pinned to today's Gold rates: 1,360 points, $27.20", () => {
    const gold = card({
      id: "gold",
      earnRates: [
        { category: "dining", multiplier: 4, cap: 50_000 },
        { category: "groceries", multiplier: 4, cap: 25_000 },
        { category: "hotels", multiplier: 5, cap: null },
        { category: "flights", multiplier: 3, cap: null },
        { category: "other", multiplier: 1, cap: null },
      ],
    });
    const r = spendWorth(gold, daySpend, "day", 2.0);
    assert.ok(close(r.points, 1360));
    assert.ok(close(r.value, 27.2));
    assert.ok(close(r.effectiveReturn ?? 0, 0.085));
    assert.ok(close(r.pointsPerYear, 496_400));
    // $80 a day is $29,200 a year, under the $50,000 dining cap.
    assert.equal(r.rows.find((x) => x.category === "dining")?.capReached, false);
  });

  test("caps are yearly: a week of groceries past the cap falls to the base rate", () => {
    const gold = card({
      id: "gold",
      earnRates: [
        { category: "groceries", multiplier: 4, cap: 25_000 },
        { category: "other", multiplier: 1, cap: null },
      ],
    });
    // $1,000 a week is $52,000 a year: 25,000 at 4x and 27,000 at 1x.
    const r = spendWorth(gold, { groceries: 1000 }, "week", 2.0);
    const row = r.rows.find((x) => x.category === "groceries");
    assert.ok(row);
    assert.equal(row.capReached, true);
    assert.equal(row.overflowRate, 1);
    assert.ok(close(row.points, (25_000 * 4 + 27_000) / 52));
  });

  test("a capped everything-else rate falls to 1x", () => {
    const bbp = card({
      id: "bbp",
      earnRates: [{ category: "other", multiplier: 2, cap: 50_000 }],
    });
    const r = spendWorth(bbp, { other: 60_000 }, "year", 2.0);
    assert.equal(r.points, 110_000);
    assert.equal(r.rows[0].capReached, true);
    assert.equal(r.rows[0].overflowRate, 1);
  });

  test("switching timeframe keeps the numbers and recomputes", () => {
    const flat = card({ id: "flat", earnRates: [{ category: "other", multiplier: 2, cap: null }] });
    const month = spendWorth(flat, { other: 1000 }, "month", 1.0);
    const year = spendWorth(flat, { other: 1000 }, "year", 1.0);
    assert.equal(month.points, 2000);
    assert.equal(year.points, 2000);
    assert.equal(month.pointsPerYear, 24_000);
    assert.equal(year.pointsPerYear, 2000);
  });

  test("only the card's own categories and everything else are counted", () => {
    const flat = card({ id: "flat", earnRates: [{ category: "other", multiplier: 2, cap: null }] });
    const r = spendWorth(flat, { dining: 500, other: 100 }, "month", 1.0);
    assert.deepEqual(r.rows.map((x) => x.category), ["other"]);
    assert.equal(r.totalSpend, 100);
  });

  test("nothing entered is a neutral result, not NaN", () => {
    const flat = card({ id: "flat", earnRates: [{ category: "other", multiplier: 2, cap: null }] });
    const r = spendWorth(flat, {}, "month", 2.0);
    assert.equal(r.points, 0);
    assert.equal(r.value, 0);
    assert.equal(r.effectiveReturn, null);
  });

  test("earnCategories lists the card's rates with everything else last", () => {
    const gold = CARDS.find((c) => c.id === "amex-gold");
    assert.ok(gold);
    const cats = earnCategories(gold);
    assert.equal(cats.at(-1), "other");
    assert.equal(new Set(cats).size, cats.length);
  });
});

describe("rankCards", () => {
  const gold = card({
    id: "gold",
    program: "amex-mr",
    earnRates: [
      { category: "dining", multiplier: 4, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
  });
  const hilton = card({
    id: "hilton",
    program: "hilton",
    earnRates: [{ category: "dining", multiplier: 6, cap: null }],
  });

  test("ranks on value per dollar, not on the multiplier", () => {
    const ranked = rankCards([hilton, gold], "dining", VALUATIONS);
    assert.equal(ranked[0].card.id, "gold");
    assert.ok(Math.abs(ranked[0].centsPerDollar - 7.6) < 1e-9);
    assert.ok(Math.abs(ranked[1].centsPerDollar - 3.0) < 1e-9);
  });

  test("best card is the head of the ranking", () => {
    const best = bestCardFor([hilton, gold], "dining", VALUATIONS);
    assert.equal(best?.card.id, "gold");
  });

  test("an empty wallet has no best card", () => {
    assert.equal(bestCardFor([], "dining", VALUATIONS), null);
  });

  test("every category returns a ranking, even ones no card names", () => {
    for (const category of [
      "dining", "groceries", "flights", "hotels",
      "gas", "transit", "streaming", "other",
    ] as const) {
      const ranked = rankCards([gold, hilton], category, VALUATIONS);
      assert.equal(ranked.length, 2, category);
      assert.ok(ranked[0].centsPerDollar >= ranked[1].centsPerDollar, category);
    }
  });
});
