import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { NotepadIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { TrackerView } from "@/components/tracker/tracker-view";

export const metadata: Metadata = pageMetadata({
  path: "/tracker",
  title: "Credit card credits and travel perks tracker | CreditDash",
  description:
    "Tick off Amex, Chase and other statement credits as you use them. Every credit resets on its real calendar or anniversary date, so none are missed.",
});

export default function TrackerPage() {
  return (
    <>
      <PageHeader
        title="Tracker"
        description="What each card gives back, and how much of it you have taken."
        action={
          // The way to Notes on a phone, whose tab bar has no room for it.
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/notes" />}>
            <NotepadIcon size={15} />
            Notes
          </Button>
        }
      />

      {/* The calculators live on their own page; the Tracker no longer
          carries a docked panel or a floating button (owner, 27 November
          2026). */}
      <TrackerView />
    </>
  );
}
