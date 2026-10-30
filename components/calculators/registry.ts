import { AwardVsCashCalculator } from "@/components/calculators/award-vs-cash";
import { CardWorthCalculator } from "@/components/calculators/card-worth";
import { SpendWorthCalculator } from "@/components/calculators/spend-worth";

/**
 * Deliberately not a client module. The calculators themselves are client
 * components, but this list is plain data, and plain data exported from a
 * "use client" file does not survive the boundary into a server component.
 *
 * `short` labels the Tracker panel's tabs, where the full question would
 * wrap onto three lines.
 */
export const CALCULATORS = [
  {
    id: "award",
    title: "Award vs cash",
    short: "Award vs cash",
    blurb: "Should this booking go on points or on a card?",
    Component: AwardVsCashCalculator,
  },
  {
    id: "card-worth",
    title: "Is this card worth it?",
    short: "Worth the fee?",
    blurb: "Whether the benefits you would actually use cover the annual fee.",
    Component: CardWorthCalculator,
  },
  {
    id: "spend",
    title: "What is my spend worth?",
    short: "Spend",
    blurb: "The points a card earns on your spending, and what they are worth.",
    Component: SpendWorthCalculator,
  },
] as const;
