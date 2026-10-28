import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { WalletView } from "@/components/wallet/wallet-view";

export const metadata: Metadata = {
  title: "Wallet",
};

export default function WalletPage() {
  return (
    <>
      <PageHeader
        title="Wallet"
        description="The cards you carry, and which one to reach for."
      />
      <WalletView />
    </>
  );
}
