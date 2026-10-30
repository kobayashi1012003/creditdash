"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DownloadSimpleIcon,
  SignOutIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { FREE_CARD_LIMIT, type Plan } from "@/lib/plan";
import {
  ACCOUNTS_ENABLED,
  deleteAccount,
  deleteEverything,
  setPlan,
  signOut,
  useAccount,
  type Account,
  useIsLoading,
  usePlan,
  useWalletIncludingHidden,
  walletToCsv,
} from "@/lib/data";
import { PlanSection } from "@/components/settings/plan-section";
import { Widget } from "@/components/ui/widget";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SettingsView() {
  const plan = usePlan();
  const entries = useWalletIncludingHidden();
  const isLoading = useIsLoading();
  const account = useAccount();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function exportCsv() {
    const blob = new Blob([walletToCsv(entries)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creditdash-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div aria-busy aria-live="polite" className="space-y-5">
        <span className="sr-only">Loading your settings</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[180px] rounded-widget border border-line bg-surface"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AccountSection account={account} />

      <Widget title="Appearance">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
            System follows whatever your device is set to, and changes with it
            through the day.
          </p>
          <ThemeToggle />
        </div>
      </Widget>

      <PlanSection plan={plan} account={account} />

      <Widget title="Your data">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={entries.length === 0}
          >
            <DownloadSimpleIcon size={16} />
            Export as CSV
          </Button>
          {confirmingDelete ? (
            <>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteEverything();
                  setConfirmingDelete(false);
                }}
              >
                <TrashIcon size={16} />
                Yes, delete it all
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <TrashIcon size={16} />
              Delete everything
            </Button>
          )}
        </div>
        <p className="mt-4 max-w-[58ch] text-[13px] leading-relaxed text-muted">
          {account
            ? confirmingDelete
              ? "This removes every card, credit and balance from your account, on every device. Your account stays. It cannot be undone."
              : "Your wallet is saved to your account. Deleting everything empties it but keeps the account; delete the account itself above."
            : confirmingDelete
              ? "This removes every card, credit and balance from this browser. It cannot be undone."
              : "Your wallet lives in this browser and nowhere else. Clearing site data removes it, and so does the button above."}
        </p>
      </Widget>

      {/* Development only, and demo user only: a real account's plan is set
          by the server. Lets the free card limit be exercised without a
          payment flow existing yet. */}
      {!account && (
        <Widget
          title="Development"
          action={<span className="text-[13px] text-muted">Not shipped</span>}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm">Pretend this account is</p>
              <p className="max-w-[44ch] text-[13px] leading-relaxed text-muted">
                Switches the demo user between plans so the {FREE_CARD_LIMIT}
                -card limit can be tested. Cards over the limit are hidden, not
                deleted.
              </p>
            </div>
            <div className="flex gap-2">
              {(["free", "premium"] as const).map((p) => (
                <Button
                  key={p}
                  variant={plan === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlan(p as Plan)}
                  aria-pressed={plan === p}
                >
                  {p === "free" ? "Free" : "Premium"}
                </Button>
              ))}
            </div>
          </div>
        </Widget>
      )}
    </div>
  );
}

/**
 * Who is signed in, or an invitation to. Deleting the account sits here and
 * not under "Your data" because it ends the account, not just its contents.
 */
function AccountSection({ account }: { account: Account | null }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!account) {
    return (
      <Widget title="Account" id="account" className="scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
            You are the demo user, saved in this browser only. Sign in to keep
            your wallet on every device.
          </p>
          {ACCOUNTS_ENABLED && (
            <Button nativeButton={false} render={<Link href="/signin" />}>
              Sign in
            </Button>
          )}
        </div>
      </Widget>
    );
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const problem = await deleteAccount();
    setBusy(false);
    if (problem) setError(problem);
  }

  return (
    <Widget title="Account" id="account" className="scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">{account.email ?? "Signed in"}</p>
          <p className="mt-0.5 text-[13px] text-muted">Your wallet saves to this account.</p>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          <SignOutIcon size={16} />
          Sign out
        </Button>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap gap-3">
          {confirming ? (
            <>
              <Button variant="destructive" onClick={remove} disabled={busy}>
                <TrashIcon size={16} />
                {busy ? "Deleting account" : "Yes, delete my account"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Keep it
              </Button>
            </>
          ) : (
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              <TrashIcon size={16} />
              Delete account
            </Button>
          )}
        </div>
        <p className="mt-3 max-w-[58ch] text-[13px] leading-relaxed text-muted">
          {confirming
            ? "This deletes the account and everything saved to it, on every device. It cannot be undone. Export a CSV below first if you want a copy."
            : "Deleting your account removes it and all of its data."}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-[13px] leading-relaxed text-[var(--cd-peach-ink)]">
            {error}
          </p>
        )}
      </div>
    </Widget>
  );
}
