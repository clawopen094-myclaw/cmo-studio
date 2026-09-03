"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Closed-option primitive. Self-contained popover + keyboard support so we
 * don't depend on a specific third-party menu version. Used through FormField
 * for label/error relationships.
 */

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

function usePopover() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        popoverRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      )
        return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, triggerRef, popoverRef };
}

function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  ariaLabel,
}: SelectProps) {
  const pop = usePopover();
  const current = options.find((o) => o.value === value);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={pop.triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={pop.open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => pop.setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-app-border-strong bg-app-surface px-3 py-2 text-sm text-app-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:opacity-50"
      >
        <span className={cn(!current && "text-app-ink-muted")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronsUpDown aria-hidden className="size-4 text-app-ink-muted" />
      </button>
      {pop.open ? (
        <div
          ref={pop.popoverRef}
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-50 w-[var(--anchor-width,100%)] min-w-full overflow-hidden rounded-md border border-app-border bg-app-surface p-1 shadow-lg"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onValueChange?.(opt.value);
                  pop.setOpen(false);
                  pop.triggerRef.current?.focus();
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-sm px-2 py-2 text-left text-sm",
                  isActive
                    ? "bg-app-surface-subtle text-app-ink"
                    : "text-app-ink hover:bg-app-surface-subtle",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{opt.label}</span>
                  {isActive ? (
                    <Check aria-hidden className="size-4 text-app-success" />
                  ) : null}
                </span>
                {opt.description ? (
                  <span className="text-xs text-app-ink-muted">
                    {opt.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export { Select };
export type { SelectOption, SelectProps };