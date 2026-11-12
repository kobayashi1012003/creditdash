import { CARDS } from "@/data/cards.seed";
import { FREE_CARD_LIMIT, PAYMENTS_LIVE, PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY, cardCount } from "@/lib/plan";

/**
 * The home page's questions, written for what people search ("how to track
 * Amex credits", "free credit card benefits tracker"). Plain data, so the
 * server page renders it and the FAQPage JSON-LD repeats it word for word,
 * which Google requires. Keep every answer true to what the app does.
 */

const ISSUERS = [...new Set(CARDS.map((c) => c.issuer))];
const NAMED = ["American Express", "Chase", "Capital One", "Citi", "Bilt"].filter((i) => ISSUERS.includes(i));

export const FAQ: { question: string; answer: string }[] = [
  {
    question: "How do I keep track of my Amex credits?",
    answer:
      "Add your American Express card and the Tracker lists each of its credits, such as Uber Cash, the dining credit and the Resy credit, with how much each is worth and when it resets. Tick a month, quarter or half year off as you use it, and the Tracker keeps the running total and shows what expires soon.",
  },
  {
    question: "Is there a free credit card benefits tracker?",
    answer: `Yes. CreditDash is free for ${cardCount(FREE_CARD_LIMIT)}, with full credit tracking and every calculator, and has no ads. Premium is $${PREMIUM_PRICE_MONTHLY} a month or $${PREMIUM_PRICE_YEARLY} a year for unlimited cards and auto-fill${PAYMENTS_LIVE ? "" : ", once payments are switched on"}. The demo is free with no account at all.`,
  },
  {
    question: "Do I need to link my bank account or enter my card number?",
    answer:
      "No. You pick the cards you own from a list and tick off credits by hand. CreditDash never asks for a card number, expiry date, security code or bank login, and has no field for any of them.",
  },
  {
    question: "Which credit card should I use for each purchase?",
    answer:
      "Pick what you are buying, such as dining, groceries or flights, or search for the store, and CreditDash ranks the cards you own by what that purchase earns. It ranks on value, using what your points are worth to you, rather than just comparing multipliers.",
  },
  {
    question: "Does it know when each credit resets?",
    answer:
      "Yes. Some credits reset with the calendar year and others on your card anniversary, so a card opened in November has quarters starting in November, February, May and August. You enter the date each card was opened and every credit resets on its real date.",
  },
  {
    question: "Can it track travel perks like lounge access and free nights?",
    answer:
      "Each card's details list its travel perks: lounge access, hotel and airline status, free night awards, companion certificates and free checked bags. The annual fee calculator counts the free nights and certificates you actually use toward what the card is worth to you.",
  },
  {
    question: "How do I know if a card's annual fee is worth it?",
    answer:
      "Is this card worth it? adds up the credits you used, any free nights or certificates you use, and what your points are worth at your own valuation, then sets that against the fee. Through the year, the Tracker shows how much of the fee your credits have earned back, so a card that is not paying for itself shows it before the renewal.",
  },
  {
    question: "Which credit cards does CreditDash support?",
    answer: `${CARDS.length} cards so far, from ${NAMED.join(", ")} and others, each checked against the issuer's own terms. Cash back cards are included, and more cards are added as their terms are checked.`,
  },
];
