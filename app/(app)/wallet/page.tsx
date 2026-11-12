import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = pageMetadata({
  path: "/wallet",
  title: "Credit card organizer: which card to use | CreditDash",
  description:
    "Add the cards you own and see which one earns the most for dining, groceries, travel or a store you search for. Try the demo, no sign-up or bank login.",
});

/** The header renders inside WalletView, since its "Add cards" opens the view's sheet. */
export default function WalletPage() {
  return <WalletView />;
}
