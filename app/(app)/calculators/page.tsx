import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/shell/page-header";
import { CalculatorsList } from "@/components/calculators/calculators-list";

export const metadata: Metadata = pageMetadata({
  path: "/calculators",
  title: "Annual fee, points and award calculators | CreditDash",
  description:
    "Is this card worth its annual fee? Is an award better than paying cash? What is your spending worth in points? Three calculators that use your own cards.",
});

/**
 * Full-page versions of the same calculators the Tracker panel renders.
 * Same components, different density, so the two can never disagree.
 */
export default function CalculatorsPage() {
  return (
    <>
      <PageHeader
        title="Calculators"
        description="Each one works from your cards and what your points are worth to you."
      />
      <CalculatorsList />
    </>
  );
}
