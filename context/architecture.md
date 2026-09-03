<!-- Proposed prototype architecture. No implementation is authorized until this context set is approved. -->

# Architecture

## Architectural Position

CMO Studio keeps the useful Paperclip control-plane ideas—durable work, scoped agents, visible delegation, audit history, and resumable execution—without copying its generalized companies, issues, heartbeats, worktrees, or admission hierarchy.

The prototype deliberately has one product workflow (`ugc_video_v1`), one fixed six-agent organization, one canonical direct chat per agent, and one approval checkpoint. It should prove the multi-agent control model before adding configurable organizations or real providers.

## Sources of Truth

| Concern | Authority | Non-authority |
| --- | --- | --- |
| Customers, workspaces, messages, campaigns, tasks, approvals, memory, artifacts, runs | PostgreSQL | Browser state and OpenHands state |
| Agent roles, tools, scopes, hierarchy, limits, schemas | Versioned control-plane catalog committed with the app | Prompts, Python duplicates, or mutable database capability rows |
| Authorization and state transitions | TypeScript control-plane services/policy | UI checks and runtime suggestions |
| Agent reasoning/resume state | Private OpenHands runtime storage, referenced by an opaque conversation ID | Product-visible message history |
| Visible conversation history | PostgreSQL messages | OpenHands transcript |
| Workflow progress | PostgreSQL campaign/task/run state | SSE delivery |
| Long-term reusable memory | PostgreSQL brand/agent memory records | OpenHands filesystem memory |

If OpenHands resume state is unavailable, the system may create a new runtime conversation from bounded, scoped product context. Product messages and campaign state remain intact.

## Prototype Deployment Topology

The prototype is local-only and uses long-lived processes:

```text
Browser
  │ HTTP mutations + SSE
  ▼
Next.js control plane ───────────────► PostgreSQL
  │                                       ▲
  │ private service request               │ claims/state/events
  ▼                                       │
OpenHands Python runtime ◄────────── Node task worker
  │
  └── approved LLM endpoint only
```

- The Next.js server owns user-facing pages, APIs, services, policy, and SSE.
- A separate long-lived Node worker claims durable `agent_runs`; it is not tied to an HTTP request lifetime.
- PostgreSQL owns queue and workflow state.
- The Python runtime is private and accepts work only from the control plane/worker.
- The runtime has no product database credentials and no unrestricted product API credential.
- Serverless hosting, public internet exposure, and horizontal production scaling are deferred.
- Graceful shutdown stops new claims; unfinished leases expire and are recovered by another worker/startup reconciliation.

## Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Web framework | Next.js 16.3 App Router | Marketing site, application UI, route handlers, SSE |
| UI runtime | React 19 | Server-first rendering and focused interactions |
| Language | TypeScript strict | Web and control plane |
| Styling | Tailwind CSS 4 + existing UI primitives | Token-based product UI |
| Database | PostgreSQL, proposed | Product state, durable run queue, events, text artifacts |
| Agent runtime | OpenHands Software Agent SDK | Agent reasoning and resume state |
| Runtime service | Private Python service, proposed | Stable start/resume/cancel/event boundary |
| External AI | Configured LLM endpoint | Agent inference only |
| Media generation | Deterministic simulator | Prototype placeholder artifacts |

No dependency is installed until its build phase begins and `context/library-docs.md` is updated.

## Planned Folder Structure

