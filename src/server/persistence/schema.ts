/**
 * PostgreSQL schema (Drizzle). Mirrors the database model in
 * architecture.md. Every brand-owned row stores both `customerId` and
 * `brandWorkspaceId`; composite foreign keys enforce cross-workspace
 * parent/child safety at the database layer, not just in app code.
 *
 * The migration that creates this schema lives in
 * `src/server/persistence/migrations/0001_init.sql` (committed text).
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Tenant keys are stored on every brand-owned row. We intentionally
 * duplicate `customerId` on the brand_workspaces child and use composite
 * foreign keys everywhere.
 */

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "changes_requested",
  "superseded",
  "cancelled",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "running",
  "waiting_approval",
  "waiting_user",
  "completed",
  "failed",
  "cancelled",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "blocked",
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const handoffStatusEnum = pgEnum("handoff_status", [
  "pending",
  "accepted",
  "declined",
  "needs_clarification",
  "cancelled",
]);

export const memoryStatusEnum = pgEnum("memory_status", [
  "proposed",
  "active",
  "rejected",
  "archived",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "queued",
  "sending",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);

export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "timed_out",
  "interrupted",
  "cancelled",
]);

// --- Identity and tenancy ----------------------------------------------------

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
});

export const customerMemberships = pgTable(
  "customer_memberships",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
  },
  (t) => ({
    pair: uniqueIndex("customer_memberships_pair").on(t.customerId, t.userId),
  }),
);

export const brandWorkspaces = pgTable(
  "brand_workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    defaultApprovalMode: text("default_approval_mode").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byCustomer: index("brand_workspaces_by_customer").on(t.customerId),
  }),
);

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    version: integer("version").notNull().default(1),
    productSummary: text("product_summary").notNull(),
    audience: text("audience"),
    voice: text("voice"),
    approvedClaims: jsonb("approved_claims").$type<string[]>().notNull().default([]),
    restrictions: jsonb("restrictions").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("active"),
  },
  (t) => ({
    workspaceVersion: uniqueIndex("brand_profiles_workspace_version").on(
      t.brandWorkspaceId,
      t.version,
    ),
  }),
);

// --- Agents and direct conversations -----------------------------------------

export const agentInstances = pgTable(
  "agent_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    definitionKey: text("definition_key").notNull(),
    definitionVersion: integer("definition_version").notNull(),
  },
  (t) => ({
    workspaceAgent: uniqueIndex("agent_instances_workspace_key").on(
      t.brandWorkspaceId,
      t.definitionKey,
    ),
  }),
);

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    agentInstanceId: uuid("agent_instance_id").notNull(),
    agentKey: text("agent_key").notNull(),
    openhandsConversationId: text("openhands_conversation_id"),
    nextSequence: integer("next_sequence").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agentInstance: uniqueIndex("chat_threads_agent_instance").on(t.agentInstanceId),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    threadId: uuid("thread_id").notNull(),
    sequence: integer("sequence").notNull(),
    clientMessageId: text("client_message_id"),
    authorType: text("author_type").notNull(),
    authorKey: text("author_key"),
    runId: uuid("run_id"),
    contentJson: text("content_json").notNull().default(""),
    status: messageStatusEnum("status").notNull().default("succeeded"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    threadSeq: uniqueIndex("messages_thread_sequence").on(t.threadId, t.sequence),
    clientId: uniqueIndex("messages_client_id").on(t.threadId, t.clientMessageId),
  }),
);

// --- Campaign execution ------------------------------------------------------

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    originThreadId: uuid("origin_thread_id"),
    originMessageId: uuid("origin_message_id"),
    handoffId: uuid("handoff_id"),
    workflowKey: text("workflow_key").notNull(),
    workflowVersion: integer("workflow_version").notNull(),
    title: text("title").notNull(),
    briefSnapshot: jsonb("brief_snapshot").notNull(),
    brandProfileVersion: integer("brand_profile_version").notNull(),
    approvalMode: text("approval_mode").notNull(),
    status: campaignStatusEnum("status").notNull().default("draft"),
    revisionCount: integer("revision_count").notNull().default(0),
    stateVersion: integer("state_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byWorkspace: index("campaigns_by_workspace").on(t.brandWorkspaceId),
  }),
);

