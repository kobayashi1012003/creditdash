import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  bestCardFor,
  earnCategories,
  effectiveEarnRates,
  picksFor,
  pointsForSpend,
  pointsForSpends,
  quarterKey,
  rateFor,
  spendWorth,
} from "./engine.ts";
import type { Card } from "../../data/types.ts";

/**
 * Chosen categories, rotating categories, quarterly caps and caps shared
 * between categories (11 November 2026). Cards are built here so a seed
 * edit cannot quietly change a result.
 */
function card(partial: Partial<Card> & Pick<Card, "id">): Card {
  return {
    name: partial.id,
    issuer: "Test",
    network: "visa",
    annualFee: 0,
    program: "cash",
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

// Bank of America Customized Cash, as the catalog models it: a picked 3%
// category and 2% groceries sharing $2,500 a quarter.
const custom = card({
  id: "custom",
  earnRates: [
    { category: "groceries", multiplier: 2, cap: 2500, capPeriod: "quarter", capGroup: "combined" },
    { category: "other", multiplier: 1, cap: null },
  ],
  chosenRates: [
    {
      id: "choice",
      label: "Your 3% category",
      multiplier: 3,
      cap: 2500,
      capPeriod: "quarter",
      capGroup: "combined",
      picks: 1,
      options: [
        { id: "gas", label: "Gas", categories: ["gas"] },
        { id: "dining", label: "Dining", categories: ["dining"] },
        { id: "travel", label: "Travel", categories: ["flights", "hotels"] },
        { id: "drugstores", label: "Drug stores", categories: [] },
      ],
      defaultPicks: ["gas"],
    },
  ],
});

const rotating = card({
  id: "rotating",
  earnRates: [{ category: "other", multiplier: 1, cap: null }],
  rotatingRates: [
    {
      id: "five",
      multiplier: 5,
      cap: 1500,
      capPeriod: "quarter",
      activate: true,
      quarters: {
        "2026-Q3": { label: "gas", categories: ["gas"] },
        "2026-Q4": { label: "restaurants", categories: ["dining"] },
      },
    },
  ],
});

describe("chosen categories", () => {
  test("the issuer's default applies until the cardholder picks", () => {
    assert.deepEqual(picksFor(custom, custom.chosenRates![0]), ["gas"]);
    assert.equal(rateFor(custom, "gas").multiplier, 3);
    assert.equal(rateFor(custom, "dining").multiplier, 1);
  });

  test("a pick moves the bonus, and one pick can cover several categories", () => {
    const travel = { ...custom, picks: { choice: ["travel"] } };
    assert.equal(rateFor(travel, "gas").multiplier, 1);
    assert.equal(rateFor(travel, "flights").multiplier, 3);
    assert.equal(rateFor(travel, "hotels").multiplier, 3);
    assert.equal(rateFor(travel, "flights").source, "chosen");
  });

  test("a pick with no app category earns nothing extra anywhere", () => {
    const drug = { ...custom, picks: { choice: ["drugstores"] } };
    assert.deepEqual(
      effectiveEarnRates(drug).map((r) => [r.category, r.multiplier]),
      [
        ["groceries", 2],
        ["other", 1],
      ],
    );
  });

  test("unknown and surplus picks are dropped", () => {
    const odd = { ...custom, picks: { choice: ["nope", "dining", "gas"] } };
    assert.deepEqual(picksFor(odd, custom.chosenRates![0]), ["dining"]);
  });

  test("a bonus never lowers a rate the card already has", () => {
    const strong = card({
      id: "strong",
      earnRates: [
        { category: "dining", multiplier: 4, cap: null },
        { category: "other", multiplier: 1, cap: null },
      ],
      chosenRates: [{ ...custom.chosenRates![0], defaultPicks: ["dining"] }],
    });
    assert.equal(rateFor(strong, "dining").multiplier, 4);
    assert.equal(rateFor(strong, "dining").source, undefined);
  });

  test("ranking follows the cardholder's pick", () => {
    const flat = card({ id: "flat", earnRates: [{ category: "other", multiplier: 2, cap: null }] });
    const dining = { ...custom, picks: { choice: ["dining"] } };
    const v = { cash: 1 };
    assert.equal(bestCardFor([flat, custom], "dining", v)!.card.id, "flat");
    assert.equal(bestCardFor([flat, dining], "dining", v)!.card.id, "custom");
  });
});

describe("rotating categories", () => {
  test("quarters are keyed by local calendar quarter", () => {
    assert.equal(quarterKey(new Date(2026, 0, 1)), "2026-Q1");
    assert.equal(quarterKey(new Date(2026, 9, 1)), "2026-Q4");
    assert.equal(quarterKey(new Date(2026, 11, 31, 23, 59)), "2026-Q4");
  });

  test("only this quarter's categories earn the bonus", () => {
    const q3 = new Date(2026, 7, 15);
    const q4 = new Date(2026, 10, 15);
    assert.equal(rateFor(rotating, "gas", q3).multiplier, 5);
    assert.equal(rateFor(rotating, "dining", q3).multiplier, 1);
    assert.equal(rateFor(rotating, "dining", q4).multiplier, 5);
    assert.equal(rateFor(rotating, "dining", q4).source, "rotating");
    assert.equal(rateFor(rotating, "dining", q4).notes, "Activate each quarter");
  });

  test("a quarter the catalog does not have earns the base rate", () => {
    assert.equal(rateFor(rotating, "dining", new Date(2027, 1, 1)).multiplier, 1);
  });
});

describe("quarterly and shared caps", () => {
  test("a quarterly cap counts four times a year", () => {
    // $10,000 of groceries a year: $2,500 x 4 at 2%.
    assert.equal(pointsForSpend(custom, "groceries", 10_000), 20_000);
    // $12,000: the extra $2,000 earns the everything-else 1%.
    assert.equal(pointsForSpend(custom, "groceries", 12_000), 22_000);
  });

  test("categories in a group share one cap, highest rate first", () => {
    // $8,000 of gas (3%) and $8,000 of groceries (2%) share $10,000 a year.
    const out = pointsForSpends(custom, { gas: 8000, groceries: 8000, other: 1000 });
    assert.equal(out.gas!.points, 24_000);
    assert.equal(out.gas!.capReached, false);
    assert.equal(out.groceries!.points, 2000 * 2 + 6000 * 1);
    assert.equal(out.groceries!.capReached, true);
    assert.equal(out.other!.points, 1000);
  });

  test("the spend calculator uses the shared cap", () => {
    const result = spendWorth(custom, { gas: 8000, groceries: 8000 }, "year", 1);
    assert.equal(result.points, 24_000 + 10_000);
    assert.deepEqual(earnCategories(custom), ["groceries", "gas", "other"]);
  });

  test("a card with no bonus rates is returned untouched", () => {
    const plain = card({ id: "plain", earnRates: [{ category: "other", multiplier: 2, cap: null }] });
    assert.equal(effectiveEarnRates(plain), plain.earnRates);
  });
});
