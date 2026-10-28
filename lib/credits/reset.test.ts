import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  currentPeriodKey,
  currentWindowIndex,
  cycleStart,
  daysUntilReset,
  expiresWithin,
  periodWindows,
  PERIOD_COUNT,
} from "./reset.ts";

/** Local midnight, so these do not drift with the machine's timezone. */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

describe("cycleStart", () => {
  test("calendar always starts on 1 January of the year in question", () => {
    assert.equal(
      iso(cycleStart({ resetBasis: "calendar", on: at(2026, 10, 27) })),
      "2026-01-01",
    );
    assert.equal(
      iso(cycleStart({ resetBasis: "calendar", on: at(2026, 1, 1) })),
      "2026-01-01",
    );
    assert.equal(
      iso(cycleStart({ resetBasis: "calendar", on: at(2026, 12, 31) })),
      "2026-01-01",
    );
  });

  test("anniversary starts in the anniversary month once it has passed", () => {
    assert.equal(
      iso(
        cycleStart({
          resetBasis: "anniversary",
          anniversaryMonth: 11,
          on: at(2026, 12, 5),
        }),
      ),
      "2026-11-01",
    );
  });

  test("anniversary falls back a year before the anniversary comes round", () => {
    // March 2026 is still inside the cycle that opened in November 2025.
    assert.equal(
      iso(
        cycleStart({
          resetBasis: "anniversary",
          anniversaryMonth: 11,
          on: at(2026, 3, 15),
        }),
      ),
      "2025-11-01",
    );
  });

  test("the anniversary day itself opens the new cycle", () => {
    assert.equal(
      iso(
        cycleStart({
          resetBasis: "anniversary",
          anniversaryMonth: 11,
          on: at(2026, 11, 1),
        }),
      ),
      "2026-11-01",
    );
  });

  test("a January anniversary matches the calendar basis", () => {
    const anniversary = cycleStart({
      resetBasis: "anniversary",
      anniversaryMonth: 1,
      on: at(2026, 7, 4),
    });
    const calendar = cycleStart({ resetBasis: "calendar", on: at(2026, 7, 4) });
    assert.equal(iso(anniversary), iso(calendar));
  });

  test("a December anniversary does not roll into the next year", () => {
    assert.equal(
      iso(
        cycleStart({
          resetBasis: "anniversary",
          anniversaryMonth: 12,
          on: at(2026, 12, 31),
        }),
      ),
      "2026-12-01",
    );
    assert.equal(
      iso(
        cycleStart({
          resetBasis: "anniversary",
          anniversaryMonth: 12,
          on: at(2027, 1, 2),
        }),
      ),
      "2026-12-01",
    );
  });

  test("a nonsense anniversary month falls back to January rather than throwing", () => {
    for (const month of [0, 13, -3, NaN, undefined]) {
      assert.equal(
        iso(
          cycleStart({
            resetBasis: "anniversary",
            anniversaryMonth: month as number,
            on: at(2026, 5, 9),
          }),
        ),
        "2026-01-01",
      );
    }
  });
});

describe("periodWindows", () => {
  test("produces one window per period of the cycle", () => {
    for (const period of ["monthly", "quarterly", "semiannual", "annual"] as const) {
      const windows = periodWindows({
        period,
        resetBasis: "calendar",
        on: at(2026, 6, 1),
      });
      assert.equal(windows.length, PERIOD_COUNT[period], period);
    }
  });

  test("windows are contiguous and cover exactly twelve months", () => {
    for (const period of ["monthly", "quarterly", "semiannual", "annual"] as const) {
      for (const resetBasis of ["calendar", "anniversary"] as const) {
        const windows = periodWindows({
          period,
          resetBasis,
          anniversaryMonth: 11,
          on: at(2026, 3, 15),
        });
        for (let i = 1; i < windows.length; i++) {
          assert.equal(
            iso(windows[i].start),
            iso(windows[i - 1].end),
            `${period}/${resetBasis} gap before window ${i}`,
          );
        }
        const first = windows[0].start;
        const last = windows[windows.length - 1].end;
        assert.equal(
          (last.getFullYear() - first.getFullYear()) * 12 +
            (last.getMonth() - first.getMonth()),
          12,
          `${period}/${resetBasis} does not span a year`,
        );
      }
    }
  });

  test("calendar quarters start in January, April, July and October", () => {
    const windows = periodWindows({
      period: "quarterly",
      resetBasis: "calendar",
      on: at(2026, 5, 1),
    });
    assert.deepEqual(
      windows.map((w) => iso(w.start)),
      ["2026-01-01", "2026-04-01", "2026-07-01", "2026-10-01"],
    );
  });

  test("a November anniversary shifts the quarters to Nov, Feb, May, Aug", () => {
    const windows = periodWindows({
      period: "quarterly",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: at(2026, 3, 15),
    });
    assert.deepEqual(
      windows.map((w) => iso(w.start)),
      ["2025-11-01", "2026-02-01", "2026-05-01", "2026-08-01"],
    );
    assert.deepEqual(
      windows.map((w) => w.label),
      ["Nov to Jan", "Feb to Apr", "May to Jul", "Aug to Oct"],
    );
  });

  test("anniversary windows wrap across the new year correctly", () => {
    const windows = periodWindows({
      period: "monthly",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: at(2026, 1, 10),
    });
    assert.equal(iso(windows[0].start), "2025-11-01");
    assert.equal(iso(windows[2].start), "2026-01-01");
    assert.equal(iso(windows[11].end), "2026-11-01");
    assert.equal(windows[2].label, "January");
  });

  test("labels name both ends of an anniversary year, and just the year for a calendar one", () => {
    const [calendar] = periodWindows({
      period: "annual",
      resetBasis: "calendar",
      on: at(2026, 6, 1),
    });
    assert.equal(calendar.label, "2026");

    const [anniversary] = periodWindows({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: at(2026, 12, 1),
    });
    assert.equal(anniversary.label, "Nov 2026 to Oct 2027");
  });
});

