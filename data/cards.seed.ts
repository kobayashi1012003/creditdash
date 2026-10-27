import type { Card, PointBalance, UserCard, Valuation } from "./types";

/**
 * SAMPLE DATA. Not verified against any issuer.
 *
 * Every figure below is plausible but made up for layout and development. It
 * must not be shown to a real user as fact. The real source is undecided
 * (creditdash-plan.md section 12, question 3) and lands in Phase 8.
 *
 * `lastVerified` is present on every card so the UI can render "Last verified"
 * the day the data becomes real, without a schema change.
 */
export const CARDS_ARE_SAMPLE_DATA = true;

export const CARDS: Card[] = [
  {
    id: "amex-platinum",
    name: "The Platinum Card",
    issuer: "American Express",
    network: "amex",
    annualFee: 895,
    program: "amex-mr",
    faceStyle: { base: "#8A8D91", shade: "#6F7276", foil: "#1C1C1E", finish: "metal" },
    issuerUrl: "https://www.americanexpress.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: "Centurion, Priority Pass, Delta Sky Club",
    earnRates: [
      { category: "flights", multiplier: 5, cap: 500000, notes: "Booked direct or through Amex Travel" },
      { category: "hotels", multiplier: 5, cap: null, notes: "Prepaid through Amex Travel" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "plat-digital", name: "Digital entertainment", amount: 20, period: "monthly", resetBasis: "calendar", category: "streaming" },
      { id: "plat-uber", name: "Uber Cash", amount: 15, period: "monthly", resetBasis: "calendar", category: "transit" },
      { id: "plat-resy", name: "Resy dining", amount: 100, period: "quarterly", resetBasis: "calendar", category: "dining" },
      { id: "plat-airline", name: "Airline fee credit", amount: 200, period: "annual", resetBasis: "calendar", category: "flights" },
      { id: "plat-hotel", name: "Fine Hotels and Resorts", amount: 300, period: "semiannual", resetBasis: "calendar", category: "hotels" },
    ],
  },
  {
    id: "amex-gold",
    name: "American Express Gold",
    issuer: "American Express",
    network: "amex",
    annualFee: 325,
    program: "amex-mr",
    faceStyle: { base: "#C8A253", shade: "#A8853F", foil: "#2A2112", finish: "metal" },
    issuerUrl: "https://www.americanexpress.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "dining", multiplier: 4, cap: 50000 },
      { category: "groceries", multiplier: 4, cap: 25000, notes: "US supermarkets" },
      { category: "flights", multiplier: 3, cap: null, notes: "Booked direct" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "gold-dining", name: "Dining credit", amount: 10, period: "monthly", resetBasis: "calendar", category: "dining" },
      { id: "gold-uber", name: "Uber Cash", amount: 10, period: "monthly", resetBasis: "calendar", category: "transit" },
      { id: "gold-resy", name: "Resy credit", amount: 100, period: "semiannual", resetBasis: "calendar", category: "dining" },
    ],
  },
  {
    id: "csr",
    name: "Sapphire Reserve",
    issuer: "Chase",
    network: "visa",
    annualFee: 795,
    program: "chase-ur",
    faceStyle: { base: "#1B2A4A", shade: "#121D35", foil: "#D8DEE9", finish: "metal" },
    issuerUrl: "https://www.chase.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: "Sapphire Lounge, Priority Pass",
    earnRates: [
      { category: "flights", multiplier: 8, cap: null, notes: "Through Chase Travel" },
      { category: "hotels", multiplier: 8, cap: null, notes: "Through Chase Travel" },
      { category: "dining", multiplier: 3, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "csr-travel", name: "Travel credit", amount: 300, period: "annual", resetBasis: "anniversary", category: "flights" },
      { id: "csr-dining", name: "Exclusive Tables dining", amount: 150, period: "semiannual", resetBasis: "calendar", category: "dining" },
      { id: "csr-stays", name: "The Edit hotel credit", amount: 250, period: "semiannual", resetBasis: "calendar", category: "hotels" },
    ],
  },
  {
    id: "csp",
    name: "Sapphire Preferred",
    issuer: "Chase",
    network: "visa",
    annualFee: 95,
    program: "chase-ur",
    faceStyle: { base: "#2E4B7A", shade: "#22395C", foil: "#E8EDF5", finish: "matte" },
    issuerUrl: "https://www.chase.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "dining", multiplier: 3, cap: null },
      { category: "streaming", multiplier: 3, cap: null },
      { category: "groceries", multiplier: 3, cap: null, notes: "Online groceries only" },
      { category: "flights", multiplier: 2, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "csp-hotel", name: "Hotel credit", amount: 50, period: "annual", resetBasis: "anniversary", category: "hotels" },
    ],
  },
  {
    id: "venture-x",
    name: "Venture X",
    issuer: "Capital One",
    network: "visa",
    annualFee: 395,
    program: "capital-one",
    faceStyle: { base: "#1F1F22", shade: "#141416", foil: "#C9CBD1", finish: "metal" },
    issuerUrl: "https://www.capitalone.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: "Capital One Lounge, Priority Pass",
    earnRates: [
      { category: "hotels", multiplier: 10, cap: null, notes: "Through Capital One Travel" },
      { category: "flights", multiplier: 5, cap: null, notes: "Through Capital One Travel" },
      { category: "other", multiplier: 2, cap: null },
    ],
    credits: [
      { id: "vx-travel", name: "Travel credit", amount: 300, period: "annual", resetBasis: "anniversary", category: "flights" },
    ],
  },
  {
    id: "strata-premier",
    name: "Strata Premier",
    issuer: "Citi",
    network: "mastercard",
    annualFee: 95,
    program: "citi-ty",
    faceStyle: { base: "#15497E", shade: "#0F3660", foil: "#E3ECF7", finish: "matte" },
    issuerUrl: "https://www.citi.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "dining", multiplier: 10, cap: null, notes: "Through Citi Travel" },
      { category: "hotels", multiplier: 10, cap: null, notes: "Through Citi Travel" },
      { category: "flights", multiplier: 3, cap: null },
      { category: "groceries", multiplier: 3, cap: null },
      { category: "gas", multiplier: 3, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "strata-hotel", name: "Hotel benefit", amount: 100, period: "annual", resetBasis: "calendar", category: "hotels" },
    ],
  },
  {
    id: "bilt",
    name: "Bilt Mastercard",
    issuer: "Bilt",
    network: "mastercard",
    annualFee: 0,
    program: "bilt",
    faceStyle: { base: "#121214", shade: "#09090A", foil: "#B9BCC4", finish: "metal" },
    issuerUrl: "https://www.biltrewards.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "dining", multiplier: 3, cap: null },
      { category: "flights", multiplier: 2, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [],
  },
  {
    id: "blue-business-plus",
    name: "Blue Business Plus",
    issuer: "American Express",
    network: "amex",
    annualFee: 0,
    program: "amex-mr",
    faceStyle: { base: "#2F6FAF", shade: "#245688", foil: "#EAF2FA", finish: "matte" },
    issuerUrl: "https://www.americanexpress.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 2.7,
    loungeAccess: null,
    earnRates: [
      { category: "other", multiplier: 2, cap: 50000, notes: "2x on everything to the cap, then 1x" },
    ],
    credits: [],
  },
  {
    id: "hilton-surpass",
    name: "Hilton Honors Surpass",
    issuer: "American Express",
    network: "amex",
    annualFee: 150,
    program: "hilton",
    faceStyle: { base: "#0F3A5C", shade: "#0A2942", foil: "#D6E4EF", finish: "matte" },
    issuerUrl: "https://www.americanexpress.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "hotels", multiplier: 12, cap: null, notes: "Hilton properties" },
      { category: "dining", multiplier: 6, cap: null },
      { category: "groceries", multiplier: 6, cap: null },
      { category: "gas", multiplier: 6, cap: null },
      { category: "other", multiplier: 3, cap: null },
    ],
    credits: [
      { id: "hilton-resort", name: "Hilton resort credit", amount: 50, period: "quarterly", resetBasis: "calendar", category: "hotels" },
    ],
  },
  {
    id: "united-explorer",
    name: "United Explorer",
    issuer: "Chase",
    network: "visa",
    annualFee: 150,
    program: "united",
    faceStyle: { base: "#1A3E6E", shade: "#122C4F", foil: "#DCE6F2", finish: "matte" },
    issuerUrl: "https://www.chase.com",
    lastVerified: "2026-09-18",
    foreignTransactionFee: 0,
    loungeAccess: "Two United Club passes a year",
    earnRates: [
      { category: "flights", multiplier: 2, cap: null, notes: "United purchases" },
      { category: "dining", multiplier: 2, cap: null },
      { category: "hotels", multiplier: 2, cap: null },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "united-travel", name: "United TravelBank", amount: 100, period: "annual", resetBasis: "anniversary", category: "flights" },
    ],
  },
];

