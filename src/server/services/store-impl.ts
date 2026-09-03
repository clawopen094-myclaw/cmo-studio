/**
 * Module-level mutable store. Imported by both the cache-wrapped reads
 * in `src/server/services/store.ts` and the repositories facade in
 * `src/server/services/repository-facade.ts`.
 *
 * IMPORTANT: this file is NOT marked `"use server"`. Both consumers are.
 */

import {
  ALL_MEMORY,
  APPROVALS,
  ARTIFACTS,
  BRAND_PROFILES,
  CAMPAIGNS,
  CAMPAIGN_TASKS,
  CHAT_THREADS,
  HANDOFFS,
  SEEDED_MESSAGES,
  WORKSPACES,
} from "@/fixtures/store";

import type {
  ApprovalRequest,
  Artifact,
  BrandProfile,
  BrandWorkspace,
  Campaign,
  CampaignTask,
  ChatThread,
  Handoff,
  MemoryRecord,
  Message,
} from "@/contracts/types";

import type { OutboxEntry } from "./outbox";

interface MutableStore {
  workspaces: BrandWorkspace[];
  profiles: BrandProfile[];
  threads: ChatThread[];
  messages: Message[];
  handovers: Handoff[];
  campaigns: Campaign[];
  tasks: CampaignTask[];
  artifacts: Artifact[];
  approvals: ApprovalRequest[];
  memory: MemoryRecord[];
  outbox: OutboxEntry[];
}

export const store: MutableStore = {
  workspaces: [...WORKSPACES],
  profiles: [...BRAND_PROFILES],
  threads: [...CHAT_THREADS],
  messages: [...SEEDED_MESSAGES],
  handovers: [...HANDOFFS],
  campaigns: [...CAMPAIGNS],
  tasks: [...CAMPAIGN_TASKS],
  artifacts: [...ARTIFACTS],
  approvals: [...APPROVALS],
  memory: [...ALL_MEMORY],
  outbox: [],
};