import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { missingQuarters } from "./catalog-review.ts";
import { CATEGORIES } from "./categories.ts";
import { isProgram } from "../data/programs.ts";
import { CARDS } from "../data/cards.seed.ts";

/**
 * Checks on the catalog's chosen and rotating rates, shared caps and the
 * rotating calendar the admin page asks for (11 November 2026).
 */

describe("rotating quarters", () => {
  const card = {
    rotatingRates: [
      {
        id: "five",
        multiplier: 5,
        cap: 1500,
        activate: true,
        quarters: { "2026-Q4": { label: "restaurants", categories: ["dining" as const] } },
      },
    ],
  };

  test("this quarter must be entered", () => {
    assert.deepEqual(missingQuarters(card, new Date(2027, 1, 10)), ["2027-Q1"]);
  });

  test("next quarter is due 30 days before it starts, not earlier", () => {
    assert.deepEqual(missingQuarters(card, new Date(2026, 10, 15)), []);
    assert.deepEqual(missingQuarters(card, new Date(2026, 11, 5)), ["2027-Q1"]);
  });

  test("a card without rotating rates needs nothing", () => {
    assert.deepEqual(missingQuarters({}, new Date(2026, 11, 5)), []);
  });
});

describe("the catalog's chosen and rotating rates", () => {
  const known = new Set<string>(CATEGORIES);

  test("every program is known, and every category is one the app has", () => {
    for (const c of CARDS) {
      assert.ok(isProgram(c.program), c.id);
      for (const r of c.earnRates) assert.ok(known.has(r.category), `${c.id} ${r.category}`);
      for (const r of c.chosenRates ?? [])
        for (const o of r.options)
          for (const cat of o.categories) assert.ok(known.has(cat), `${c.id} ${o.id}`);
      for (const r of c.rotatingRates ?? [])
        for (const q of Object.values(r.quarters))
          for (const cat of q.categories) assert.ok(known.has(cat), c.id);
    }
  });

  test("chosen rates offer enough options, and defaults are real options", () => {
    for (const c of CARDS) {
      for (const r of c.chosenRates ?? []) {
        const ids = r.options.map((o) => o.id);
        assert.equal(new Set(ids).size, ids.length, `${c.id} ${r.id} duplicate option`);
        assert.ok(r.picks >= 1 && r.picks < ids.length, `${c.id} ${r.id} picks`);
        for (const d of r.defaultPicks ?? []) assert.ok(ids.includes(d), `${c.id} ${r.id} default ${d}`);
        assert.ok((r.defaultPicks ?? []).length <= r.picks, `${c.id} ${r.id} too many defaults`);
      }
    }
  });

  test("rotating quarters are keyed YYYY-Qn", () => {
    for (const c of CARDS)
      for (const r of c.rotatingRates ?? [])
        for (const key of Object.keys(r.quarters)) assert.match(key, /^\d{4}-Q[1-4]$/, `${c.id} ${key}`);
  });

  test("rates sharing a cap carry the same cap and period", () => {
    for (const c of CARDS) {
      const members = [
        ...c.earnRates.filter((r) => r.capGroup),
        ...(c.chosenRates ?? []).filter((r) => r.capGroup),
      ];
      const byGroup = new Map<string, string>();
      for (const m of members) {
        assert.ok(m.cap !== null, `${c.id} ${m.capGroup} has no cap`);
        const shape = `${m.cap}/${m.capPeriod ?? "year"}`;
        const seen = byGroup.get(m.capGroup!);
        if (seen) assert.equal(shape, seen, `${c.id} ${m.capGroup}`);
        else byGroup.set(m.capGroup!, shape);
      }
    }
  });

  test("a foreign fee is a number or explicitly not stated", () => {
    for (const c of CARDS) {
      assert.ok(c.foreignTransactionFee === null || c.foreignTransactionFee >= 0, c.id);
    }
  });
});
