import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeSimpleIcon, GoogleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Temporary. The design is final; the two real providers arrive in Phase 6
 * with Supabase Auth. Until then they are visibly disabled rather than
 * hidden, so the page does not have to be redesigned later.
 */
export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="font-display text-[34px] leading-tight sm:text-[40px]">
        Pick up where you left off.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Accounts are not switched on yet. Continue as the demo user and your
        wallet saves in this browser.
      </p>

      <Button
        size="lg"
        className="mt-8 w-full"
        nativeButton={false}
        render={<Link href="/wallet" />}
      >
        Continue as demo user
      </Button>

      <div
        className="my-7 flex items-center gap-4 text-[13px] text-muted"
        aria-hidden
      >
        <span className="h-px flex-1 bg-line" />
        Coming later
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" size="lg" className="w-full" disabled>
          <GoogleLogoIcon size={18} />
          Continue with Google
        </Button>
        <Button variant="outline" size="lg" className="w-full" disabled>
          <EnvelopeSimpleIcon size={18} />
          Email me a sign-in link
        </Button>
      </div>

      <p className="mt-8 text-[13px] leading-relaxed text-muted">
        We will never ask for a card number, an expiry date, a CVV or a bank
        login. Read the{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink"
        >
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
