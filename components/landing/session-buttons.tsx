"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { hasSessionCookie } from "@/lib/data/supabase";
import { Button } from "@/components/ui/button";

/**
 * The public pages' calls to action, aware of whether someone is signed in.
 * The pages themselves are server-rendered and cannot know, so these render
 * the signed-out version first and switch after hydration. Reading the
 * session cookie is enough for a label; nothing here trusts it further.
 */

const noSubscribe = () => () => {};

function useSignedIn(): boolean {
  return useSyncExternalStore(noSubscribe, hasSessionCookie, () => false);
}

/** "Open the demo" for visitors, "Dashboard" for members. */
export function DashboardButton({
  className,
  size,
  arrow = false,
}: {
  className?: string;
  size?: "sm" | "default";
  arrow?: boolean;
}) {
  const signedIn = useSignedIn();
  return (
    <Button size={size} className={className} nativeButton={false} render={<Link href="/wallet" />}>
      {signedIn ? "Dashboard" : "Open the demo"}
      {arrow && <ArrowRightIcon size={15} weight="bold" />}
    </Button>
  );
}

/**
 * "Sign in" for visitors. For members, "Sign out", which ends the session
 * and lands on the sign-in page, so switching accounts is one step.
 */
export function AccountButton({
  className,
  variant = "ghost",
  size,
}: {
  className?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "default";
}) {
  const signedIn = useSignedIn();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        nativeButton={false}
        render={<Link href="/signin" />}
      >
        Sign in
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        // Loaded on click: the data layer stays out of the marketing
        // pages' download for everyone who never presses this.
        const { signOut } = await import("@/lib/data");
        await signOut();
        router.push("/signin");
      }}
    >
      {busy ? "Signing out" : "Sign out"}
    </Button>
  );
}
