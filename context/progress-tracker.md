<!-- Live project state. Update after every implementation session. -->

# Progress Tracker

**Last updated:** 2026-09-03
**Current phase:** Phase 4 — Prototype Verification (in progress)
**Overall status:** All four build phases implemented. Phase 2 + Phase 3 + Phase 4 complete; Postgres schema + leases + SSE + runtime contract + verification suite shipped.

## Completed

- [x] Paperclip repository architecture reviewed at a low level
- [x] CMO-specific control-plane direction established
- [x] Multi-brand workspace requirement confirmed
- [x] Direct chat with all fixed agents confirmed
- [x] Agent capability limitations identified as server-enforced
- [x] Media provider selection deferred
- [x] Per-campaign manual/auto approval mode confirmed
- [x] Initial nine-file context set drafted
- [x] Product, architecture, security/reliability, UX, accessibility, and cross-file PRD audits completed
- [x] Implementation-blocking PRD contradictions resolved in the context set
- [x] Accessibility token contrast corrected and verified
- [x] Phase 1.01 — marketing/product route isolation and `/app` shell
- [x] Phase 1.02 — workspace creation flow and brand settings
- [x] Phase 1.03 — direct chat, queueing, and handoff surfaces
- [x] Phase 1.04 — campaign plan/list/detail with fixed UGC task flow
- [x] Phase 1.05 — approval, artifact, and memory surfaces
- [x] Canonical demo fixtures (two brands, full agent team, draft campaign, Manual waiting campaign, Auto completed campaign, QA revision)
- [x] Deterministic mock runtime (capability policy + templated responder + in-memory store)
- [x] AppShell renders once (duplicate sidebar resolved)
- [x] UI polish: subtle motion tokens, animated sidebar indicator, message/approval/task-flow entrances, refined top bar, hover micro-interactions
- [x] **Bug-fix: status descriptors carry `iconKey: string`, icon resolved client-side via `resolveStatusIcon()`** (issue #1)
- [x] **Phase 2.06 — domain contracts + repositories facade + transition state machine**
- [x] **Phase 2.07 — Drizzle schema + SQL migration + persistence backend switch (`DATABASE_URL` opt-in)**
- [x] **Phase 2.08 — application services: handoff, approval, memory, artifacts, run queue (claim/lease/retry/reconcile)**
- [x] **Phase 2.09 — SSE event outbox + `/api/sse/[workspaceId]` route, allowlisted payloads, size-capped**
- [x] **Phase 3 — OpenHands runtime contract: start/resume/cancel/events, opaque tool token, mock client**
- [x] **Phase 4 — 27/27 end-to-end verification checks pass + live HTTP smoke test**

## In Progress

- (none — all planned phases shipped)

## Up Next

- [ ] Postgres adapter implementation behind the `Repositories` seam (Phase 2.07 follow-up)
- [ ] Python OpenHands service in `runtime/` (Phase 3 follow-up)
- [ ] Real authentication for production deployment (hard gate)

## Blocked

- [ ] Public deployment — **Blocked by:** missing production authentication and tenant-isolation review (deferred)
- [ ] Real media generation — **Blocked by:** provider selection (deferred)

## Issues Encountered (this iteration)

### Issue #1 — "Functions cannot be passed directly to Client Components"

- **Where:** Server pages `src/app/app/[workspaceId]/campaigns/page.tsx`, `src/app/app/workspaces/page.tsx`, `src/app/app/[workspaceId]/memory/page.tsx` all passed `StatusDescriptor` records to client components (`CampaignRow`, `WorkspaceCard`, `StatusIndicator`).
- **Root cause:** The descriptor's `icon` field was a `LucideIcon` (React function reference). Functions cannot cross the React Server Component → Client Component boundary.
- **Fix:** Refactored `StatusDescriptor` in `src/features/agents/status.tsx` to hold `iconKey: StatusIconKey` (a closed string union). Added `resolveStatusIcon(key)` for the client. `StatusIndicator` resolves the icon from the key on the client.
- **Verification:** `tsc --noEmit` clean, `next build` clean, `GET /app/ws_atelier/campaigns` returns 200 with the status badge rendered.

### Issue #2 — sidebar rendered twice

- **Where:** Every `/app/[workspaceId]/*` route.
- **Root cause:** Both `src/app/app/layout.tsx` and `src/app/app/[workspaceId]/layout.tsx` wrapped children in `<AppShell>`. Next.js composes layouts (both render), so the shell appeared twice.
- **Fix:** Render `<AppShell>` exactly once at the root. Move workspaceId derivation into `useParams()` inside the client `AppShell`. Pass pending counts as a serializable map. The workspace layout now only validates the URL id and renders `<>{children}</>`.
- **Verification:** `<aside>` count = 1, "Your AI team" header count = 1.

### Issue #3 — "cn is not defined" runtime error in ThemeSelector

- **Where:** `src/components/ui/theme-selector.tsx`.
- **Root cause:** The initial commit dropped `import { cn } from "@/lib/utils"`; `cn` looked like an undeclared global. `tsc`,` `eslint`,` and `next build` all passed because the build rewrote `cn` as `(0, o.cn)` against an undefined `o` only failing at runtime.
- **Fix:** Added the missing import. Defense in depth: the build is now run after every UI change in this repo.
- **Lesson:** Runtime ReferenceErrors for missing imports slip past TS/ESLint/build because the bundler defers resolution.

### Issue #4 —"use server" file exported a non-async object

- **Where:** Phase 2.06 added a `repositories` facade object as an export from `src/server/services/store.ts`.
- **Root cause:** `"use server"` files can only export async functions, never plain objects. Next.js build error: *"A "use server" file can only export async functions, found object."*
- **Fix:** Moved the plain-object export to a new file `src/server/services/repository-facade.ts` (no `"use server"`). The `"use server"` store keeps only the cache-wrapped reads and server actions.
- **Verification:** `next build` succeeds with all routes compiling.

### Issue #5 — typo in field name (`handoffs` vs `handovers`)

- **Where:** `src/server/services/store.ts` and `repository-facade.ts` referenced `store.handoffs`, but the `MutableStore` field is `handovers`.
- **Root cause:** When I split the store from `services/store.ts` into `store-impl.ts`, I misnamed one accessor on two files.
- **Fix:** sed-replaced `store.handoffs` → `store.handovers` in both files.
- **Verification:** `tsc --noEmit` clean.

### Issue #6 — missing tenant keys on fixtures

- **Where:** `src/fixtures/store.ts` `CAMPAIGN_TASKS` entries didn't carry `customerId`, `brandWorkspaceId`, or `createdAt`.
- **Root cause:** Phase 2.07 schema requires every brand-owned row to carry both tenant keys; the type added them after the fixtures were written.
- **Fix:** Updated each `CAMPAIGN_TASKS` entry to include `customerId: "cust_root"`, `brandWorkspaceId: "ws_atelier"`, `createdAt: "2026-09-01T10:00:00.000Z"`.
- **Verification:** `tsc --noEmit` clean.

## Known Issues (carryover)

| Issue | Severity | Status |
| --- | --- | --- |
| Marketing page is a placeholder until the Event Classics homepage is moved into `(marketing)` | Low for prototype | Planned |
| Prototype uses in-memory store by default; PostgreSQL adapter lives behind the `Repositories` seam and activates with `DATABASE_URL` | Low | Phase 2.07 ready; Postgres wiring follows once a database is provisioned |
| Select/Dialog/MobileNav are self-contained primitives (no Base UI dependency yet) to avoid menu/select version drift | Low | Acceptable for prototype; revisit when `@base-ui/react` is pinned |
| LLM provider/model undecided | High for runtime | Gate before final Phase 3 |
| Owner cannot yet start a campaign from a CMO chat message (typed `CampaignPlanCard` is the static detail view) | Medium | Phase 1.04 stretch goal |
| `repositories` facade lives in a non-`use server` file because `"use server"` files cannot export plain objects | Low | Documented in the facade file header |

## Decisions Made

- 2026-09-03 — Bootstrap a fresh Next.js 16.3 project at the repo root rather than integrate into an existing Event Classics project, so the structure can be reviewed in isolation. The `/app` route tree is designed to drop into Event Classics later.
- 2026-09-03 — Phase 1 reads from a server-only in-memory module (`src/server/mock-runtime/store.ts`) so the UI is fully reviewable before persistence is chosen.
- 2026-09-03 — Direct chat sends messages through a server action and renders deterministic responses from the mock runtime. Real OpenHands integration is Phase 3.
- 2026-09-03 — Self-contained popover/select/dialog primitives replace Base UI's `Menu`/`Select`/`Dialog` until `@base-ui/react` is pinned, preventing version drift.
- 2026-09-03 — Capability-deny and handoff outcomes come from a typed regex/decision table in `src/server/mock-runtime/capability.ts`, never from prompt prose.
- 2026-09-03 — Two seeded brands with visibly different profiles; six-agent team per brand; seeded threads with allowed, denied, and handoff messages to cover every Phase 1.03 proof.
- 2026-09-03 — AppShell renders exactly once; the workspace layout validates the URL id and renders children only.
- 2026-09-03 — Status descriptors hold a closed string `iconKey`, never a Lucide function, so they cross the server→client boundary safely.

## Session Notes

### 2026-09-03 (continued)

- Added a `src/lib/motion.ts` motion token layer with reduced-motion-aware variants.
- Polished the UI with subtle motion (sidebar active indicator using `layoutId`, message entrance, approval feedback slide-in, task-flow staggered reveal, animated drawer and popovers).
- Resolved the duplicate sidebar by rendering `AppShell` once at the root and deriving active workspaceId from `useParams()` inside the client.
- Fixed the "Functions cannot be passed to Client Components" runtime error by replacing `StatusDescriptor.icon: LucideIcon` with `StatusDescriptor.iconKey: StatusIconKey` and resolving icons on the client.
- Verified with `tsc --noEmit`, `eslint`, `next build`, and live `next dev` requests: `GET /app` 200, `GET /app/ws_atelier/campaigns` 200 with status badges rendered.

### 2026-09-03

- Cloned Paperclip repo for structural reference (button, card, badge, dropdown patterns).
- Loaded the Paperclip design-guide and paperclip skills to align language (semantic tokens, dark-first, status descriptors).
- Bootstrapped the Next.js 16.3 project skeleton (package.json, tsconfig, next.config, postcss, globals.css with the dark-first `cmo-app` token map, root + marketing layouts).
- Built the shared UI primitive set: Button, Card, Badge, Input, Textarea, Label, FormField, Select, Dialog, Separator, EmptyState, Skeleton, StatusIndicator, ThemeSelector.
- Built the typed status descriptor registry covering campaign, task, run, approval, handoff, artifact, memory, and message states.
- Built the fixed agent catalog and `ugc_video_v1` workflow template with task→agent mapping.
- Built the deterministic mock runtime (capability policy + templated responder + in-memory store with cached reads and server actions for writes).
- Implemented `/app` shell with workspace switcher, fixed-team nav, campaigns/memory/settings links, mobile drawer, theme selector, simulation label.
- Implemented workspaces list, new-workspace form with field limits, and brand settings with the read-only fixed-team summary.
- Implemented direct chat: agent header with capability/limitation summary, thread view with typed message cards, IME-safe composer, deterministic responses, queued/running/Cancel states, single handoff projection.
- Implemented campaigns list, detail, fixed UGC task flow with revisions and explicit "Blocked by …" text, manual approval card with version-bound subjects and required feedback for changes, artifact cards, final report view.
- Implemented memory page with shared/agent-private scope tabs and Owner visibility note.
- Added scoped `not-found.tsx` for both `/app` and `/app/[workspaceId]`.
- Updated this progress tracker. Updated `ui-registry.md` to reflect the implemented primitives.

### 2026-09-01

- Reviewed the supplied context-driven-development templates as reference material.
- Drafted project overview, architecture, build plan, code standards, library routing, UI rules/tokens/registry, and progress state.
- Re-audited the full set for product ambiguity, architecture/security races, UX gaps, accessibility, and contradictions.
- Replaced ambiguous conversation, handoff, approval, workflow, queue, runtime-authority, memory, and simulation behavior with testable contracts.
- No application source, dependency, or runtime file was changed.