```text
/
├── context/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Fonts/globals only; no marketing providers
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx             # Marketing-only SmoothScroll/effects
│   │   │   └── page.tsx               # Existing `/`
│   │   ├── app/
│   │   │   ├── layout.tsx             # Native-scrolling product shell
│   │   │   ├── page.tsx
│   │   │   ├── workspaces/
│   │   │   └── [workspaceId]/
│   │   │       ├── chat/[agentKey]/
│   │   │       ├── campaigns/
│   │   │       ├── memory/
│   │   │       └── settings/
│   │   └── api/                        # Thin HTTP/SSE boundaries
│   ├── components/
│   │   ├── ui/
│   │   └── marketing/
│   ├── features/
│   │   ├── workspaces/
│   │   ├── agents/
│   │   ├── chat/
│   │   ├── campaigns/
│   │   ├── approvals/
│   │   ├── memory/
│   │   └── artifacts/
│   ├── server/
│   │   ├── catalog/                    # Fixed agent/workflow definitions
│   │   ├── services/                   # Transactions and workflows
│   │   ├── repositories/               # Scoped persistence
│   │   ├── policy/                     # Deny-by-default decisions
│   │   └── worker/                     # Claims, leases, runtime bridge
│   ├── contracts/                      # Validated domain/API/runtime schemas
│   └── lib/                            # Small framework utilities
├── runtime/                             # Python OpenHands service, Phase 3
└── public/                              # Marketing and static simulation assets
```

Folders are created only when their first real file is needed. Moving the existing homepage into `(marketing)` must preserve the `/` URL and marketing behavior.

## Layer Boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| `src/app` | Routing, page composition, HTTP/SSE translation | Database queries or workflow rules |
| `src/components/ui` | Reusable accessible primitives | Feature fetching or domain decisions |
| `src/features` | Feature UI and local interaction state | Cross-feature persistence policy |
| `src/server/catalog` | Versioned fixed definitions and schemas | Mutable tenant data |
| `src/server/services` | Authorization, transactions, transitions, orchestration | React rendering |
| `src/server/repositories` | Explicitly tenant-scoped queries | Authorization or orchestration policy |
| `src/server/policy` | Capability/approval/scope decisions | Tool execution |
| `src/server/worker` | Run claims, leases, retries, runtime communication | User authorization decisions |
| `runtime` | OpenHands conversations and allowed custom-tool calls | Tenancy, approval, campaign authority, product persistence |

## Component Flow

```text
Browser
  → Next.js route/action
  → ActorContext + input validation
  → application service
     ├── capability/approval policy
     ├── scoped repository transaction
     ├── audit event
     └── SSE outbox event
  → worker claims queued run
  → OpenHands runtime
  → product-tool request with run token
  → control plane rechecks current authority
  → structured result is validated and persisted
  → browser refetches authoritative state
```

## Fixed Agent Catalog

The code-owned catalog is the sole capability source of truth. Each definition contains:

```text
key and integer version
display name and reports-to key
system-instruction template
model profile
allowed task types
allowed product-tool keys
resource read/write scopes
memory read/write scopes
allowed delegation targets
validated input/result schemas
max run seconds and attempts
```

The catalog is deny-by-default. Database agent instances record `definition_key` and `definition_version`; each run stores the resolved definition snapshot/digest used for that attempt. Updating the catalog affects new runs only and never rewrites historical run authority.

Prototype limits are fixed configuration, not editable tenant settings:

- one active run per agent instance;
- two attempts per logical task/message unless a definition is stricter;
- a finite run timeout from the catalog; and
- two creative revision cycles per campaign.

Initial boundary limits are contract constants, not scattered literals:

| Input/output | Prototype limit |
| --- | ---: |
| Workspace name | 1–80 characters |
| Product summary, audience, or voice field | 2,000 characters each |
| Approved claims or restrictions | 25 entries, 500 characters each |
| Campaign title | 120 characters |
| Campaign objective, audience, deliverable, or product field | 2,000 characters each |
| Campaign channel or duration label | 100 characters each |
| Campaign call to action | 500 characters |
| User chat message | 12,000 characters |
| One memory record | 4,000 characters |
| Text artifact body | 200,000 characters |
| Runtime progress event | 32 KiB after encoding |
| Runtime terminal result | 512 KiB after encoding |
| SSE outbox payload | 16 KiB after encoding |

Reject over-limit content before model/runtime use and return a safe field-specific error. These values may change through context review, not silently in implementation.

## Fixed UGC Workflow Contract

The CMO does not invent an arbitrary DAG in the prototype. It instantiates and fills the validated `ugc_video_v1` template:

```text
audience_research ─┐
                   ├─► creative_package ─► pre_production approval
brand_strategy ────┘                         │
                                             ▼
                                  simulated_production
                                             │
                                             ▼
                                        creative_qa
                                             │ pass
                                             ▼
                                         final_report
```

