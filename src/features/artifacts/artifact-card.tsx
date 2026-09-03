"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { FileText, Film, Image as ImageIcon, Sparkles } from "lucide-react";

import type { Artifact, Id } from "@/contracts/types";
import { ARTIFACT_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { transitions } from "@/lib/motion";

/**
 * Typed deliverable, version, provenance, state, and Simulation label.
 * Per ui-rules.md: no download/share/play-as-video/publish controls appear;
 * storyboards use ordered shot cards in their detail view (not yet shipped).
 *
 * Motion: subtle lift on hover, icon fade-in on mount.
 */
function ArtifactCard({
  artifact,
  workspaceId: _workspaceId,
}: {
  artifact: Artifact;
  workspaceId: Id;
}) {
  const reduced = useReducedMotion();
  const Icon = iconFor(artifact.type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : transitions.medium}
      whileHover={reduced ? undefined : { y: -2 }}
      className="group flex cursor-default flex-col gap-2 rounded-md border border-app-border bg-app-surface p-3 transition-colors duration-150 hover:border-app-border-strong hover:bg-app-surface/95"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-md bg-app-surface-subtle text-app-ink-muted transition-colors duration-150 group-hover:text-app-ink"
          >
            <Icon className="size-4" />
          </span>
          <span className="truncate text-sm font-medium text-app-ink">
            {artifact.title}
          </span>
        </div>
        <Badge variant="outline">v{artifact.version}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{typeLabel(artifact.type)}</Badge>
        <StatusIndicator descriptor={ARTIFACT_STATUS[artifact.status]} />
        {artifact.isSimulated ? (
          <Badge variant="outline" className="inline-flex items-center gap-1">
            <Sparkles aria-hidden className="size-3" />
            Simulation
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-app-ink-muted">
        Produced by {artifact.producingAgentKey.replaceAll("_", " ")} · sha256{" "}
        {artifact.sha256.slice(0, 8)}
      </p>
    </motion.div>
  );
}

function iconFor(type: Artifact["type"]): React.ElementType {
  switch (type) {
    case "simulated_media":
      return Film;
    case "storyboard":
      return ImageIcon;
    case "script":
    case "research_brief":
    case "strategy_brief":
    case "qa_report":
    case "final_report":
    default:
      return FileText;
  }
}

function typeLabel(type: Artifact["type"]): string {
  switch (type) {
    case "research_brief":
      return "Research brief";
    case "strategy_brief":
      return "Strategy brief";
    case "script":
      return "Script";
    case "storyboard":
      return "Storyboard";
    case "simulated_media":
      return "Simulated media";
    case "qa_report":
      return "QA report";
    case "final_report":
      return "Final report";
  }
}

export { ArtifactCard };