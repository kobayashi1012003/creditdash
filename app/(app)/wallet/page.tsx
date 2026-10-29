import type { Metadata } from "next";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Wallet",
};

/** The header renders inside WalletView, since its "Add cards" opens the view's sheet. */
export default function WalletPage() {
  return <WalletView />;
}
