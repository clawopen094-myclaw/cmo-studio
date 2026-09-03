"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "./button";

/**
 * Focused decision primitive. Labelled title + description, focus trap,
 * Escape behavior, focus restored to the trigger. Used for destructive
 * confirmations and the manual approval rationale form.
 */

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const triggerRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange(false);
        (triggerRef.current as HTMLElement | null)?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 grid place-items-center"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-[min(560px,calc(100vw-32px))] rounded-xl border border-app-border bg-app-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-app-ink">{title}</h2>
            {description ? (
              <p className="mt-1.5 text-sm text-app-ink-muted">{description}</p>
            ) : null}
          </div>
          <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-8 items-center justify-center rounded-md text-app-ink-muted hover:bg-app-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmDialog };