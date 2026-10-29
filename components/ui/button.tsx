import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Restyled from the shadcn generator to the CreditDash tokens. Buttons share
 * the 6px control radius with chips; inner surfaces and inputs are 8px.
 *
 * Press feedback is a 0.97 scale over the press duration rather than the
 * generated 1px nudge, so the whole control responds to the touch.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 select-none items-center justify-center gap-2",
    "rounded-control border border-transparent whitespace-nowrap",
    "text-sm font-medium",
    "transition-[background-color,border-color,color,transform,opacity]",
    "duration-[var(--cd-dur-press)] ease-out",
    "active:scale-[0.97]",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** One primary action per screen. */
        default: "bg-ink text-bg hover:bg-ink/90",
        outline: "border-line bg-surface text-ink hover:border-muted",
        ghost: "text-muted hover:bg-surface hover:text-ink",
        link: "text-ink underline underline-offset-4 decoration-line hover:decoration-current rounded-none",
        destructive:
          "border-line bg-surface text-[var(--destructive)] hover:border-[var(--destructive)]",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-10 px-5",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
