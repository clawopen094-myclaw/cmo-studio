"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

import { getToneClasses, type StatusDescriptor } from "@/features/agents/status";

/**
 * Renders one StatusDescriptor. Renders both icon and text so status is
 * conveyed by text + icon + tone — never color alone (WCAG 2.2 AA).
 *
 * Motion: the icon fades between descriptors so consecutive status
 * changes don't snap. The running-family descriptors get a subtle
 * pulsing opacity loop. prefers-reduced-motion disables the pulse and
 * the icon transition.
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
  const reduced = useReducedMotion();
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
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-150",
        getToneClasses(descriptor.tone),
        size === "sm" && "text-[11px] px-1.5",
        className,
      )}
    >
      {showIcon ? (
        <span aria-hidden className="relative grid size-3 place-items-center">
          <AnimatePresence mode="wait" initial={false}>
            {isAnim ? (
              <motion.span
                key="pulse"
                initial={{ opacity: 0 }}
                animate={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: [0.4, 1, 0.4], scale: [0.92, 1, 0.92] }
                }
                exit={{ opacity: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                }
                className="absolute inset-0 grid place-items-center"
              >
                <Loader2 className="size-3 animate-spin" />
              </motion.span>
            ) : (
              <motion.span
                key={`icon-${descriptor.label}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={reduced ? { duration: 0 } : transitions.fast}
                className="absolute inset-0 grid place-items-center"
              >
                <Icon className="size-3" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      ) : null}
      <span>{descriptor.label}</span>
    </span>
  );
}

export { StatusIndicator };