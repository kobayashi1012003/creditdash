/**
 * Spend categories and the pastel each one owns. A category keeps the same
 * pastel on every screen: wallet chip, compare column, tracker section,
 * calculator row. Change the pairing here and it changes everywhere.
 */
export const CATEGORIES = [
  "dining",
  "groceries",
  "flights",
  "hotels",
  "gas",
  "transit",
  "streaming",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  dining: "Dining",
  groceries: "Groceries",
  flights: "Flights",
  hotels: "Hotels",
  gas: "Gas",
  transit: "Transit",
  streaming: "Streaming",
  other: "Everything else",
};

/** CSS custom properties defined in app/globals.css. */
export function categoryStyle(category: Category) {
  return {
    backgroundColor: `var(--cd-cat-${category})`,
    color: `var(--cd-cat-${category}-ink)`,
  } as const;
}
