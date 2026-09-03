/**
 * Shared domain contracts. Single source of truth for the prototype's
 * discriminated unions and bounded types. Unknown fields fail closed at the
 * parser boundary. Mirrors the state machines in architecture.md.
 */

// --- Identity / tenancy ------------------------------------------------------

export type Id = string;

export interface OwnerIdentity {
  id: Id;
  displayName: string;
}

export interface Customer {
  id: Id;
  name: string;
}

export interface BrandWorkspace {
  id: Id;
  customerId: Id;
  name: string;
  defaultApprovalMode: ApprovalMode;
  createdAt: string;
}

export interface BrandProfile {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  version: number;
  productSummary: string;
  audience?: string;
  voice?: string;
  approvedClaims: string[];
  restrictions: string[];
  status: "active" | "archived";
}

// --- Approval modes ----------------------------------------------------------

export type ApprovalMode = "manual" | "auto";

// --- Agents ------------------------------------------------------------------

export type AgentKey =
  | "ai_cmo"
  | "audience_researcher"
  | "brand_strategist"
  | "ugc_writer"
  | "media_producer"
  | "creative_qa";

export const AGENT_ORDER: AgentKey[] = [
  "ai_cmo",
  "audience_researcher",
  "brand_strategist",
  "ugc_writer",
  "media_producer",
  "creative_qa",
];

export interface AgentDefinition {
  key: AgentKey;
  version: number;
  displayName: string;
  role: string;
  reportsTo?: AgentKey;
  shortSummary: string;
  canDo: string[];
  mustNotDo: string[];
  allowedTaskTypes: TaskType[];
  allowedProductTools: ProductToolKey[];
  allowedDelegationTargets: AgentKey[];
  maxRunSeconds: number;
  maxAttempts: number;
}

export interface AgentInstance {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  definitionKey: AgentKey;
  definitionVersion: number;
}

// --- Workflow tasks (fixed ugc_video_v1) --------------------------------------

export type TaskType =
  | "audience_research"
  | "brand_strategy"
  | "creative_package"
  | "simulated_production"
  | "creative_qa"
  | "final_report";

export type TaskStatus =
  | "pending"
  | "blocked"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface CampaignTask {
  id: Id;
  campaignId: Id;
  templateTaskKey: TaskType;
  revisionIndex: number;
  isCurrent: boolean;
  supersedesTaskId?: Id;
  assignedAgentInstanceId: Id;
  assignedAgentKey: AgentKey;
  status: TaskStatus;
  waitReason?: string;
  dependsOnTaskIds: Id[];
  attemptCount: number;
  maxAttempts: number;
  resultSummary?: string;
  artifactIds: Id[];
}

// --- Campaigns ---------------------------------------------------------------

export type CampaignStatus =
  | "draft"
  | "running"
  | "waiting_approval"
  | "waiting_user"
  | "completed"
  | "failed"
  | "cancelled";

export interface CampaignBrief {
  productOrOffer: string;
  objective: string;
  targetAudience: string;
  channel: string;
  deliverable: string;
  callToAction: string;
  duration?: string;
  approvedClaimRefs: Id[];
  restrictionRefs: Id[];
}

export interface Campaign {
  id: Id;
  brandWorkspaceId: Id;
  customerId: Id;
  originThreadId?: Id;
  originMessageId?: Id;
  handoffId?: Id;
  title: string;
  brief: CampaignBrief;
  brandProfileVersion: number;
  approvalMode: ApprovalMode;
  status: CampaignStatus;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
}

// --- Direct chat -------------------------------------------------------------

export interface ChatThread {
  id: Id;
  brandWorkspaceId: Id;
  agentInstanceId: Id;
  agentKey: AgentKey;
  nextSequence: number;
  createdAt: string;
}

export type MessageAuthorType = "user" | "agent" | "system";

export type MessageStatus =
  | "queued"
  | "sending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface Message {
  id: Id;
  threadId: Id;
  sequence: number;
  clientMessageId?: string;
  authorType: MessageAuthorType;
  authorKey?: AgentKey;
  runId?: Id;
  contentJson: string;
  status: MessageStatus;
  createdAt: string;
  /**
   * Structured semantic payloads rendered as typed cards in the thread. The
   * control plane composes these from validated runtime output; the UI never
   * renders raw JSON as chat content.
   */
  cards: MessageCard[];
}

