import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Hourglass,
  Loader2,
  type LucideIcon,
  PauseCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import type {
  AgentRunStatus,
  ApprovalStatus,
  ArtifactStatus,
  CampaignStatus,
  HandoffStatus,
  MemoryStatus,
  MessageStatus,
  TaskStatus,
} from "@/contracts/types";

/**
 * Typed status descriptor registry. One owner per status family. Status
 * indicators consume this registry; they never implement their own status
 * switch. Tone classes reference app-* tokens — never raw colors.
 *
 * Per code-standards.md and ui-tokens.md: state colors come from semantic
 * tokens, status is communicated by text + icon + tone (not color alone).
 */

export type Tone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

interface StatusDescriptor {
  label: string;
  icon: LucideIcon;
  tone: Tone;
  /** Whether the live region should announce transitions for this status. */
  announce: boolean;
}

export type { StatusDescriptor };

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-app-surface-subtle text-app-ink",
  info: "bg-app-info-soft text-app-info",
  success: "bg-app-success-soft text-app-success",
  warning: "bg-app-warning-soft text-app-warning",
  danger: "bg-app-danger-soft text-app-danger",
  muted: "bg-transparent text-app-ink-muted",
};

// --- Campaign status ---------------------------------------------------------

export const CAMPAIGN_STATUS: Record<CampaignStatus, StatusDescriptor> = {
  draft: { label: "Draft", icon: CircleDashed, tone: "muted", announce: false },
  running: { label: "Running", icon: Loader2, tone: "info", announce: true },
  waiting_approval: {
    label: "Waiting approval",
    icon: Clock,
    tone: "warning",
    announce: true,
  },
  waiting_user: {
    label: "Waiting for you",
    icon: Clock,
    tone: "warning",
    announce: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "success",
    announce: true,
  },
  failed: { label: "Failed", icon: XCircle, tone: "danger", announce: true },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

// --- Task status -------------------------------------------------------------

export const TASK_STATUS: Record<TaskStatus, StatusDescriptor> = {
  pending: { label: "Pending", icon: CircleDashed, tone: "muted", announce: false },
  blocked: {
    label: "Blocked",
    icon: AlertTriangle,
    tone: "danger",
    announce: true,
  },
  queued: { label: "Queued", icon: Hourglass, tone: "neutral", announce: false },
  running: { label: "Running", icon: Loader2, tone: "info", announce: true },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "success",
    announce: true,
  },
  failed: { label: "Failed", icon: XCircle, tone: "danger", announce: true },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

// --- Agent run status --------------------------------------------------------

export const RUN_STATUS: Record<AgentRunStatus, StatusDescriptor> = {
  queued: { label: "Queued", icon: Hourglass, tone: "neutral", announce: false },
  running: { label: "Running", icon: Loader2, tone: "info", announce: false },
  succeeded: {
    label: "Succeeded",
    icon: CheckCircle2,
    tone: "success",
    announce: true,
  },
  failed: { label: "Failed", icon: XCircle, tone: "danger", announce: true },
  timed_out: {
    label: "Timed out",
    icon: AlertTriangle,
    tone: "danger",
    announce: true,
  },
  interrupted: {
    label: "Interrupted",
    icon: AlertTriangle,
    tone: "warning",
    announce: false,
  },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

// --- Approval status ---------------------------------------------------------

export const APPROVAL_STATUS: Record<ApprovalStatus, StatusDescriptor> = {
  pending: { label: "Pending", icon: Clock, tone: "warning", announce: false },
  approved: {
    label: "Approved",
    icon: ShieldCheck,
    tone: "success",
    announce: true,
  },
  changes_requested: {
    label: "Changes requested",
    icon: AlertTriangle,
    tone: "warning",
    announce: true,
  },
  superseded: {
    label: "Superseded",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

// --- Handoff status ----------------------------------------------------------

export const HANDOFF_STATUS: Record<HandoffStatus, StatusDescriptor> = {
  pending: { label: "Pending", icon: Clock, tone: "warning", announce: false },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    tone: "success",
    announce: true,
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    tone: "danger",
    announce: true,
  },
  needs_clarification: {
    label: "Needs clarification",
    icon: AlertTriangle,
    tone: "warning",
    announce: true,
  },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

// --- Artifact status ---------------------------------------------------------

export const ARTIFACT_STATUS: Record<ArtifactStatus, StatusDescriptor> = {
  current: {
    label: "Current",
    icon: CheckCircle2,
    tone: "success",
    announce: false,
  },
  stale: { label: "Stale", icon: Clock, tone: "warning", announce: false },
  superseded: {
    label: "Superseded",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
  rejected: { label: "Rejected", icon: XCircle, tone: "danger", announce: false },
};

// --- Memory status -----------------------------------------------------------

export const MEMORY_STATUS: Record<MemoryStatus, StatusDescriptor> = {
  proposed: {
    label: "Proposed",
    icon: Clock,
    tone: "warning",
    announce: false,
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    tone: "success",
    announce: false,
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    tone: "danger",
    announce: false,
  },
  archived: {
    label: "Archived",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

// --- Message status ----------------------------------------------------------

export const MESSAGE_STATUS: Record<MessageStatus, StatusDescriptor> = {
  queued: { label: "Queued", icon: Hourglass, tone: "neutral", announce: false },
  sending: { label: "Sending", icon: Loader2, tone: "info", announce: false },
  running: { label: "Running", icon: Loader2, tone: "info", announce: true },
  succeeded: {
    label: "Sent",
    icon: CheckCircle2,
    tone: "success",
    announce: true,
  },
  failed: { label: "Failed", icon: XCircle, tone: "danger", announce: true },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    tone: "muted",
    announce: false,
  },
};

export function getToneClasses(tone: Tone): string {
  return TONE_BG[tone];
}