import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/shell/wordmark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Any URL that matches nothing. Rendered by the root layout alone, so it
 * carries its own way home rather than relying on a header.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-10">
      <Link
        href="/"
        className="w-fit rounded-inner focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        <Wordmark />
      </Link>
      <div className="my-auto max-w-[48ch] py-16">
        <h1 className="font-display text-[34px] leading-tight sm:text-[42px]">
          There is no page here.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          The address may be mistyped, or the page may have moved. Your wallet
          is where you left it.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/wallet" />}>
            Go to Wallet
          </Button>
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            Home
          </Button>
        </div>
      </div>
    </main>
  );
}
