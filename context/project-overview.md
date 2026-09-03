<!-- Product definition: review and approve this before prototype implementation starts. -->

# Project Overview

## Working Name

**CMO Studio** is a temporary product name. Renaming it does not change the product model.

## Product Summary

CMO Studio is a multi-brand AI marketing workspace. Each customer can own multiple isolated brand workspaces. Every brand workspace receives the same predefined AI CMO and specialist team. Users may chat with any agent, while the CMO coordinates work that needs multiple agents.

Each agent has a versioned, deny-by-default configuration that limits its tools, data, task types, memory scope, and delegation paths. Prompts explain those limits; the server enforces them. Direct chat never expands an agent's authority.

The first prototype lives under `/app` in the existing Event Classics Next.js project. The existing marketing site remains at `/`.

## Problem It Solves

Marketing work commonly spans research, positioning, copy, media production, review, and reporting. When those activities happen in unrelated AI chats, brand context drifts, responsibility is unclear, and the final output is difficult to audit.

CMO Studio gives each brand a persistent, fixed AI team with:

- clear ownership and delegation;
- isolated brand and agent memory;
- visible campaign progress and decisions;
- artifact provenance and versioning; and
- user-selected manual or automatic campaign approval.

## Target User

- Founders and small marketing teams operating more than one brand
- Agencies managing multiple client brands
- Users who want direct access to specialists without manually coordinating every handoff
- Users who want either a review checkpoint or automatic continuation during campaign execution

## Terminology

| Term | Meaning |
| --- | --- |
| Customer | Tenant/account that owns one or more brand workspaces |
| User | Human identity acting for a customer |
| Actor | Authenticated request identity; the prototype uses one seeded Owner actor |
| Brand workspace | Hard data, memory, conversation, and execution isolation boundary for one brand |
| Agent definition | Versioned code-owned role, tools, scopes, delegation rules, prompt, and limits |
| Agent instance | One workspace-bound copy of a fixed definition |
| Direct thread | The canonical persistent user conversation with one agent in one workspace |
| Campaign | User-started, CMO-owned workflow with a snapshotted brief and approval mode |
| Task | Durable unit of campaign work assigned to an allowed agent role |
| Run | One recoverable attempt to answer a direct message or execute a task |
| Handoff | Persisted specialist-to-CMO escalation with linked source context |
| Artifact | Immutable, versioned deliverable produced by a run |
| Approval | Decision bound to exact creative-package artifact versions |

## Product Model

```text
Customer
  └── Brand workspace (many per customer)
       ├── Brand profile and shared memory
       ├── Fixed AI CMO
       ├── Five fixed specialist agents
       ├── One direct thread per agent
       ├── Campaigns and delegated tasks
       ├── Approvals
       └── Versioned artifacts and reports
```

## Human Authority

The prototype has one seeded `Owner` user. The Owner may create and edit brand workspaces, chat with agents, start or cancel campaigns, approve or request changes, and inspect or edit all memory in owned workspaces.

“Agent-private” means private from other agents, not hidden from an authorized human Owner. The CMO receives specialist task results and artifact references, but it cannot retrieve another agent's private memory.

Future multi-user roles and administration are out of scope. Public deployment is blocked until real authentication and authorization are implemented.

## Fixed Agent Team and Capability Contract

| Agent | Allowed prototype outcomes | Must not do |
| --- | --- | --- |
| AI CMO | Read brand context; create campaign drafts; validate plans; delegate approved task types; read task results; create the final report | Approve for a human in Manual mode; bypass policy; read specialist-private memory; publish externally |
| Audience Researcher | Synthesize supplied context into a clearly source-labelled research brief | Claim live/current verification; generate media; change brand facts or strategy; delegate to peers; use unrestricted web/browser tools |
| Brand Strategist | Produce positioning, messaging, audience, and creative-brief artifacts | Generate media; publish; change authoritative brand facts; delegate to peers |
| UGC Writer | Produce hooks, scripts, shot lists, and storyboards | Generate/publish media; change brand facts; delegate to peers |
| Media Producer | Produce clearly labelled simulated media from an approved creative package | Change strategy or approved copy; call a real media provider; publish |
| Creative QA | Read campaign artifacts; produce a structured QA result | Publish; silently rewrite approved creative; delegate to peers |

