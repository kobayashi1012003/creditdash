"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
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
import { cn } from "@/lib/cn";
import {
  ACCOUNTS_ENABLED,
  prepareSignIn,
  sendSignInLink,
  signInWithGoogle,
  verifySignInCode,
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
  if (code === "not_configured") {
    return "Sign-in is not set up on this build. Try the demo, or sign in on creditdash.co.";
  }
  if (code === "access_denied") {
    return "Google sign-in was cancelled. Nothing was changed.";
  }
  // Usually an email link opened somewhere other than the browser that
  // asked for it, such as a mail app's own browser.
  return "Sign-in did not finish. Type the code from the email instead, or open the link in the browser you requested it from.";
}

// The callback route sends failures back with `?error=`. It is read here in
// the browser, not by the page, so /signin stays prerendered and is served
// from the static cache rather than rendered per request (open-next.config.ts).
const noSubscribe = () => () => {};
const errorFromUrl = () => new URLSearchParams(window.location.search).get("error") ?? undefined;
const noErrorOnServer = () => undefined;

export function SignInForm() {
  const account = useAccount();
  const isLoading = useIsLoading();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | "code" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const urlError = useSyncExternalStore(noSubscribe, errorFromUrl, noErrorOnServer);
  // undefined until a button is pressed; after that, the latest outcome
  // replaces whatever the URL said.
  const [actionError, setError] = useState<string | null | undefined>(undefined);
  const error = actionError === undefined ? explain(urlError) : actionError;

  // The Supabase client is loaded on demand. Fetch it now, in the
  // background, so pressing a button sends you on without a wait.
  useEffect(() => {
    prepareSignIn();
  }, []);

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
    else {
      setSentTo(email.trim());
      setCode("");
    }
  }

  async function checkCode(value: string) {
    if (!sentTo || busy) return;
    setBusy("code");
    setError(null);
    const problem = await verifySignInCode(sentTo, value);
    if (problem) {
      setError(problem);
      setBusy(null);
      return;
    }
    // A full load, not router.push: the store decides its mode once, at
    // start, so only a fresh page starts it in account mode, the way the
    // email link does, import offer included.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${window.location.origin}/wallet`);
  }

  function typeCode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    // Six digits, typed or pasted, is the whole code: sign in at once.
    if (digits.length === 6) void checkCode(digits);
  }

  const disabled = !ACCOUNTS_ENABLED || isLoading || busy !== null;

  return (
    <>
      {/* Once a code is on its way, problems show beside the code box
          instead, where someone typing it is looking. */}
      {error && !sentTo && <Problem className="mt-8">{error}</Problem>}

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
        <div className="rounded-inner border border-line bg-surface p-5">
          <p role="status" className="flex items-center gap-2 text-[15px] font-medium">
            <CheckCircleIcon size={18} weight="fill" className="text-[var(--cd-mint-ink)]" />
            Check your inbox
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We sent a 6-digit code to {sentTo}. Type it here, or open the
            link in the same email in this browser. Both work once and expire
            after an hour.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void checkCode(code);
            }}
            className="mt-4 flex flex-col gap-3"
          >
            {error && <Problem>{error}</Problem>}
            <Label htmlFor="signin-code" className="text-[13px] text-muted">
              Sign-in code
            </Label>
            <Input
              id="signin-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => typeCode(e.target.value)}
              placeholder="000000"
              className="h-12 rounded-inner px-3.5 text-center text-[22px] tracking-[0.4em] tabular-nums placeholder:tracking-[0.4em]"
            />
            <Button type="submit" size="lg" className="w-full" disabled={busy !== null || code.length < 6}>
              {busy === "code" ? "Signing in" : "Sign in"}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-x-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={async () => {
                setBusy("email");
                setError(null);
                const problem = await sendSignInLink(sentTo);
                setBusy(null);
                setCode("");
                if (problem) setError(problem);
              }}
            >
              {busy === "email" ? "Sending" : "Send a new code"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={() => {
                setSentTo(null);
                setCode("");
              }}
            >
              Use a different address
            </Button>
          </div>
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
            {busy === "email" ? "Sending" : "Email me a sign-in code"}
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
        Try the demo without saving
      </Button>
    </>
  );
}

function Problem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-inner bg-butter px-4 py-3 text-butter-ink", className)}
    >
      <WarningCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
