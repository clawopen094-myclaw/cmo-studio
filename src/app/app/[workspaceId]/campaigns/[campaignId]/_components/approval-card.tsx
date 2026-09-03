"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, MessageSquareWarning, ShieldCheck } from "lucide-react";

import type {
  ApprovalRequest,
  ApprovalSubject,
  Artifact,
  Id,
} from "@/contracts/types";
import { APPROVAL_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { resolveApproval } from "@/server/services/approval";
import { transitions } from "@/lib/motion";

/**
 * Pre-production approval card. Lists the exact script/storyboard versions
 * being reviewed. Manual: Approve / Request changes (feedback required).
 * Auto: read-only history. Subject artifacts remain inspectable.
 *
 * The server page resolves subject artifacts and passes them down as
 * plain props so the client component never reaches into a server
 * function during initial render.
 *
 * Motion: the request-changes feedback panel slides in/out. The approve
 * button confirms with a brief check-mark morph.
 */
function ApprovalCard({
  approval,
  subjects,
  workspaceId,
}: {
  approval: ApprovalRequest;
  subjects: Array<ApprovalSubject & { artifact: Artifact }>;
  workspaceId: Id;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [decisionMode, setDecisionMode] = React.useState<
    "idle" | "approve" | "changes"
  >("idle");
  const [feedback, setFeedback] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [justApproved, setJustApproved] = React.useState(false);

  async function decide(outcome: "approved" | "changes_requested") {
    if (outcome === "changes_requested" && !feedback.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await resolveApproval({
        brandWorkspaceId: workspaceId,
        approvalId: approval.id,
        outcome,
        feedback: outcome === "changes_requested" ? feedback.trim() : undefined,
        decidedByUserId: "user_owner",
      });
      setDecisionMode("idle");
      if (outcome === "approved") {
        setJustApproved(true);
        setTimeout(() => setJustApproved(false), 1400);
      }
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
            <motion.li
              key={s.artifactId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : transitions.fast}
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
            </motion.li>
          ))}
        </ul>

        {approval.status === "pending" ? (
          <AnimatePresence mode="wait" initial={false}>
            {decisionMode === "idle" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={reduced ? { duration: 0 } : transitions.fast}
                className="flex flex-wrap items-center justify-end gap-2"
              >
                <Button
                  variant="outline"
                  onClick={() => setDecisionMode("changes")}
                >
                  <MessageSquareWarning
                    aria-hidden
                    className="size-4"
                  />
                  Request changes
                </Button>
                <Button variant="default" onClick={() => decide("approved")}>
                  <AnimatePresence mode="wait" initial={false}>
                    {justApproved ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={reduced ? { duration: 0 } : transitions.fast}
                        className="inline-flex"
                      >
                        <CheckCircle2 aria-hidden className="size-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="shield"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={reduced ? { duration: 0 } : transitions.fast}
                        className="inline-flex"
                      >
                        <ShieldCheck aria-hidden className="size-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {justApproved ? "Approved" : "Approve current versions"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="changes"
                initial={{ opacity: 0, y: 4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={reduced ? { duration: 0 } : transitions.medium}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 rounded-md border border-app-warning/40 bg-app-warning-soft/30 p-3">
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
                      autoFocus
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
              </motion.div>
            )}
          </AnimatePresence>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { ApprovalCard };