| Task key | Agent | Required inputs | Required result |
| --- | --- | --- | --- |
| `audience_research` | Audience Researcher | Campaign brief + brand snapshot | Research brief with supplied facts, assumptions, and verification-needed items |
| `brand_strategy` | Brand Strategist | Campaign brief + brand snapshot | Strategy brief artifact |
| `creative_package` | UGC Writer | Research + strategy artifact versions | Script and storyboard artifacts |
| `simulated_production` | Media Producer | Currently approved script/storyboard versions | Labelled simulated-media artifact |
| `creative_qa` | Creative QA | Produced media + approved creative inputs + restrictions | QA report: `pass`, `revise`, or `escalate` |
| `final_report` | AI CMO | All current artifacts, approval, QA, and task summaries | Final-report artifact |

Template validation rejects unknown task keys, changed assignees, missing/extra dependencies, invalid input references, cycles, or output schemas. Every task is mandatory. A QA revision specifies `revision_target=creative_package|simulated_production` and may run at most twice. Revising the creative package creates new script/storyboard versions, supersedes approval, and marks production/QA outputs stale. Revising production preserves approval only when its subject digest is unchanged, creates a new production version, and reruns QA. `escalate` or an exhausted revision limit moves the campaign to `waiting_user`.

## Data Flows

### Brand Workspace Creation

```text
Owner submits profile
  → validate seeded actor/customer
  → validate required fields and limits
  → one transaction creates workspace + profile version
  → instantiate six catalog agent instances
  → create six canonical direct threads
  → seed active user-authored brand memory
  → insert audit/outbox events
  → return CMO route
```

The transaction creates the complete workspace or nothing.

### Direct Agent Message

```text
User submits message + clientMessageId
  → verify actor/workspace/agent relationship
  → validate/sanitize bounded content
  → one transaction appends next thread sequence
     + creates one queued direct-message run
     + writes audit/outbox records
  → worker waits for that agent instance to become available
  → atomically leases the run
  → runtime resumes the thread's opaque conversation ID
  → result/tool/handoff events are schema-validated
  → one terminal response/artifact/handoff is persisted
  → run becomes terminal and next queued run may start
```

`clientMessageId` makes retries idempotent. A unique constraint allows at most one terminal agent response per direct-message run. Messages submitted while the agent is busy remain visibly queued in sequence; they do not create concurrent conversations.

### Handoff

```text
Specialist result requests coordination
  → capability policy permits only target=CMO
  → transaction creates one handoff for source message/outcome
     + creates queued CMO review run against canonical CMO thread
  → CMO accepts, declines, asks for clarification, or cancels
  → accepted handoff may create linked campaign draft
  → state is visible from both source and CMO threads
```

The safe context summary includes links to scoped artifacts, not the specialist's private memory or hidden reasoning.

### Campaign Start and Execution

```text
CMO produces typed draft fields
  → control plane instantiates ugc_video_v1 preview
  → Owner confirms brief + Manual/Auto mode + Start
  → one transaction snapshots brand/config/workflow
     + creates all logical tasks/dependencies
     + queues ready research/strategy runs
  → completed tasks atomically promote newly ready tasks
  → creative package completion creates pre_production approval
     ├── Manual: campaign waits for current user decision
     └── Auto: preflight resolves policy approval transactionally
  → approved production task runs simulator
  → QA passes, requests bounded revision, or escalates
  → pass queues final report
  → report persists and campaign completes
  → originating CMO thread receives one campaign/report link
```

Task result persistence, artifact creation, task completion, dependency promotion, and outbox writes occur in one transaction. A crash before commit changes nothing; a crash after commit cannot promote the same logical successor twice.

## State Machines

### Campaign

```text
draft → running ↔ waiting_approval
           ├────↔ waiting_user
           ├────→ completed
           ├────→ failed
           └────→ cancelled
```

`draft` cannot dispatch tasks. `completed`, `failed`, and `cancelled` are terminal.

### Campaign Task

