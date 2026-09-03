"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

/**
 * Card primitive. Flat by default; semantic semantic only. Status and
 * agent identity never change card appearance — domain color belongs in
 * typed status descriptors, not in Card.
 *
 * Motion: subtle border/bg shift on interactive cards. Lifts only on
 * explicit `interactive` prop so static containers stay still.
 */

type CardProps = React.ComponentProps<"div"> & {
  interactive?: boolean;
};

function Card({ className, interactive = false, ...props }: CardProps) {
  const reduced = useReducedMotion();
  if (!interactive) {
    return (
      <div
        data-slot="card"
        className={cn(
          "flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-6 transition-colors duration-150",
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <motion.div
      data-slot="card"
      data-interactive
      className={cn(
        "flex cursor-pointer flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-6 transition-colors duration-150 hover:border-app-border-strong hover:bg-app-surface/95 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
        className,
      )}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { y: 0 }}
      transition={transitions.fast}
      {...(props as unknown as React.ComponentProps<typeof motion.div>)}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base font-semibold leading-none text-app-ink",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-app-ink-muted", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("text-sm text-app-ink-secondary", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center justify-between", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};