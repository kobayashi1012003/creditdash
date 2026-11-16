import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/shell/page-header";
import { NotesView } from "@/components/notes/notes-view";

// Personal notes: nothing here for search to show.
export const metadata: Metadata = pageMetadata({
  path: "/notes",
  title: "Notes | CreditDash",
  description: "Your notes on your credit cards and their credits.",
  index: false,
});

export default function NotesPage() {
  return (
    <>
      <PageHeader title="Notes" description="Anything worth remembering about your cards and their credits." />
      <NotesView />
    </>
  );
}
