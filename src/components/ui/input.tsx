"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Single-line text entry. Always used through FormField so label and error
 * relationships stay stable. 40px height; 44px on coarse pointers via the
 * FormField wrapper. Focus ring transitions smoothly.
 */
function Input({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-app-border-strong bg-app-surface px-3 py-2 text-sm text-app-ink placeholder:text-app-ink-muted transition-[border-color,box-shadow] duration-150 focus-visible:border-app-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus/40 focus-visible:shadow-[0_0_0_4px_rgba(250,250,250,0.05)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };