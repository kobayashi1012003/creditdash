"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GoogleLogoIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACCOUNTS_ENABLED,
  sendSignInLink,
  signInWithGoogle,
  signOut,
  useAccount,
  useIsLoading,
} from "@/lib/data";

/** Plain words for the codes the callback route passes back. */
function explain(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "otp_expired") {
    return "That sign-in link has expired or was already used. Send yourself a new one.";
  }
  if (code === "access_denied") {
    return "Google sign-in was cancelled. Nothing was changed.";
  }
  // Usually an email link opened somewhere other than the browser that
  // asked for it, such as a mail app's own browser.
  return "Sign-in did not finish. Open the email link in the same browser you asked for it from, or send a new one.";
}

export function SignInForm({ error: initialError }: { error?: string }) {
  const account = useAccount();
  const isLoading = useIsLoading();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(explain(initialError));

  if (account) {
    return (
      <div className="mt-8 rounded-inner border border-line bg-surface p-5">
        <p className="text-[15px]">
          Signed in as <span className="font-medium">{account.email ?? "your account"}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/wallet" />}>
            Go to Wallet
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  async function google() {
    setBusy("google");
    setError(null);
    // On success the browser leaves for Google, so only a failure returns.
    const problem = await signInWithGoogle();
    if (problem) {
      setError(problem);
      setBusy(null);
    }
  }

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    const problem = await sendSignInLink(email);
    setBusy(null);
    if (problem) setError(problem);
    else setSentTo(email.trim());
  }

  const disabled = !ACCOUNTS_ENABLED || isLoading || busy !== null;

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mt-8 flex items-start gap-3 rounded-inner bg-butter px-4 py-3 text-butter-ink"
        >
          <WarningCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{error}</p>
        </div>
      )}

      <Button
        size="lg"
        className="mt-8 w-full"
        onClick={google}
        disabled={disabled}
      >
        <GoogleLogoIcon size={18} weight="bold" />
        {busy === "google" ? "Opening Google" : "Continue with Google"}
      </Button>

      <div className="my-7 flex items-center gap-4 text-[13px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      {sentTo ? (
        <div role="status" className="rounded-inner border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-[15px] font-medium">
            <CheckCircleIcon size={18} weight="fill" className="text-[var(--cd-mint-ink)]" />
            Check your inbox
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A sign-in link is on its way to {sentTo}. Open it in this browser.
            It works once and expires after an hour.
          </p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSentTo(null)}>
            Use a different address
          </Button>
        </div>
      ) : (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <Label htmlFor="signin-email" className="text-[13px] text-muted">
            Email address
          </Label>
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!ACCOUNTS_ENABLED}
            className="h-11 rounded-inner px-3.5 text-base"
          />
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={disabled || email.trim() === ""}
          >
            <EnvelopeSimpleIcon size={18} />
            {busy === "email" ? "Sending link" : "Email me a sign-in link"}
          </Button>
        </form>
      )}

      <Button
        variant="ghost"
        size="lg"
        className="mt-6 w-full"
        nativeButton={false}
        render={<Link href="/wallet" />}
      >
        Continue as demo user
      </Button>
    </>
  );
}
