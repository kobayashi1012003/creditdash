import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
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
