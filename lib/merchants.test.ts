import { test } from "node:test";
import assert from "node:assert/strict";
import { editDistance, normalise, searchMerchants, typoAllowance } from "./merchants.ts";
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

test("forgives a small typo", () => {
  assert.equal(first("starbuks")?.name, "Starbucks");
  assert.equal(first("chipolte")?.name, "Chipotle");
  assert.equal(first("mcdonlds")?.name, "McDonald's");
  assert.equal(first("wallgreens")?.name, "Walgreens");
  assert.equal(first("safewya")?.name, "Safeway");
  assert.equal(first("whole fods")?.name, "Whole Foods Market");
  assert.equal(first("netflx")?.name, "Netflix");
});

test("forgives a typo while still typing", () => {
  assert.equal(first("chipol")?.name, "Chipotle");
  assert.equal(first("starbuk")?.name, "Starbucks");
});

test("a typo in a brand still carries its brand", () => {
  assert.equal(first("hiltn")?.brand, "hilton");
  assert.equal(first("dleta")?.name, "Delta Air Lines");
});

test("near misses only appear when nothing matched as typed", () => {
  assert.deepEqual(
    searchMerchants(MERCHANTS, "uber").map((m) => m.name),
    ["Uber", "Uber Eats"],
  );
  assert.equal(first("lyft")?.name, "Lyft");
  assert.equal(searchMerchants(MERCHANTS, "lyft").length, 1);
});

test("short queries get no typo allowance", () => {
  assert.equal(typoAllowance(3), 0);
  assert.equal(typoAllowance(4), 1);
  assert.equal(typoAllowance(7), 1);
  assert.equal(typoAllowance(8), 2);
  assert.deepEqual(searchMerchants(MERCHANTS, "ubr"), []);
});

test("edit distance counts a swap of neighbours as one", () => {
  assert.equal(editDistance("chipolte", "chipotle", 2), 1);
  assert.equal(editDistance("starbuks", "starbucks", 2), 1);
  assert.equal(editDistance("kitten", "sitting", 3), 3);
  assert.equal(editDistance("abc", "xyz", 1), 2);
});

test("no name or alias belongs to two merchants", () => {
  const seen = new Map<string, string>();
  for (const m of MERCHANTS) {
    for (const key of new Set([m.name, ...(m.aliases ?? [])].map((s) => normalise(s).replace(/ /g, "")))) {
      assert.ok(!seen.has(key), `"${key}" is on ${seen.get(key)} and ${m.name}`);
      seen.set(key, m.name);
    }
  }
});

test("no dashes a reader would see in names, aliases or notes", () => {
  for (const m of MERCHANTS) {
    const text = [m.name, ...(m.aliases ?? []), m.note ?? ""].join(" ");
    assert.ok(!/[–—]/.test(text), m.name);
  }
});