```text
pending → queued → running → completed
             ▲         ├──→ retry_wait ──┘
                       ├──→ failed
                       └──→ cancelled

pending → blocked
any nonterminal → cancelled
```

`pending` includes a machine-readable wait reason such as dependency or approval. If a mandatory prerequisite permanently fails or is cancelled, dependents become terminal `blocked` with that reason; they are never silently queued.

### Agent Run

```text
queued → running → succeeded | failed | timed_out | interrupted | cancelled
```

Each retry is a new immutable run/attempt. A lease expiry makes the old run `interrupted`; it never returns to `running`.

### Approval

```text
pending → approved | changes_requested | superseded | cancelled
approved | changes_requested → superseded (when subject versions change)
```

An Auto decision is an `approved` record with `resolution_source=policy`; a Manual decision uses `resolution_source=user`.

### Handoff

```text
pending → accepted | declined | needs_clarification | cancelled
needs_clarification → pending | cancelled
```

### Memory

```text
proposed → active | rejected
active → archived
```

## Durable Run Queue and Recovery

`agent_runs` is the queue and immutable attempt history for direct messages, handoffs, and campaign tasks.

Claim algorithm:

1. Select an eligible `queued` run whose `available_at` has passed.
2. Recheck tenant scope, origin state, dependencies, approval, cancellation, and the one-run-per-agent limit inside the claim transaction.
3. Conditionally set `status=running`, `lease_owner`, random `lease_token`, and `lease_expires_at`.
4. Renew the lease while work is active.
5. Accept progress/result events only for the current run and lease generation.

Recovery algorithm:

1. Startup and periodic reconciliation finds expired running leases.
2. It marks the old run `interrupted` exactly once.
3. Transient failures create a new queued attempt with bounded backoff when attempts remain.
4. Schema, capability, tenant, cancellation, and deterministic validation failures do not retry.
5. Exhausted attempts fail the logical task/message visibly and propagate campaign failure/blocking rules.

Every mutating tool invocation has a stable idempotency key unique to `(run_id, tool_call_id)`. The prototype exposes no non-idempotent external provider effects. Future provider work must separately specify provider idempotency, reconciliation, callbacks, polling, and late-result behavior before it is enabled.

## Approval and Revision Consistency

`pre_production` approval is bound to a subject set containing exact artifact IDs, logical keys, versions, and SHA-256 hashes for the script and storyboard.

- Only one `pending` approval may exist for a campaign/checkpoint. A campaign/checkpoint/subject digest is also unique across history.
- Manual resolution includes the Owner ID and optional decision note; Request changes requires feedback.
- Auto resolution includes the catalog policy version and preflight reason.
- The decision request supplies an expected approval version. A concurrent/stale decision fails without changing task state.
- Resolving approval and promoting production happen in one transaction.
- Creating a new subject version supersedes the old pending/approved request and marks derived artifacts `stale`.
- A late decision for a superseded subject never unlocks production.

## Cancellation Rules

- **Cancel run:** one transaction marks the run `cancelled`, revokes its tool token/lease, and then asks the runtime to stop best-effort. Any later payload is ignored except safe diagnostics. Messages and prior artifacts remain.
- **Cancel campaign:** one transaction marks the campaign cancelled, prevents new claims, cancels nonterminal tasks and queued/running runs, and revokes active tool authority. Runtime stop requests follow best-effort.
- A worker rechecks cancellation immediately before every product-tool action and before terminal commit.
- Late runtime events cannot move a cancelled entity to a nonterminal or successful state.
- Retry creates a new attempt and preserves the full old attempt history.

## Database Model

All IDs are UUIDs and timestamps are `timestamptz`. Database migrations are the implemented schema authority.

### Tenant-Key Convention

- Every customer-owned row stores `customer_id`.
- Every brand-owned row stores both `customer_id` and `brand_workspace_id`, including nested child rows.
- Brand parents expose a unique composite key that includes their tenant IDs.
- Composite foreign keys require referenced entities to share the same customer/workspace; application joins are not the only defense.
- Globally unique IDs never replace tenant predicates.
- Cross-scope lookup returns the same scoped not-found response as a missing entity.

