"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Megaphone } from "lucide-react";

import type { ApprovalMode } from "@/contracts/types";
import { CAMPAIGN_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { transitions } from "@/lib/motion";
import { formatRelative } from "@/lib/utils";

interface WorkspaceCardProps {
  index: number;
  href: string;
  name: string;
  approvalMode: ApprovalMode;
  productSummary: string;
  pending: number;
  createdAt: string;
}

/**
 * Workspace card. Reveal-in sequence, hover lift, animated arrow on
 * hover. Click anywhere opens the workspace's CMO chat.
 */
function WorkspaceCard({
  index,
  href,
  name,
  approvalMode,
  productSummary,
  pending,
  createdAt,
}: WorkspaceCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...transitions.medium,
        delay: reduced ? 0 : index * 0.06,
      }}
      whileHover={reduced ? undefined : { y: -3 }}
    >
      <Link
        href={href as never}
        className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
      >
        <div className="flex h-full flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-6 transition-colors duration-150 hover:border-app-border-strong hover:bg-app-surface/95 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-9 place-items-center rounded-md bg-app-surface-subtle text-app-ink transition-colors duration-150 group-hover:bg-app-surface-strong"
              >
                <Megaphone className="size-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-semibold tracking-tight text-app-ink">
                  {name}
                </span>
                <span className="text-xs text-app-ink-muted">
                  Created {formatRelative(createdAt)}
                </span>
              </div>
            </div>
            <Badge variant="outline">
              {approvalMode === "manual" ? "Manual" : "Auto"}
            </Badge>
          </div>
          <p className="line-clamp-3 text-sm text-app-ink-secondary">
            {productSummary}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-app-border pt-3">
            <div className="flex items-center gap-2">
              {pending > 0 ? (
                <StatusIndicator
                  descriptor={CAMPAIGN_STATUS.waiting_approval}
                />
              ) : (
                <StatusIndicator descriptor={CAMPAIGN_STATUS.draft} />
              )}
              <span className="text-xs text-app-ink-muted">
                {pending} pending approval{pending === 1 ? "" : "s"}
              </span>
            </div>
            <span
              aria-hidden
              className="inline-flex items-center text-app-ink-muted transition-transform duration-150 group-hover:translate-x-1 group-hover:text-app-ink"
            >
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export { WorkspaceCard };
export type { WorkspaceCardProps };