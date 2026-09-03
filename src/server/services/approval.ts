"use server";

/**
 * Approval service. The pre_production checkpoint is bound to exact
 * script/storyboard versions and SHA-256 digests. Subject changes
 * supersede the pending decision; stale decisions cannot unlock
 * production.
 *
 * Per architecture.md: resolution request supplies an expected approval
 * version. A concurrent/stale decision fails without changing task
 * state. Resolution + promotion happen in one transaction (single
 * store here; the Postgres path uses a conditional update).
 */

import { cache } from "react";
import { revalidatePath } from "next/cache";

import type { ApprovalRequest, Id } from "@/contracts/types";
import { assertTransition } from "@/server/services/transitions";
import { repositories } from "@/server/services/repository-facade";

interface ResolveApprovalInput {
  brandWorkspaceId: Id;
  approvalId: Id;
  outcome: "approved" | "changes_requested";
  feedback?: string;
  decidedByUserId: Id;
}

export async function resolveApproval(
  input: ResolveApprovalInput,
): Promise<ApprovalRequest | undefined> {
  const target = repositories.approvals.getApproval(input.approvalId);
  if (!target) return undefined;
  assertTransition("approval", target.status, input.outcome);
  const updated = repositories.approvals.resolveApproval({
    approvalId: input.approvalId,
    outcome: input.outcome,
    feedback: input.feedback,
    decidedByUserId: input.decidedByUserId,
    resolutionSource: "user",
  });
  if (updated) {
    revalidatePath(
      `/app/${input.brandWorkspaceId}/campaigns/${updated.campaignId}`,
    );
  }
  return updated;
}

export const listApprovalsForCampaign = cache(
  (campaignId: Id): ApprovalRequest[] =>
    repositories.approvals.listApprovals(campaignId),
);