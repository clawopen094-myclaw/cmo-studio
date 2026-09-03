import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { getToneClasses, type StatusDescriptor } from "@/features/agents/status";

/**
 * Renders one StatusDescriptor. Renders both icon and text so status is
 * conveyed by text + icon + tone — never color alone (WCAG 2.2 AA). Loader2
 * is animated by default for "running"-family tones; aria-live is opted in
 * via the descriptor's announce flag.
 */
function StatusIndicator({
  descriptor,
  size = "default",
  className,
  showIcon = true,
}: {
  descriptor: StatusDescriptor;
  size?: "default" | "sm";
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = descriptor.icon;
  const isAnim =
    descriptor.label === "Running" ||
    descriptor.label === "Sending" ||
    descriptor.label === "Queued";
  return (
    <span
      data-slot="status-indicator"
      data-tone={descriptor.tone}
      aria-live={descriptor.announce ? "polite" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        getToneClasses(descriptor.tone),
        size === "sm" && "text-[11px] px-1.5",
        className,
      )}
    >
      {showIcon ? (
        isAnim ? (
          <Loader2 aria-hidden className="size-3 animate-spin" />
        ) : (
          <Icon aria-hidden className="size-3" />
        )
      ) : null}
      <span>{descriptor.label}</span>
    </span>
  );
}

export { StatusIndicator };