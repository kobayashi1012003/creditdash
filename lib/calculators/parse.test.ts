import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCents, parseMoney, parsePoints } from "./parse.ts";

describe("parseMoney", () => {
  test("reads the ways people write dollars", () => {
    assert.equal(parseMoney("$1,200"), 1200);
    assert.equal(parseMoney("1200"), 1200);
    assert.equal(parseMoney("1200.50"), 1200.5);
    assert.equal(parseMoney(" $45 "), 45);
    assert.equal(parseMoney(".5"), 0.5);
    assert.equal(parseMoney("0"), 0);
  });

  test("anything else is null", () => {
    for (const text of ["", " ", "$", "abc", "12a", "-5", "1.2.3"]) {
      assert.equal(parseMoney(text), null, text);
    }
  });
});

describe("parsePoints", () => {
  test("reads commas and k", () => {
    assert.equal(parsePoints("30,000"), 30000);
    assert.equal(parsePoints("30000"), 30000);
    assert.equal(parsePoints("30k"), 30000);
    assert.equal(parsePoints("30K"), 30000);
    assert.equal(parsePoints("1.5k"), 1500);
    assert.equal(parsePoints("2m"), 2_000_000);
  });

  test("anything else is null", () => {
    for (const text of ["", "k", "abc", "30kk", "-100", "$30"]) {
      assert.equal(parsePoints(text), null, text);
    }
  });
});

describe("parseCents", () => {
  test("reads a plain number or one with a cent sign", () => {
    assert.equal(parseCents("2.1"), 2.1);
    assert.equal(parseCents("2.1¢"), 2.1);
    assert.equal(parseCents("0.5"), 0.5);
  });

  test("anything else is null", () => {
    for (const text of ["", "x", "-1", "2,1"]) {
      assert.equal(parseCents(text), null, text);
    }
  });
});

test("parsePoints refuses balances past a trillion", () => {
  assert.equal(parsePoints("1000000000000"), 1_000_000_000_000);
  assert.equal(parsePoints("2000000m"), null);
  assert.equal(parsePoints("9".repeat(400)), null);
});

test("parseCents refuses values the database cannot hold", () => {
  assert.equal(parseCents("99.9"), 99.9);
  assert.equal(parseCents("100"), null);
  assert.equal(parseCents("1e3"), null);
});
