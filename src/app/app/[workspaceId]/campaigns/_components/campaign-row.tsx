"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";

import type { ApprovalMode } from "@/contracts/types";
import type { StatusDescriptor } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { transitions } from "@/lib/motion";
import { formatRelative } from "@/lib/utils";

interface CampaignRowProps {
  index: number;
  href: string;
  title: string;
  statusDescriptor: StatusDescriptor;
  approvalMode: ApprovalMode;
  updatedAt: string;
  currentOwner?: string | null;
}

/**
 * Campaign row. Reveal-in sequence, hover lift, animated arrow on hover.
 * Per ui-rules.md: status + mode + current owner + required action +
 * updated time are always visible.
 */
function CampaignRow({
  index,
  href,
  title,
  statusDescriptor,
  approvalMode,
  updatedAt,
  currentOwner,
}: CampaignRowProps) {
  const reduced = useReducedMotion();
  return (
    <motion.li
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...transitions.medium,
        delay: reduced ? 0 : index * 0.05,
      }}
      whileHover={reduced ? undefined : { y: -2 }}
      className="list-none"
    >
      <Link
        href={href as never}
        className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
      >
        <div className="flex flex-col gap-2 rounded-lg border border-app-border bg-app-surface p-4 transition-colors duration-150 hover:border-app-border-strong hover:bg-app-surface/95 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-base font-semibold tracking-tight text-app-ink">
              {title}
            </span>
            <span className="text-xs text-app-ink-muted">
              Updated {formatRelative(updatedAt)}
              {currentOwner ? (
                <>
                  {" · "}
                  <span className="text-app-ink-secondary">
                    {currentOwner.replaceAll("_", " ")}
                  </span>
                </>
              ) : null}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator descriptor={statusDescriptor} />
            <Badge variant="outline">
              {approvalMode === "manual" ? "Manual" : "Auto"}
            </Badge>
            <span
              aria-hidden
              className="ml-2 inline-flex items-center text-app-ink-muted transition-transform duration-150 group-hover:translate-x-1 group-hover:text-app-ink"
            >
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

export { CampaignRow };
export type { CampaignRowProps };