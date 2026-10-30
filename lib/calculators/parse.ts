/**
 * What people type into the calculators, read as numbers.
 *
 * Dependency-free so `node --test` runs its tests directly. Anything that
 * is not a number reads as null, which the calculators show as their
 * neutral state rather than as an error or NaN.
 */

/** "$1,200", "1200", "1200.50", " 45 " */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[\s$,]/g, "");
  if (!/^\d*\.?\d*$/.test(cleaned) || !/\d/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "30,000", "30000", "30k", "1.5k", "2m" */
export function parsePoints(text: string): number | null {
  const cleaned = text.replace(/[\s,]/g, "").toLowerCase();
  const match = /^(\d*\.?\d*)([km]?)$/.exec(cleaned);
  if (!match || !/\d/.test(match[1])) return null;
  const scale = match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : 1;
  const n = Number(match[1]) * scale;
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** "2.1", "2.1¢", "2,1" is not accepted. Cents per point. */
export function parseCents(text: string): number | null {
  const cleaned = text.replace(/[\s¢c]/gi, "");
  if (!/^\d*\.?\d*$/.test(cleaned) || !/\d/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
