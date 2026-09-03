"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, Cpu } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

/**
 * Agent identity, role, and concise capability/limitation summary. Per
 * ui-rules.md: every agent header has a concise capability/limitation
 * summary plus a plain-language details panel. No raw prompts.
 *
 * Motion: the details panel expands with height auto + fade; the chevron
 * rotates smoothly.
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
  const reduced = useReducedMotion();

  return (
    <Card className="shrink-0 border-app-border/80 bg-app-surface/70">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-md bg-app-surface-subtle text-app-ink"
              >
                <Cpu className="size-4" />
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-app-ink">
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
              "inline-flex h-9 items-center gap-1 rounded-md border border-app-border-strong bg-app-surface px-3 text-sm text-app-ink transition-colors duration-150 hover:bg-app-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
            )}
          >
            {expanded ? "Hide capabilities" : "What this agent can do"}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={reduced ? { duration: 0 } : transitions.fast}
              className="inline-flex"
            >
              {expanded ? (
                <ChevronUp aria-hidden className="size-4" />
              ) : (
                <ChevronDown aria-hidden className="size-4" />
              )}
            </motion.span>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="details"
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, height: 0, y: -4 }
              }
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, height: 0, y: -4 }
              }
              transition={reduced ? { duration: 0 } : transitions.medium}
              className="overflow-hidden"
            >
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border border-app-border bg-app-surface/60 p-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
                    Can
                  </h2>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm text-app-ink-secondary">
                    {canDo.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-app-border bg-app-surface/60 p-3">
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export { AgentHeader };