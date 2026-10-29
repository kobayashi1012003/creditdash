"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A centred confirmation, for the few actions worth interrupting someone
 * for. Modals stay centred and scale from 0.95, never from nothing; focus
 * moves inside on open and back to the trigger on close (Base UI).
 *
 * The page's own inline confirms (delete everything, delete account) stay
 * inline. This is for a step that leaves the app, where an inline line
 * would be gone the moment the browser navigates.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className={cn(
            // band is dark in both themes, so the scrim dims rather than
            // lightens the page in dark mode.
            "fixed inset-0 z-50 bg-band/50",
            "transition-opacity duration-[var(--cd-dur-pop)] ease-out",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />
        <AlertDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-32px)] max-w-[440px]",
            "rounded-widget border border-line bg-surface p-6 text-ink shadow-lifted",
            "[transform:translate(-50%,-50%)]",
            "transition-[opacity,transform] duration-[var(--cd-dur-pop)] ease-out",
            "data-starting-style:opacity-0 data-starting-style:[transform:translate(-50%,-50%)_scale(0.95)]",
            "data-ending-style:opacity-0 data-ending-style:[transform:translate(-50%,-50%)_scale(0.95)]",
          )}
        >
          <AlertDialog.Title className="font-display text-xl leading-tight">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            render={<div />}
            className="mt-3 space-y-3 text-sm leading-relaxed text-muted"
          >
            {children}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export const ConfirmDialogClose = AlertDialog.Close;