### Identity and tenancy

| Table | Required key fields and constraints |
| --- | --- |
| `users` | `id`, `display_name`; one seeded local user |
| `customers` | `id`, `name`; one seeded customer |
| `customer_memberships` | `customer_id`, `user_id`, `role`; unique pair; prototype role is Owner |
| `brand_workspaces` | `id`, `customer_id`, `name`, `default_approval_mode` defaulting to Manual, timestamps; no slug until friendly URLs exist |
| `brand_profiles` | `id`, `customer_id`, `brand_workspace_id`, `version`, bounded profile fields, `status`; one active version per workspace |

### Agents and direct conversations

| Table | Required key fields and constraints |
| --- | --- |
| `agent_instances` | `id`, `customer_id`, `brand_workspace_id`, `definition_key`, `definition_version`; unique definition key per workspace; no arbitrary override |
| `chat_threads` | `id`, tenant keys, `agent_instance_id`, `openhands_conversation_id?`, `next_sequence`, timestamps; unique agent instance per workspace |
| `messages` | `id`, tenant keys, `thread_id`, `sequence`, `client_message_id?`, `author_type`, `author_id?`, `content_json`, `status`, `source_run_id?`; unique `(thread_id, sequence)`, unique client ID, at most one terminal response per run; immutable |

The route uses the stable catalog `agentKey`; the service resolves the workspace-local instance after authorization.

### Campaign execution

| Table | Required key fields and constraints |
| --- | --- |
| `campaigns` | `id`, tenant keys, `origin_thread_id?`, `origin_message_id?`, `handoff_id?`, `workflow_key/version`, `title`, `brief_snapshot`, `brand_profile_version`, `approval_mode`, `status`, `revision_count`, `state_version`; mode/brief immutable after start |
| `campaign_tasks` | `id`, tenant keys, `campaign_id`, `template_task_key`, `revision_index`, `supersedes_task_id?`, `is_current`, `assigned_agent_instance_id`, `definition_version`, `status`, `wait_reason?`, `input_manifest`, `result_json?`, `attempt_count`, `max_attempts`, `openhands_conversation_id?`; unique logical task/revision and one current revision per task key |
| `task_dependencies` | tenant keys, `campaign_id`, `task_id`, `depends_on_task_id`; composite FKs keep both tasks in the same campaign/workspace; self-edge and cycles rejected |
| `handoffs` | `id`, tenant keys, `source_agent_instance_id`, `target_cmo_instance_id`, `source_thread_id`, `source_message_id`, `target_thread_id`, `reason`, `requested_outcome`, `safe_context_json`, `status`, `campaign_id?`, `idempotency_key`; unique source/outcome key |
| `agent_runs` | `id`, tenant keys, `agent_instance_id`, `origin_type`, exactly one of `trigger_message_id`, `handoff_id`, or `campaign_task_id`, `thread_id?`, `attempt_number`, `status`, `available_at`, lease fields, timestamps, `resolved_config_json`, `config_digest`, bounded usage/error summary |
| `run_tokens` | `id`, tenant keys, `agent_run_id`, `token_hash`, exact tool/scope claims, `expires_at`, `revoked_at?`; raw bearer token is never stored |
| `approval_requests` | `id`, tenant keys, `campaign_id`, `checkpoint`, `subject_digest`, `status`, `resolution_source?`, `decided_by_user_id?`, `policy_version?`, `feedback?`, `supersedes_id?`, `state_version`, timestamps |
| `approval_subjects` | tenant keys, `approval_request_id`, `artifact_id`, `artifact_version`, `artifact_sha256`, `logical_key`; exact immutable subject set |

Database constraints enforce one running run per agent instance, unique attempts per origin, one pending approval per campaign/checkpoint, and one historical request per subject digest.

### Knowledge, output, and operations

