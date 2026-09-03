import type { Artifact, Id } from "@/contracts/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Final CMO report. Persisted as a versioned artifact and surfaced here as
 * the campaign's terminal output. Per ui-rules.md: explicit Simulation
 * indicator + measured/simulated usage labelled accurately.
 */
function FinalReportView({
  artifact,
  workspaceId: _workspaceId,
}: {
  artifact: Artifact;
  workspaceId: Id;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Final CMO report</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm text-app-ink-secondary">
          {artifact.body ?? ""}
        </pre>
        <p className="mt-3 text-xs text-app-ink-muted">
          Status: Simulation. All generated media is a deterministic
          placeholder.
        </p>
      </CardContent>
    </Card>
  );
}

export { FinalReportView };