import type { Metadata } from "next";
import { PointsView } from "@/components/points/points-view";

export const metadata: Metadata = {
  title: "Points",
};

/** The header renders inside PointsView, since its "Add programs" opens the view's sheet. */
export default function PointsPage() {
  return <PointsView />;
}
