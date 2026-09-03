<!-- Canonical inventory and promotion rules for CMO Studio product UI. -->

# UI Registry

## Purpose

This file prevents parallel versions of the same product pattern. It records what exists, what is approved for `/app`, and the intended ownership of not-yet-built components. It is not permission to scaffold every planned component early.

The reviewed AI Flow frontend informs the neutral shadcn-style component language, route-local composition, and typed registry pattern. Paperclip supplies the structuralist primitives (button, card, badge, status indicators). Source files are not copied.

## Status Definitions

| Status | Meaning |
| --- | --- |
| `Approved` | Exists, follows `ui-tokens.md`, and passed interaction/accessibility review |
| `Audit required` | Exists in the repository but is not yet approved for product use |
| `Planned contract` | A responsibility needed by an approved build phase; no file is claimed to exist |
| `Marketing only` | Must not be imported by the `/app` route tree |

Only real files receive a file path. When a planned component is implemented and reviewed, replace its planned entry with the exact canonical path and final variant contract.

## Mandatory Reuse and Promotion Rule

1. Search this registry, `src/components/ui`, the owning feature, and route-local `_components` before creating UI.
2. Reuse the registered owner when semantics match.
3. A pattern used once stays route-local and specific.
4. **The second semantic use is the promotion point:** move one implementation to the nearest common owner, migrate every caller in the same change, and delete all copies.
5. Update this registry after the shared implementation is visually and accessibly verified.

The second-use rule includes repeated JSX structures, interaction state, keyboard behavior, Tailwind class recipes, form-field shells, dialog framing, error/empty presentation, and status label/icon/tone mapping. Two near-identical components with different names are still duplication.

Do not extract merely coincidental visuals with different domain behavior. Prefer a small explicit domain component over a universal component with many booleans or arbitrary style overrides.

## Ownership Levels

| Location | Owns | Promotion trigger |
| --- | --- | --- |
| `src/app/**/_components` | Composition used by one route | A second route needs the same semantic pattern |
| `src/features/<domain>` | Reusable product behavior within one domain | A second domain needs the same behavior without domain policy |
| `src/components/ui` | Domain-neutral visual/accessibility primitives | Already proven across domains |
| `src/lib` or domain module | Pure descriptors, formatters, and typed registries | Non-React callers or multiple features need the same rule |

Pages compose data and components. Primitives own styling and accessibility. Feature components own product semantics. Business rules do not live in UI components.

## Current Repository Inventory

| Export | File | Status | Product decision |
| --- | --- | --- | --- |
| `Button`, `buttonVariants` | `src/components/ui/button.tsx` | Approved | Single CVA owner. Six variants (default/secondary/outline/ghost/destructive/link) and five sizes (default/sm/lg/icon/icon-sm). All call sites select semantic variants. |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `src/components/ui/card.tsx` | Approved | Flat bordered surface. Composition only — no domain status. |
| `Badge`, `badgeVariants` | `src/components/ui/badge.tsx` | Approved | Compact neutral label. Domain states route through `StatusIndicator`. |
| `Input` | `src/components/ui/input.tsx` | Approved | Always used through `FormField`. |
| `Textarea` | `src/components/ui/textarea.tsx` | Approved | Always used through `FormField`. Auto-grow is per-call site (chat composer). |
| `Label` | `src/components/ui/label.tsx` | Approved | Persistent visible label. |
| `FormField` | `src/components/ui/form-field.tsx` | Approved | Stable IDs for label/control/description/error and `aria-invalid` context. |
| `Select` | `src/components/ui/select.tsx` | Approved | Self-contained popover with keyboard + click-outside. Used through `FormField`. |
| `Dialog`, `ConfirmDialog` | `src/components/ui/dialog.tsx` | Approved | Self-contained focus trap and Escape restore. ConfirmDialog used for destructive confirmations. |
| `Separator` | `src/components/ui/separator.tsx` | Approved | Decorative by default; upgradeable via `role`. |
| `EmptyState` | `src/components/ui/empty-state.tsx` | Approved | Empty region explanation + one next action. |
| `Skeleton` | `src/components/ui/skeleton.tsx` | Approved | Geometry-known loading placeholder. Reduced-motion honored at root CSS. |
| `StatusIndicator` | `src/components/ui/status-indicator.tsx` | Approved | Renders one StatusDescriptor. Loader2 spin on running/sending/queued. |
| `ThemeProvider`, `ThemeSelector`, `useTheme` | `src/components/ui/theme-selector.tsx` | Approved | Resolves System before paint; `.cmo-app` owns `data-theme`. |
| `cn`, `formatRelative`, `makeId`, `fingerprint`, `sentenceCase` | `src/lib/utils.ts` | Approved | Canonical composition + formatters. Never recreate. |
| Typed descriptor registries | `src/features/agents/status.tsx` | Approved | One owner per status family: campaign, task, run, approval, handoff, artifact, memory, message. |
| `AppShell` (sidebar + top bar + mobile nav) | `src/features/agents/app-shell.tsx` | Approved | 280px desktop sidebar, 56px top bar, mobile drawer. No marketing code. |
| `WorkspaceSwitcher` | `src/features/workspaces/workspace-switcher.tsx` | Approved | Self-contained popover, no foreign ID retention, dedicated create flow. |
| `ArtifactCard` | `src/features/artifacts/artifact-card.tsx` | Approved | Type, version, status, simulation label; no download/share/publish. |
| `AgentHeader` | `src/features/agents/.../agent-header.tsx` | Approved | Capability/limitation summary + details panel. |
| `ChatPanel` | `src/features/agents/.../chat-panel.tsx` | Approved | Optimistic + queued + deterministic responder wiring. |
| `ChatThread` | `src/features/agents/.../chat-thread.tsx` | Approved | Accessible ordered projection of typed message cards. |
| `ChatComposer` | `src/features/agents/.../chat-composer.tsx` | Approved | IME-safe Enter, Shift+Enter newline, Cancel run. |
| `HandoffCard` | `src/features/agents/.../handoff-card.tsx` | Approved | Single visible specialist→CMO escalation. |
| `CampaignTaskFlow` | `src/features/agents/.../campaign-task-flow.tsx` | Approved | Fixed UGC task flow with revisions + "Blocked by …" text. |
| `ApprovalCard` | `src/features/agents/.../approval-card.tsx` | Approved | Version-bound Manual decision; feedback required for changes. |
| `FinalReportView` | `src/features/agents/.../final-report-view.tsx` | Approved | Versioned final CMO report + Simulation indicator. |

