import { test } from "node:test";
import assert from "node:assert/strict";
import { normalise, searchMerchants } from "./merchants.ts";
import { MERCHANTS } from "../data/merchants.ts";

const first = (q: string) => searchMerchants(MERCHANTS, q)[0];

test("finds a brand by its name, in any case", () => {
  assert.equal(first("CVS")?.name, "CVS");
  assert.equal(first("cvs")?.category, "other");
  assert.equal(first("whole foods")?.category, "groceries");
});

test("forgives punctuation and spacing", () => {
  assert.equal(first("trader joes")?.name, "Trader Joe's");
  assert.equal(first("chickfila")?.name, "Chick-fil-A");
  assert.equal(first("7 eleven")?.name, "7-Eleven");
  assert.equal(normalise("Stop & Shop"), "stop and shop");
});

test("finds by alias and by partial word", () => {
  assert.equal(first("westin")?.name, "Marriott");
  assert.equal(first("hampton")?.name, "Hilton");
  assert.equal(first("whole fo")?.name, "Whole Foods Market");
});

test("an exact match outranks a longer one that starts the same", () => {
  assert.equal(first("uber")?.name, "Uber");
  assert.equal(first("uber eats")?.name, "Uber Eats");
  assert.equal(first("uber eats")?.category, "dining");
});

test("kinds of place work as well as brands", () => {
  assert.equal(first("coffee")?.category, "dining");
  assert.equal(first("pharmacy")?.name, "Pharmacies");
  assert.equal(first("gas")?.category, "gas");
});

test("superstores are not groceries, and say why", () => {
  for (const q of ["costco", "walmart", "target"]) {
    const hit = first(q);
    assert.equal(hit?.category, "other", q);
    assert.ok(hit?.note, q);
  }
});

test("too short or unknown returns nothing", () => {
  assert.deepEqual(searchMerchants(MERCHANTS, "c"), []);
  assert.deepEqual(searchMerchants(MERCHANTS, "zzqx"), []);
});

test("every merchant name is unique, so results never repeat", () => {
  const names = MERCHANTS.map((m) => m.name);
  assert.equal(new Set(names).size, names.length);
});
