import type {
  ApprovalStatus,
  ArtifactStatus,
  CampaignStatus,
  HandoffStatus,
  MemoryStatus,
  TaskStatus,
  AgentRunStatus,
} from "@/contracts/types";

/**
 * Closed transition tables. Per architecture.md: state transitions are
 * reject-by-default. These tables are the single source of truth for what
 * moves are allowed; callers must look up via canTransition().
 *
 * Reject transitions from terminal states unless an approved reopen flow
 * exists (none in the prototype).
 */

type AnyStatus =
  | ApprovalStatus
  | ArtifactStatus
  | CampaignStatus
  | HandoffStatus
  | MemoryStatus
  | TaskStatus
  | AgentRunStatus;

/**
 * Terminal statuses are reject-by-default. Notable: an `approved`
 * decision can still transition to `superseded` when the subject
 * versions change (architecture.md), so `approved` is NOT in this set.
 */
const TERMINAL: ReadonlySet<AnyStatus> = new Set<AnyStatus>([
  // Campaign
  "completed",
  "failed",
  "cancelled",
  // Task
  "completed",
  "failed",
  "cancelled",
  // Agent run
  "succeeded",
  "failed",
  "timed_out",
  "interrupted",
  "cancelled",
  // Approval (approved and changes_requested may move to superseded)
  "superseded",
  "cancelled",
  // Handoff
  "accepted",
  "declined",
  "cancelled",
  // Memory
  "rejected",
  "archived",
]);

const CAMPAIGN: Record<CampaignStatus, ReadonlySet<CampaignStatus>> = {
  draft: new Set<CampaignStatus>(["running", "cancelled"]),
  running: new Set<CampaignStatus>([
    "waiting_approval",
    "waiting_user",
    "completed",
    "failed",
    "cancelled",
  ]),
  waiting_approval: new Set<CampaignStatus>([
    "running",
    "completed",
    "failed",
    "cancelled",
  ]),
  waiting_user: new Set<CampaignStatus>([
    "running",
    "completed",
    "failed",
    "cancelled",
  ]),
  completed: new Set<CampaignStatus>(),
  failed: new Set<CampaignStatus>(),
  cancelled: new Set<CampaignStatus>(),
};

const TASK: Record<TaskStatus, ReadonlySet<TaskStatus>> = {
  pending: new Set<TaskStatus>(["blocked", "queued", "cancelled"]),
  blocked: new Set<TaskStatus>(["queued", "failed", "cancelled"]),
  queued: new Set<TaskStatus>(["running", "cancelled"]),
  running: new Set<TaskStatus>([
    "completed",
    "failed",
    "cancelled",
    "blocked",
  ]),
  completed: new Set<TaskStatus>(),
  failed: new Set<TaskStatus>(),
  cancelled: new Set<TaskStatus>(),
};

const RUN: Record<AgentRunStatus, ReadonlySet<AgentRunStatus>> = {
  queued: new Set<AgentRunStatus>(["running", "cancelled"]),
  running: new Set<AgentRunStatus>([
    "succeeded",
    "failed",
    "timed_out",
    "interrupted",
    "cancelled",
  ]),
  succeeded: new Set<AgentRunStatus>(),
  failed: new Set<AgentRunStatus>(),
  timed_out: new Set<AgentRunStatus>(),
  interrupted: new Set<AgentRunStatus>(["running"]), // retry creates a new attempt
  cancelled: new Set<AgentRunStatus>(),
};

const APPROVAL: Record<ApprovalStatus, ReadonlySet<ApprovalStatus>> = {
  pending: new Set<ApprovalStatus>([
    "approved",
    "changes_requested",
    "superseded",
    "cancelled",
  ]),
  approved: new Set<ApprovalStatus>(["superseded"]),
  changes_requested: new Set<ApprovalStatus>(["superseded"]),
  superseded: new Set<ApprovalStatus>(),
  cancelled: new Set<ApprovalStatus>(),
};

const HANDOFF: Record<HandoffStatus, ReadonlySet<HandoffStatus>> = {
  pending: new Set<HandoffStatus>([
    "accepted",
    "declined",
    "needs_clarification",
    "cancelled",
  ]),
  accepted: new Set<HandoffStatus>(),
  declined: new Set<HandoffStatus>(),
  needs_clarification: new Set<HandoffStatus>(["pending", "cancelled"]),
  cancelled: new Set<HandoffStatus>(),
};

const ARTIFACT: Record<ArtifactStatus, ReadonlySet<ArtifactStatus>> = {
  current: new Set<ArtifactStatus>(["stale", "superseded"]),
  stale: new Set<ArtifactStatus>(["current", "superseded", "rejected"]),
  superseded: new Set<ArtifactStatus>(),
  rejected: new Set<ArtifactStatus>(),
};

const MEMORY: Record<MemoryStatus, ReadonlySet<MemoryStatus>> = {
  proposed: new Set<MemoryStatus>(["active", "rejected"]),
  active: new Set<MemoryStatus>(["archived"]),
  rejected: new Set<MemoryStatus>(),
  archived: new Set<MemoryStatus>(),
};

export type StatusFamily =
  | "campaign"
  | "task"
  | "run"
  | "approval"
  | "handoff"
  | "artifact"
  | "memory";

export function isTerminal(status: AnyStatus): boolean {
  return TERMINAL.has(status);
}

export function canTransition(
  family: StatusFamily,
  from: AnyStatus,
  to: AnyStatus,
): boolean {
  if (from === to) return true;
  if (isTerminal(from)) return false;
  switch (family) {
    case "campaign":
      return CAMPAIGN[from as CampaignStatus]?.has(to as CampaignStatus) ?? false;
    case "task":
      return TASK[from as TaskStatus]?.has(to as TaskStatus) ?? false;
    case "run":
      return RUN[from as AgentRunStatus]?.has(to as AgentRunStatus) ?? false;
    case "approval":
      return (
        APPROVAL[from as ApprovalStatus]?.has(to as ApprovalStatus) ?? false
      );
    case "handoff":
      return HANDOFF[from as HandoffStatus]?.has(to as HandoffStatus) ?? false;
    case "artifact":
      return (
        ARTIFACT[from as ArtifactStatus]?.has(to as ArtifactStatus) ?? false
      );
    case "memory":
      return MEMORY[from as MemoryStatus]?.has(to as MemoryStatus) ?? false;
  }
}

export class TransitionError extends Error {
  constructor(
    public family: StatusFamily,
    public from: AnyStatus,
    public to: AnyStatus,
  ) {
    super(
      `Invalid ${family} transition: ${String(from)} → ${String(to)}`,
    );
    this.name = "TransitionError";
  }
}

export function assertTransition(
  family: StatusFamily,
  from: AnyStatus,
  to: AnyStatus,
): void {
  if (!canTransition(family, from, to)) {
    throw new TransitionError(family, from, to);
  }
}