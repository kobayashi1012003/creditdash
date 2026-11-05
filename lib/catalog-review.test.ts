import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { endedBy, reviewCatalog, STALE_AFTER_DAYS } from "./catalog-review.ts";
import { CARDS } from "../data/cards.seed.ts";
import type { Card } from "../data/types.ts";

const card = (id: string, lastVerified: string, sourceUrl?: string) =>
  ({ id, name: id, lastVerified, sourceUrl }) as Card;

describe("reviewCatalog", () => {
  const today = new Date(2026, 10, 1); // 1 November 2026

  test("counts days since the last check, stalest first", () => {
    const rows = reviewCatalog(
      [card("b", "2026-10-28"), card("a", "2026-07-01"), card("c", "2026-11-01")],
      today,
    );
    assert.deepEqual(rows.map((r) => [r.card.id, r.daysSince]), [
      ["a", 123],
      ["b", 4],
      ["c", 0],
    ]);
  });

  test(`flags a card at ${STALE_AFTER_DAYS} days, not before`, () => {
    const rows = reviewCatalog([card("due", "2026-08-03"), card("fine", "2026-08-04")], today);
    assert.equal(rows.find((r) => r.card.id === "due")?.stale, true);
    assert.equal(rows.find((r) => r.card.id === "fine")?.stale, false);
  });

  test("a check dated in the future reads as today, not negative", () => {
    assert.equal(reviewCatalog([card("x", "2026-12-01")], today)[0].daysSince, 0);
  });

  test("reports the terms page when there is one", () => {
    const [row] = reviewCatalog([card("x", "2026-11-01", "https://example.test/terms")], today);
    assert.equal(row.source, "https://example.test/terms");
    assert.equal(reviewCatalog([card("y", "2026-11-01")], today)[0].source, null);
  });

  test("a limited credit counts as ended the day after its last day", () => {
    assert.equal(endedBy("2026-10-31", today), true);
    assert.equal(endedBy("2026-11-01", today), false);
  });

  test("flags a fresh card whose limited credit has ended", () => {
    const fresh = {
      ...card("x", "2026-11-01"),
      credits: [
        { id: "a", name: "Lyft", endsOn: "2026-10-31" },
        { id: "b", name: "Peloton", endsOn: "2027-12-31" },
      ],
    } as Card;
    const [row] = reviewCatalog([fresh], today);
    assert.deepEqual(row.ended, ["Lyft"]);
    assert.equal(row.stale, true);
  });
});

describe("the catalog itself", () => {
  test("every id is unique, and so is every credit and perk id", () => {
    const ids = CARDS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    const credits = CARDS.flatMap((c) => c.credits.map((x) => x.id));
    assert.equal(new Set(credits).size, credits.length);
    const perks = CARDS.flatMap((c) => (c.perks ?? []).map((x) => x.id));
    assert.equal(new Set(perks).size, perks.length);
  });

  test("every end date is a real ISO date", () => {
    for (const c of CARDS) {
      for (const x of c.credits) {
        if (x.endsOn) assert.match(x.endsOn, /^\d{4}-\d{2}-\d{2}$/, x.id);
      }
    }
  });

  test("counted perks count something, and only free nights carry a points cap", () => {
    for (const c of CARDS) {
      for (const p of c.perks ?? []) {
        if (p.count) {
          assert.ok(Number.isInteger(p.count.perYear) && p.count.perYear > 0, p.id);
          assert.ok(p.count.unit[0] && p.count.unit[1], p.id);
        }
        if (p.pointsCap !== undefined) {
          assert.equal(p.kind, "free-night", p.id);
          assert.ok(p.count, `${p.id} has a cap but no count`);
        }
        // Free nights and companion fares are valued per one used, so they
        // need a count, or the calculator would list them as included.
        if (p.kind === "free-night" || p.kind === "companion") assert.ok(p.count, p.id);
      }
    }
  });

  test("Venture X's anniversary miles are a field, not fine print", () => {
    const vx = CARDS.find((c) => c.id === "venture-x")!;
    assert.deepEqual(vx.anniversaryBonus, { points: 10000, unit: "miles" });
    assert.ok(!(vx.finePrint ?? []).some((l) => /anniversary/i.test(l) && /10,000/.test(l)));
  });

  test("a boost is always above the rate it boosts", () => {
    for (const c of CARDS) {
      for (const r of c.earnRates) {
        if (r.boost) assert.ok(r.boost.multiplier > r.multiplier, `${c.id} ${r.category}`);
      }
    }
  });

  test("every card has an everything-else rate and a valid date", () => {
    for (const c of CARDS) {
      assert.ok(c.earnRates.some((r) => r.category === "other"), c.id);
      assert.match(c.lastVerified, /^\d{4}-\d{2}-\d{2}$/, c.id);
    }
  });

  test("cards checked against issuer terms say where", () => {
    for (const c of CARDS.filter((x) => x.lastVerified === "2026-11-01")) {
      assert.ok(c.sourceUrl?.startsWith("https://"), c.id);
    }
  });
});
