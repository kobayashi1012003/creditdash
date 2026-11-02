import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { CatalogReview } from "@/components/admin/catalog-review";

export const metadata: Metadata = {
  title: "Card catalog",
  robots: { index: false, follow: false },
};

/** The owner's review of the card catalog. Not in the navigation. */
export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Card catalog"
        description="When each card was last checked against its issuer, stalest first."
      />
      <CatalogReview />
    </>
  );
}
