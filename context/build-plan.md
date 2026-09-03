<!-- Review gate: implementation begins only after this plan and the rest of context/ are approved. -->

# Build Plan

## Delivery Rule

Build one observable vertical slice at a time. The UI first proves the complete product contract with deterministic fixtures. Domain rules, persistence, and OpenHands then replace mocks behind the same reviewed surfaces.

A feature is complete only when its happy, loading, empty, error, retry/recovery, and relevant denied-access states are demonstrable. A screenshot alone is not completion.

## Canonical Demo Fixtures

Use deterministic fixtures throughout Phase 1 and preserve their semantic cases when persistence is added:

- one seeded Owner customer;
- two isolated brands with visibly different profiles;
- the fixed six-agent team and one direct thread per agent in each brand;
- an allowed Writer draft request;
- a Producer direct request that is denied and handed to the CMO exactly once;
- a draft campaign awaiting explicit start;
- a Manual campaign waiting at `pre_production` for specific script/storyboard versions;
- an Auto campaign completed with a recorded policy approval; and
- a QA revision example with stale/superseded artifact history.

Fixture IDs and timestamps are stable so visual and interaction tests do not depend on randomness.

## Phase 0 — Context Approval

### 00 Approve the Product Contract

Review every file in `context/`; do not change prototype source yet.

**Done when:**

- The user accepts the fixed team, one-thread rule, fixed UGC workflow, direct-chat limits, handoff lifecycle, explicit campaign start, one approval checkpoint, memory authority, local-only boundary, and UI direction.
- Unresolved choices are either assigned to a later gate or resolved before their phase.
- A terminology/search pass finds no conflicting route, state, approval, authority, or scope descriptions.
- No prototype source or dependency file has changed.

## Phase 1 — Complete Visible Prototype

### 01 Isolate Marketing and Create the Product Shell

Move marketing-only providers to a marketing route-group layout and create the `/app` shell.

**UI:**

- Root layout with fonts/globals only
- Marketing layout that preserves current `/` behavior
- Native-scrolling product layout with desktop sidebar, mobile drawer, top bar, and scoped metadata
- Workspace switcher, fixed team navigation, Campaigns, Memory, and Settings links
- Loading, empty, missing-workspace, scoped not-found, and stream-disconnected states

**Proof:**

- `/` has no visual or behavior regression.
- `/app` uses native scroll and loads no Lenis, GSAP, shader, Three.js, or marketing blend behavior.
- Keyboard focus moves into/out of the mobile drawer correctly.
- An invalid workspace route reveals no information and offers a safe workspace-list recovery.

### 02 Workspace Creation and Brand Settings

Build `/app/workspaces` and `/app/[workspaceId]/settings` using fixtures.

**UI:**

- Workspace list and create form
- Required brand name and product summary; optional audience, voice, claims, and restrictions
- Default Manual/Auto selector with plain-language effect
- Incomplete-profile notice
- Brand profile edit form with explicit Save
- Read-only fixed-team configuration summary

**Proof:**

- Required-field and length errors are displayed beside their fields.
- Manual is selected for a new workspace unless the Owner explicitly chooses Auto.
- Creating a fixture workspace shows exactly six agents and routes to its CMO.
- Switching between two brands changes every visible profile/agent datum without stale residue.
- Editing the default approval mode does not change existing campaign fixtures.

### 03 Direct Chat, Queuing, and Handoff

Build the canonical chat surface for every agent.

**UI:**

- Agent identity, capabilities, and limitations
- Ordered message thread and multiline composer
- Queued/running/cancelled/failed/retry states
- Typed activity, artifact, capability-denial, and handoff cards
- CMO-side linked handoff state
- No New conversation or attachment control

**Fixture logic:**

- Exactly one direct thread per workspace-agent
- Stable message sequence and idempotent client message ID
- At most one running attempt per agent; later messages visibly queue
- Deterministic allowed, denied, and handoff results

**Proof:**

- Structured policy fixtures—not model prose—produce different allowed/denied outcomes by agent.
- Re-submitting one message ID creates one message and one logical response.
- One prohibited Producer action creates one denial and one same-workspace CMO handoff.
- Cancel preserves conversation/history and leaves the queued next message recoverable.
- Enter does not send during IME composition; Shift+Enter inserts a newline.

### 04 Campaign Plan, Start, List, and Detail

Show the complete fixed UGC flow before implementing orchestration.

**UI:**

- CMO `CampaignPlanCard` with required brief fields
- Manual/Auto selector and explicit Start campaign action
- Campaign list with status, mode, current stage, pending action, and updated time
- Detail with brief snapshot, fixed task dependencies, attempts, reasons, artifacts, and report
- Separate cancel-campaign action
- Accessible text such as “Blocked by Research and Strategy” in addition to connectors