describe("period keys", () => {
  test("calendar keys keep the plain format", () => {
    const key = (period: "monthly" | "quarterly" | "semiannual" | "annual") =>
      currentPeriodKey({ period, resetBasis: "calendar", on: at(2026, 3, 9) });
    assert.equal(key("annual"), "2026");
    assert.equal(key("semiannual"), "2026-H1");
    assert.equal(key("quarterly"), "2026-Q1");
    assert.equal(key("monthly"), "2026-03");
  });

  test("anniversary keys carry the cycle start, so they cannot collide", () => {
    const key = (period: "monthly" | "quarterly" | "semiannual" | "annual") =>
      currentPeriodKey({
        period,
        resetBasis: "anniversary",
        anniversaryMonth: 11,
        on: at(2026, 3, 9),
      });
    assert.equal(key("annual"), "a2025-11");
    assert.equal(key("semiannual"), "a2025-11:H1");
    assert.equal(key("quarterly"), "a2025-11:Q2");
    assert.equal(key("monthly"), "a2025-11:M05");
  });

  test("every key within a cycle is distinct", () => {
    for (const period of ["monthly", "quarterly", "semiannual", "annual"] as const) {
      const keys = periodWindows({
        period,
        resetBasis: "anniversary",
        anniversaryMonth: 7,
        on: at(2026, 9, 1),
      }).map((w) => w.key);
      assert.equal(new Set(keys).size, keys.length, period);
    }
  });

  test("consecutive cycles do not reuse a key", () => {
    const thisYear = currentPeriodKey({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: at(2026, 12, 1),
    });
    const nextYear = currentPeriodKey({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: at(2027, 12, 1),
    });
    assert.notEqual(thisYear, nextYear);
  });
});

describe("currentWindowIndex", () => {
  test("tracks the month through a calendar year", () => {
    for (let month = 1; month <= 12; month++) {
      assert.equal(
        currentWindowIndex({
          period: "monthly",
          resetBasis: "calendar",
          on: at(2026, month, 15),
        }),
        month - 1,
      );
    }
  });

  test("counts from the anniversary, not from January", () => {
    // Cycle opens in June. October is its fifth month, so index 4.
    assert.equal(
      currentWindowIndex({
        period: "monthly",
        resetBasis: "anniversary",
        anniversaryMonth: 6,
        on: at(2026, 10, 5),
      }),
      4,
    );
  });

  test("the last day of a window still belongs to it", () => {
    assert.equal(
      currentWindowIndex({
        period: "monthly",
        resetBasis: "calendar",
        on: new Date(2026, 0, 31, 23, 59, 59),
      }),
      0,
    );
  });

  test("the first moment of the next window has moved on", () => {
    assert.equal(
      currentWindowIndex({
        period: "monthly",
        resetBasis: "calendar",
        on: at(2026, 2, 1),
      }),
      1,
    );
  });

  test("February in a leap year is handled by month arithmetic, not day counting", () => {
    const windows = periodWindows({
      period: "monthly",
      resetBasis: "calendar",
      on: at(2024, 2, 29),
    });
    assert.equal(iso(windows[1].start), "2024-02-01");
    assert.equal(iso(windows[1].end), "2024-03-01");
    assert.equal(
      currentWindowIndex({
        period: "monthly",
        resetBasis: "calendar",
        on: at(2024, 2, 29),
      }),
      1,
    );
  });
});

describe("expiresWithin", () => {
  test("a monthly credit late in the month is expiring", () => {
    assert.equal(
      expiresWithin(
        { period: "monthly", resetBasis: "calendar", on: at(2026, 10, 27) },
        31,
      ),
      true,
    );
  });

  test("an annual calendar credit in March is not", () => {
    assert.equal(
      expiresWithin(
        { period: "annual", resetBasis: "calendar", on: at(2026, 3, 1) },
        31,
      ),
      false,
    );
  });

  test("an annual calendar credit in December is", () => {
    assert.equal(
      expiresWithin(
        { period: "annual", resetBasis: "calendar", on: at(2026, 12, 10) },
        31,
      ),
      true,
    );
  });

  test("an anniversary credit expires near its own anniversary, not in December", () => {
    const options = {
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 6,
    } as const;

    // December is mid-cycle for a June anniversary.
    assert.equal(expiresWithin({ ...options, on: at(2026, 12, 10) }, 31), false);
    // Late May is the week before it resets.
    assert.equal(expiresWithin({ ...options, on: at(2026, 5, 20) }, 31), true);
  });
});

describe("daysUntilReset", () => {
  test("counts to the first of the next month", () => {
    assert.equal(
      daysUntilReset({
        period: "monthly",
        resetBasis: "calendar",
        on: at(2026, 10, 27),
      }),
      5,
    );
  });

  test("counts to the anniversary for an anniversary credit", () => {
    assert.equal(
      daysUntilReset({
        period: "annual",
        resetBasis: "anniversary",
        anniversaryMonth: 11,
        on: at(2026, 10, 27),
      }),
      5,
    );
  });
});
