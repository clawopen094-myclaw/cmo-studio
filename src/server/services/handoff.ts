"use server";

/**
 * Handoff service. Specialist → CMO escalation records are idempotent
 * per (source_message_id, requested_outcome). Idempotency is enforced at
 * the repository layer via the unique index on (source_message_id,
 * requested_outcome); the service checks the transition table before any
 * status change.
 */

import { cache } from "react";
import { revalidatePath } from "next/cache";

import type { AgentKey, Handoff, HandoffStatus, Id } from "@/contracts/types";
import { assertTransition } from "@/server/services/transitions";
import { repositories } from "@/server/services/repository-facade";

interface CreateHandoffInput {
  customerId: Id;
  brandWorkspaceId: Id;
  sourceAgentInstanceId: Id;
  sourceAgentKey: AgentKey;
  targetCmoInstanceId: Id;
  sourceThreadId: Id;
  sourceMessageId: Id;
  targetThreadId: Id;
  reason: string;
  requestedOutcome: string;
  safeContextJson: Record<string, unknown>;
  /** Defaults to a stable key derived from sourceMessageId+outcome. */
  idempotencyKey?: string;
}

function defaultIdempotencyKey(input: CreateHandoffInput): string {
  return `${input.sourceMessageId}:${input.requestedOutcome}`;
}

export async function createHandoff(input: CreateHandoffInput): Promise<Handoff> {
  const idempotencyKey = input.idempotencyKey ?? defaultIdempotencyKey(input);
  // Idempotent: existing record with the same (source, outcome) is returned.
  const existing = repositories.handoffs
    .listHandoffs(input.brandWorkspaceId)
    .find(
      (h) =>
        h.sourceMessageId === input.sourceMessageId &&
        h.requestedOutcome === input.requestedOutcome,
    );
  if (existing) return existing;
  const created = repositories.handoffs.createHandoff({
    ...input,
    status: "pending",
    safeContextSummary: JSON.stringify(input.safeContextJson ?? {}),
    idempotencyKey,
  });
  revalidatePath(`/app/${input.brandWorkspaceId}/chat/ai_cmo`);
  return created;
}

export async function resolveHandoff(
  workspaceId: Id,
  handoffId: Id,
  outcome: Exclude<HandoffStatus, "pending">,
): Promise<Handoff | undefined> {
  const h = repositories.handoffs.getHandoff(handoffId);
  if (!h) return undefined;
  assertTransition("handoff", h.status, outcome);
  const updated = repositories.handoffs.resolveHandoff({ handoffId, outcome });
  if (updated) {
    revalidatePath(`/app/${workspaceId}/chat/${updated.sourceAgentKey}`);
    revalidatePath(`/app/${workspaceId}/chat/ai_cmo`);
  }
  return updated;
}

export const listHandoffsForWorkspace = cache(
  (workspaceId: Id): Handoff[] =>
    repositories.handoffs.listHandoffs(workspaceId),
);