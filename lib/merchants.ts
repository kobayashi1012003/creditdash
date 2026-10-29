import type { Merchant } from "@/data/merchants";

/**
 * Finds merchants by what someone types: "cvs", "whole fo", "uber eats".
 *
 * No runtime imports (the type import is erased),
 * so `node --test` runs its tests directly, like the reset logic.
 *
 * Matching is forgiving about case, punctuation and spacing ("trader joes"
 * finds Trader Joe's, "chickfila" finds Chick-fil-A). Ranked: an exact name
 * or alias, then a name or alias that starts with the query, then a word in
 * it that does, then the query anywhere inside.
 */

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

const squash = (s: string) => s.replace(/ /g, "");

function score(query: string, candidate: string): number {
  const c = normalise(candidate);
  if (!c) return 0;
  if (c === query || squash(c) === squash(query)) return 4;
  if (c.startsWith(query) || squash(c).startsWith(squash(query))) return 3;
  if (c.split(" ").some((w) => w.startsWith(query))) return 2;
  if (query.length >= 3 && squash(c).includes(squash(query))) return 1;
  return 0;
}

export function searchMerchants(
  merchants: readonly Merchant[],
  input: string,
  limit = 5,
): Merchant[] {
  const query = normalise(input);
  if (query.length < 2) return [];
  return merchants
    .map((m, i) => ({
      m,
      i,
      s: Math.max(score(query, m.name), ...(m.aliases ?? []).map((a) => score(query, a))),
    }))
    .filter((x) => x.s > 0)
    // Stable on ties, so the list's own order (brands near their kind) holds.
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.m);
}
