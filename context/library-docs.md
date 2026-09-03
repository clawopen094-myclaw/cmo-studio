<!-- Project-specific library routing. Verify current local/official docs before implementation. -->

# Library Docs

## Before Using a Library

1. Read root `AGENTS.md`.
2. For Next.js, read the relevant guide in `node_modules/next/dist/docs/`; this repository explicitly warns that the installed version has breaking changes.
3. Check the installed package version in `package.json` or the appropriate runtime lockfile.
4. Follow this file's project-specific constraints.
5. Add a library only when the approved build-plan phase needs it.

General training knowledge is not sufficient for changing APIs.

## Next.js 16.3 App Router

Next.js serves the existing marketing site, the `/app` product routes, and the thin control API.

**Project rules:**

- Use the App Router under `src/app`.
- Server Components are the default.
- Route handlers are transport boundaries; call server services for real work.
- Read the installed docs before using caching, route params, metadata, server actions, cookies, middleware, or streaming.
- Preserve `/` and its current metadata/visual behavior when moving it under the `(marketing)` route group.
- Keep the root layout limited to fonts/globals. Put `SmoothScroll` and other marketing providers in `(marketing)/layout.tsx`; a CSS reset inside `/app` cannot undo a root Lenis/provider wrapper.
- Give `/app/layout.tsx` product metadata, native scrolling, normal blending, and product-appropriate scroll anchoring.
- Do not assume older `params`, request-caching, or rendering conventions apply.

## React 19

React renders server-first application screens and focused interactive islands.

**Project rules:**

- Keep state closest to the interaction that owns it.
- Use URL state for selected workspace, agent, campaign, and shareable filters.
- Do not create a global state library for the prototype.
- Avoid effects for state derivation; compute during render or at the event boundary.
- Client optimistic state must reconcile with the authoritative server result.
- Never put secret, authorization, or capability decisions in client context.

## Tailwind CSS 4

Tailwind styles the application through semantic CSS variables.

**Project rules:**

- Tokens are declared in `src/app/globals.css` with `@theme` mappings.
- Use semantic utilities such as `bg-app-surface` and `text-app-ink`; do not use raw palette utilities such as `bg-zinc-100`.
- Do not add `tailwind.config.ts` for colors.
- Follow exact values in `context/ui-tokens.md`.
- App styles must explicitly neutralize remaining global marketing blend rules within the app shell after provider isolation.
- Use `border-app-border-strong` for essential control boundaries; the subtle border is decorative only.

## shadcn and Base UI

Existing primitives provide accessible foundations; they are not a separate design system.

**Project rules:**

- Check `src/components/ui` and `components.json` before generating a primitive.
- Reuse or minimally adapt an existing primitive before adding one.
- Generated primitives must be restyled with CMO Studio tokens.
- Feature-specific composition belongs in `src/features`, not `src/components/ui`.
- Base UI controls retain their keyboard and focus behavior; do not replace it with custom div-based widgets.

## Lucide React

Lucide supplies interface icons.

**Project rules:**

- Default sizes: 16px inside controls, 18px in navigation, 20–24px in empty states.
- Icons inherit `currentColor`.
- Do not use icons as the only label for unfamiliar actions.
- Do not mix icon libraries in `/app`.

## Motion

Motion may provide small product transitions.

**Allowed:**

- Drawer/dialog entrance
- Short message or task-row appearance
- Layout transition when an approval/task state changes

**Not allowed:**

- Decorative page-load choreography
- Continuous movement
- Animations that delay reading or task execution
- Ignoring reduced-motion preferences

Prefer CSS transitions when sufficient.

## GSAP, Lenis, Three.js, Drei, React Three Fiber, Shaders

These libraries belong to the current Event Classics marketing experience.

**Rules:**

- Do not import them into `/app` or CMO Studio feature modules.
- Move marketing-only providers closer to the marketing route if the shared root layout interferes with application scrolling.
- Product screens use native document scrolling.

## PostgreSQL — Planned

PostgreSQL is the proposed source of truth for tenancy, conversations, campaigns, tasks, approvals, memory, runs, events, and artifact metadata.

The client/ORM is deliberately undecided.

**Selection requirements:**

- Works with Next.js server-only code and explicit transactions
- Supports conditional updates/row locking needed for task claims
- Supports composite foreign keys and partial/conditional uniqueness needed for tenant relationships and one-running-run limits
- Supports migrations owned in the repository
- Does not encourage browser-side database access
- Adds minimal operational/code complexity

**Usage rules once selected:**

- One server-only database module
- Parameterized queries only
- Every brand query scopes `customer_id` and `brand_workspace_id`
- Physically store both keys on every brand-owned row and enforce cross-workspace-safe composite foreign keys
- Transactions for workspace/team creation and campaign/task DAG creation
- Transactions for message + queued run, result + artifact + task promotion, and state + outbox writes
- Database constraints enforce uniqueness and idempotency where possible
- `agent_runs` is the durable queue; leases have owner, random token, expiry, attempt, and availability time
- Migrations are the schema source of truth

Update this section with exact API patterns before Build Plan feature 07 begins.

## OpenHands Software Agent SDK — Planned

OpenHands provides agent settings, reasoning/action loops, conversations, tools, events, persistence, and workspace execution.

**Integration pattern:**

```text
Next.js control plane
  → authenticated run envelope
  → separate Python runtime service
  → OpenHands Conversation
  → structured events and TaskResult
```

**Project rules:**

- Use the current Software Agent SDK, not archived V0 backend patterns.
- Store fixed agent configuration as validated data and create agents from settings.
- Preserve one opaque OpenHands conversation ID per canonical direct thread and per logical campaign task.
- PostgreSQL—not the OpenHands transcript—is authoritative for product-visible messages, runs, tasks, approvals, and artifacts.
- Any SDK-native in-process subtask helper remains inside one synchronous run; the product campaign graph, parallel work, retries, and long-running state stay in the application's durable queue.
- Do not use OpenHands filesystem memory as the cross-tenant product memory database.
- Custom tools call the control-plane capability boundary; they do not connect directly to product tables.
- The runtime receives a short-lived opaque run token bound to exact tools/scopes; the control plane stores only its hash and rechecks live authority on each call.
- Runtime events and results are untrusted: validate closed schemas, tenant/run correlation, sequence/idempotency, size, and safe content before persistence.
- Terminal, shell, filesystem, browser, arbitrary HTTP, direct database, and unrestricted network tools are disabled for the prototype.
- The runtime has private persistent conversation storage for local restart, no host mount, and network access only to the selected LLM and control-plane endpoints.
- Keep deterministic mock mode so capability, queue, approval, and UI tests do not depend on model wording.

Before Phase 3, verify the official pages for architecture, agent settings, task delegation, persistence, memory, security, custom tools, workspaces, and Agent Server.

## Media Provider and Object Storage — Deferred

No provider is selected.

Until selection:

- Use deterministic simulated generation jobs and static placeholder artifacts.
- Do not create `external_jobs`, webhook, upload, or object-storage code in the prototype.
- Keep the product-level tool name and result shape focused on the user outcome, not a guessed provider API.
- Do not create a generic provider abstraction with no implementation.
- Select the first provider based on required UGC capabilities, API maturity, async callbacks, pricing, content policy, and commercial rights.
- Extract a provider interface only when a second implementation is actually needed.

Before enabling a real provider, extend this document with verified APIs for idempotency, cost estimation/reservation, callbacks or polling, authentication, cancellation, late-result reconciliation, upload/download validation, commercial rights, and retention.