export function getCard(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}

/**
 * The demo wallet. Phase 2 replaces this with browser storage behind
 * lib/data/; until then it is what every screen renders.
 */
export const DEMO_WALLET: UserCard[] = [
  { cardId: "amex-gold", openedOn: "2023-03-14", anniversaryMonth: 3, sortOrder: 0 },
  { cardId: "csr", openedOn: "2021-11-02", anniversaryMonth: 11, sortOrder: 1 },
  { cardId: "venture-x", nickname: "Travel card", openedOn: "2024-06-21", anniversaryMonth: 6, sortOrder: 2 },
  { cardId: "bilt", openedOn: "2025-01-09", anniversaryMonth: 1, sortOrder: 3 },
];

export const DEMO_BALANCES: PointBalance[] = [
  { program: "amex-mr", balance: 142000, updatedAt: "2026-10-04" },
  { program: "chase-ur", balance: 86400, updatedAt: "2026-10-04" },
  { program: "capital-one", balance: 31250, updatedAt: "2026-09-27" },
  { program: "bilt", balance: 12800, updatedAt: "2026-10-18" },
];

/** Defaults, editable per user in Settings. */
export const DEFAULT_VALUATIONS: Valuation[] = [
  { program: "amex-mr", centsPerPoint: 1.9 },
  { program: "chase-ur", centsPerPoint: 1.9 },
  { program: "citi-ty", centsPerPoint: 1.6 },
  { program: "capital-one", centsPerPoint: 1.7 },
  { program: "bilt", centsPerPoint: 1.8 },
  { program: "hilton", centsPerPoint: 0.5 },
  { program: "united", centsPerPoint: 1.3 },
];

export function valuationFor(program: string): number {
  return DEFAULT_VALUATIONS.find((v) => v.program === program)?.centsPerPoint ?? 1;
}

/**
 * Sample credit usage for the demo wallet, keyed by credit id. Each array has
 * one entry per period slot, holding the dollars used in that slot.
 * Phase 3 replaces this with real tracked state.
 */
export const DEMO_USAGE: Record<string, number[]> = {
  // Amex Gold, opened March 2023.
  "gold-dining": [10, 10, 10, 10, 10, 10, 10, 10, 10, 4, 0, 0],
  "gold-uber": [10, 10, 0, 10, 10, 10, 0, 10, 10, 10, 0, 0],
  "gold-resy": [100, 0],
  // Sapphire Reserve, opened November 2021.
  "csr-travel": [300],
  "csr-dining": [150, 85],
  "csr-stays": [250, 0],
  // Venture X, opened June 2024.
  "vx-travel": [300],
};
