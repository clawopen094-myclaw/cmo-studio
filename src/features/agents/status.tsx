import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDashed,
  Clock,
  Hourglass,
  Inbox,
  Loader2,
  PauseCircle,
  ShieldCheck,
  ShieldX,
  XCircle,
  type LucideIcon,
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
 * Typed status descriptor registry. One owner per status family.
 *
 * IMPORTANT: `iconKey` is a string identifier, NOT a LucideIcon reference.
 * Server components construct descriptors and pass them to client
 * components. Lucide components are React functions and cannot cross the
 * server→client boundary, so we keep descriptors plain-object-safe by
 * resolving the icon inside the client-side StatusIndicator.
 *
 * Per code-standards.md and ui-tokens.md: state colors come from
 * semantic tokens; status is communicated by text + icon + tone — never
 * color alone.
 */

export type Tone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

/**
 * The closed set of icon keys every status may use. Adding a new icon
 * requires extending this union AND the registry below — the typecheck
 * fails closed on a missing entry.
 */
export type StatusIconKey =
  | "alert-triangle"
  | "archive"
  | "check-circle"
  | "circle-dashed"
  | "clock"
  | "hourglass"
  | "inbox"
  | "loader"
  | "pause-circle"
  | "shield-check"
  | "shield-x"
  | "x-circle";

/** Icon map. Lives next to the registry; not exported to call sites. */
const STATUS_ICONS: Record<StatusIconKey, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  archive: Archive,
  "check-circle": CheckCircle2,
  "circle-dashed": CircleDashed,
  clock: Clock,
  hourglass: Hourglass,
  inbox: Inbox,
  loader: Loader2,
  "pause-circle": PauseCircle,
  "shield-check": ShieldCheck,
  "shield-x": ShieldX,
  "x-circle": XCircle,
};

export interface StatusDescriptor {
  label: string;
  iconKey: StatusIconKey;
  tone: Tone;
  /** Whether the live region should announce transitions for this status. */
  announce: boolean;
}

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-app-surface-subtle text-app-ink",
  info: "bg-app-info-soft text-app-info",
  success: "bg-app-success-soft text-app-success",
  warning: "bg-app-warning-soft text-app-warning",
  danger: "bg-app-danger-soft text-app-danger",
  muted: "bg-transparent text-app-ink-muted",
};

/** Resolve an icon for use inside a client component. */
export function resolveStatusIcon(key: StatusIconKey): LucideIcon {
  return STATUS_ICONS[key];
}

// --- Campaign status ---------------------------------------------------------

