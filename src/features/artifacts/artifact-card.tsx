import type { Artifact, Id } from "@/contracts/types";
import { ARTIFACT_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";

/**
 * Typed deliverable, version, provenance, state, and Simulation label.
 * Per ui-rules.md: no download/share/play-as-video/publish controls appear;
 * storyboards use ordered shot cards in their detail view (not yet shipped).
 */
function ArtifactCard({
  artifact,
  workspaceId: _workspaceId,
}: {
  artifact: Artifact;
  workspaceId: Id;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-app-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-app-ink">
          {artifact.title}
        </span>
        <Badge variant="outline">v{artifact.version}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{typeLabel(artifact.type)}</Badge>
        <StatusIndicator descriptor={ARTIFACT_STATUS[artifact.status]} />
        {artifact.isSimulated ? (
          <Badge variant="outline">Simulation</Badge>
        ) : null}
      </div>
      <p className="text-xs text-app-ink-muted">
        Produced by {artifact.producingAgentKey.replaceAll("_", " ")} · sha256{" "}
        {artifact.sha256.slice(0, 8)}
      </p>
    </div>
  );
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