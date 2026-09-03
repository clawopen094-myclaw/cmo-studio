# CMO Studio

Multi-brand AI marketing workspace. Each customer can own multiple isolated brand workspaces. Every brand workspace receives the same predefined AI CMO and specialist team.

> **Phase 1 UI prototype.** Deterministic mock-runtime fixtures drive every screen; backend, persistence, and OpenHands runtime are deferred per `context/build-plan.md`.

## What's built

- **Marketing/product route isolation** — `/` and `/app` are independent route groups; marketing providers stay out of the product shell.
- **App shell** — 280px desktop sidebar, 56px top bar, mobile drawer, theme selector (Dark/Light/System), workspace switcher, Simulation label.
- **Workspace management** — list, create form (with field limits and preserved input on error), brand settings (profile + default approval + read-only fixed-team summary).
- **Direct chat with every agent** — one canonical thread per (workspace, agent), IME-safe composer, deterministic responses from the mock runtime, typed message cards for text / artifact reference / capability denial / handoff / queued / run progress / error.
- **Capability policy** — typed regex/decision table denies media generation in direct chat and CMO self-approval in Manual mode; a denial produces one and only one linked CMO handoff.
- **Campaigns** — list, detail, fixed `ugc_video_v1` workflow rendering (audience research → brand strategy → creative package → simulated production → creative QA → final report) with explicit "Blocked by …" text, revisions, and stale/superseded artifact history.
- **Manual pre-production approval** — version-bound subject set (script + storyboard with sha256), Approve or Request changes (feedback required), read-only superseded history.
- **Artifacts** — typed, versioned, with provenance, simulation label, and no download/share/play-as-video/publish controls.
- **Memory** — shared brand memory vs per-agent private memory, Owner visibility note, status indicators for proposed/active/rejected/archived.

## Project layout

```text
src/
├── app/
│   ├── (marketing)/            # Placeholder Event Classics homepage
│   ├── app/                    # Product shell + routes
│   │   ├── workspaces/
│   │   ├── [workspaceId]/
│   │   │   ├── chat/[agentKey]/
│   │   │   ├── campaigns/[campaignId]/
│   │   │   ├── memory/
│   │   │   └── settings/
│   │   └── ...
│   ├── api/                    # Placeholder for Phase 2
│   ├── globals.css             # .cmo-app dark-first token map
│   └── layout.tsx              # Root layout (fonts + globals only)
├── components/ui/              # Approved primitives (Button, Card, ...)
├── features/                   # Domain composition (app-shell, status, ...)
│   ├── agents/
│   ├── artifacts/
│   └── workspaces/
├── server/
│   ├── catalog/                # Fixed agent catalog + workflow template
│   └── mock-runtime/           # Capability policy + responder + in-memory store
├── contracts/                  # Domain types and boundary limits
├── fixtures/                   # Canonical demo fixtures
└── lib/                        # cn, formatters, helpers
context/                        # The nine-file context set (authoritative spec)
```

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000> for the marketing placeholder, or <http://localhost:3000/app> to land in the first workspace's CMO chat.

## What is NOT in this prototype

- Real PostgreSQL persistence (use the in-memory store in `src/server/mock-runtime/store.ts`; restart wipes runtime-created messages).
- Real LLM calls (the mock runtime produces templated responses and may deny video/image generation in direct chat).
- Real media generation (simulated media is a placeholder artifact, clearly labelled).
- Production authentication (single local Owner; do not expose publicly).
- SSE updates (mutations trigger a server action + `router.refresh()`; Phase 2.09 adds SSE).

## How to extend

- Add a new state → extend the union in `src/contracts/types.ts`, add a descriptor in `src/features/agents/status.tsx`, and consume it via `<StatusIndicator descriptor={...} />`.
- Add a new agent → extend `AGENT_CATALOG` in `src/server/catalog/agents.ts` and add to `AGENT_ORDER` in `src/contracts/types.ts`.
- Add a new surface route → add a folder under `src/app/app/[workspaceId]/`, fetch through a server-only helper in `src/server/mock-runtime/store.ts`, and update `ui-registry.md` when a shared primitive is added or promoted.

## Context set

The authoritative product spec is the nine-file context set in `context/`:

- `project-overview.md` — product model, terminology, capability contract
- `architecture.md` — sources of truth, layers, data flows
- `build-plan.md` — phased implementation plan with explicit gates
- `code-standards.md` — engineering mindset, reuse rule, security/UI/testing minimums
- `library-docs.md` — project-specific library rules
- `progress-tracker.md` — live project state (last updated 2026-09-03)
- `ui-tokens.md` — design tokens (colors, typography, layout, radius, motion)
- `ui-rules.md` — UI behavior, composition, accessibility, anti-patterns
- `ui-registry.md` — component inventory and promotion rules

Update these files when architecture, design tokens, or the component inventory changes — they are the source of truth.