export const CAMPAIGN_STATUS: Record<CampaignStatus, StatusDescriptor> = {
  draft: {
    label: "Draft",
    iconKey: "circle-dashed",
    tone: "muted",
    announce: false,
  },
  running: {
    label: "Running",
    iconKey: "loader",
    tone: "info",
    announce: true,
  },
  waiting_approval: {
    label: "Waiting approval",
    iconKey: "clock",
    tone: "warning",
    announce: true,
  },
  waiting_user: {
    label: "Waiting for you",
    iconKey: "clock",
    tone: "warning",
    announce: true,
  },
  completed: {
    label: "Completed",
    iconKey: "check-circle",
    tone: "success",
    announce: true,
  },
  failed: {
    label: "Failed",
    iconKey: "x-circle",
    tone: "danger",
    announce: true,
  },
  cancelled: {
    label: "Cancelled",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

// --- Task status -------------------------------------------------------------

export const TASK_STATUS: Record<TaskStatus, StatusDescriptor> = {
  pending: {
    label: "Pending",
    iconKey: "circle-dashed",
    tone: "muted",
    announce: false,
  },
  blocked: {
    label: "Blocked",
    iconKey: "alert-triangle",
    tone: "danger",
    announce: true,
  },
  queued: {
    label: "Queued",
    iconKey: "hourglass",
    tone: "neutral",
    announce: false,
  },
  running: {
    label: "Running",
    iconKey: "loader",
    tone: "info",
    announce: true,
  },
  completed: {
    label: "Completed",
    iconKey: "check-circle",
    tone: "success",
    announce: true,
  },
  failed: {
    label: "Failed",
    iconKey: "x-circle",
    tone: "danger",
    announce: true,
  },
  cancelled: {
    label: "Cancelled",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

// --- Agent run status --------------------------------------------------------

export const RUN_STATUS: Record<AgentRunStatus, StatusDescriptor> = {
  queued: {
    label: "Queued",
    iconKey: "hourglass",
    tone: "neutral",
    announce: false,
  },
  running: {
    label: "Running",
    iconKey: "loader",
    tone: "info",
    announce: false,
  },
  succeeded: {
    label: "Succeeded",
    iconKey: "check-circle",
    tone: "success",
    announce: true,
  },
  failed: {
    label: "Failed",
    iconKey: "x-circle",
    tone: "danger",
    announce: true,
  },
  timed_out: {
    label: "Timed out",
    iconKey: "alert-triangle",
    tone: "danger",
    announce: true,
  },
  interrupted: {
    label: "Interrupted",
    iconKey: "alert-triangle",
    tone: "warning",
    announce: false,
  },
  cancelled: {
    label: "Cancelled",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

// --- Approval status ---------------------------------------------------------

export const APPROVAL_STATUS: Record<ApprovalStatus, StatusDescriptor> = {
  pending: {
    label: "Pending",
    iconKey: "clock",
    tone: "warning",
    announce: false,
  },
  approved: {
    label: "Approved",
    iconKey: "shield-check",
    tone: "success",
    announce: true,
  },
  changes_requested: {
    label: "Changes requested",
    iconKey: "alert-triangle",
    tone: "warning",
    announce: true,
  },
  superseded: {
    label: "Superseded",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
  cancelled: {
    label: "Cancelled",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

// --- Handoff status ----------------------------------------------------------

export const HANDOFF_STATUS: Record<HandoffStatus, StatusDescriptor> = {
  pending: {
    label: "Pending",
    iconKey: "clock",
    tone: "warning",
    announce: false,
  },
  accepted: {
    label: "Accepted",
    iconKey: "check-circle",
    tone: "success",
    announce: true,
  },
  declined: {
    label: "Declined",
    iconKey: "shield-x",
    tone: "danger",
    announce: true,
  },
  needs_clarification: {
    label: "Needs clarification",
    iconKey: "alert-triangle",
    tone: "warning",
    announce: true,
  },
  cancelled: {
    label: "Cancelled",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

// --- Artifact status ---------------------------------------------------------

export const ARTIFACT_STATUS: Record<ArtifactStatus, StatusDescriptor> = {
  current: {
    label: "Current",
    iconKey: "check-circle",
    tone: "success",
    announce: false,
  },
  stale: {
    label: "Stale",
    iconKey: "clock",
    tone: "warning",
    announce: false,
  },
  superseded: {
    label: "Superseded",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
  rejected: {
    label: "Rejected",
    iconKey: "x-circle",
    tone: "danger",
    announce: false,
  },
};

// --- Memory status -----------------------------------------------------------

export const MEMORY_STATUS: Record<MemoryStatus, StatusDescriptor> = {
  proposed: {
    label: "Proposed",
    iconKey: "clock",
    tone: "warning",
    announce: false,
  },
  active: {
    label: "Active",
    iconKey: "check-circle",
    tone: "success",
    announce: false,
  },
  rejected: {
    label: "Rejected",
    iconKey: "x-circle",
    tone: "danger",
    announce: false,
  },
  archived: {
    label: "Archived",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

// --- Message status ----------------------------------------------------------

export const MESSAGE_STATUS: Record<MessageStatus, StatusDescriptor> = {
  queued: {
    label: "Queued",
    iconKey: "hourglass",
    tone: "neutral",
    announce: false,
  },
  sending: {
    label: "Sending",
    iconKey: "loader",
    tone: "info",
    announce: false,
  },
  running: {
    label: "Running",
    iconKey: "loader",
    tone: "info",
    announce: true,
  },
  succeeded: {
    label: "Sent",
    iconKey: "check-circle",
    tone: "success",
    announce: true,
  },
  failed: {
    label: "Failed",
    iconKey: "x-circle",
    tone: "danger",
    announce: true,
  },
  cancelled: {
    label: "Cancelled",
    iconKey: "pause-circle",
    tone: "muted",
    announce: false,
  },
};

export function getToneClasses(tone: Tone): string {
  return TONE_BG[tone];
}