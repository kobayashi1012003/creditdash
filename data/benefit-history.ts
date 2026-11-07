/**
 * What changed in CreditDash's record of each credit, newest last, keyed by
 * credit id. Data, no logic.
 *
 * This is the history of our entry, not a claim about when an issuer changed
 * its terms: an entry can be a real change at the issuer or a correction we
 * made on checking. Written from the git history of data/cards.seed.ts; the
 * start of the log is 28 October 2026, when every card was first checked
 * against its issuer (owner, 6 November 2026).
 *
 * Add an entry whenever a credit's amount, period, name, conditions or end
 * date changes. A credit whose period or amount changes meaningfully gets a
 * new id (CLAUDE.md, "Card data"), so its entry here starts with what it
 * replaced.
 */

export type BenefitChange = {
  /** ISO date the record changed. */
  date: string;
  /** Plain words, no dashes. */
  change: string;
};

const AMEX_ADDED = "Added from American Express's benefit terms.";
const CHECKED_ADDED = "Added when the card was checked against its issuer.";

export const BENEFIT_HISTORY: Record<string, BenefitChange[]> = {
  // --- The Platinum Card ----------------------------------------------------
  "plat-hotel": [
    { date: "2026-10-28", change: "Now includes The Hotel Collection as well as Fine Hotels and Resorts." },
    { date: "2026-11-02", change: "Renamed the Lodging credit, as Amex's terms now call it." },
  ],
  "plat-digital": [
    { date: "2026-10-28", change: "Raised from $20 to $25 a month." },
    { date: "2026-11-01", change: "Marked as needing enrollment." },
  ],
  "plat-resy": [{ date: "2026-11-01", change: "Marked as needing enrollment." }],
  "plat-airline": [{ date: "2026-11-01", change: "Marked as needing enrollment." }],
  "plat-uber": [{ date: "2026-11-01", change: "December's extra $20 moved to its own credit." }],
  "plat-uber-december": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "plat-uber-one": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "plat-clear": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "plat-lululemon": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-01", change: "Marked as needing enrollment." },
  ],
  "plat-walmart": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "plat-equinox": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-01", change: "Marked as needing enrollment." },
  ],
  "plat-oura": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-01", change: "Marked as needing enrollment. Ring hardware from ouraring.com only." },
  ],
  "plat-airbnb": [{ date: "2026-11-01", change: AMEX_ADDED }],

  // --- Amex Gold ------------------------------------------------------------
  "gold-dining": [{ date: "2026-11-01", change: "Marked as needing enrollment." }],
  "gold-resy-50": [
    { date: "2026-10-28", change: "Replaced the earlier Resy entry: $50 twice a year, enrollment needed." },
    { date: "2026-11-07", change: "Only restaurants marked eligible on Resy count, since 1 August 2026." },
  ],
  "gold-dunkin": [{ date: "2026-10-28", change: CHECKED_ADDED }],

  // --- Sapphire Reserve -----------------------------------------------------
  "csr-edit-500": [
    { date: "2026-10-28", change: "Added as $500 a year for stays booked through The Edit." },
    { date: "2026-11-02", change: "Changed to $250 twice a year, January to June and July to December." },
    {
      date: "2026-11-07",
      change: "Corrected to one $500 pool a calendar year, up to $250 a stay, as Chase's page states.",
    },
  ],
  "csr-select-hotels": [{ date: "2026-11-02", change: CHECKED_ADDED }],
  "csr-stubhub": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-02", change: "Marked limited: ends 31 December 2027. Needs activating." },
  ],
  "csr-doordash": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-02", change: "Marked limited: ends 31 December 2029. Needs DashPass, free with the card." },
  ],
  "csr-lyft": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-02", change: "Marked limited: ends 30 September 2027." },
  ],
  "csr-peloton": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-02", change: "Marked limited: ends 31 December 2027. Needs activating." },
  ],

  // --- Sapphire Preferred ---------------------------------------------------
  "csp-hotel": [{ date: "2026-10-28", change: "Raised from $50 to $100 a year, Chase Travel hotels only." }],
  "csp-doordash": [{ date: "2026-10-28", change: CHECKED_ADDED }],

  // --- Bilt -----------------------------------------------------------------
  "bilt-obsidian-hotel": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "bilt-palladium-hotel": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "bilt-palladium-cash": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-07", change: "Noted that Bilt Cash expires 12 months after it is earned." },
  ],

  // --- Hilton and United ----------------------------------------------------
  "hilton-resort": [
    { date: "2026-10-28", change: "Renamed the Hilton credit: purchases made directly with a Hilton property." },
  ],
  "aspire-resort": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "aspire-flight": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "aspire-clear": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "brilliant-dining": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "united-tb-10k": [
    { date: "2026-10-28", change: "Replaced the earlier travel credit: $100 a year, paid once $10,000 is spent." },
  ],
  "united-hotels": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "united-rideshare": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "united-instacart": [
    { date: "2026-10-28", change: CHECKED_ADDED },
    { date: "2026-11-05", change: "One order of $10 or more a month, while Instacart+ is active. Marked limited: ends 31 December 2027." },
  ],
  "united-avis": [{ date: "2026-10-28", change: CHECKED_ADDED }],
  "united-jsx": [{ date: "2026-10-28", change: CHECKED_ADDED }],

  // --- Delta ----------------------------------------------------------------
  "reserve-resy": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "reserve-rideshare": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "reserve-stays": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "dplat-resy": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "dplat-rideshare": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "dplat-stays": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "dgold-rideshare": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "dgold-stays": [{ date: "2026-11-01", change: AMEX_ADDED }],
  "dgold-flight": [{ date: "2026-11-01", change: AMEX_ADDED }],
};
