import type { Card, FaceStyle, Network, Program } from "./types";

/**
 * Cards people can add before their data is in (owner, 6 November 2026):
 * real art from the owner's folder, but no earn rates, credits or fee yet.
 *
 * They are kept out of `CARDS` on purpose. Everything that ranks, compares
 * or adds up money reads `CARDS`, so these can never produce a made-up
 * number; only the add sheet, `getCard` and the wallet see them, and each
 * shows "Details coming soon". `program` is the issuer's usual programme,
 * only so the type holds; nothing reads it while `pending` is set.
 *
 * To finish one: move it into `CARDS` in cards.seed.ts with its real data,
 * check it against the issuer, set `lastVerified`, and drop `pending`.
 */

const AMEX = "https://www.americanexpress.com/us/credit-cards/";
const AMEX_BUSINESS = "https://www.americanexpress.com/us/business/credit-cards/";
const CHASE = "https://creditcards.chase.com/";
const CHASE_BUSINESS = "https://creditcards.chase.com/business-credit-cards";
const CITI = "https://www.citi.com/credit-cards/compare/view-all-credit-cards";
const CAPITAL_ONE_BUSINESS = "https://www.capitalone.com/small-business/credit-cards/";

function pending(
  id: string,
  name: string,
  issuer: string,
  network: Network,
  program: Program,
  issuerUrl: string,
  base: string,
  foil = "#F4F3EE",
): Card {
  const faceStyle: FaceStyle = { base, shade: base, foil, finish: "matte" };
  return {
    id,
    name,
    issuer,
    network,
    annualFee: 0,
    program,
    faceStyle,
    issuerUrl,
    lastVerified: "2026-11-06",
    foreignTransactionFee: 0,
    loungeAccess: null,
    earnRates: [],
    credits: [],
    pending: true,
  };
}

export const PENDING_CARDS: Card[] = [
  // American Express
  pending("amex-green", "Amex Green", "American Express", "amex", "amex-mr", AMEX, "#4F6B4A"),
  pending("amex-blue-cash-everyday", "Blue Cash Everyday", "American Express", "amex", "amex-mr", AMEX, "#1F6FB8"),
  pending("amex-blue-cash-preferred", "Blue Cash Preferred", "American Express", "amex", "amex-mr", AMEX, "#0E4C92"),
  pending("amex-business-gold", "Amex Business Gold", "American Express", "amex", "amex-mr", AMEX_BUSINESS, "#B8963F", "#2A2210"),
  pending("amex-business-platinum", "Amex Business Platinum", "American Express", "amex", "amex-mr", AMEX_BUSINESS, "#BFC2C6", "#1E1F21"),
  pending("delta-gold-business", "Delta SkyMiles Gold Business", "American Express", "amex", "delta", AMEX_BUSINESS, "#B8963F", "#2A2210"),
  pending("delta-platinum-business", "Delta SkyMiles Platinum Business", "American Express", "amex", "delta", AMEX_BUSINESS, "#BFC2C6", "#1E1F21"),
  pending("delta-reserve-business", "Delta SkyMiles Reserve Business", "American Express", "amex", "delta", AMEX_BUSINESS, "#E9EAEC", "#1E1F21"),

  // Chase
  pending("csr-business", "Sapphire Reserve for Business", "Chase", "visa", "chase-ur", CHASE_BUSINESS, "#1B2A44"),
  pending("ink-preferred", "Ink Business Preferred", "Chase", "visa", "chase-ur", CHASE_BUSINESS, "#1D2B3A"),
  pending("ink-unlimited", "Ink Business Unlimited", "Chase", "visa", "chase-ur", CHASE_BUSINESS, "#2C5E8A"),
  pending("ink-premier", "Ink Business Premier", "Chase", "visa", "chase-ur", CHASE_BUSINESS, "#2B2B2E"),
  pending("chase-prime-visa", "Prime Visa", "Chase", "visa", "chase-ur", CHASE, "#14263F"),
  pending("chase-amazon", "Amazon Visa", "Chase", "visa", "chase-ur", CHASE, "#2C2C2C"),
  pending("united-gateway", "United Gateway", "Chase", "visa", "united", CHASE, "#1E4F9C"),
  pending("united-quest", "United Quest", "Chase", "visa", "united", CHASE, "#0E2B58"),
  pending("united-club", "United Club", "Chase", "visa", "united", CHASE, "#121A2B"),
  pending("hyatt-business", "World of Hyatt Business", "Chase", "visa", "hyatt", CHASE_BUSINESS, "#1F3B5C"),

  // Citi
  pending("citi-strata", "Strata", "Citi", "mastercard", "citi-ty", CITI, "#2B4A7A"),
  pending("citi-strata-elite", "Strata Elite", "Citi", "mastercard", "citi-ty", CITI, "#1E1E22"),
  pending("citi-double-cash", "Double Cash", "Citi", "mastercard", "citi-ty", CITI, "#1F5FA6"),
  pending("citi-custom-cash", "Custom Cash", "Citi", "mastercard", "citi-ty", CITI, "#1B7CC4"),
  pending("aa-platinum-select", "AAdvantage Platinum Select", "Citi", "mastercard", "aadvantage", CITI, "#5E6B78"),
  pending("aa-executive", "AAdvantage Executive", "Citi", "mastercard", "aadvantage", CITI, "#26272B"),

  // Capital One
  pending("venture-x-business", "Venture X Business", "Capital One", "visa", "capital-one", CAPITAL_ONE_BUSINESS, "#1B2533"),
];
