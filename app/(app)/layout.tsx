import { Sidebar } from "@/components/shell/sidebar";
import { TabBar } from "@/components/shell/tab-bar";

/**
 * The signed-in shell. Sidebar on desktop, tab bar on mobile, with the
 * content column capped at 1200px as the plan specifies.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col lg:pl-[232px]">
      <Sidebar />
      {/* Bottom padding clears the mobile tab bar. */}
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
        {children}
      </div>
      <TabBar />
    </div>
  );
}
