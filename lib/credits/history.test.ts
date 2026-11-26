import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  currentPeriodKey,
  currentWindowIndex,
  cycleInYear,
  cycleLabel,
  periodWindows,
  trackerYears,
  type CreditPeriod,
  type CycleOptions,
} from "./reset.ts";

/** Local time, so these hold in any timezone the tests run in. */
const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s);
const keys = (o: CycleOptions) => periodWindows(o).map((w) => w.key);
const PERIODS: CreditPeriod[] = ["monthly", "quarterly", "semiannual", "annual"];

describe("a past year finds what was ticked while it was current", () => {
  // The invariant that makes history work: the Tracker stores a tick under
  // the open window's key, and the year view must ask for the same key.
  test("calendar credits: any day of the year gives that year's keys", () => {
    for (const period of PERIODS) {
      const history = keys({ period, resetBasis: "calendar", on: cycleInYear(2025, { resetBasis: "calendar" }) });
      for (const day of [at(2025, 1, 1), at(2025, 6, 15), at(2025, 12, 31, 23, 59, 59)]) {
        assert.deepEqual(keys({ period, resetBasis: "calendar", on: day }), history, `${period} on ${day}`);
      }
    }
  });

  test("anniversary credits: any day of the card year gives its keys", () => {
    const opts = { resetBasis: "anniversary" as const, anniversaryMonth: 11, anniversaryDay: 14 };
    for (const period of PERIODS) {
      const history = keys({ period, ...opts, on: cycleInYear(2025, opts) });
      // The card year that starts 14 Nov 2025 runs to 13 Nov 2026.
      for (const day of [at(2025, 11, 14), at(2026, 3, 1), at(2026, 11, 13, 23, 59)]) {
        assert.deepEqual(keys({ period, ...opts, on: day }), history, `${period} on ${day}`);
      }
      assert.notDeepEqual(keys({ period, ...opts, on: at(2026, 11, 14) }), history, "the next card year differs");
    }
  });
});

describe("cycleInYear", () => {
  test("a calendar year starts on 1 January", () => {
    const w = periodWindows({ period: "monthly", resetBasis: "calendar", on: cycleInYear(2025, { resetBasis: "calendar" }) });
    assert.equal(w[0].key, "2025-01");
    assert.equal(w[11].key, "2025-12");
  });

  test("an anniversary year is the card year that starts in it", () => {
    const opts = { resetBasis: "anniversary" as const, anniversaryMonth: 11 };
    const w = periodWindows({ period: "quarterly", ...opts, on: cycleInYear(2025, opts) });
    assert.equal(w[0].key, "a2025-11:Q1");
    assert.equal(w[0].start.getTime(), at(2025, 11, 1).getTime());
    assert.equal(w[3].end.getTime(), at(2026, 11, 1).getTime());
  });

  test("an anniversary on the 29th of February falls on the 28th in other years", () => {
    const opts = { resetBasis: "anniversary" as const, anniversaryMonth: 2, anniversaryDay: 29 };
    assert.equal(cycleInYear(2027, opts).getTime(), at(2027, 2, 28).getTime());
    assert.equal(cycleInYear(2028, opts).getTime(), at(2028, 2, 29).getTime());
  });
});

describe("the new year, in the device's own time", () => {
  test("the last second of 2026 is still 2026; midnight is 2027", () => {
    const before = at(2026, 12, 31, 23, 59, 59);
    const after = at(2027, 1, 1, 0, 0, 0);
    assert.equal(currentPeriodKey({ period: "monthly", resetBasis: "calendar", on: before }), "2026-12");
    assert.equal(currentPeriodKey({ period: "monthly", resetBasis: "calendar", on: after }), "2027-01");
    assert.equal(currentPeriodKey({ period: "annual", resetBasis: "calendar", on: before }), "2026");
    assert.equal(currentPeriodKey({ period: "annual", resetBasis: "calendar", on: after }), "2027");
    assert.equal(currentPeriodKey({ period: "quarterly", resetBasis: "calendar", on: after }), "2027-Q1");
    assert.equal(currentWindowIndex({ period: "monthly", resetBasis: "calendar", on: after }), 0);
  });

  test("2026's keys are untouched by the turn of the year", () => {
    const year2026 = keys({ period: "monthly", resetBasis: "calendar", on: cycleInYear(2026, { resetBasis: "calendar" }) });
    const fromJanuary = keys({ period: "monthly", resetBasis: "calendar", on: at(2026, 12, 31, 23, 59) });
    assert.deepEqual(year2026, fromJanuary);
    assert.ok(!year2026.some((k) => k.startsWith("2027")));
  });

  test("an anniversary card year rolls over on its own date, not on 1 January", () => {
    const opts = { period: "monthly" as const, resetBasis: "anniversary" as const, anniversaryMonth: 3 };
    assert.equal(currentPeriodKey({ ...opts, on: at(2027, 1, 1) }), "a2026-03:M11");
    assert.equal(currentPeriodKey({ ...opts, on: at(2027, 3, 1) }), "a2027-03:M01");
  });
});

describe("trackerYears", () => {
  const now = at(2026, 11, 26);
  test("from the opened year to this one, newest first", () => {
    assert.deepEqual(trackerYears("2024-03-05", now), [2026, 2025, 2024]);
  });
  test("a card opened this year has this year only", () => {
    assert.deepEqual(trackerYears("2026-11-02", now), [2026]);
  });
  test("a missing, unreadable or future date gives this year only", () => {
    assert.deepEqual(trackerYears(undefined, now), [2026]);
    assert.deepEqual(trackerYears("not a date", now), [2026]);
    assert.deepEqual(trackerYears("2031-01-01", now), [2026]);
  });
  test("on 1 January the new year is offered first", () => {
    assert.deepEqual(trackerYears("2025-06-01", at(2027, 1, 1)), [2027, 2026, 2025]);
  });
  test("a typo decades back is bounded", () => {
    assert.equal(trackerYears("1901-01-01", now).length, 51);
  });
});

describe("cycleLabel", () => {
  test("a calendar year", () => {
    const w = periodWindows({ period: "monthly", resetBasis: "calendar", on: at(2025, 5, 1) });
    assert.equal(cycleLabel(w), "Jan to Dec 2025");
  });
  test("a card year across two years", () => {
    const w = periodWindows({ period: "quarterly", resetBasis: "anniversary", anniversaryMonth: 11, on: at(2025, 12, 1) });
    assert.equal(cycleLabel(w), "Nov 2025 to Oct 2026");
  });
  test("a card year starting mid-month names its days", () => {
    const w = periodWindows({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 3,
      anniversaryDay: 14,
      on: at(2025, 6, 1),
    });
    assert.equal(cycleLabel(w), "Mar 14 2025 to Mar 13 2026");
  });
});