export type MessageCard =
  | { kind: "text"; body: string }
  | { kind: "artifact_reference"; artifactId: Id; label: string }
  | { kind: "capability_denied"; reason: string; handoffId?: Id }
  | { kind: "handoff"; handoffId: Id }
  | { kind: "run_progress"; stage: RunStage; detail?: string }
  | { kind: "queued"; position: number }
  | { kind: "error"; code: string; message: string };

export type RunStage =
  | "queued"
  | "preparing_context"
  | "reasoning"
  | "validating_output"
  | "persisting"
  | "succeeded"
  | "failed"
  | "cancelled";

// --- Handoff -----------------------------------------------------------------

export type HandoffStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "needs_clarification"
  | "cancelled";

export interface Handoff {
  id: Id;
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
  safeContextSummary: string;
  status: HandoffStatus;
  campaignId?: Id;
  createdAt: string;
}

// --- Approvals ---------------------------------------------------------------

export type ApprovalCheckpoint = "pre_production";
export type ApprovalStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "superseded"
  | "cancelled";

export interface ApprovalSubject {
  artifactId: Id;
  logicalKey: "script" | "storyboard";
  version: number;
  sha256: string;
}

export interface ApprovalRequest {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  campaignId: Id;
  checkpoint: ApprovalCheckpoint;
  subjectDigest: string;
  subjects: ApprovalSubject[];
  status: ApprovalStatus;
  resolutionSource?: "user" | "policy";
  decidedByUserId?: Id;
  policyVersion?: number;
  feedback?: string;
  createdAt: string;
  resolvedAt?: string;
}

// --- Artifacts ---------------------------------------------------------------

export type ArtifactType =
  | "research_brief"
  | "strategy_brief"
  | "script"
  | "storyboard"
  | "simulated_media"
  | "qa_report"
  | "final_report";

export type ArtifactStatus = "current" | "stale" | "superseded" | "rejected";

export interface Artifact {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  logicalKey: string;
  version: number;
  type: ArtifactType;
  title: string;
  producingAgentKey: AgentKey;
  sourceRunId?: Id;
  threadId?: Id;
  campaignId?: Id;
  taskId?: Id;
  body?: string;
  mimeType: string;
  sha256: string;
  status: ArtifactStatus;
  isSimulated: boolean;
  createdAt: string;
  inputArtifactIds: Id[];
}

// --- Memory ------------------------------------------------------------------

export type MemoryScope = "brand" | "agent_private";
export type MemoryStatus = "proposed" | "active" | "rejected" | "archived";

export interface MemoryRecord {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  scope: MemoryScope;
  agentInstanceId?: Id;
  agentKey?: AgentKey;
  title: string;
  body: string;
  sourceType: "user" | "agent";
  sourceAgentKey?: AgentKey;
  status: MemoryStatus;
  version: number;
  supersedesId?: Id;
  createdAt: string;
}

// --- Agent runs / queue ------------------------------------------------------

export type AgentRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "interrupted"
  | "cancelled";

export interface AgentRun {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  agentInstanceId: Id;
  agentKey: AgentKey;
  originType: "direct_message" | "handoff" | "campaign_task";
  triggerMessageId?: Id;
  handoffId?: Id;
  campaignTaskId?: Id;
  threadId?: Id;
  attemptNumber: number;
  status: AgentRunStatus;
  availableAt: string;
  createdAt: string;
  resolvedAt?: string;
}

// --- Tool surface ------------------------------------------------------------

export type ProductToolKey =
  | "read_brand_context"
  | "read_memory"
  | "propose_memory_change"
  | "create_text_artifact"
  | "create_simulated_media"
  | "create_handoff_to_cmo"
  | "create_campaign_draft"
  | "return_qa_result"
  | "return_task_result";

// --- Workflow template -------------------------------------------------------

export interface WorkflowTemplate {
  key: "ugc_video_v1";
  version: number;
  description: string;
  taskSequence: TaskType[];
  requiredBriefFields: ReadonlyArray<keyof CampaignBrief>;
  approvalCheckpoint: ApprovalCheckpoint;
  maxRevisionCycles: number;
}

// --- Result envelopes (capability policy outputs) ----------------------------

export type CapabilityDecision =
  | { kind: "allow" }
  | { kind: "deny"; reason: string; createHandoff: boolean };

export type ActionOutcome =
  | { kind: "ok"; cards: MessageCard[]; artifactIds?: Id[] }
  | { kind: "denied"; reason: string; handoffId?: Id }
  | { kind: "needs_clarification"; question: string };