All specialists may create a visible handoff only to the CMO. Peer-to-peer and downward specialist delegation are denied. Only the CMO may create campaign drafts and task plans. Unknown agents, tasks, tools, resource actions, and delegation targets are denied by default.

The prototype agent definitions, prompts, capabilities, hierarchy, and limits are read-only. There are no workspace prompt or capability overrides. A later version may add validated safe settings, but no override may widen authority.

## Prototype Tool Surface

Allowed product tools are intentionally small:

- read scoped brand, campaign, task, and permitted memory context;
- create a typed text or simulated artifact;
- propose an agent-private or shared-brand memory change;
- create one idempotent specialist-to-CMO handoff;
- create or update a campaign draft as the CMO; and
- return structured task, QA, and report results.

Terminal, host filesystem, arbitrary network, browser automation, social publishing, real media generation, and direct database access are disabled. Direct chats are advisory and draft-producing; any multi-agent execution must become a user-started campaign.

Because live web research is disabled, research artifacts must distinguish supplied facts, model assumptions, and items needing external verification. They must not claim current competitor or trend verification.

## Pages

```text
/                                             → Existing Event Classics marketing site
/app                                          → First authorized workspace's CMO chat, otherwise workspace list
/app/workspaces                               → List and create brand workspaces
/app/[workspaceId]/chat/[agentKey]            → Canonical direct conversation with one fixed agent role
/app/[workspaceId]/campaigns                  → Campaign list and approval-attention states
/app/[workspaceId]/campaigns/[campaignId]     → Brief, task graph, artifacts, approval, QA, and report
/app/[workspaceId]/memory                     → Shared memory and user-visible agent-private memory
/app/[workspaceId]/settings                   → Brand profile, default approval mode, read-only team config
```

The `/app` redirect deterministically opens the first authorized workspace ordered by creation time and ID, or `/app/workspaces` when none exists. Remembered-last-workspace behavior is deferred until it has a clear storage and authorization contract.

Authentication routes are excluded from the prototype. The seeded Owner flow is local-only and must not be exposed as a public deployment.

## Navigation

The application uses a persistent left sidebar and compact top bar.

Sidebar order:

1. Brand workspace switcher
2. Fixed agent team, with CMO first
3. Campaigns, with pending-approval count
4. Memory
5. Brand settings

The prototype has one canonical direct thread per workspace-agent pair, so it has no “New conversation” action or hidden conversation-history requirement. Campaign runtime activity remains linked to its task and appears in campaign detail, not as extra direct chats.

## Core User Flows

### Create a Brand Workspace

1. The Owner enters a required brand name and product summary.
2. Audience, voice, approved claims, and restrictions are optional; missing context is shown as an incomplete-profile notice. Approval mode defaults to `Manual` unless the Owner selects `Auto`.
3. The system validates field limits. Routes use opaque workspace IDs; friendly slugs and name-uniqueness rules are deferred.
4. One transaction creates the workspace, brand profile, six agent instances, initial shared-memory records, and six canonical direct threads.
5. The user lands in the new workspace's CMO chat.

If any creation step fails, none of the workspace is visible.

### Chat Directly With an Agent

1. The Owner selects a brand and agent.
2. The system restores the canonical thread for exactly that workspace-agent pair.
3. The user's message is persisted once before a recoverable run is queued.
4. The agent may answer, produce a permitted draft artifact, propose memory, or call an allowed product tool.
5. An out-of-scope or multi-agent request is denied at the action boundary and creates exactly one visible CMO handoff.
6. The CMO reviews the handoff and may answer, ask for clarification, decline it, or create a linked campaign draft.

At most one run is active per agent instance in the prototype. Users may still send messages while an agent is busy; later messages are visibly queued in order. Cancel run cancels only the current attempt and preserves the conversation.

### Specialist-to-CMO Handoff

1. The specialist records the source thread/message, safe summary, reason, requested outcome, and proposed task type.
2. A CMO review run is queued automatically; no campaign work starts yet.
3. The CMO marks the handoff `accepted`, `declined`, `needs_clarification`, or `cancelled`.
4. Acceptance may create a linked `draft` campaign and plan preview.
5. Handoff state and links are projected into both canonical threads.

