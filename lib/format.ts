/** Money and points formatting. Tabular numerals are on globally in globals.css. */

const money0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const points = new Intl.NumberFormat("en-US");

/** $395. Whole dollars, for fees and credit amounts. */
export function usd(amount: number) {
  return money0.format(amount);
}

/** $12.50. Use where cents genuinely matter, like a partial credit. */
export function usdExact(amount: number) {
  return money2.format(amount);
}

/** 142,000 */
export function pts(amount: number) {
  return points.format(amount);
}

/** Dollar value of a points balance at a given cents-per-point. */
export function pointsValue(balance: number, centsPerPoint: number) {
  return (balance * centsPerPoint) / 100;
}

/** "14 March" */
export function monthDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

/** "March" from a 1-indexed month number. */
export function monthName(month: number) {
  return new Date(2026, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
  });
}

/** "18 September 2026" */
export function longDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
