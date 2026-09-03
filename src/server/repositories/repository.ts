import type {
  ApprovalRequest,
  Artifact,
  BrandProfile,
  BrandWorkspace,
  Campaign,
  CampaignTask,
  ChatThread,
  Handoff,
  HandoffStatus,
  Id,
  MemoryRecord,
  Message,
} from "@/contracts/types";

/**
 * Repository abstraction. The Phase 2 in-memory implementation lives in
 * `src/server/mock-runtime/store.ts`; Phase 2.07 will add a PostgreSQL
 * implementation behind the same interface.
 *
 * Every method scopes by customerId and brandWorkspaceId when the entity
 * is brand-owned. The contract is plain types only — no methods, no
 * functions — so it can cross the server/client boundary safely.
 */
export interface WorkspaceRepository {
  listWorkspaces(customerId: Id): BrandWorkspace[];
  getWorkspace(customerId: Id, workspaceId: Id): BrandWorkspace | undefined;
  createWorkspace(input: {
    customerId: Id;
    name: string;
    productSummary: string;
    audience?: string;
    voice?: string;
    approvedClaims: string[];
    restrictions: string[];
    defaultApprovalMode: "manual" | "auto";
  }): BrandWorkspace;

  getProfile(brandWorkspaceId: Id): BrandProfile | undefined;
  updateProfile(input: {
    customerId: Id;
    brandWorkspaceId: Id;
    productSummary: string;
    audience?: string;
    voice?: string;
    approvedClaims: string[];
    restrictions: string[];
  }): BrandProfile;
}

export interface ChatRepository {
  listThreads(brandWorkspaceId: Id): ChatThread[];
  getThread(brandWorkspaceId: Id, agentKey: string): ChatThread | undefined;
  listMessages(threadId: Id): Message[];
  appendMessage(input: {
    threadId: Id;
    authorType: Message["authorType"];
    authorKey?: string;
    contentJson: string;
    cards: Message["cards"];
    clientMessageId?: string;
  }): Message;
}

export interface CampaignRepository {
  listCampaigns(brandWorkspaceId: Id): Campaign[];
  getCampaign(brandWorkspaceId: Id, campaignId: Id): Campaign | undefined;
  createCampaign(input: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Campaign;
  updateCampaign(
    brandWorkspaceId: Id,
    campaignId: Id,
    patch: Partial<Pick<Campaign, "status" | "updatedAt" | "revisionCount">>,
  ): Campaign | undefined;
  listTasks(campaignId: Id): CampaignTask[];
  upsertTask(task: CampaignTask): CampaignTask;
  promoteReadyTasks(campaignId: Id): CampaignTask[];
}

export interface ApprovalRepository {
  listApprovals(campaignId: Id): ApprovalRequest[];
  getApproval(approvalId: Id): ApprovalRequest | undefined;
  resolveApproval(input: {
    approvalId: Id;
    outcome: "approved" | "changes_requested";
    feedback?: string;
    decidedByUserId?: Id;
    resolutionSource?: "user" | "policy";
  }): ApprovalRequest | undefined;
}

export interface ArtifactRepository {
  listArtifacts(brandWorkspaceId: Id): Artifact[];
  getArtifact(id: Id): Artifact | undefined;
}

export interface HandoffRepository {
  listHandoffs(brandWorkspaceId: Id): Handoff[];
  getHandoff(id: Id): Handoff | undefined;
  createHandoff(input: Omit<Handoff, "id" | "createdAt">): Handoff;
  resolveHandoff(input: {
    handoffId: Id;
    outcome: Exclude<HandoffStatus, "pending">;
  }): Handoff | undefined;
}

export interface MemoryRepository {
  listMemory(input: {
    brandWorkspaceId: Id;
    scope?: "brand" | "agent_private";
    agentKey?: string;
  }): MemoryRecord[];
}

export interface Repositories {
  workspaces: WorkspaceRepository;
  chat: ChatRepository;
  campaigns: CampaignRepository;
  approvals: ApprovalRepository;
  artifacts: ArtifactRepository;
  handoffs: HandoffRepository;
  memory: MemoryRepository;
}