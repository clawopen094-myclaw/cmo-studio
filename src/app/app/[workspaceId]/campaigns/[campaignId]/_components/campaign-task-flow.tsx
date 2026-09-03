"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";

import type { CampaignTask, Id } from "@/contracts/types";
import { TASK_AGENT_MAP, FIXED_UGC_WORKFLOW } from "@/server/catalog/agents";
import { TASK_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { transitions } from "@/lib/motion";

/**
 * Fixed ordered task flow. Parallel research and strategy are presented
 * sequentially here; logical DOM order is preserved. Per ui-rules.md:
 * explicit "Blocked by …" text accompanies the visual connectors — never
 * connector-only communication.
 *
 * Motion: each task card reveals in sequence when the page mounts.
 */
function CampaignTaskFlow({
  tasks,
}: {
  tasks: CampaignTask[];
  workspaceId?: Id;
}) {
  const reduced = useReducedMotion();
  const byKey = new Map<string, CampaignTask[]>();
  for (const t of tasks) {
    const arr = byKey.get(t.templateTaskKey) ?? [];
    arr.push(t);
    byKey.set(t.templateTaskKey, arr);
  }

  const sequence = FIXED_UGC_WORKFLOW.taskSequence;

  return (
    <ol className="flex flex-col gap-2">
      {sequence.map((key, idx) => {
        const variants = byKey.get(key) ?? [];
        const current =
          variants.find((t) => t.isCurrent && t.status !== "completed") ??
          variants.find((t) => t.isCurrent) ??
          variants[0];
        if (!current) {
          return (
            <motion.li
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...transitions.medium,
                delay: reduced ? 0 : idx * 0.05,
              }}
              className="rounded-md border border-dashed border-app-border p-3 text-sm text-app-ink-muted"
            >
              {labelFor(key)} not started.
            </motion.li>
          );
        }
        const blockedByNames = current.dependsOnTaskIds
          .map((id) => tasks.find((t) => t.id === id))
          .filter(Boolean)
          .map(
            (t) =>
              t!.assignedAgentKey === "ai_cmo"
                ? "AI CMO"
                : t!.assignedAgentKey.replaceAll("_", " "),
          );

        return (
          <motion.li
            key={`${key}-${current.revisionIndex}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...transitions.medium,
              delay: reduced ? 0 : idx * 0.05,
            }}
            className="relative rounded-md border border-app-border bg-app-surface/60 p-3 transition-colors duration-150 hover:bg-app-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{labelFor(key)}</Badge>
                <span className="text-sm font-medium text-app-ink">
                  {displayAgent(TASK_AGENT_MAP[key]!)}
                </span>
              </div>
              <StatusIndicator descriptor={TASK_STATUS[current.status]} />
            </div>
            {current.resultSummary ? (
              <p className="mt-2 text-sm text-app-ink-secondary">
                {current.resultSummary}
              </p>
            ) : null}
            {current.status === "pending" && blockedByNames.length > 0 ? (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-app-ink-muted">
                <ArrowRight aria-hidden className="size-3" />
                Blocked by {joinNames(blockedByNames)}.
              </p>
            ) : null}
            {variants.length > 1 ? (
              <p className="mt-2 text-xs text-app-ink-muted">
                Revision {current.revisionIndex + 1} of {variants.length}.
              </p>
            ) : null}
          </motion.li>
        );
      })}
    </ol>
  );
}

function labelFor(key: string): string {
  switch (key) {
    case "audience_research":
      return "Audience research";
    case "brand_strategy":
      return "Brand strategy";
    case "creative_package":
      return "Creative package";
    case "simulated_production":
      return "Simulated production";
    case "creative_qa":
      return "Creative QA";
    case "final_report":
      return "Final report";
    default:
      return key;
  }
}

function displayAgent(key: string): string {
  switch (key) {
    case "ai_cmo":
      return "AI CMO";
    case "audience_researcher":
      return "Audience Researcher";
    case "brand_strategist":
      return "Brand Strategist";
    case "ugc_writer":
      return "UGC Writer";
    case "media_producer":
      return "Media Producer";
    case "creative_qa":
      return "Creative QA";
    default:
      return key;
  }
}

function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export { CampaignTaskFlow };