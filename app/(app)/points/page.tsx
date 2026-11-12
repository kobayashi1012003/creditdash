import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PointsView } from "@/components/points/points-view";

export const metadata: Metadata = pageMetadata({
  path: "/points",
  title: "Points and miles balances and values | CreditDash",
  description:
    "Keep your points and miles balances in one list and set what each program is worth to you. Every dollar figure in CreditDash uses your values.",
});

/** The header renders inside PointsView, since its "Add programs" opens the view's sheet. */
export default function PointsPage() {
  return <PointsView />;
}
