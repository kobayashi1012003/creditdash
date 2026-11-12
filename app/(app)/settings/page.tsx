import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsView } from "@/components/settings/settings-view";

/** One person's settings: nothing for search, though links on it may be followed. */
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="How the app looks, what your points are worth, and what happens to your data."
      />
      <SettingsView />
    </>
  );
}