## Planned Foundation Contracts

All planned primitives have now landed as Approved primitives. New shared UI should be added only when a real repeated need appears.

| Component | Responsibility | Status |
| --- | --- | --- |
| `Card` | Flat bordered object surface | Approved |
| `FormField` | Label, control slot, description, error | Approved |
| `Input` | Single-line text entry | Approved |
| `Textarea` | Multiline entry | Approved |
| `Select` | Closed option choice | Approved |
| `Dialog` | Focused decision/confirmation | Approved |
| `Tooltip` | Supplemental control explanation | Planned contract — add only when an icon-only control truly needs one |
| `Badge` | Compact neutral label | Approved |
| `Skeleton` | Geometry-known loading placeholder | Approved |
| `Separator` | Semantic/decorative division | Approved |

## Planned Cross-Product Patterns

| Component | Responsibility | Status |
| --- | --- | --- |
| `AppShell` | 280px desktop sidebar, 56px header, mobile drawer, scoped theme | Approved |
| `AppHeader` | Page context, Simulation/runtime state, theme, Owner menu | Approved (folded into `AppShell`) |
| `AppSidebar` | Fixed labelled agent/workspace navigation | Approved (folded into `AppShell`) |
| `ThemeSelector` | Dark/Light/System preference | Approved |
| `WorkspaceSwitcher` | Select current brand + link to dedicated create flow | Approved |
| `PageHeader` | Page title, description, primary/secondary actions | Planned contract — page-level so far; promote on second use |
| `StatusIndicator` | Text/icon/tone display from a typed descriptor | Approved |
| `EmptyState` | Empty-region explanation + one next action | Approved |
| `AsyncErrorState` | Safe error copy, Retry, navigation recovery | Planned contract — add when a real error boundary needs it |
| `SimulationNotice` | Consistent simulated-runtime disclosure | Approved (badge in top bar; per-artifact label in `ArtifactCard` and `FinalReportView`) |

## Planned Feature Components

### Workspace and Agent

| Component | Responsibility | Status |
| --- | --- | --- |
| `WorkspaceCreateForm` | Validate/create one isolated brand workspace while preserving failed input | Approved (`workspaces/_components/create-workspace-form.tsx`) |
| `BrandSettingsForm` | Explicit profile/default-approval Save and Cancel | Approved (`settings/_components/settings-brand-form.tsx`) |
| `AgentNavItem` | Agent identity, role, current run label, selected state | Approved (rendered inline in `AppShell`) |
| `AgentHeader` | Agent role, capability/limitation summary, run controls | Approved |
| `CapabilityNotice` | Allowed/denied outcome and safe next action | Approved (rendered as the capability-denied card in `ChatThread`) |

