/**
 * Repositories facade. The implementation reads/writes the same
 * module-level store as the server actions in `src/server/services/store.ts`.
 *
 * Phase 2.07 will add a Postgres implementation that satisfies the same
 * Repositories interface. Today's callers can target this facade directly
 * or keep using the cache() helpers.
 *
 * IMPORTANT: this file is NOT marked `"use server"`. A "use server" file
 * can only export async functions; exporting the plain `repositories`
 * object lets it cross into Server Components safely.
 */

import type {
  BrandWorkspace,
  Campaign,
  Handoff,
  HandoffStatus,
  Message,
} from "@/contracts/types";

import type { Repositories } from "@/server/repositories/repository";

import { CUSTOMER, OWNER } from "@/fixtures/store";
import { store } from "./store-impl";

export const repositories: Repositories = {
  workspaces: {
    listWorkspaces: (customerId) =>
      store.workspaces.filter((w) => w.customerId === customerId),
    getWorkspace: (customerId, workspaceId) =>
      store.workspaces.find(
        (w) => w.customerId === customerId && w.id === workspaceId,
      ),
    createWorkspace: (input) => {
      const id = `ws_${Date.now().toString(36)}`;
      const ws: BrandWorkspace = {
        id,
        customerId: input.customerId,
        name: input.name,
        defaultApprovalMode: input.defaultApprovalMode,
        createdAt: new Date().toISOString(),
      };
      store.workspaces.push(ws);
      store.profiles.push({
        id: `prof_${id}`,
        customerId: input.customerId,
        brandWorkspaceId: id,
        version: 1,
        productSummary: input.productSummary,
        audience: input.audience,
        voice: input.voice,
        approvedClaims: input.approvedClaims,
        restrictions: input.restrictions,
        status: "active",
      });
      return ws;
    },
    getProfile: (workspaceId) =>
      store.profiles.find((p) => p.brandWorkspaceId === workspaceId),
    updateProfile: (input) => {
      const existing = store.profiles.find(
        (p) =>
          p.brandWorkspaceId === input.brandWorkspaceId && p.status === "active",
      );
      if (!existing) {
        throw new Error(
          `No active profile for workspace ${input.brandWorkspaceId}`,
        );
      }
      existing.productSummary = input.productSummary;
      existing.audience = input.audience;
      existing.voice = input.voice;
      existing.approvedClaims = input.approvedClaims;
      existing.restrictions = input.restrictions;
      existing.version += 1;
      return existing;
    },
  },
  chat: {
    listThreads: (brandWorkspaceId) =>
      store.threads.filter((t) => t.brandWorkspaceId === brandWorkspaceId),
    getThread: (brandWorkspaceId, agentKey) =>
      store.threads.find(
        (t) => t.brandWorkspaceId === brandWorkspaceId && t.agentKey === agentKey,
      ),
    listMessages: (threadId) =>
      store.messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.sequence - b.sequence),
    appendMessage: (input) => {
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
      return msg;
    },
  },
  campaigns: {
    listCampaigns: (brandWorkspaceId) =>
      store.campaigns
        .filter((c) => c.brandWorkspaceId === brandWorkspaceId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getCampaign: (brandWorkspaceId, campaignId) =>
      store.campaigns.find(
        (c) => c.brandWorkspaceId === brandWorkspaceId && c.id === campaignId,
      ),
    createCampaign: (input) => {
      const created: Campaign = {
        ...input,
        id: `cmp_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.campaigns.push(created);
      return created;
    },
    updateCampaign: (brandWorkspaceId, campaignId, patch) => {
      const c = store.campaigns.find(
        (x) => x.brandWorkspaceId === brandWorkspaceId && x.id === campaignId,
      );
      if (!c) return undefined;
      Object.assign(c, patch, { updatedAt: new Date().toISOString() });
      return c;
    },
    listTasks: (campaignId) =>
      store.tasks
        .filter((t) => t.campaignId === campaignId)
        .sort((a, b) => a.id.localeCompare(b.id)),
    upsertTask: (task) => {
      const idx = store.tasks.findIndex((t) => t.id === task.id);
      if (idx === -1) store.tasks.push(task);
      else store.tasks[idx] = task;
      return task;
    },
    promoteReadyTasks: (campaignId) =>
      store.tasks.filter((t) => t.campaignId === campaignId),
  },
  approvals: {
    listApprovals: (campaignId) =>
      store.approvals.filter((a) => a.campaignId === campaignId),
    getApproval: (approvalId) =>
      store.approvals.find((a) => a.id === approvalId),
    resolveApproval: (input) => {
      const a = store.approvals.find((x) => x.id === input.approvalId);
      if (!a) return undefined;
      a.status = input.outcome;
      a.resolutionSource = input.resolutionSource ?? "user";
      a.decidedByUserId = input.decidedByUserId;
      a.feedback = input.feedback;
      a.resolvedAt = new Date().toISOString();
      return a;
    },
  },
  artifacts: {
    listArtifacts: (brandWorkspaceId) =>
      store.artifacts
        .filter((a) => a.brandWorkspaceId === brandWorkspaceId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getArtifact: (id) => store.artifacts.find((a) => a.id === id),
  },
  handoffs: {
    listHandoffs: (brandWorkspaceId) =>
      store.handovers.filter((h) => h.brandWorkspaceId === brandWorkspaceId),
    getHandoff: (id) => store.handovers.find((h) => h.id === id),
    createHandoff: (input) => {
      const created: Handoff = {
        ...input,
        id: `ho_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
      store.handovers.push(created);
      return created;
    },
    resolveHandoff: (input) => {
      const h = store.handovers.find((x) => x.id === input.handoffId);
      if (!h) return undefined;
      h.status = input.outcome;
      return h;
    },
  },
  memory: {
    listMemory: ({ brandWorkspaceId, scope, agentKey }) =>
      store.memory
        .filter((m) => m.brandWorkspaceId === brandWorkspaceId)
        .filter((m) => (scope ? m.scope === scope : true))
        .filter((m) => (agentKey ? m.agentKey === agentKey : true)),
  },
};

// Keep typed references alive for downstream consumers without runtime cost.
void CUSTOMER;
void OWNER;
type _Unused = HandoffStatus;
void 0 as unknown as _Unused;