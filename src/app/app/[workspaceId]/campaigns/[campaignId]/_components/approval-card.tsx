"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, X } from "lucide-react";

import type { ApprovalRequest, Id } from "@/contracts/types";
import { APPROVAL_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { ConfirmDialog } from "@/components/ui/dialog";
import { resolveApprovalAction } from "@/server/mock-runtime/store";
import { listArtifactsForWorkspace } from "@/server/mock-runtime/store";

/**
 * Pre-production approval card. Lists the exact script/storyboard versions
 * being reviewed. Manual: Approve / Request changes (feedback required).
 * Auto: read-only history. Subject artifacts remain inspectable.
 */
function ApprovalCard({
  approval,
  workspaceId,
}: {
  approval: ApprovalRequest;
  workspaceId: Id;
}) {
  const router = useRouter();
  const [decisionMode, setDecisionMode] = React.useState<
    "idle" | "approve" | "changes"
  >("idle");
  const [feedback, setFeedback] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const artifacts = listArtifactsForWorkspace(workspaceId);
  const subjects = approval.subjects
    .map((s) => {
      const artifact = artifacts.find((a) => a.id === s.artifactId);
      return artifact ? { ...s, artifact } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  async function decide(outcome: "approved" | "changes_requested") {
    if (outcome === "changes_requested" && !feedback.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await resolveApprovalAction({
        approvalId: approval.id,
        outcome,
        feedback: outcome === "changes_requested" ? feedback.trim() : undefined,
      });
      setDecisionMode("idle");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Pre-production approval</CardTitle>
          <StatusIndicator descriptor={APPROVAL_STATUS[approval.status]} />
        </div>
        <p className="text-xs text-app-ink-muted">
          {approval.status === "pending"
            ? "Manual mode waits for your decision before simulated production."
            : "This decision is recorded and cannot be reversed."}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {subjects.map((s) => (
            <li
              key={s.artifactId}
              className="flex items-center justify-between gap-3 rounded-md border border-app-border p-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.logicalKey}</Badge>
                  <span className="text-sm font-medium text-app-ink">
                    {s.artifact.title}
                  </span>
                </div>
                <span className="text-xs text-app-ink-muted">
                  v{s.version} · sha256 {s.sha256.slice(0, 8)}
                </span>
              </div>
              <ShieldCheck aria-hidden className="size-4 text-app-success" />
            </li>
          ))}
        </ul>

        {approval.status === "pending" ? (
          decisionMode === "idle" ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDecisionMode("changes")}
              >
                Request changes
              </Button>
              <Button variant="default" onClick={() => decide("approved")}>
                Approve current versions
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-app-border p-3">
              <FormField
                label="Feedback"
                required
                description="What should change before production?"
              >
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Tighten the CTA timing; flag the urgency wording in hook A."
                />
              </FormField>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDecisionMode("idle")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => decide("changes_requested")}
                  disabled={!feedback.trim() || submitting}
                >
                  Request changes
                </Button>
              </div>
            </div>
          )
        ) : null}

        {approval.status === "superseded" ? (
          <p className="inline-flex items-center gap-1 text-xs text-app-ink-muted">
            <AlertTriangle aria-hidden className="size-3" />
            Superseded by a later creative-package version.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { ApprovalCard };

// Silence unused import warnings.
void X;