export const campaignTasks = pgTable(
  "campaign_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    templateTaskKey: text("template_task_key").notNull(),
    revisionIndex: integer("revision_index").notNull().default(0),
    isCurrent: boolean("is_current").notNull().default(true),
    supersedesTaskId: uuid("supersedes_task_id"),
    assignedAgentInstanceId: uuid("assigned_agent_instance_id").notNull(),
    assignedAgentKey: text("assigned_agent_key").notNull(),
    status: taskStatusEnum("status").notNull().default("pending"),
    waitReason: text("wait_reason"),
    inputManifest: jsonb("input_manifest").notNull().default({}),
    resultJson: jsonb("result_json"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(2),
    openhandsConversationId: text("openhands_conversation_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    campaignCurrentTask: uniqueIndex("campaign_tasks_logical_revision").on(
      t.campaignId,
      t.templateTaskKey,
      t.revisionIndex,
    ),
  }),
);

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    taskId: uuid("task_id").notNull(),
    dependsOnTaskId: uuid("depends_on_task_id").notNull(),
  },
  (t) => ({
    pair: primaryKey({ columns: [t.taskId, t.dependsOnTaskId] }),
  }),
);

export const handoffs = pgTable(
  "handoffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    sourceAgentInstanceId: uuid("source_agent_instance_id").notNull(),
    sourceAgentKey: text("source_agent_key").notNull(),
    targetCmoInstanceId: uuid("target_cmo_instance_id").notNull(),
    sourceThreadId: uuid("source_thread_id").notNull(),
    sourceMessageId: uuid("source_message_id").notNull(),
    targetThreadId: uuid("target_thread_id").notNull(),
    reason: text("reason").notNull(),
    requestedOutcome: text("requested_outcome").notNull(),
    safeContextJson: jsonb("safe_context_json").notNull().default({}),
    status: handoffStatusEnum("status").notNull().default("pending"),
    campaignId: uuid("campaign_id"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sourceOutcome: uniqueIndex("handoffs_source_outcome").on(
      t.sourceMessageId,
      t.requestedOutcome,
    ),
  }),
);

// --- Agent runs / queue -----------------------------------------------------

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    agentInstanceId: uuid("agent_instance_id").notNull(),
    agentKey: text("agent_key").notNull(),
    originType: text("origin_type").notNull(),
    triggerMessageId: uuid("trigger_message_id"),
    handoffId: uuid("handoff_id"),
    campaignTaskId: uuid("campaign_task_id"),
    threadId: uuid("thread_id"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: agentRunStatusEnum("status").notNull().default("queued"),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leaseOwner: text("lease_owner"),
    leaseToken: text("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    resolvedConfigJson: jsonb("resolved_config_json").notNull().default({}),
    configDigest: text("config_digest").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => ({
    byAgentStatus: index("agent_runs_by_agent_status").on(
      t.agentInstanceId,
      t.status,
    ),
  }),
);

export const runTokens = pgTable(
  "run_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    agentRunId: uuid("agent_run_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    claims: jsonb("claims").notNull().default({}),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    run: uniqueIndex("run_tokens_run").on(t.agentRunId),
  }),
);

// --- Approvals --------------------------------------------------------------

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    checkpoint: text("checkpoint").notNull(),
    subjectDigest: text("subject_digest").notNull(),
    status: approvalStatusEnum("status").notNull().default("pending"),
    resolutionSource: text("resolution_source"),
    decidedByUserId: uuid("decided_by_user_id"),
    policyVersion: integer("policy_version"),
    feedback: text("feedback"),
    supersedesId: uuid("supersedes_id"),
    stateVersion: integer("state_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => ({
    campaignCheckpoint: uniqueIndex("approval_requests_campaign_checkpoint").on(
      t.campaignId,
      t.checkpoint,
    ),
    digest: uniqueIndex("approval_requests_digest").on(
      t.campaignId,
      t.checkpoint,
      t.subjectDigest,
    ),
  }),
);

