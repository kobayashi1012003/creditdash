"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { CheckIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A dropdown restyled to the tokens. It scales from its trigger (Base UI
 * sets --transform-origin), from 0.95 and never from nothing, over the
 * menu duration. Radio items for one choice, checkbox items for several;
 * neither closes the menu, so a few filters can be set in one go.
 */
export function Menu({
  trigger,
  children,
  align = "end",
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
}) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger render={trigger as React.ReactElement} />
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner sideOffset={6} align={align} className="z-50 outline-none">
          <MenuPrimitive.Popup
            className={cn(
              "max-h-[min(70vh,var(--available-height))] w-[248px] overflow-y-auto overscroll-contain",
              "rounded-inner border border-line bg-surface p-1.5 text-ink shadow-lifted outline-none",
              "origin-[var(--transform-origin)] transition-[opacity,transform] duration-[var(--cd-dur-menu)] ease-out",
              "data-starting-style:scale-[0.95] data-starting-style:opacity-0",
              "data-ending-style:scale-[0.95] data-ending-style:opacity-0",
            )}
          >
            {children}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

const itemClass = cn(
  "flex w-full cursor-default items-center gap-2.5 rounded-control px-2.5 py-2 text-[14px] outline-none select-none",
  "transition-[background-color] duration-[var(--cd-dur-hover)] ease-out",
  "data-highlighted:bg-panel",
);

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <MenuPrimitive.GroupLabel className="px-2.5 pt-2 pb-1 text-[12px] font-medium text-muted">
      {children}
    </MenuPrimitive.GroupLabel>
  );
}

export function MenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <MenuPrimitive.Group>
      {label && <MenuLabel>{label}</MenuLabel>}
      {children}
    </MenuPrimitive.Group>
  );
}

export function MenuSeparator() {
  return <MenuPrimitive.Separator className="my-1.5 h-px bg-line" />;
}

export function MenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <MenuPrimitive.RadioGroup value={value} onValueChange={(v) => onValueChange(String(v))}>
      {children}
    </MenuPrimitive.RadioGroup>
  );
}

export function MenuRadioItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <MenuPrimitive.RadioItem value={value} closeOnClick className={itemClass}>
      <span className="grid size-4 shrink-0 place-items-center">
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon size={14} weight="bold" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export function MenuCheckboxItem({
  checked,
  onCheckedChange,
  disabled,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      closeOnClick={false}
      className={cn(itemClass, "data-disabled:opacity-40")}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-control border",
          "transition-[background-color,border-color] duration-[var(--cd-dur-press)] ease-out",
          checked ? "border-transparent bg-ink text-bg" : "border-muted/60",
        )}
      >
        {checked && <CheckIcon size={11} weight="bold" />}
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export function MenuItem({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <MenuPrimitive.Item onClick={onClick} disabled={disabled} className={cn(itemClass, "text-muted data-disabled:opacity-40")}>
      {children}
    </MenuPrimitive.Item>
  );
}
