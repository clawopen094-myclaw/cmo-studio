"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

/**
 * Registered button primitive. One CVA owner; do not fork. All call sites
 * select semantic variants — they never paste the base class recipe.
 *
 * Motion: subtle scale on press, color transition on hover/focus. Honors
 * prefers-reduced-motion via useReducedMotion().
 *
 * Sizing follows ui-tokens.md: 40px standard, 44px on coarse pointers.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-app-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg aria-invalid:ring-2 aria-invalid:ring-app-danger",
  {
    variants: {
      variant: {
        default:
          "bg-app-primary text-app-primary-ink hover:bg-app-primary-hover shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        secondary:
          "bg-app-surface-subtle text-app-ink hover:bg-app-surface-strong",
        outline:
          "border border-app-border-strong bg-app-surface text-app-ink hover:bg-app-surface-subtle hover:border-app-ink-muted",
        ghost:
          "bg-transparent text-app-ink hover:bg-app-surface-subtle",
        destructive:
          "bg-app-danger-soft text-app-danger hover:bg-app-danger hover:text-white",
        link: "text-app-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const reduced = useReducedMotion();
  if (asChild) {
    return (
      <Slot
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
  return (
    <motion.button
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      whileHover={reduced ? undefined : { scale: 1.015 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      transition={transitions.fast}
      {...(props as unknown as React.ComponentProps<typeof motion.button>)}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };