"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Agent identity, role, and concise capability/limitation summary. Per
 * ui-rules.md: every agent header has a concise capability/limitation
 * summary plus a plain-language details panel. No raw prompts.
 */
function AgentHeader({
  agentName,
  role,
  canDo,
  mustNotDo,
}: {
  agentName: string;
  role: string;
  canDo: string[];
  mustNotDo: string[];
  workspaceName?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="shrink-0">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-app-ink">
                {agentName}
              </h1>
              <Badge variant="outline">v1</Badge>
            </div>
            <p className="text-sm text-app-ink-muted">{role}</p>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-md border border-app-border-strong bg-app-surface px-3 text-sm text-app-ink hover:bg-app-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
            )}
          >
            {expanded ? (
              <>
                Hide capabilities <ChevronUp aria-hidden className="size-4" />
              </>
            ) : (
              <>
                What this agent can do{" "}
                <ChevronDown aria-hidden className="size-4" />
              </>
            )}
          </button>
        </div>
        {expanded ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-app-border p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
                Can
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-app-ink-secondary">
                {canDo.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-app-border p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
                Cannot
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-app-ink-secondary">
                {mustNotDo.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { AgentHeader };