**Fixture logic:**

- Draft cannot dispatch
- Manual fixture stops at the exact pre-production subjects
- Auto fixture records `approved` with `resolution_source=policy`
- QA revision fixture supersedes prior creative/approval and caps revision count

**Proof:**

- The Start action visibly snapshots the chosen mode and disables later mode edits.
- Every task displays owner, status, dependency text, current reason, result summary, and artifacts.
- With all inputs fixed, Manual waits while Auto continues; no other state differs before the checkpoint.
- The final report is a versioned artifact and is linked from the originating CMO thread.

### 05 Approval, Artifact, and Memory Surfaces

Complete the remaining review/control surfaces using fixtures.

**UI:**

- Manual approval card listing exact script/storyboard versions
- Approve and Request changes; feedback required for changes
- Read-only Auto/superseded approval history
- Artifact detail, provenance, input versions, Simulation label, and stale/version history
- Shared brand memory list/editor and per-agent private-memory view
- Proposed/active/rejected/archived memory status and provenance

**Proof:**

- A stale approval is visibly read-only and cannot trigger production.
- Request changes creates a new creative version in fixture state and preserves the old decision.
- Simulated media never shows download, share, play-as-video, or publish controls.
- The UI explains that private memory is isolated from other agents but visible to the Owner.
- All forms have explicit labels, error recovery, keyboard focus, and AA token contrast.

## Phase 2 — Durable Control Plane

### 06 Domain Contracts, Catalog, and Policy

Create the smallest validated domain model required by the approved screens.

**Logic:**

- Fixed versioned six-agent catalog with task/tool/resource/memory/delegation rules
- Fixed `ugc_video_v1` workflow and typed brief/input/result schemas
- Shared campaign, task, run, handoff, approval, memory, artifact, and message transitions
- Deny-by-default capability policy
- Tenant relationship and workflow-template validation
- Fixed concurrency, attempt, timeout, and revision limits

**Proof:**

- Unknown agent/tool/task/result fields and forbidden delegation fail closed.
- The CMO cannot change template assignees/dependencies; specialists cannot create campaign plans.
- Direct chat cannot execute a multi-agent, external, or real-media action.
- Invalid state transitions fail in the shared domain layer, independent of UI.

### 07 PostgreSQL Persistence and Recoverable Run Queue

Select/document a client or ORM and implement only the approved schema.

**Logic:**

- Migrations with explicit tenant keys and composite foreign keys
- Transactional workspace/team/thread creation
- Transactional campaign/task/dependency creation
- Ordered/idempotent message persistence
- `agent_runs` queue with conditional claims, leases, renewal, expiry, retry, and startup reconciliation
- Immutable/versioned artifacts and exact approval subjects
- Audit events and SSE outbox in owning transactions
- Deterministic seed/reset for the local prototype, including runtime mapping cleanup contract

**Proof:**

- Repository tests cannot create or read a cross-workspace child relationship.
- Two workers racing for one run produce exactly one lease.
- An expired lease becomes interrupted and produces at most one eligible retry.
- A restart after a task commit but before successor promotion produces one successor run, not zero or two.
- Duplicate message, handoff, tool call, approval, and terminal result keys create one logical record.

### 08 Application Services: Handoff, Approval, Memory, and Artifacts

Implement authoritative transactions before the runtime/orchestrator depends on them.

**Logic:**

- Scoped actor/workspace services
- Direct message + queued run atomic write
- Specialist-to-CMO handoff + CMO review run atomic write
- Campaign draft/start transaction and immutable snapshots
- Exact-subject Manual/Auto approval resolution
- Request-changes invalidation and two-cycle revision policy
- Shared-memory proposal/Owner decision and private-memory rules
- Artifact provenance, hashing, versioning, and staleness
- Run/campaign cancellation propagation and late-result rejection

**Proof:**

- A new creative artifact version supersedes the approval and all affected downstream artifacts.
- Concurrent approval decisions accept one current transition.
- Cancel-vs-complete races always leave an allowed terminal state and cannot revive work.
- Owner access and agent retrieval obey their different private-memory rules.

### 09 Application API and SSE

Connect the reviewed UI to services without runtime inference yet.

**Logic:**

- Workspace/profile, chat, handoff, campaign, approval, memory, artifact, cancel, and retry boundaries
- Actor and tenant validation on every request
- Stable machine error codes and human recovery text
- SSE with workspace authorization, stable event IDs, reconnect cursor, `resync_required`, and authoritative refetch
- No raw HTML, secrets, message/memory bodies, runtime errors, or unbounded payloads in events

**Proof:**

