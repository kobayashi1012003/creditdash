import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { currentPeriodKey } from "./reset.ts";

/**
 * The v1 to v2 migration in lib/data/schema.ts cannot be imported here: it
 * pulls in the card seed through path aliases, which `node --test` does not
 * resolve. What it actually depends on is the key mapping, so that is what
 * is pinned here, against the same reset logic the migration calls.
 *
 * If one of these changes, the migration is moving data to the wrong place
 * and someone's tracked credits quietly vanish from the Tracker.
 */

describe("v1 to v2 key mapping", () => {
  test("a calendar key is identical in both versions, so nothing moves", () => {
    // v1 wrote these, and v2 still computes them.
    assert.equal(
      currentPeriodKey({
        period: "monthly",
        resetBasis: "calendar",
        on: new Date(2026, 9, 15),
      }),
      "2026-10",
    );
    assert.equal(
      currentPeriodKey({
        period: "annual",
        resetBasis: "calendar",
        on: new Date(2026, 5, 1),
      }),
      "2026",
    );
  });

  test("a v1 annual key lands in the cycle overlapping most of that year", () => {
    // v1 stored "2026" for an anniversary credit on a November card. The
    // cycle running Nov 2025 to Oct 2026 covers ten months of 2026; the one
    // starting Nov 2026 covers two. The first is the honest target.
    const target = currentPeriodKey({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: new Date(2026, 6, 1),
    });
    assert.equal(target, "a2025-11");
  });

  test("an anniversary before July picks that same year's cycle", () => {
    const target = currentPeriodKey({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 6,
      on: new Date(2026, 6, 1),
    });
    assert.equal(target, "a2026-06");
  });

  test("the July crossover sits where the overlap actually flips", () => {
    // Month 7 covers six months of its own year and six of the next, so it
    // is the first month that maps to its own year's cycle.
    assert.equal(
      currentPeriodKey({
        period: "annual",
        resetBasis: "anniversary",
        anniversaryMonth: 7,
        on: new Date(2026, 6, 1),
      }),
      "a2026-07",
    );
    assert.equal(
      currentPeriodKey({
        period: "annual",
        resetBasis: "anniversary",
        anniversaryMonth: 8,
        on: new Date(2026, 6, 1),
      }),
      "a2025-08",
    );
  });

  test("a migrated key is not one a calendar credit could ever produce", () => {
    const anniversary = currentPeriodKey({
      period: "annual",
      resetBasis: "anniversary",
      anniversaryMonth: 11,
      on: new Date(2026, 6, 1),
    });
    const calendar = currentPeriodKey({
      period: "annual",
      resetBasis: "calendar",
      on: new Date(2026, 6, 1),
    });
    assert.notEqual(anniversary, calendar);
    assert.match(anniversary!, /^a/);
  });
});
