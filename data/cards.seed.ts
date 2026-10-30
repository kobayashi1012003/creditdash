import type { Card, PointBalance, UserCard, Valuation } from "./types";

/**
 * CARD DATA, checked 28 October 2026.
 *
 * Every card was researched against the issuer's own page and
 * cross-checked with The Points Guy and recent coverage. Facts are recorded
 * here in our own words; nothing is copied. Where the issuer page could not
 * be read (parts of americanexpress.com), the card is marked in finePrint.
 * Issuers change these often: treat `lastVerified` as the date it was true.
 *
 * Bilt relaunched on 7 February 2026 as three cards. The id `bilt` now
 * means Bilt Blue, the $0 card, so wallets holding the old $0 Wells Fargo
 * card keep a card rather than losing one.
 *
 * Modelling rules:
 * - A credit that changed period or amount meaningfully gets a new id, so
 *   usage stored under the old rules is never read under the new ones.
 * - Earn rates through a travel portal are listed as the category rate with
 *   the channel in `notes`, as before; the direct rate goes in the note.
 * - Benefits with no regular period (per stay, every four years, unlocked
 *   by spend) are not credits the Tracker can tick; they go in finePrint.
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
    issuerUrl: "https://www.americanexpress.com/us/credit-cards/card/platinum/",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: "Centurion, Delta Sky Club (10 visits a year), Priority Pass",
    earnRates: [
      { category: "flights", multiplier: 5, cap: 500000, notes: "Booked direct or through Amex Travel, up to $500,000 a year" },
      { category: "hotels", multiplier: 5, cap: null, notes: "Prepaid through Amex Travel only" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "plat-hotel", name: "Hotel credit", amount: 300, period: "semiannual", resetBasis: "calendar", category: "hotels", notes: "Prepaid Fine Hotels and Resorts or The Hotel Collection through Amex Travel" },
      { id: "plat-resy", name: "Resy dining", amount: 100, period: "quarterly", resetBasis: "calendar", category: "dining", notes: "Enroll first. US Resy restaurants" },
      { id: "plat-digital", name: "Digital entertainment", amount: 25, period: "monthly", resetBasis: "calendar", category: "streaming", notes: "Enroll first. Peacock counts only when bought direct from Peacock" },
      { id: "plat-uber", name: "Uber Cash", amount: 15, period: "monthly", resetBasis: "calendar", category: "transit", notes: "Lapses at the end of each month. December adds $20" },
      { id: "plat-uber-one", name: "Uber One", amount: 120, period: "annual", resetBasis: "calendar", category: "transit", notes: "Auto-renewing Uber One membership" },
      { id: "plat-airline", name: "Airline fee credit", amount: 200, period: "annual", resetBasis: "calendar", category: "flights", notes: "Incidental fees on the one airline you select, not tickets" },
      { id: "plat-clear", name: "CLEAR+", amount: 219, period: "annual", resetBasis: "calendar", category: "flights" },
      { id: "plat-lululemon", name: "lululemon", amount: 75, period: "quarterly", resetBasis: "calendar", notes: "Enroll first. US stores, not outlets, and lululemon.com" },
      { id: "plat-walmart", name: "Walmart+", amount: 12.95, period: "monthly", resetBasis: "calendar", category: "groceries", notes: "Monthly Walmart+ membership, not Plus Ups" },
      { id: "plat-equinox", name: "Equinox", amount: 300, period: "annual", resetBasis: "calendar", notes: "Enroll first. Club or Equinox+ app membership" },
      { id: "plat-oura", name: "Oura", amount: 200, period: "annual", resetBasis: "calendar", notes: "Enroll first. Ring hardware only" },
    ],
    finePrint: [
      "Most credits need enrollment in your Amex account before the purchase, not after.",
      "From 1 January 2027, Fine Hotels and Resorts bookings need two nights or more to earn the hotel credit.",
      "The Saks credit ended on 1 July 2026, and Lufthansa lounge access ended on 1 October 2026.",
      "Centurion Lounge guests and unlimited Delta Sky Club visits need $75,000 of spend in a calendar year.",
      "Global Entry ($120 every four years) or TSA PreCheck is covered when the fee is charged to the card.",
      "Equinox and Oura terms were confirmed only by third parties; check them in your Amex account.",
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
    issuerUrl: "https://www.americanexpress.com/us/credit-cards/card/gold-card/",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "dining", multiplier: 4, cap: 50000, notes: "Restaurants worldwide, up to $50,000 a year, then 1x" },
      { category: "groceries", multiplier: 4, cap: 25000, notes: "US supermarkets only, up to $25,000 a year, then 1x" },
      { category: "hotels", multiplier: 5, cap: null, notes: "Prepaid through Amex Travel only" },
      { category: "flights", multiplier: 3, cap: null, notes: "Booked direct or through Amex Travel" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "gold-dining", name: "Dining credit", amount: 10, period: "monthly", resetBasis: "calendar", category: "dining", notes: "Enroll first. Grubhub, Five Guys, Cheesecake Factory, Buffalo Wild Wings, Wonder" },
      { id: "gold-uber", name: "Uber Cash", amount: 10, period: "monthly", resetBasis: "calendar", category: "transit", notes: "Add the card in the Uber app. Lapses at the end of each month" },
      { id: "gold-resy-50", name: "Resy credit", amount: 50, period: "semiannual", resetBasis: "calendar", category: "dining", notes: "Enroll first. US Resy restaurants" },
      { id: "gold-dunkin", name: "Dunkin'", amount: 7, period: "monthly", resetBasis: "calendar", category: "dining", notes: "Enroll first. US Dunkin' locations" },
    ],
    finePrint: [
      "Goldbelly and Wine.com stopped counting for the dining credit on 1 July 2026.",
      "Prepaid hotels through Amex Travel earn 5x since 30 April 2026, and prepaid car rentals and cruises 2x.",
      "Hotel Collection stays of two nights or more include a $100 property credit.",
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
    issuerUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: "Sapphire Lounge, Priority Pass, Air Canada Maple Leaf",
    earnRates: [
      { category: "flights", multiplier: 8, cap: null, notes: "Through Chase Travel. 4x booked direct" },
      { category: "hotels", multiplier: 8, cap: null, notes: "Through Chase Travel. 4x booked direct" },
      { category: "dining", multiplier: 3, cap: null, notes: "Includes takeout and eligible delivery" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "csr-travel", name: "Travel credit", amount: 300, period: "annual", resetBasis: "anniversary", category: "flights", notes: "Applies automatically to travel purchases" },
      { id: "csr-edit", name: "The Edit hotel credit", amount: 500, period: "annual", resetBasis: "calendar", category: "hotels", notes: "Up to $250 a stay. Prepaid stays of two nights or more" },
      { id: "csr-dining", name: "Exclusive Tables dining", amount: 150, period: "semiannual", resetBasis: "calendar", category: "dining", notes: "Only Exclusive Tables restaurants on OpenTable" },
      { id: "csr-stubhub", name: "StubHub", amount: 150, period: "semiannual", resetBasis: "calendar", notes: "Activate first. StubHub or viagogo, no gift cards" },
      { id: "csr-doordash", name: "DoorDash promos", amount: 35, period: "monthly", resetBasis: "calendar", category: "dining", notes: "$15 on one order plus two $10 non-restaurant promos. No rollover" },
      { id: "csr-lyft", name: "Lyft", amount: 10, period: "monthly", resetBasis: "calendar", category: "transit", notes: "Add the card in the Lyft app. Rides only" },
      { id: "csr-peloton", name: "Peloton membership", amount: 10, period: "monthly", resetBasis: "calendar", notes: "Activate first" },
    ],
    finePrint: [
      "Purchases covered by the travel credit or The Edit credit earn no points.",
      "Since 2026 the two Edit credits can be used any time in the calendar year, not one per half.",
      "Lyft earns 5x through September 2027, and Peloton equipment over $150 earns 10x through 2027.",
      "Apple TV and Apple Music are included free; activate by 22 June 2027.",
      "$75,000 of spend in a calendar year unlocks Hyatt and IHG status and a $500 Southwest credit.",
      "Priority Pass needs the physical card or digital Priority Pass card; a phone wallet card is refused.",
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
    issuerUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "flights", multiplier: 5, cap: null, notes: "Through Chase Travel. 2x on other travel" },
      { category: "hotels", multiplier: 5, cap: null, notes: "Through Chase Travel. 2x on other travel, 3x vacation homes" },
      { category: "dining", multiplier: 3, cap: null, notes: "Includes takeout and eligible delivery" },
      { category: "gas", multiplier: 3, cap: null, notes: "Gas stations and EV charging" },
      { category: "streaming", multiplier: 3, cap: null, notes: "Select streaming services" },
      { category: "groceries", multiplier: 3, cap: null, notes: "Online groceries only, not Target, Walmart or warehouse clubs" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "csp-hotel", name: "Hotel credit", amount: 100, period: "annual", resetBasis: "anniversary", category: "hotels", notes: "Hotels booked through Chase Travel" },
      { id: "csp-doordash", name: "DoorDash promo", amount: 10, period: "monthly", resetBasis: "calendar", category: "groceries", notes: "Non-restaurant orders. Activate first" },
    ],
    finePrint: [
      "The card was refreshed on 15 June 2026: the hotel credit doubled to $100 and gas earns 3x.",
      "The 10% anniversary points bonus is gone; the last one posts in early 2027 for older cardholders.",
      "Points now transfer to Hyatt at 4 to 3, not 1 to 1.",
      "Trip delay cover starts after 12 hours, not 6 as on the Reserve.",
      "Global Entry or TSA PreCheck is covered up to $120 every four years.",
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
    issuerUrl: "https://www.capitalone.com/credit-cards/venture-x/",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: "Capital One Lounge, Priority Pass",
    earnRates: [
      { category: "hotels", multiplier: 10, cap: null, notes: "Hotels and rental cars through Capital One Travel" },
      { category: "flights", multiplier: 5, cap: null, notes: "Flights and vacation rentals through Capital One Travel" },
      { category: "other", multiplier: 2, cap: null },
    ],
    credits: [
      { id: "vx-travel", name: "Travel credit", amount: 300, period: "annual", resetBasis: "anniversary", category: "flights", notes: "Capital One Travel bookings only. Expires at the next anniversary" },
    ],
    finePrint: [
      "10,000 bonus miles post every account anniversary.",
      "Since 1 February 2026, authorized users pay $125 a year each for lounge access.",
      "Free lounge guests now need $75,000 of spend in a calendar year; otherwise $45 per adult.",
      "Priority Pass guests cost $35 each, and Priority Pass covers lounges only, not restaurants.",
      "Global Entry or TSA PreCheck is covered up to $120 every four years.",
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
    issuerUrl: "https://www.citi.com/credit-cards/citi-strata-premier-credit-card",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "hotels", multiplier: 10, cap: null, notes: "Hotels, car rentals and attractions through Citi Travel. 3x other hotels" },
      { category: "flights", multiplier: 3, cap: null },
      { category: "dining", multiplier: 3, cap: null, notes: "Restaurants, including takeout" },
      { category: "groceries", multiplier: 3, cap: null, notes: "Supermarkets" },
      { category: "gas", multiplier: 3, cap: null, notes: "Gas and EV charging stations" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "strata-hotel", name: "Hotel benefit", amount: 100, period: "annual", resetBasis: "calendar", category: "hotels", notes: "One stay of $500 or more through Citi Travel. Taken off at booking" },
    ],
    finePrint: [
      "The hotel benefit is a discount at booking, not a statement credit, and the $500 excludes taxes and fees.",
      "Sharing points with another person ended on 17 May 2026; combining your own Citi cards still works.",
    ],
  },
  {
    id: "bilt",
    name: "Bilt Blue",
    issuer: "Bilt",
    network: "mastercard",
    annualFee: 0,
    program: "bilt",
    faceStyle: { base: "#1B2F42", shade: "#132232", foil: "#D7E2EC", finish: "matte" },
    issuerUrl: "https://www.bilt.com/card",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "hotels", multiplier: 3, cap: null, notes: "Through Bilt Travel" },
      { category: "flights", multiplier: 2, cap: null, notes: "Through Bilt Travel" },
      { category: "other", multiplier: 1, cap: null, notes: "Up to 4x at Bilt partner restaurants, 3x on Lyft" },
    ],
    credits: [],
    finePrint: [
      "Rent and mortgage earn up to 1.25x with no fee, depending on how much you spend on the card that month.",
      "Every card earns 4% back in Bilt Cash, which can only be spent inside Bilt, not withdrawn.",
      "Rent Day, the 1st of each month, doubles points on non-housing purchases through 1 January 2027.",
      "Issued by Column N.A. since the Bilt Card 2.0 relaunch on 7 February 2026.",
    ],
  },
  {
    id: "bilt-obsidian",
    name: "Bilt Obsidian",
    issuer: "Bilt",
    network: "mastercard",
    annualFee: 95,
    program: "bilt",
    faceStyle: { base: "#252526", shade: "#18181A", foil: "#C9CBD1", finish: "metal" },
    issuerUrl: "https://www.bilt.com/card",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "dining", multiplier: 3, cap: null, notes: "If you choose dining. Or 3x groceries to $25,000 a year instead" },
      { category: "hotels", multiplier: 4, cap: null, notes: "Through Bilt Travel. 2x other travel" },
      { category: "flights", multiplier: 3, cap: null, notes: "Through Bilt Travel. 2x other travel" },
      { category: "other", multiplier: 1, cap: null, notes: "Up to 6x at Bilt partner restaurants, 3x on Lyft" },
    ],
    credits: [
      { id: "bilt-obsidian-hotel", name: "Hotel credit", amount: 50, period: "semiannual", resetBasis: "calendar", category: "hotels", notes: "Hotels booked through Bilt Travel" },
    ],
    finePrint: [
      "You pick 3x on dining or 3x on groceries; the app assumes dining.",
      "Rent and mortgage earn up to 1.25x with no fee, depending on how much you spend on the card that month.",
      "Every card earns 4% back in Bilt Cash, which can only be spent inside Bilt, not withdrawn.",
      "Rent Day, the 1st of each month, doubles points on non-housing purchases through 1 January 2027.",
      "Issued by Column N.A. since the Bilt Card 2.0 relaunch on 7 February 2026.",
    ],
  },
  {
    id: "bilt-palladium",
    name: "Bilt Palladium",
    issuer: "Bilt",
    network: "mastercard",
    annualFee: 495,
    program: "bilt",
    faceStyle: { base: "#A29F99", shade: "#87847E", foil: "#1C1C1E", finish: "metal" },
    issuerUrl: "https://www.bilt.com/card",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: "Priority Pass",
    earnRates: [
      { category: "hotels", multiplier: 4, cap: null, notes: "Through Bilt Travel. 2x other travel" },
      { category: "flights", multiplier: 3, cap: null, notes: "Through Bilt Travel. 2x other travel" },
      { category: "other", multiplier: 2, cap: null, notes: "Up to 5x at Bilt partner restaurants, 4x on Lyft" },
    ],
    credits: [
      { id: "bilt-palladium-hotel", name: "Hotel credit", amount: 200, period: "semiannual", resetBasis: "calendar", category: "hotels", notes: "Hotels booked through Bilt Travel" },
      { id: "bilt-palladium-cash", name: "Bilt Cash", amount: 200, period: "annual", resetBasis: "calendar", notes: "Spendable inside Bilt only" },
    ],
    finePrint: [
      "Rent and mortgage earn up to 1.25x with no fee, depending on how much you spend on the card that month.",
      "Every card earns 4% back in Bilt Cash, which can only be spent inside Bilt, not withdrawn.",
      "Rent Day, the 1st of each month, doubles points on non-housing purchases through 1 January 2027.",
      "Issued by Column N.A. since the Bilt Card 2.0 relaunch on 7 February 2026.",
    ],
  },
  {
    id: "blue-business-plus",
    name: "Blue Business Plus",
    issuer: "American Express",
    network: "amex",
    annualFee: 0,
    program: "amex-mr",
    faceStyle: { base: "#2F6FAF", shade: "#245688", foil: "#EAF2FA", finish: "matte" },
    issuerUrl: "https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-blue-business-plus-credit-card-amex/",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 2.7,
    loungeAccess: null,
    earnRates: [
      { category: "other", multiplier: 2, cap: 50000, notes: "2x on everything to $50,000 a calendar year, then 1x" },
    ],
    credits: [],
    finePrint: [
      "A 2.7% fee applies to purchases abroad, so it is a poor choice when travelling.",
      "Checked with third-party sources only; the Amex page could not be read.",
    ],
  },
  {
    id: "hilton-surpass",
    name: "Hilton Honors Surpass",
    issuer: "American Express",
    network: "amex",
    annualFee: 150,
    program: "hilton",
    faceStyle: { base: "#0F3A5C", shade: "#0A2942", foil: "#D6E4EF", finish: "matte" },
    issuerUrl: "https://www.americanexpress.com/us/credit-cards/card/hilton-honors-surpass/",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [
      { category: "hotels", multiplier: 12, cap: null, notes: "Booked direct with Hilton properties" },
      { category: "dining", multiplier: 6, cap: null, notes: "US restaurants" },
      { category: "groceries", multiplier: 6, cap: null, notes: "US supermarkets" },
      { category: "gas", multiplier: 6, cap: null, notes: "US gas stations" },
      { category: "other", multiplier: 3, cap: null },
    ],
    credits: [
      { id: "hilton-resort", name: "Hilton credit", amount: 50, period: "quarterly", resetBasis: "calendar", category: "hotels", notes: "Purchases made directly with a Hilton property, room or on-site dining" },
    ],
    finePrint: [
      "US online retail earns 4x.",
      "A free night is earned after $15,000 of spend in a calendar year, not given each year.",
      "Diamond status comes after $40,000 of spend in a calendar year; Gold is automatic.",
      "Priority Pass was removed; this card has no lounge access.",
      "Checked with third-party sources only; the Amex page could not be read.",
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
    issuerUrl: "https://creditcards.chase.com/travel-credit-cards/united/united-explorer",
    lastVerified: "2026-10-28",
    foreignTransactionFee: 0,
    loungeAccess: "Two United Club passes a year",
    earnRates: [
      { category: "flights", multiplier: 3, cap: null, notes: "United purchases. Plus 6x MileagePlus miles on United fares, 9x in total" },
      { category: "dining", multiplier: 2, cap: null, notes: "Includes delivery" },
      { category: "hotels", multiplier: 2, cap: null, notes: "Booked direct with the hotel" },
      { category: "other", multiplier: 1, cap: null },
    ],
    credits: [
      { id: "united-tb-10k", name: "United TravelBank cash", amount: 100, period: "annual", resetBasis: "calendar", category: "flights", notes: "Only after $10,000 of spend in the calendar year" },
      { id: "united-hotels", name: "United Hotels", amount: 100, period: "annual", resetBasis: "anniversary", category: "hotels", notes: "$50 on each of the first two prepaid United Hotels stays" },
      { id: "united-rideshare", name: "Rideshare", amount: 5, period: "monthly", resetBasis: "calendar", category: "transit", notes: "Opt in every calendar year" },
      { id: "united-instacart", name: "Instacart", amount: 10, period: "monthly", resetBasis: "calendar", category: "groceries", notes: "Orders of $10 or more. Needs the Instacart+ trial activated" },
      { id: "united-avis", name: "Avis or Budget", amount: 50, period: "annual", resetBasis: "anniversary", notes: "$25 on each of the first two rentals of two days or more" },
      { id: "united-jsx", name: "JSX", amount: 100, period: "annual", resetBasis: "anniversary", category: "flights", notes: "Flights booked direct with JSX" },
    ],
    finePrint: [
      "The annual fee is $0 in the first year, then $150.",
      "The first checked bag is free for you and one companion when the ticket is bought with the card.",
      "$20,000 of spend in a calendar year earns a 10,000-mile award discount.",
      "Chase's terms also describe an older version of the TravelBank credit; confirm which applies to your account.",
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
/**
 * CreditDash's own default valuations, cents per point. Rounded estimates
 * in line with the published consensus (revised 30 October 2026), not any
 * one publisher's table, and never labelled as anyone else's. Users can
 * set their own.
 */
export const DEFAULT_VALUATIONS: Valuation[] = [
  { program: "amex-mr", centsPerPoint: 2.0 },
  { program: "chase-ur", centsPerPoint: 2.0 },
  { program: "citi-ty", centsPerPoint: 1.8 },
  { program: "capital-one", centsPerPoint: 1.8 },
  { program: "bilt", centsPerPoint: 2.1 },
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