Handoff creation is idempotent for the source message and target outcome. It never bypasses explicit campaign start or approval policy.

### Start a UGC Campaign

The CMO must have these fields before it can offer a runnable plan:

- product or offer;
- objective;
- target audience;
- channel/platform;
- requested deliverable; and
- call to action.

Duration, supplied asset references, approved claims, and restrictions are optional. Asset references must point to an existing same-workspace artifact or allowlisted demo asset; uploads and arbitrary URLs are not accepted. The CMO asks for missing required information instead of inventing it.

1. The CMO creates a validated campaign draft and plan preview.
2. The workspace approval default is preselected. The Owner may choose `Manual` or `Auto` before starting.
3. Pressing **Start campaign** snapshots the brief, profile version, agent definitions, plan, and approval mode. Chat text alone does not cross this execution boundary in the prototype.
4. No delegated campaign task runs while the campaign is `draft`.
5. Research and strategy run in parallel.
6. The writer produces a versioned UGC script and storyboard after dependencies complete.
7. Preflight validation checks that the creative package exists and satisfies brand restrictions.
8. The `pre_production` approval checkpoint is resolved according to campaign mode.
9. The producer creates a deterministic, clearly labelled simulated-media artifact.
10. Creative QA returns `pass`, `revise`, or `escalate`.
11. A revision may invalidate downstream artifacts and repeat affected tasks, up to two revision cycles.
12. On pass, the CMO creates the final report. After two unsuccessful revision cycles, the campaign becomes `waiting_user` rather than looping forever.

### Approval Contract

The prototype has exactly one checkpoint: `pre_production`.

- It covers the exact script and storyboard artifact IDs, versions, and content hashes.
- `Manual` pauses before simulated production and offers **Approve** or **Request changes**. Feedback is required for changes.
- `Auto` records an auditable automatic decision only after preflight validation passes; it never silently skips the checkpoint.
- A new script/storyboard version supersedes the prior approval, marks affected downstream artifacts stale, and requires a new decision.
- Approval resolution and queueing the newly unblocked task occur in one transaction. A stale or already-resolved decision is rejected.
- Cancelling a campaign is separate from requesting changes.

External publishing and real paid generation are out of scope, so their future approval and cost policies are not part of this checkpoint.

### Campaign Completion and Final Report

A campaign completes only when every mandatory task has completed, no approval is pending, Creative QA has passed, and a final-report artifact exists.

The final CMO report includes:

- objective and snapshotted brief;
- final artifact titles, versions, and links;
- key decisions and rationale;
- approval history;
- QA result and unresolved risks;
- task/agent provenance;
- a clear `Simulation` indicator; and
- measured or simulated usage labelled accurately.

## Memory Contract

| Scope | Purpose | Agent access | Human Owner access |
| --- | --- | --- | --- |
| Brand | Voice, facts, audience, restrictions, approved claims | All agents in that workspace | Inspect, add, edit, archive |
| Agent private | Role-specific preferences and lessons | Only that agent instance | Inspect, edit, approve, archive |
| Conversation | Ordered visible history for one direct thread | That thread's agent and user | Inspect |
| Campaign | Snapshotted brief, decisions, and accepted outputs | Assigned agents receive only relevant slices | Inspect |
| Task | Inputs, dependencies, and execution result | Assigned agent and CMO via structured result | Inspect |

User-authored brand memory is authoritative within its version. Agent-generated shared-memory writes begin as `proposed` and require Owner acceptance; an agent cannot silently change shared brand facts. Agent-private proposals may be activated only through the scoped memory tool and remain reviewable. Memory includes source/provenance, status, revision lineage, and size limits.

Memory and research content are untrusted inputs: they cannot override system policy or tool permissions. The prototype provides no cross-brand copy, lookup, linking, or shared memory. Manually re-entered information becomes a new scoped record with its own provenance.

## Simulation Contract

Simulated media generation is deterministic for a given demo input, emits a short sequence of progress events, and creates a placeholder artifact rather than a playable/generated video. `Simulation` appears in the task, artifact, report, and usage display. No download, share, or publish control is shown.

## Features In Scope