- Phase 1 screens run entirely from persisted service state in deterministic mock-runtime mode.
- Cross-workspace ID substitution is denied without confirming whether the target exists.
- Disconnect/reconnect never erases current state; a cursor gap causes a clean refetch.
- Duplicate SSE delivery does not duplicate visible messages/tasks/artifacts.

## Phase 3 — OpenHands Runtime

### 10 Private Runtime and Direct Conversation Bridge

Run direct agent conversations through the current OpenHands Software Agent SDK.

**Logic:**

- Private Python health/readiness, start/resume, cancel, event, and result boundary
- Stable opaque runtime conversation mapping
- Run-scoped opaque token with stored hash, expiry, exact tools/scopes, and revocation
- Product custom tools only; terminal, filesystem, browser, arbitrary HTTP, and unrestricted network disabled
- Schema/size validation and redaction for every runtime event/result
- Bounded context reconstruction when runtime state is unavailable
- Deterministic mock runtime remains available for tests/development

**Proof:**

- One agent resumes its own conversation after both app and runtime restart.
- A missing runtime conversation reconstructs from allowed context without losing product history.
- Expired/revoked/wrong-run tokens and replayed mutations fail or return the existing idempotent result.
- Prompt injection in message/memory/tool output cannot widen capabilities.
- Runtime has no path to product tables, another workspace, host files, or unrestricted network.

### 11 Durable UGC Orchestrator

Execute the fixed campaign template using queued OpenHands runs.

**Logic:**

- Atomic ready-task promotion
- Parallel research and strategy within fixed concurrency limits
- Structured specialist results and artifact manifests
- Current-subject pre-production approval
- Deterministic simulated production
- QA pass/revise/escalate and bounded revision
- Final CMO report and originating-thread link
- Retry, timeout, interruption, cancellation, blocked dependency, and terminal campaign behavior

**Proof:**

- The exact flow runs research + strategy → creative package → approval → simulation → QA → report.
- Manual and Auto execution produce the UI-approved divergence and checkpoint history.
- Restart/lease-expiry tests produce no duplicate logical artifact, approval, or final response.
- A failed mandatory task blocks dependents and gives the Owner a specific recovery action.
- Two failed creative revisions move to `waiting_user`; no autonomous loop continues.

## Phase 4 — Prototype Verification

### 12 End-to-End Demo and Hardening

Verify the prototype from a clean local reset.

**Scenarios:**

- Create and switch two brand workspaces
- Chat with all six agents
- Demonstrate allowed draft, server denial, one handoff, and campaign draft
- Start otherwise-identical Manual and Auto UGC campaigns
- Approve current versions; reject a stale approval
- Request a revision and show downstream staleness
- Cancel and retry a run; cancel a campaign during an active attempt
- Restart the Node worker and Python runtime during campaign execution
- Attempt cross-customer/workspace, cross-agent memory, invalid token, and duplicate-event attacks
- Verify mobile navigation, 200% zoom, keyboard-only use, IME send behavior, focus restoration, and reduced motion
- Verify Simulation wording on every output surface

**Automated checks:**

- Lint
- Typecheck
- Production build
- Domain/policy unit tests
- Repository/transaction integration tests
- Runtime-contract tests with mock runtime
- Focused browser tests for the critical user flows

**Done when:** every acceptance criterion in `project-overview.md` is reproducible and recorded from a clean setup, with no P0/P1 known issue left open for the prototype boundary.

## Hard Gates for Later Work

### Before persistence

- Select the PostgreSQL client/ORM.
- Update `library-docs.md` with exact transaction, migration, and conditional-claim patterns.

### Before OpenHands

- Verify current official SDK/runtime APIs and security guidance.
- Select the LLM provider/model and approve its data handling, runtime isolation, and credential path.

### Before any public deployment

- Add real authentication/authorization.
- Specify rate limits, abuse controls, secrets management, data deletion/retention, backup/restore, and production observability.
- Run a dedicated tenant/runtime security review.

### Before real media or publishing

- Select provider and object storage.
- Specify cost reservation/caps, idempotency, webhook/polling verification, late results, cancellation, content policy, upload/download security, rights, retention, and always-manual effects.
- Add new approval checkpoints only from a reviewed product requirement.

## Explicitly Not Scheduled

- Arbitrary workflow builder
- Multiple direct threads/history management
- Agent prompt/capability editing
- Dynamic org management
- Cross-brand memory/data movement
- Real media, uploads, publishing, scheduled campaigns, plugins, billing, or enforced provider budgets

## Feature Count

| Phase | Name | Features |
| --- | --- | ---: |
| 0 | Context Approval | 1 |
| 1 | Complete Visible Prototype | 5 |
| 2 | Durable Control Plane | 4 |
| 3 | OpenHands Runtime | 2 |
| 4 | Prototype Verification | 1 |
| **Total** |  | **13** |
