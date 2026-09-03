<!-- Live project state. Update after every implementation session. -->

# Progress Tracker

**Last updated:** 2026-09-03
**Current phase:** Phase 1 — Complete Visible Prototype
**Overall status:** Phase 1 UI prototype implemented against deterministic mock-runtime fixtures. Backend / persistence / OpenHands deferred.

## Completed

- [x] Paperclip repository architecture reviewed at a low level
- [x] CMO-specific control-plane direction established
- [x] Multi-brand workspace requirement confirmed
- [x] Direct chat with all fixed agents confirmed
- [x] Agent capability limitations identified as server-enforced
- [x] Media provider selection deferred
- [x] Per-campaign manual/auto approval requirement confirmed
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

## In Progress

- [ ] Wire the Owner flow's CMO chat → campaign draft → Start action end-to-end (typed `CampaignPlanCard` form still lives only as a static detail view; creating a campaign from a CMO message is a Phase 1.04 stretch)
- [ ] Light browser verification on the built surfaces

## Up Next

- [ ] Phase 2.06 — domain contracts + fixed catalog + deny-by-default policy (catalog already present; schemas & transitions to be tightened)
- [ ] Phase 2.07 — PostgreSQL persistence and recoverable run queue
- [ ] Phase 2.08 — application services for handoff, approval, memory, artifacts
- [ ] Phase 2.09 — API and SSE wire-up
- [ ] Phase 3 — OpenHands runtime bridge

## Blocked

- [ ] Public deployment — **Blocked by:** missing production authentication and tenant-isolation review (deferred)
- [ ] Real media generation — **Blocked by:** provider selection (deferred)

## Known Issues

| Issue | Severity | Status |
| --- | --- | --- |
| Marketing page is a placeholder until the Event Classics homepage is moved into `(marketing)` | Low for prototype | Planned |
| Prototype uses in-memory store; restart wipes messages/campaigns created at runtime | Medium | Documented; Phase 2.07 replaces it |
| Select/Dialog/MobileNav are self-contained primitives (no Base UI dependency yet) to avoid menu/select version drift | Low | Acceptable for prototype; revisit when `@base-ui/react` is pinned |
| PostgreSQL client/ORM undecided | Medium | Decide before feature 07 |
| LLM provider/model undecided | High for runtime | Gate before feature 10 |
| Owner cannot yet start a campaign from a CMO chat message (typed `CampaignPlanCard` is the static detail view) | Medium | Phase 1.04 stretch goal |

## Decisions Made

- 2026-09-03 — Bootstrap a fresh Next.js 16.3 project at the repo root rather than integrate into an existing Event Classics project, so the structure can be reviewed in isolation. The `/app` route tree is designed to drop into Event Classics later.
- 2026-09-03 — Phase 1 reads from a server-only in-memory module (`src/server/mock-runtime/store.ts`) so the UI is fully reviewable before persistence is chosen.
- 2026-09-03 — Direct chat sends messages through a server action and renders deterministic responses from the mock runtime. Real OpenHands integration is Phase 3.
- 2026-09-03 — Self-contained popover/select/dialog primitives replace Base UI's `Menu`/`Select`/`Dialog` until `@base-ui/react` is pinned, preventing version drift.
- 2026-09-03 — Capability-deny and handoff outcomes come from a typed regex/decision table in `src/server/mock-runtime/capability.ts`, never from prompt prose.
- 2026-09-03 — Two seeded brands with visibly different profiles; six-agent team per brand; seeded threads with allowed, denied, and handoff messages to cover every Phase 1.03 proof.

## Session Notes

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