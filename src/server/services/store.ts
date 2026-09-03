"use server";

/**
 * Server-only service entrypoint. Reads and writes both go through the
 * same module-level store; reads are React-cached, writes invalidate
 * dependent routes via revalidatePath().
 *
 * Phase 2.06 introduces the Repositories abstraction. The facade lives
 * in `src/server/services/repository-facade.ts` (a plain module, not
 * "use server") because "use server" files can only export async
 * functions. Today's callers can keep using the cache() helpers here.
 */

import { cache } from "react";
import { revalidatePath } from "next/cache";

import type {
  ApprovalRequest,
  Artifact,
  BrandProfile,
  BrandWorkspace,
  Campaign,
  CampaignTask,
  ChatThread,
  Handoff,
  Id,
  MemoryRecord,
  Message,
} from "@/contracts/types";

import {
  CUSTOMER,
  OWNER,
  countPendingApprovals as countPendingApprovalsFixture,
  getWorkspace,
  getWorkspaceProfile,
} from "@/fixtures/store";

import { store } from "./store-impl";

// --- Read helpers -----------------------------------------------------------

export const getOwner = cache(() => OWNER);
export const getCustomer = cache(() => CUSTOMER);

export const listWorkspaces = cache((): BrandWorkspace[] => store.workspaces);

export const listProfiles = cache((): BrandProfile[] => store.profiles);

export const getWorkspaceById = cache(
  (id: Id): BrandWorkspace | undefined =>
    store.workspaces.find((w) => w.id === id),
);

export const getProfileByWorkspace = cache(
  (workspaceId: Id): BrandProfile | undefined =>
    store.profiles.find((p) => p.brandWorkspaceId === workspaceId),
);

export const listThreadsForWorkspace = cache(
  (workspaceId: Id): ChatThread[] =>
    store.threads.filter((t) => t.brandWorkspaceId === workspaceId),
);

export const getThreadByAgent = cache(
  (workspaceId: Id, agentKey: string): ChatThread | undefined =>
    store.threads.find(
      (t) => t.brandWorkspaceId === workspaceId && t.agentKey === agentKey,
    ),
);

export const listMessagesForThread = cache(
  (threadId: Id): Message[] =>
    store.messages
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.sequence - b.sequence),
);

export const listHandoffsForWorkspace = cache(
  (workspaceId: Id): Handoff[] =>
    store.handovers.filter((h) => h.brandWorkspaceId === workspaceId),
);

export const getHandoff = cache(
  (handoffId: Id): Handoff | undefined =>
    store.handovers.find((h) => h.id === handoffId),
);

