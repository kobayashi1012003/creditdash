import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/shell/page-header";
import { CompareView } from "@/components/compare/compare-view";
import { CARDS } from "@/data/cards.seed";

export const metadata: Metadata = pageMetadata({
  path: "/compare",
  title: "Compare credit cards side by side | CreditDash",
  description:
    "Put up to three credit cards side by side: earn rates by category, annual fees, credits a year and lounges, with the winner of each row tinted.",
});

export default function ComparePage() {
  return (
    <>
      <PageHeader
        title="Compare"
        description="Pick up to 3 cards to see side by side. The winner of each row is tinted."
      />
      <CompareView all={CARDS} />
    </>
  );
}
