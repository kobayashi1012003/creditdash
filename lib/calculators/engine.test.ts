import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bestCardFor,
  breakEven,
  centsPerPoint,
  pointsForSpend,
  pointsToDollars,
  rankCards,
  rateFor,
  valueSpend,
} from "./engine.ts";
import type { Card } from "../../data/types.ts";

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

describe("valueSpend", () => {
  const gold = card({
    id: "gold",
    program: "amex-mr",
    earnRates: [
      { category: "dining", multiplier: 4, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
  });
  const csr = card({
    id: "csr",
    program: "chase-ur",
    earnRates: [
      { category: "dining", multiplier: 3, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
  });

  test("values a year of monthly spend", () => {
    const [top] = valueSpend([gold], { dining: 500 }, VALUATIONS);
    // 500 a month is 6,000 a year, at 4x is 24,000 points, at 1.9c is $456.
    assert.equal(top.points, 24_000);
    assert.equal(top.value, 456);
  });

  test("ranks by value and returns best first", () => {
    const results = valueSpend([csr, gold], { dining: 500 }, VALUATIONS);
    assert.equal(results[0].card.id, "gold");
    assert.equal(results[1].card.id, "csr");
  });

  test("a lower multiplier wins when its points are worth more", () => {
    const hilton = card({
      id: "hilton",
      program: "hilton",
      earnRates: [{ category: "hotels", multiplier: 12, cap: null }],
    });
    const venture = card({
      id: "venture",
      program: "capital-one",
      earnRates: [{ category: "hotels", multiplier: 10, cap: null }],
    });
    const results = valueSpend([hilton, venture], { hotels: 1000 }, VALUATIONS);
    // 12x at 0.5c is 6 cents a dollar; 10x at 1.7c is 17.
    assert.equal(results[0].card.id, "venture");
  });

  test("the user's valuation changes the ranking", () => {
    const results = valueSpend(
      [gold, csr],
      { dining: 500 },
      { "amex-mr": 0.5, "chase-ur": 1.9 },
    );
    // Gold earns more points but they are now worth far less.
    assert.equal(results[0].card.id, "csr");
  });

  test("caps are applied to the annual total, not the monthly figure", () => {
    const capped = card({
      id: "capped",
      earnRates: [
        { category: "groceries", multiplier: 4, cap: 12_000 },
        { category: "other", multiplier: 1, cap: null },
      ],
    });
    // 2,000 a month is 24,000 a year: half bonused, half not.
    const [r] = valueSpend([capped], { groceries: 2000 }, VALUATIONS);
    assert.equal(r.points, 12_000 * 4 + 12_000 * 1);
  });

  test("empty spend is worth nothing", () => {
    const [r] = valueSpend([gold], {}, VALUATIONS);
    assert.equal(r.points, 0);
    assert.equal(r.value, 0);
  });
});

describe("breakEven", () => {
  const platinum = card({
    id: "platinum",
    annualFee: 895,
    program: "amex-mr",
    earnRates: [{ category: "other", multiplier: 1, cap: null }],
  });

  test("credits reduce the fee", () => {
    const r = breakEven(platinum, 500, VALUATIONS);
    assert.equal(r.shortfall, 395);
    assert.equal(r.surplus, 0);
  });

  test("credits beyond the fee are a surplus, never a negative shortfall", () => {
    const r = breakEven(platinum, 1200, VALUATIONS);
    assert.equal(r.shortfall, 0);
    assert.equal(r.surplus, 305);
    assert.equal(r.spendNeeded, 0);
  });

  test("spend needed is the shortfall divided by value per dollar", () => {
    const r = breakEven(platinum, 500, VALUATIONS);
    // 1x at 1.9c is 1.9 cents a dollar, so $395 needs 395 / 0.019.
    assert.ok(r.spendNeeded !== null);
    assert.ok(Math.abs(r.spendNeeded - 395 / 0.019) < 0.001);
  });

  test("a no-fee card needs no spend", () => {
    const free = card({ id: "free", annualFee: 0 });
    const r = breakEven(free, 0, VALUATIONS);
    assert.equal(r.shortfall, 0);
    assert.equal(r.spendNeeded, 0);
  });

  test("worthless points make break-even impossible rather than enormous", () => {
    const r = breakEven(platinum, 0, { "amex-mr": 0 });
    assert.equal(r.spendNeeded, null);
  });

  test("a base-rate cap makes the remainder cost more spend, not less", () => {
    const capped = card({
      id: "capped",
      annualFee: 1000,
      program: "amex-mr",
      earnRates: [{ category: "other", multiplier: 2, cap: 10_000 }],
    });
    const r = breakEven(capped, 0, { "amex-mr": 1.0 });
    // 10,000 at 2x at 1c yields $200. The remaining $800 comes at 1x, so
    // another 80,000 of spend. Ignoring the cap would have said 50,000.
    assert.equal(r.spendNeeded, 10_000 + 80_000);
  });

  test("the uncapped version of the same card needs far less spend", () => {
    const uncapped = card({
      id: "uncapped",
      annualFee: 1000,
      program: "amex-mr",
      earnRates: [{ category: "other", multiplier: 2, cap: null }],
    });
    const r = breakEven(uncapped, 0, { "amex-mr": 1.0 });
    assert.equal(r.spendNeeded, 50_000);
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