export const listCampaignsForWorkspace = cache(
  (workspaceId: Id): Campaign[] =>
    store.campaigns
      .filter((c) => c.brandWorkspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
);

export const getCampaign = cache(
  (workspaceId: Id, campaignId: Id): Campaign | undefined => {
    const c = store.campaigns.find(
      (x) => x.id === campaignId && x.brandWorkspaceId === workspaceId,
    );
    return c;
  },
);

export const listTasksForCampaign = cache(
  (campaignId: Id): CampaignTask[] =>
    store.tasks
      .filter((t) => t.campaignId === campaignId)
      .sort((a, b) => a.id.localeCompare(b.id)),
);

export const listArtifactsForWorkspace = cache(
  (workspaceId: Id): Artifact[] =>
    store.artifacts
      .filter((a) => a.brandWorkspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
);

export const getArtifact = cache(
  (id: Id): Artifact | undefined => store.artifacts.find((a) => a.id === id),
);

export const listApprovalsForCampaign = cache(
  (campaignId: Id): ApprovalRequest[] =>
    store.approvals.filter((a) => a.campaignId === campaignId),
);

export const listMemoryForWorkspace = cache(
  (
    workspaceId: Id,
    opts?: { scope?: "brand" | "agent_private"; agentKey?: string },
  ): MemoryRecord[] => {
    return store.memory
      .filter((m) => m.brandWorkspaceId === workspaceId)
      .filter((m) => (opts?.scope ? m.scope === opts.scope : true))
      .filter((m) => (opts?.agentKey ? m.agentKey === opts.agentKey : true));
  },
);

export const countPendingApprovals = cache(
  (workspaceId: Id): number =>
    store.approvals.filter(
      (a) => a.brandWorkspaceId === workspaceId && a.status === "pending",
    ).length,
);

// --- Writes (server actions) -----------------------------------------------

export async function createWorkspaceAction(input: {
  name: string;
  productSummary: string;
  audience?: string;
  voice?: string;
  approvedClaims?: string[];
  restrictions?: string[];
  defaultApprovalMode?: "manual" | "auto";
}): Promise<{ workspaceId: string }> {
  const id = `ws_${Date.now().toString(36)}`;
  const workspace: BrandWorkspace = {
    id,
    customerId: CUSTOMER.id,
    name: input.name,
    defaultApprovalMode: input.defaultApprovalMode ?? "manual",
    createdAt: new Date().toISOString(),
  };
  store.workspaces.push(workspace);

  const profile: BrandProfile = {
    id: `prof_${id}`,
    customerId: CUSTOMER.id,
    brandWorkspaceId: id,
    version: 1,
    productSummary: input.productSummary,
    audience: input.audience,
    voice: input.voice,
    approvedClaims: input.approvedClaims ?? [],
    restrictions: input.restrictions ?? [],
    status: "active",
  };
  store.profiles.push(profile);

  revalidatePath("/app/workspaces");
  return { workspaceId: id };
}

export async function updateProfileAction(input: {
  workspaceId: Id;
  productSummary: string;
  audience?: string;
  voice?: string;
  approvedClaims: string[];
  restrictions: string[];
}): Promise<void> {
  const existing = store.profiles.find(
    (p) => p.brandWorkspaceId === input.workspaceId && p.status === "active",
  );
  if (!existing) return;
  existing.productSummary = input.productSummary;
  existing.audience = input.audience;
  existing.voice = input.voice;
  existing.approvedClaims = input.approvedClaims;
  existing.restrictions = input.restrictions;
  existing.version += 1;
  revalidatePath(`/app/${input.workspaceId}/settings`);
}

export async function appendMessageAction(input: {
  threadId: Id;
  authorType: "user" | "agent" | "system";
  authorKey?: string;
  contentJson: string;
  cards: Message["cards"];
  clientMessageId?: string;
}): Promise<Message> {
  const thread = store.threads.find((t) => t.id === input.threadId);
  if (!thread) throw new Error(`Unknown thread ${input.threadId}`);
  const nextSequence = thread.nextSequence;
  thread.nextSequence += 1;
  const msg: Message = {
    id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    threadId: thread.id,
    sequence: nextSequence,
    authorType: input.authorType,
    authorKey: input.authorKey as never,
    contentJson: input.contentJson,
    status: "succeeded",
    createdAt: new Date().toISOString(),
    cards: input.cards,
    clientMessageId: input.clientMessageId,
  };
  store.messages.push(msg);
  revalidatePath(`/app/${thread.brandWorkspaceId}/chat/${thread.agentKey}`);
  return msg;
}

export async function resolveApprovalAction(input: {
  approvalId: Id;
  outcome: "approved" | "changes_requested";
  feedback?: string;
}): Promise<void> {
  const a = store.approvals.find((x) => x.id === input.approvalId);
  if (!a) return;
  a.status = input.outcome;
  a.resolutionSource = "user";
  a.decidedByUserId = OWNER.id;
  a.feedback = input.feedback;
  a.resolvedAt = new Date().toISOString();
  const c = store.campaigns.find((x) => x.id === a.campaignId);
  if (c) {
    c.updatedAt = new Date().toISOString();
    revalidatePath(`/app/${c.brandWorkspaceId}/campaigns/${c.id}`);
  }
}

// --- Re-export convenient read helpers used by older import paths -----------

export { countPendingApprovalsFixture, getWorkspace, getWorkspaceProfile };