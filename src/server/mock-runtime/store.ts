"use server";

/**
 * Server-only in-memory store. Single process, prototype only. Persistence
 * is deferred to Phase 2 per the build plan; this module owns the seeded
 * fixtures plus any messages/tasks/campaigns created at runtime.
 *
 * Read access is wrapped in cache(); writes go through dedicated server
 * actions so client code never reaches into module-level state directly.
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
  ALL_MEMORY,
  APPROVALS,
  ARTIFACTS,
  BRAND_PROFILES,
  CAMPAIGNS,
  CAMPAIGN_TASKS,
  CHAT_THREADS,
  CUSTOMER,
  HANDOFFS,
  OWNER,
  SEEDED_MESSAGES,
  WORKSPACES,
  countPendingApprovals as countPendingApprovalsFixture,
  getWorkspace,
  getWorkspaceProfile,
} from "@/fixtures/store";

// --- Module-level mutable state (server-only) -------------------------------

const workspaces: BrandWorkspace[] = [...WORKSPACES];
const profiles: BrandProfile[] = [...BRAND_PROFILES];
const threads: ChatThread[] = [...CHAT_THREADS];
const messages: Message[] = [...SEEDED_MESSAGES];
const handovers: Handoff[] = [...HANDOFFS];
const campaigns: Campaign[] = [...CAMPAIGNS];
const tasks: CampaignTask[] = [...CAMPAIGN_TASKS];
const artifacts: Artifact[] = [...ARTIFACTS];
const approvals: ApprovalRequest[] = [...APPROVALS];
const memory: MemoryRecord[] = [...ALL_MEMORY];

// --- Reads (cached for the duration of one request) -------------------------

export const getOwner = cache(() => OWNER);
export const getCustomer = cache(() => CUSTOMER);

export const listWorkspaces = cache((): BrandWorkspace[] => workspaces);

export const listProfiles = cache((): BrandProfile[] => profiles);

export const getWorkspaceById = cache(
  (id: Id): BrandWorkspace | undefined =>
    workspaces.find((w) => w.id === id),
);

export const getProfileByWorkspace = cache(
  (workspaceId: Id): BrandProfile | undefined =>
    profiles.find((p) => p.brandWorkspaceId === workspaceId),
);

export const listThreadsForWorkspace = cache(
  (workspaceId: Id): ChatThread[] =>
    threads.filter((t) => t.brandWorkspaceId === workspaceId),
);

export const getThreadByAgent = cache(
  (workspaceId: Id, agentKey: string): ChatThread | undefined =>
    threads.find(
      (t) => t.brandWorkspaceId === workspaceId && t.agentKey === agentKey,
    ),
);

export const listMessagesForThread = cache(
  (threadId: Id): Message[] =>
    messages
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.sequence - b.sequence),
);

export const listHandoffsForWorkspace = cache(
  (workspaceId: Id): Handoff[] =>
    handovers.filter((h) => h.brandWorkspaceId === workspaceId),
);

export const getHandoff = cache(
  (handoffId: Id): Handoff | undefined =>
    handovers.find((h) => h.id === handoffId),
);

export const listCampaignsForWorkspace = cache(
  (workspaceId: Id): Campaign[] =>
    campaigns
      .filter((c) => c.brandWorkspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
);

export const getCampaign = cache(
  (workspaceId: Id, campaignId: Id): Campaign | undefined => {
    const c = campaigns.find(
      (x) => x.id === campaignId && x.brandWorkspaceId === workspaceId,
    );
    return c;
  },
);

export const listTasksForCampaign = cache(
  (campaignId: Id): CampaignTask[] =>
    tasks
      .filter((t) => t.campaignId === campaignId)
      .sort((a, b) => a.id.localeCompare(b.id)),
);

export const listArtifactsForWorkspace = cache(
  (workspaceId: Id): Artifact[] =>
    artifacts
      .filter((a) => a.brandWorkspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
);

export const getArtifact = cache(
  (id: Id): Artifact | undefined => artifacts.find((a) => a.id === id),
);

export const listApprovalsForCampaign = cache(
  (campaignId: Id): ApprovalRequest[] =>
    approvals.filter((a) => a.campaignId === campaignId),
);

export const listMemoryForWorkspace = cache(
  (
    workspaceId: Id,
    opts?: { scope?: "brand" | "agent_private"; agentKey?: string },
  ): MemoryRecord[] => {
    return memory
      .filter((m) => m.brandWorkspaceId === workspaceId)
      .filter((m) => (opts?.scope ? m.scope === opts.scope : true))
      .filter((m) => (opts?.agentKey ? m.agentKey === opts.agentKey : true));
  },
);

export const countPendingApprovals = cache(
  (workspaceId: Id): number =>
    approvals.filter(
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
  workspaces.push(workspace);

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
  profiles.push(profile);

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
  const existing = profiles.find(
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
  const thread = threads.find((t) => t.id === input.threadId);
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
  messages.push(msg);
  revalidatePath(`/app/${thread.brandWorkspaceId}/chat/${thread.agentKey}`);
  return msg;
}

export async function resolveApprovalAction(input: {
  approvalId: Id;
  outcome: "approved" | "changes_requested";
  feedback?: string;
}): Promise<void> {
  const a = approvals.find((x) => x.id === input.approvalId);
  if (!a) return;
  a.status = input.outcome;
  a.resolutionSource = "user";
  a.decidedByUserId = OWNER.id;
  a.feedback = input.feedback;
  a.resolvedAt = new Date().toISOString();
  const c = campaigns.find((x) => x.id === a.campaignId);
  if (c) {
    c.updatedAt = new Date().toISOString();
    revalidatePath(`/app/${c.brandWorkspaceId}/campaigns/${c.id}`);
  }
}

// --- Re-export convenient read helpers used by older import paths -----------

export { countPendingApprovalsFixture, getWorkspace, getWorkspaceProfile };