### Chat and Handoff

| Component | Responsibility | Status |
| --- | --- | --- |
| `ChatThread` | Accessible ordered projection of the canonical thread | Approved |
| `ChatComposer` | Multiline IME-safe Send, Queue, Cancel | Approved |
| `NewMessagesControl` | Preserve reading position and return to latest content | Planned contract |
| `RunProgress` | Product-safe named stages and cancellation state | Planned contract — typed `run_progress` message card and `MESSAGE_STATUS.queued/running` already render |
| `HandoffCard` | One visible specialist-to-CMO escalation | Approved |

### Campaign, Approval, and Artifact

| Component | Responsibility | Status |
| --- | --- | --- |
| `CampaignPlanCard` | Draft brief, fixed workflow preview, approval mode, Start action | Planned contract — current prototype exposes the snapshotted brief on the detail page; the typed start form is a Phase 1.04 stretch |
| `ApprovalModeSelector` | Explain/select Manual or Auto before campaign start | Approved (folded into `BrandSettingsForm` and `WorkspaceCreateForm`) |
| `CampaignList` | Status/mode filters and compact responsive campaign rows | Approved (`campaigns/page.tsx`) |
| `CampaignTaskFlow` | Fixed ordered/branched dependency presentation in logical DOM order | Approved |
| `TaskCard` | Task owner/state, attempts, inputs, output, next action, artifacts | Approved (rendered inside `CampaignTaskFlow`) |
| `ApprovalCard` | Version-bound Manual decision or Auto checkpoint history | Approved |
| `ArtifactCard` | Typed deliverable, version, provenance, state, Simulation label | Approved |
| `StoryboardShots` | Ordered shot presentation for storyboard artifacts | Planned contract |
| `RunActivityPanel` | Optional structured/redacted task and run milestones | Planned contract |
| `FinalReportView` | Persisted final CMO report sections and provenance | Approved |

### Memory

| Component | Responsibility | Status |
| --- | --- | --- |
| `MemoryScopeTabs` | Shared brand versus selected agent-private scope | Approved (rendered in `memory/page.tsx`) |
| `MemoryList` | Scoped memory records, provenance, version, review state | Approved (rendered in `memory/page.tsx`) |
| `MemoryEditor` | Explicit versioned edit and proposal decision | Planned contract |

## Typed Descriptor Registries

Closed UI state families must use one exhaustive typed descriptor registry per domain. A registry entry owns the visible label, semantic tone, Lucide icon key, priority/order, and live-region behavior where applicable.

Initial campaign/task concepts include:

```text
draft
queued
ready
running
waiting_approval
needs_input
blocked
completed
failed
cancelled
stale
superseded
```

This list is a contract input, not permission to invent database states. The implementation derives keys from approved domain state types and fails typecheck when a state lacks a descriptor. `TaskCard`, `CampaignList`, `ApprovalCard`, chat activity, and filters consume the same appropriate descriptor owner; they never implement their own status switch.

`src/features/agents/status.tsx` implements one descriptor owner per family: `CAMPAIGN_STATUS`, `TASK_STATUS`, `RUN_STATUS`, `APPROVAL_STATUS`, `HANDOFF_STATUS`, `ARTIFACT_STATUS`, `MEMORY_STATUS`, `MESSAGE_STATUS`. Adding a new state requires extending the union in `contracts/types.ts` and the matching registry here.

## Variant Rules

- A primitive has one CVA/typed variant authority.
- Call sites select semantic variants; they do not paste the registered base class recipe.
- `className` may adjust layout placement, not replace colors, focus, disabled state, radius, or control sizing.
- If the same layout override appears twice, promote it to a named variant or shared composition.
- Domain state is not encoded as an arbitrary visual variant string; resolve it through the typed descriptor registry.
- Do not create `CompactCard`, `DarkCard`, `StatusBadge2`, or similarly forked near-copies.

## Registration Checklist

Before changing a planned entry to `Approved`, verify:

- exact canonical file/export and no duplicate implementation;
- both Dark and Light themes using only registered tokens;
- keyboard, focus, screen-reader name/description, and reduced-motion behavior;
- loading, disabled, invalid, error, and long-content states that apply;
- 320px reflow, 200% zoom, and 44px coarse-pointer targets;
- one focused component test for non-trivial interaction; and
- at least two real callers when the component was promoted because of reuse.

Record only stable variants. Temporary experiments stay route-local and are removed if rejected.