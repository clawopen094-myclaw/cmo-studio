"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import type { Handoff } from "@/contracts/types";
import { HANDOFF_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";

/**
 * Single visible specialist-to-CMO escalation projection. Per ui-rules.md:
 * states are pending, accepted, declined, needs clarification, or cancelled.
 * One handoff is projected from both source and CMO threads — the same
 * record, never two.
 */
function HandoffCard({ handoff }: { handoff: Handoff }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-app-warning bg-app-warning-soft p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ArrowRight aria-hidden className="size-4 text-app-warning" />
          <span className="text-sm font-medium text-app-ink">
            Handoff to AI CMO
          </span>
          <Badge variant="outline">{handoff.sourceAgentKey}</Badge>
        </div>
        <StatusIndicator descriptor={HANDOFF_STATUS[handoff.status]} />
      </div>
      <p className="text-sm text-app-ink-secondary">{handoff.reason}</p>
      <p className="text-xs text-app-ink-muted">
        <span className="font-medium text-app-ink-secondary">
          Requested outcome:
        </span>{" "}
        {handoff.requestedOutcome}
      </p>
      <p className="text-xs text-app-ink-muted">{handoff.safeContextSummary}</p>
    </div>
  );
}

export { HandoffCard };