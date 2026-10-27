import {
  BreakEvenCalculator,
  PointsCalculator,
  SpendCalculator,
} from "@/components/calculators/calculators";

/**
 * Deliberately not a client module. The calculators themselves are client
 * components, but this list is plain data, and plain data exported from a
 * "use client" file does not survive the boundary into a server component.
 */
export const CALCULATORS = [
  {
    id: "break-even",
    title: "Annual fee break-even",
    blurb: "How much you need to put on a card before its fee pays for itself.",
    Component: BreakEvenCalculator,
  },
  {
    id: "spend",
    title: "What is my spend worth?",
    blurb: "A month of spending by category, valued on every card you own.",
    Component: SpendCalculator,
  },
  {
    id: "points",
    title: "Points to dollars",
    blurb: "A balance converted at what you think a point is worth.",
    Component: PointsCalculator,
  },
] as const;
