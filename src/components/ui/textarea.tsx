"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Multiline entry. Initial composer height 96px; auto-grow happens in the
 * ChatComposer wrapper, not here. Used through FormField for labels/errors.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-md border border-app-border-strong bg-app-surface px-3 py-2 text-sm text-app-ink placeholder:text-app-ink-muted transition-[border-color,box-shadow] duration-150 focus-visible:border-app-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus/40 focus-visible:shadow-[0_0_0_4px_rgba(250,250,250,0.05)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };