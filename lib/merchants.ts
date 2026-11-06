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
 * it that does, then the query anywhere inside, and last a near miss: a
 * small typo ("starbuks", "chipolte") against a name, an alias or one of
 * their words, or against how one of them begins, for someone still typing.
 * Near misses are only offered when nothing matched as typed.
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

/** Typos forgiven for a query this long: none under 4 characters, then 1, then 2 from 8. */
export function typoAllowance(length: number): number {
  return length >= 8 ? 2 : length >= 4 ? 1 : 0;
}

/**
 * Edits between two strings (insert, delete, change, or swap two neighbours),
 * or `max + 1` as soon as it is clearly more than `max`.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prev2[j - 2] + 1);
      }
      row.push(d);
      if (d < best) best = d;
    }
    if (best > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

/**
 * How near a miss the candidate is, for a query that matched nothing:
 * the whole name or alias with a typo ranks above one of its words, which
 * ranks above how it begins (someone still typing); one typo above two;
 * and a miss that keeps the first letter above one that does not, since
 * typos rarely land there. 0 when it is not near.
 */
function nearness(query: string, candidate: string): number {
  const c = normalise(candidate);
  const q = squash(query);
  const max = typoAllowance(q.length);
  if (!c || max === 0) return 0;
  const whole = squash(c);
  const tiers: [number, string[]][] = [
    [0.5, [whole]],
    [0.4, c.split(" ")],
    [0.3, [whole, ...c.split(" ")].filter((t) => t.length > q.length).map((t) => t.slice(0, q.length))],
  ];
  for (const [base, targets] of tiers) {
    let best = 0;
    for (const t of targets) {
      const d = editDistance(q, t, max);
      if (d > max) continue;
      best = Math.max(best, base - (d - 1) * 0.04 + (t[0] === q[0] ? 0.02 : 0));
    }
    if (best > 0) return best;
  }
  return 0;
}

function score(query: string, candidate: string): number {
  const c = normalise(candidate);
  if (!c) return 0;
  if (c === query || squash(c) === squash(query)) return 4;
  if (c.startsWith(query) || squash(c).startsWith(squash(query))) return 3;
  if (c.split(" ").some((w) => w.startsWith(query))) return 2;
  if (query.length >= 3 && squash(c).includes(squash(query))) return 1;
  return 0;
}

function rank(
  merchants: readonly Merchant[],
  query: string,
  by: (query: string, candidate: string) => number,
) {
  return merchants
    .map((m, i) => ({
      m,
      i,
      s: Math.max(by(query, m.name), ...(m.aliases ?? []).map((a) => by(query, a))),
    }))
    .filter((x) => x.s > 0)
    // Stable on ties, so the list's own order (brands near their kind) holds.
    .sort((a, b) => b.s - a.s || a.i - b.i);
}

export function searchMerchants(
  merchants: readonly Merchant[],
  input: string,
  limit = 5,
): Merchant[] {
  const query = normalise(input);
  if (query.length < 2) return [];
  let hits = rank(merchants, query, score);
  // Typos only when nothing matched as typed, so "uber" never trails off
  // into near misses like "Iberia".
  if (hits.length === 0) hits = rank(merchants, query, nearness);
  return hits.slice(0, limit).map((x) => x.m);
}
