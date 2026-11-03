import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { autoFillDue, localDate, nextCheck, parseLocalDate, startAutoFill } from "./autofill.ts";
import { currentPeriodKey, cycleStart, periodWindows, windowsOpenedBetween } from "./reset.ts";

/** Local time, so these hold in any timezone the tests run in. */
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

const monthly = { period: "monthly", resetBasis: "calendar" } as const;

describe("anniversary day", () => {
  const vx = { period: "annual", resetBasis: "anniversary", anniversaryMonth: 6, anniversaryDay: 21 } as const;

  test("the cycle turns on the day, not the 1st", () => {
    assert.equal(localDate(cycleStart({ ...vx, on: at(2026, 6, 20) })), "2025-06-21");
    assert.equal(localDate(cycleStart({ ...vx, on: at(2026, 6, 21) })), "2026-06-21");
  });

  test("keys still name the cycle by its month", () => {
    assert.equal(currentPeriodKey({ ...vx, on: at(2026, 6, 21) }), "a2026-06");
    assert.equal(currentPeriodKey({ ...vx, on: at(2026, 6, 20) }), "a2025-06");
  });

  test("windows run day to day and say so", () => {
    const [w] = periodWindows({ ...vx, on: at(2026, 7, 1) });
    assert.equal(localDate(w.start), "2026-06-21");
    assert.equal(localDate(w.end), "2027-06-21");
    assert.equal(w.label, "Jun 21 2026 to Jun 20 2027");
  });

  test("a day past the month's end clamps to its last day", () => {
    const q = { period: "monthly", resetBasis: "anniversary", anniversaryMonth: 1, anniversaryDay: 31 } as const;
    const w = periodWindows({ ...q, on: at(2028, 3, 1) });
    assert.equal(localDate(w[1].start), "2028-02-29"); // leap year
    assert.equal(localDate(w[2].start), "2028-03-31");
    assert.equal(localDate(w[1].end), "2028-03-31");
  });

  test("no day means the 1st, exactly as before", () => {
    const plain = { period: "quarterly", resetBasis: "anniversary", anniversaryMonth: 11 } as const;
    assert.deepEqual(
      periodWindows({ ...plain, on: at(2026, 12, 5) }).map((w) => [w.key, localDate(w.start), w.label]),
      [
        ["a2026-11:Q1", "2026-11-01", "Nov to Jan"],
        ["a2026-11:Q2", "2027-02-01", "Feb to Apr"],
        ["a2026-11:Q3", "2027-05-01", "May to Jul"],
        ["a2026-11:Q4", "2027-08-01", "Aug to Oct"],
      ],
    );
  });
});

describe("windowsOpenedBetween", () => {
  test("crosses a year end, oldest first", () => {
    const w = windowsOpenedBetween(monthly, at(2026, 11, 1), at(2027, 2, 3));
    assert.deepEqual(w.map((x) => x.key), ["2026-12", "2027-01", "2027-02"]);
  });

  test("nothing when the open window started on or before `after`", () => {
    assert.equal(windowsOpenedBetween(monthly, at(2026, 11, 1), at(2026, 11, 30, 23, 59)).length, 0);
  });
});

describe("auto-fill", () => {
  test("switching on fills the open period and nothing earlier", () => {
    const entry = startAutoFill(monthly, at(2026, 11, 17, 14, 5));
    assert.deepEqual(entry, { since: "2026-11-17", through: "2026-10-31" });
    const due = autoFillDue(monthly, entry, at(2026, 11, 17, 14, 5));
    assert.deepEqual(due.windows.map((w) => w.key), ["2026-11"]);
    assert.equal(due.through, "2026-11-01");
  });

  test("nothing more until local midnight on the 1st", () => {
    const entry = { since: "2026-11-17", through: "2026-11-01" };
    assert.equal(autoFillDue(monthly, entry, at(2026, 11, 30, 23, 59)).windows.length, 0);
    const due = autoFillDue(monthly, entry, at(2026, 12, 1, 0, 0));
    assert.deepEqual(due.windows.map((w) => w.key), ["2026-12"]);
    assert.equal(due.through, "2026-12-01");
  });

  test("catches up every period missed while the app was closed", () => {
    const due = autoFillDue(monthly, { since: "2026-11-17", through: "2026-11-01" }, at(2027, 2, 9));
    assert.deepEqual(due.windows.map((w) => w.key), ["2026-12", "2027-01", "2027-02"]);
    assert.equal(due.through, "2027-02-01");
  });

  test("an unticked period is not ticked again", () => {
    // After December was filled `through` moved to 1 December, so a check
    // later that month finds nothing, whatever the user did to December.
    const after = autoFillDue(monthly, { since: "2026-11-17", through: "2026-12-01" }, at(2026, 12, 20));
    assert.equal(after.windows.length, 0);
  });

  test("follows the card's anniversary day for anniversary credits", () => {
    const vx = { period: "annual", resetBasis: "anniversary", anniversaryMonth: 6, anniversaryDay: 21 } as const;
    const entry = startAutoFill(vx, at(2026, 11, 3));
    assert.equal(entry.through, "2026-06-20");
    assert.equal(autoFillDue(vx, { ...entry, through: "2026-06-21" }, at(2027, 6, 20, 23, 59)).windows.length, 0);
    const due = autoFillDue(vx, { ...entry, through: "2026-06-21" }, at(2027, 6, 21));
    assert.deepEqual(due.windows.map((w) => w.key), ["a2027-06"]);
  });

  test("quarterly and semiannual open on their own boundaries", () => {
    const q = { period: "quarterly", resetBasis: "calendar" } as const;
    const due = autoFillDue(q, { since: "2026-11-03", through: "2026-10-01" }, at(2027, 4, 1));
    assert.deepEqual(due.windows.map((w) => w.key), ["2027-Q1", "2027-Q2"]);
  });

  test("an unreadable entry starts fresh rather than filling the past", () => {
    const due = autoFillDue(monthly, { since: "x", through: "not a date" }, at(2026, 11, 3));
    assert.deepEqual(due.windows.map((w) => w.key), ["2026-11"]);
  });
});

describe("local dates", () => {
  test("round trip, and reject impossible dates", () => {
    assert.equal(localDate(at(2026, 3, 8)), "2026-03-08");
    assert.equal(parseLocalDate("2026-02-30"), null);
    assert.equal(localDate(parseLocalDate("2028-02-29")!), "2028-02-29");
  });

  test("the next check is the next local midnight, across a DST change", () => {
    // 8 March 2026 is a daylight saving day in the US; a fixed 24h step
    // would land at 01:00 or 23:00 instead of midnight.
    const next = nextCheck(at(2026, 3, 8, 12));
    assert.equal(localDate(next), "2026-03-09");
    assert.equal(next.getHours(), 0);
  });
});