| Table | Required key fields and constraints |
| --- | --- |
| `memories` | `id`, tenant keys, `scope=brand|agent_private`, `agent_instance_id?`, `content_json`, `source_type/id`, `status`, `version`, `supersedes_id?`; scope check constraint; no generic conversation/campaign/task duplication |
| `artifacts` | `id`, tenant keys, `logical_key`, `version`, `type`, `title`, `producing_agent_instance_id`, `source_run_id`, `thread_id?`, `campaign_id?`, `task_id?`, exactly one of `body_json` or server-generated `static_asset_key`, `mime_type`, `sha256`, `status`; immutable and unique logical version |
| `artifact_inputs` | tenant keys, `artifact_id`, `input_artifact_id`, input version/hash; composite FKs preserve workspace and provenance |
| `tool_invocations` | `id`, tenant keys, `agent_run_id`, `tool_call_id`, `tool_key`, `decision`, bounded redacted input/result summaries, timestamps; unique `(run_id, tool_call_id)` |
| `usage_records` | `id`, tenant keys, `agent_run_id`, `campaign_id?`, provider/model, measured units, `estimated_cost?`, `is_simulated`; never label an estimate as enforced spend |
| `audit_events` | `id`, tenant keys, actor/run correlation, event type, entity reference, allowlisted redacted payload, timestamp; append-only |
| `event_outbox` | `id`, tenant keys, `workspace_sequence`, event type, entity reference, compact payload, timestamp; unique sequence per workspace; used only for delivery |

Conversation history is represented by messages, while campaign/task context is assembled from their authoritative records and artifact manifests. They are not duplicated into a generic memory table.

## Run Authority and Runtime Trust Boundary

There are two independent authentication directions:

1. **Control plane/worker → runtime:** a private service credential authenticates start, resume, cancel, and event-stream requests.
2. **Runtime → product tools:** each run receives a random high-entropy opaque bearer token. Only its hash is stored. It is bound to the run, tenant, agent, exact tools/scopes, audience, and short expiry.

On every product-tool call, the control plane:

1. hashes and looks up the token;
2. verifies expiry, audience, run status, cancellation, tenant, agent, tool, and resource scope;
3. derives identity from the stored run—not tool arguments;
4. rechecks current task dependencies and approval where relevant; and
5. applies the tool-call idempotency key.

Run authority is revoked at cancellation or any terminal state. Token replay cannot widen scope; repeated mutations return the existing logical result.

OpenHands events, LLM output, memory, research text, tool output, filenames, URLs, Markdown, and artifact bodies are all untrusted input. The control plane schema-validates, size-limits, and redacts them. UI Markdown renders without raw HTML, URLs use an allowlist, and runtime/provider errors never pass directly to the client.

Terminal, filesystem, shell, browser, arbitrary HTTP, and unrestricted network tools are disabled. Runtime network egress is limited to the configured LLM and control-plane endpoints. No host directory or product secret is mounted into an agent workspace.

## Runtime Conversation Lifecycle

- A direct thread has one stable opaque OpenHands conversation ID.
- A campaign logical task has its own opaque conversation ID across its attempts/revisions.
- PostgreSQL stores only the pointer and product-visible records, not hidden chain-of-thought.
- The runtime persists conversation state on a private durable volume/store for local restart.
- If the pointer is missing or runtime state is corrupt, a bounded context builder reconstructs only allowed messages, memory, task inputs, and artifact summaries into a new conversation.
- No archive/delete feature is exposed in the prototype. The local reset procedure clears PostgreSQL seed data, runtime conversation storage, and simulated assets together.
- Production retention, deletion, and legal/privacy workflows are a hard gate before public deployment.

## Context Assembly and Memory Retrieval

The control plane builds the bounded context envelope; the runtime cannot query arbitrary product memory.

Direct-chat priority is:

1. fixed agent definition and current policy summary;
2. current user message;
3. current brand-profile version;
4. active shared brand memory;
5. active private memory for that exact agent instance; and
6. newest direct-thread turns that fit the remaining catalog token budget.

Campaign-task priority is the snapshotted brief/profile, typed task inputs, exact dependency artifact versions, current approval facts where relevant, and that agent's permitted memory. It excludes other specialists' direct threads and private memories.

