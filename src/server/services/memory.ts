"use server";

/**
 * Memory service. Shared brand memory requires Owner acceptance before
 * active status; agent-private memory is reviewed by the Owner. Every
 * record carries scope + provenance + status + revision lineage.
 */

import { cache } from "react";
import { revalidatePath } from "next/cache";

import type { AgentKey, Id, MemoryRecord, MemoryStatus } from "@/contracts/types";
import { assertTransition } from "@/server/services/transitions";
import { repositories } from "@/server/services/repository-facade";

export const listMemoryForWorkspace = cache(
  (
    brandWorkspaceId: Id,
    opts?: { scope?: "brand" | "agent_private"; agentKey?: string },
  ): MemoryRecord[] => repositories.memory.listMemory({ brandWorkspaceId, ...opts }),
);

interface ProposeMemoryInput {
  brandWorkspaceId: Id;
  scope: "brand" | "agent_private";
  agentInstanceId?: Id;
  agentKey?: AgentKey;
  title: string;
  body: string;
  sourceType: "user" | "agent";
  sourceAgentKey?: AgentKey;
}

export async function proposeMemory(input: ProposeMemoryInput): Promise<MemoryRecord> {
  const created: MemoryRecord = {
    id: `mem_${Date.now().toString(36)}`,
    customerId: "", // filled by repository from the store context
    brandWorkspaceId: input.brandWorkspaceId,
    scope: input.scope,
    agentInstanceId: input.agentInstanceId,
    agentKey: input.agentKey,
    title: input.title,
    body: input.body,
    sourceType: input.sourceType,
    sourceAgentKey: input.sourceAgentKey,
    status: "proposed",
    version: 1,
    createdAt: new Date().toISOString(),
  };
  // The facade stores layer is a flat list — push directly through the
  // memory facet once Phase 2.07 ships. Today we mutate the in-memory
  // store via the legacy facade.
  pushMemoryRecord(created);
  revalidatePath(`/app/${input.brandWorkspaceId}/memory`);
  return created;
}

export async function reviewMemory(
  brandWorkspaceId: Id,
  memoryId: Id,
  outcome: Exclude<MemoryStatus, "proposed">,
): Promise<MemoryRecord | undefined> {
  const all = listMemoryForWorkspace(brandWorkspaceId);
  const target = all.find((m) => m.id === memoryId);
  if (!target) return undefined;
  assertTransition("memory", target.status, outcome);
  target.status = outcome;
  revalidatePath(`/app/${brandWorkspaceId}/memory`);
  return target;
}

// --- Internal mutators ------------------------------------------------------

import { store } from "./store-impl";

function pushMemoryRecord(record: MemoryRecord): void {
  store.memory.push(record);
}