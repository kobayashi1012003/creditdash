import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { creditEnded, offeredPeriods, windowOffered } from "./limited.ts";
import { periodWindows } from "./reset.ts";

/** Local time, so these hold in any timezone the tests run in. */
const at = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h);

// The shapes of real catalog credits (data/cards.seed.ts).
const selectHotels = { amount: 250, period: "annual", resetBasis: "calendar", endsOn: "2026-12-31" } as const;
const lyft = { amount: 10, period: "monthly", resetBasis: "calendar", endsOn: "2027-09-30" } as const;
const stubhub = { amount: 150, period: "semiannual", resetBasis: "calendar", endsOn: "2027-12-31" } as const;
const dining: { amount: number; period: "monthly"; resetBasis: "calendar"; endsOn?: string } = {
  amount: 10,
  period: "monthly",
  resetBasis: "calendar",
};

describe("creditEnded", () => {
  test("still offered through the whole of its last day", () => {
    assert.equal(creditEnded(selectHotels, at(2026, 12, 31, 23)), false);
  });
  test("ended from local midnight after the last day", () => {
    assert.equal(creditEnded(selectHotels, at(2027, 1, 1)), true);
  });
  test("a credit with no end never ends", () => {
    assert.equal(creditEnded(dining, at(2040, 1, 1)), false);
  });
});

describe("offeredPeriods", () => {
  test("a monthly credit ending in September counts nine months of its last year", () => {
    assert.equal(offeredPeriods(lyft, undefined, at(2027, 3, 15)), 9);
  });
  test("it counts the full twelve the year before", () => {
    assert.equal(offeredPeriods(lyft, undefined, at(2026, 11, 4)), 12);
  });
  test("an annual credit is worth its whole amount until it ends, then nothing", () => {
    assert.equal(offeredPeriods(selectHotels, undefined, at(2026, 11, 4)), 1);
    assert.equal(offeredPeriods(selectHotels, undefined, at(2027, 1, 1)), 0);
  });
  test("a credit ending on the last day of a year keeps both halves", () => {
    assert.equal(offeredPeriods(stubhub, undefined, at(2027, 6, 1)), 2);
  });
  test("credits with no end keep their full count", () => {
    assert.equal(offeredPeriods(dining, undefined, at(2027, 6, 1)), 12);
  });
  test("an anniversary cycle counts only the periods before the end", () => {
    // Anniversary in November: the 2026-11 cycle runs to October 2027, and
    // a monthly credit ending 30 September 2027 loses only October.
    const credit = { ...lyft, resetBasis: "anniversary" } as const;
    assert.equal(offeredPeriods(credit, { anniversaryMonth: 11 }, at(2027, 3, 1)), 11);
  });
});

describe("windowOffered", () => {
  test("marks the months after the end, and only those", () => {
    const windows = periodWindows({ period: "monthly", resetBasis: "calendar", on: at(2027, 5, 1) });
    const offered = windows.map((w) => windowOffered(lyft, w));
    assert.deepEqual(offered, [true, true, true, true, true, true, true, true, true, false, false, false]);
  });
});