Retrieval is deterministic recent/keyword selection with record and character caps; no vector store is added. Older chat remains visible to the user but is not guaranteed to fit an agent run. Each run records only the IDs/versions and digest of injected context for provenance, not duplicated bodies in logs. Agent-written shared facts remain proposals until Owner acceptance.

## Artifacts and Storage

Prototype text artifacts live as validated PostgreSQL JSON/text. Simulated media points only to allowlisted static assets owned by the application. A client cannot provide a storage path or artifact URI.

Artifact rules:

- immutable versions; edits create a successor version;
- exact producing run/agent and input-version provenance;
- SHA-256 digest over canonical content;
- `current`, `stale`, `superseded`, or `rejected` lifecycle status;
- bounded content and metadata;
- simulated artifacts always carry `is_simulated=true` in validated metadata.

When real binary media is approved later, private object keys will be generated from authenticated database IDs. Upload validation, malware handling, short-lived downloads, provider callbacks, retention, and purge must be specified before that phase.

## SSE and Audit Contract

- State changes and their compact `event_outbox` record commit in one transaction.
- SSE authorizes the customer/workspace before reading events.
- Events have stable IDs and per-workspace sequence numbers; duplicate delivery is allowed and client-deduplicated.
- The client reconnects with `Last-Event-ID` when possible, then refetches authoritative thread/campaign state.
- A missing/gapped cursor produces `resync_required`; events are never workflow authority.
- Payload types and sizes are allowlisted and contain no prompts, message bodies, memory content, secrets, raw provider output, or signed URLs.
- `audit_events` records security/domain decisions separately from SSE delivery.

## Admission Policy

Every run/tool action passes only focused checks:

1. Actor owns the requested workspace for user-initiated mutations.
2. Agent, origin, thread/task, and every referenced resource belong to the same tenant/workspace.
3. The run/origin is current, nonterminal, and not cancelled.
4. The fixed catalog permits the task, tool, resource action, memory scope, and delegation target.
5. Task dependencies and the exact current approval permit continuation.
6. Agent concurrency, attempt, timeout, and revision limits permit execution.
7. The request and result match versioned schemas and size limits.

There is no Paperclip-style generalized admission gate. Real provider cost gates are also deferred because no paid media/provider tool exists. LLM usage is measured for visibility; it is not misrepresented as a guaranteed budget-control system.

## Invariants

- Every brand-owned query and relationship is scoped by both customer and workspace.
- Every workspace contains exactly one instance of each fixed agent definition and one canonical direct thread per instance.
- Direct chat never expands capability and cannot directly start multi-agent or external work.
- Only the CMO can instantiate the fixed campaign template; no task runs before explicit campaign start.
- Specialists hand off only to the same-workspace CMO; peer delegation is denied.
- Prompt text never substitutes for policy enforcement.
- Campaign brief, profile version, workflow version, agent versions, and approval mode are snapshotted at start.

- Manual approval blocks production against any unapproved creative-package version.
- Auto approval creates the same auditable checkpoint record and cannot bypass cancellation or validation.
- A current approval covers exact artifact versions/hashes and is invalidated by any subject change.
- Run claims are leased, bounded, atomic, and recoverable; terminal attempts are immutable.
- One agent instance never has two running attempts in the prototype.
- Task promotion, result persistence, artifact creation, and outbox emission are idempotent transactions.
- The CMO sees structured specialist results, not specialist-private memory or hidden reasoning.
- No secret appears in prompts, messages, memory, events, logs, artifacts, or client output.
- Late or duplicate runtime events cannot reverse a terminal/cancelled state.
- Existing `/` behavior remains unchanged, while `/app` loads no SmoothScroll, GSAP, shader, or Three.js product code.

## Explicitly Deferred Architecture

- Real media provider, async jobs, webhooks, polling, and provider reconciliation
- Object storage, upload/download, and binary retention
- Public deployment and production authentication
- User/role administration beyond the seeded Owner
- Mutable agent configs or tenant capability overrides
- Multiple direct threads, thread archive/delete, and cross-brand data movement
- Scheduled work, billing, enforced spend caps, publishing, and integrations
- Vector retrieval and generalized workflow/DAG editing
