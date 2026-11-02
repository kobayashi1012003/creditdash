import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Google, an emailed link, or carrying on as the demo user. The callback
 * route sends failures back here with `?error=`, which the form explains.
 */
export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="font-display text-[34px] leading-tight sm:text-[40px]">
        Sign in, or start free.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        A free account saves your wallet and Tracker to every device. New
        here? Either option below creates one. Or try the demo, which is not
        saved to an account.
      </p>

      <SignInForm error={typeof error === "string" ? error : undefined} />

      <p className="mt-8 text-[13px] leading-relaxed text-muted">
        We will never ask for a card number, an expiry date, a CVV or a bank
        login. Read the{" "}
        <Link
          href="/privacy"
          className="rounded-inner underline underline-offset-4 transition-colors duration-[var(--cd-dur-hover)] ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
