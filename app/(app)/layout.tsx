import { Sidebar } from "@/components/shell/sidebar";
import { TabBar } from "@/components/shell/tab-bar";
import { SkipLink } from "@/components/shell/skip-link";
import { StorageNotice } from "@/components/shell/storage-notice";

/**
 * The signed-in shell. Sidebar on desktop, tab bar on mobile, with the
 * content column capped at 1200px as the plan specifies.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col lg:pl-[232px]">
      <SkipLink />
      <Sidebar />
      {/* Bottom padding clears the mobile tab bar. tabIndex lets the skip
          link move focus here, not just scroll. */}
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-24 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
      >
        <StorageNotice />
        {children}
      </main>
      <TabBar />
    </div>
  );
}
