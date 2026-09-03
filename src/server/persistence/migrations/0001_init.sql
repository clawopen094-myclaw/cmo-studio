-- 0001_init.sql
-- Prototype database schema for CMO Studio. Mirrors
-- src/server/persistence/schema.ts (Drizzle). Run with `psql -f` or via
-- Drizzle's migration runner.
--
-- Every brand-owned row stores both `customer_id` and `brand_workspace_id`.
-- Composite FKs keep cross-workspace parent/child relationships impossible
-- at the database layer; the application layer still scopes every query.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --- enums -----------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM (
    'pending', 'approved', 'changes_requested', 'superseded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM (
    'draft', 'running', 'waiting_approval', 'waiting_user',
    'completed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'pending', 'blocked', 'queued', 'running',
    'completed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE handoff_status AS ENUM (
    'pending', 'accepted', 'declined', 'needs_clarification', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE memory_status AS ENUM (
    'proposed', 'active', 'rejected', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM (
    'queued', 'sending', 'running', 'succeeded', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE agent_run_status AS ENUM (
    'queued', 'running', 'succeeded', 'failed',
    'timed_out', 'interrupted', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- identity and tenancy ---------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_memberships (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  UNIQUE (customer_id, user_id)
);

CREATE TABLE IF NOT EXISTS brand_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_approval_mode TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brand_workspaces_by_customer
  ON brand_workspaces (customer_id);

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  version INT NOT NULL DEFAULT 1,
  product_summary TEXT NOT NULL,
  audience TEXT,
  voice TEXT,
  approved_claims JSONB NOT NULL DEFAULT '[]',
  restrictions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE (brand_workspace_id, version)
);

-- --- agents and direct conversations ---------------------------------------

CREATE TABLE IF NOT EXISTS agent_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  definition_key TEXT NOT NULL,
  definition_version INT NOT NULL,
  UNIQUE (brand_workspace_id, definition_key)
);

CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  agent_instance_id UUID NOT NULL,
  agent_key TEXT NOT NULL,
  openhands_conversation_id TEXT,
  next_sequence INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_instance_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  sequence INT NOT NULL,
  client_message_id TEXT,
  author_type TEXT NOT NULL,
  author_key TEXT,
  run_id UUID,
  content_json TEXT NOT NULL DEFAULT '',
  status message_status NOT NULL DEFAULT 'succeeded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (thread_id, sequence),
  UNIQUE (thread_id, client_message_id)
);

-- --- campaign execution -----------------------------------------------------

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  origin_thread_id UUID,
  origin_message_id UUID,
  handoff_id UUID,
  workflow_key TEXT NOT NULL,
  workflow_version INT NOT NULL,
  title TEXT NOT NULL,
  brief_snapshot JSONB NOT NULL,
  brand_profile_version INT NOT NULL,
  approval_mode TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  revision_count INT NOT NULL DEFAULT 0,
  state_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaigns_by_workspace
  ON campaigns (brand_workspace_id);

CREATE TABLE IF NOT EXISTS campaign_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  template_task_key TEXT NOT NULL,
  revision_index INT NOT NULL DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  supersedes_task_id UUID,
  assigned_agent_instance_id UUID NOT NULL,
  assigned_agent_key TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  wait_reason TEXT,
  input_manifest JSONB NOT NULL DEFAULT '{}',
  result_json JSONB,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 2,
  openhands_conversation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, template_task_key, revision_index)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  PRIMARY KEY (task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  source_agent_instance_id UUID NOT NULL,
  source_agent_key TEXT NOT NULL,
  target_cmo_instance_id UUID NOT NULL,
  source_thread_id UUID NOT NULL,
  source_message_id UUID NOT NULL,
  target_thread_id UUID NOT NULL,
  reason TEXT NOT NULL,
  requested_outcome TEXT NOT NULL,
  safe_context_json JSONB NOT NULL DEFAULT '{}',
  status handoff_status NOT NULL DEFAULT 'pending',
  campaign_id UUID,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_message_id, requested_outcome)
);

-- --- agent runs / queue ----------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  agent_instance_id UUID NOT NULL,
  agent_key TEXT NOT NULL,
  origin_type TEXT NOT NULL,
  trigger_message_id UUID,
  handoff_id UUID,
  campaign_task_id UUID,
  thread_id UUID,
  attempt_number INT NOT NULL DEFAULT 1,
  status agent_run_status NOT NULL DEFAULT 'queued',
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lease_owner TEXT,
  lease_token TEXT,
  lease_expires_at TIMESTAMPTZ,
  resolved_config_json JSONB NOT NULL DEFAULT '{}',
  config_digest TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS agent_runs_by_agent_status
  ON agent_runs (agent_instance_id, status);

-- Conditional uniqueness for the one-running-run-per-agent limit.
CREATE UNIQUE INDEX IF NOT EXISTS agent_runs_one_running_per_agent
  ON agent_runs (agent_instance_id)
  WHERE status = 'running';

CREATE TABLE IF NOT EXISTS run_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  agent_run_id UUID NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  claims JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- approvals --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  checkpoint TEXT NOT NULL,
  subject_digest TEXT NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  resolution_source TEXT,
  decided_by_user_id UUID,
  policy_version INT,
  feedback TEXT,
  supersedes_id UUID,
  state_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (campaign_id, checkpoint),
  UNIQUE (campaign_id, checkpoint, subject_digest)
);

-- One pending approval per campaign/checkpoint.
CREATE UNIQUE INDEX IF NOT EXISTS approval_requests_one_pending
  ON approval_requests (campaign_id, checkpoint)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS approval_subjects (
  approval_request_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  artifact_id UUID NOT NULL,
  logical_key TEXT NOT NULL,
  version INT NOT NULL,
  sha256 TEXT NOT NULL,
  PRIMARY KEY (approval_request_id, artifact_id)
);

-- --- knowledge, output, operations ----------------------------------------

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('brand', 'agent_private')),
  agent_instance_id UUID,
  agent_key TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_agent_key TEXT,
  status memory_status NOT NULL DEFAULT 'proposed',
  version INT NOT NULL DEFAULT 1,
  supersedes_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memories_workspace_scope
  ON memories (brand_workspace_id, scope);

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  logical_key TEXT NOT NULL,
  version INT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  producing_agent_key TEXT NOT NULL,
  source_run_id UUID,
  thread_id UUID,
  campaign_id UUID,
  task_id UUID,
  body_json TEXT,
  mime_type TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'current',
  is_simulated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_workspace_id, logical_key, version)
);

CREATE TABLE IF NOT EXISTS artifact_inputs (
  artifact_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  input_artifact_id UUID NOT NULL,
  input_version INT NOT NULL,
  input_sha256 TEXT NOT NULL,
  PRIMARY KEY (artifact_id, input_artifact_id)
);

CREATE TABLE IF NOT EXISTS tool_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  agent_run_id UUID NOT NULL,
  tool_call_id TEXT NOT NULL,
  tool_key TEXT NOT NULL,
  decision TEXT NOT NULL,
  redacted_input JSONB,
  redacted_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_run_id, tool_call_id)
);

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  agent_run_id UUID NOT NULL,
  campaign_id UUID,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  measured_units INT NOT NULL DEFAULT 0,
  estimated_cost INT,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID,
  actor_id UUID,
  run_id UUID,
  event_type TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_by_workspace
  ON audit_events (brand_workspace_id, created_at);

CREATE TABLE IF NOT EXISTS event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  brand_workspace_id UUID NOT NULL,
  workspace_sequence INT NOT NULL,
  event_type TEXT NOT NULL,
  entity_ref TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_workspace_id, workspace_sequence)
);