export const approvalSubjects = pgTable(
  "approval_subjects",
  {
    approvalRequestId: uuid("approval_request_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    artifactId: uuid("artifact_id").notNull(),
    logicalKey: text("logical_key").notNull(),
    version: integer("version").notNull(),
    sha256: text("sha256").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.approvalRequestId, t.artifactId] }),
  }),
);

// --- Knowledge, output, and operations --------------------------------------

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    scope: text("scope").notNull(),
    agentInstanceId: uuid("agent_instance_id"),
    agentKey: text("agent_key"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sourceType: text("source_type").notNull(),
    sourceAgentKey: text("source_agent_key"),
    status: memoryStatusEnum("status").notNull().default("proposed"),
    version: integer("version").notNull().default(1),
    supersedesId: uuid("supersedes_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceScope: index("memories_workspace_scope").on(
      t.brandWorkspaceId,
      t.scope,
    ),
  }),
);

export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    logicalKey: text("logical_key").notNull(),
    version: integer("version").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    producingAgentKey: text("producing_agent_key").notNull(),
    sourceRunId: uuid("source_run_id"),
    threadId: uuid("thread_id"),
    campaignId: uuid("campaign_id"),
    taskId: uuid("task_id"),
    bodyJson: text("body_json"),
    mimeType: text("mime_type").notNull(),
    sha256: text("sha256").notNull(),
    status: text("status").notNull().default("current"),
    isSimSimulated: boolean("is_simulated").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    logicalVersion: uniqueIndex("artifacts_logical_version").on(
      t.brandWorkspaceId,
      t.logicalKey,
      t.version,
    ),
  }),
);

export const artifactInputs = pgTable(
  "artifact_inputs",
  {
    artifactId: uuid("artifact_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    inputArtifactId: uuid("input_artifact_id").notNull(),
    inputVersion: integer("input_version").notNull(),
    inputSha256: text("input_sha256").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.artifactId, t.inputArtifactId] }),
  }),
);

export const toolInvocations = pgTable(
  "tool_invocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    agentRunId: uuid("agent_run_id").notNull(),
    toolCallId: text("tool_call_id").notNull(),
    toolKey: text("tool_key").notNull(),
    decision: text("decision").notNull(),
    redactedInput: jsonb("redacted_input"),
    redactedResult: jsonb("redacted_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    runCall: uniqueIndex("tool_invocations_run_call").on(
      t.agentRunId,
      t.toolCallId,
    ),
  }),
);

export const usageRecords = pgTable("usage_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull(),
  brandWorkspaceId: uuid("brand_workspace_id").notNull(),
  agentRunId: uuid("agent_run_id").notNull(),
  campaignId: uuid("campaign_id"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  measuredUnits: integer("measured_units").notNull().default(0),
  estimatedCost: integer("estimated_cost"),
  isSimulated: boolean("is_simulated").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id"),
    actorId: uuid("actor_id"),
    runId: uuid("run_id"),
    eventType: text("event_type").notNull(),
    entityRef: text("entity_ref").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byWorkspace: index("audit_events_by_workspace").on(
      t.brandWorkspaceId,
      t.createdAt,
    ),
  }),
);

export const eventOutbox = pgTable(
  "event_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull(),
    brandWorkspaceId: uuid("brand_workspace_id").notNull(),
    workspaceSequence: integer("workspace_sequence").notNull(),
    eventType: text("event_type").notNull(),
    entityRef: text("entity_ref").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceSeq: uniqueIndex("event_outbox_workspace_seq").on(
      t.brandWorkspaceId,
      t.workspaceSequence,
    ),
  }),
);