- Multiple isolated brand workspaces per customer
- Automatic creation of the fixed six-agent organization per workspace
- One persistent direct chat with every agent
- Versioned, server-enforced capability and delegation policy
- CMO campaign drafts, explicit campaign start, and durable task delegation
- Visible task dependencies, attempts, handoffs, approvals, and progress
- One exact manual/automatic pre-production approval checkpoint
- Reviewable brand and agent-private memory
- Immutable, versioned artifacts and a final CMO report
- Recoverable runs and deterministic simulated media
- Local-only seeded Owner experience

## Features Out of Scope

- Multiple direct threads or conversation archive/delete UI
- Dynamic hiring, firing, or org-chart editing
- User-created roles or prompt/capability editing
- Real video, image, or voice generation
- Arbitrary shell, filesystem, browser, or network access for agents
- Social publishing integrations
- Recurring automations and scheduled campaigns
- General-purpose project management, issue boards, goals, cases, or pipelines
- Plugin marketplace
- Cross-brand memory copy or sharing
- Production authentication, enterprise SSO, billing, and multi-user administration
- Public deployment
- Permanent workspace deletion and production data-retention workflows
- Vector search before scoped recent/keyword retrieval proves insufficient

## Non-Functional Requirements

- **Isolation:** ID substitution and malformed agent output cannot cross customer/workspace boundaries.
- **Durability:** A persisted message or task always has a recoverable dispatch; restart cannot strand work permanently.
- **Idempotency:** Duplicate message, run, handoff, task-claim, approval, and terminal-event delivery creates one logical result.
- **Security:** Runtime output is untrusted; privileged actions are schema-validated and policy-checked server-side.
- **Accessibility:** Core chat, campaign, approval, memory, drawer, and error recovery flows meet WCAG 2.2 AA keyboard and contrast expectations.
- **Traceability:** Every artifact and decision links to its producing run, agent, inputs, and version.
- **Honesty:** Simulated outputs and usage are never presented as real provider results.
- **Bounded execution:** One active run per agent instance, bounded attempts, two QA revision cycles, and cancellation checks prevent runaway work.

## Proposed Tech Stack

- **Frontend:** Next.js 16.3 App Router, React 19, TypeScript strict
- **UI:** Tailwind CSS 4, existing shadcn/Base UI primitives, Lucide icons
- **Control API:** Next.js route handlers and server-only services
- **Database:** PostgreSQL; client/ORM selected before persistence implementation
- **Agent runtime:** OpenHands Software Agent SDK in a separate private Python service
- **Live updates:** Server-sent events; mutations use normal HTTP/actions
- **Artifacts:** PostgreSQL text/metadata and static simulated assets for the prototype
- **Authentication:** Seeded local Owner only; production provider deferred
- **Topology:** Long-lived local processes/containers; serverless and public hosting are not prototype targets

## Acceptance Criteria

- A seeded Owner can create and switch between at least two brand workspaces without stale or cross-brand data.
- Replacing a workspace ID in a valid URL/API request returns not-found/denied and leaks no entity details.
- Each workspace has exactly one instance and one canonical direct thread for each fixed agent.
- A user can message any agent; busy-agent messages queue in order and never start concurrent runs for that agent.
- An allowed direct draft succeeds; a disallowed action is denied server-side and creates exactly one linked CMO handoff.
- A CMO handoff can create a campaign draft, but no task runs until explicit campaign start.
- Manual and Auto campaigns using the same brief diverge only at `pre_production`; both retain an approval record.
- Approving stale script/storyboard versions is rejected, and a revised creative package supersedes the prior decision.
- Two workers racing for one task produce exactly one successful lease/attempt.
- After worker/application restart, an expired lease is recovered without duplicate logical artifacts or terminal responses.
- A cancelled run/campaign cannot be reactivated by a late runtime event.
- The UGC flow produces traceable research, strategy, script, storyboard, simulated-media, QA, and final-report artifacts.
- Cross-agent private-memory and cross-workspace memory retrieval attempts are denied.
- All Simulation labels, mobile navigation, keyboard flows, focus behavior, loading/empty/error states, and event-stream reconnect behavior are demonstrable.

## Review Decisions Still Needed

These do not block Phase 1 UI review unless noted:

- Final product name
- PostgreSQL client/ORM — required before persistence implementation
- LLM provider/model and credential path — required before OpenHands implementation
- Production authentication provider — required before any public deployment
- First real media provider and object storage — required only for a later real-media phase
