# OpenHands runtime service (skeleton)

Phase 3 ships a Python service that exposes a private HTTP boundary:

```
POST /runtime/start        { runId, agentKey, contextEnvelope, toolToken, configDigest }
POST /runtime/{id}/resume   → { accepted }
POST /runtime/{id}/cancel   → { accepted }
GET  /runtime/{id}/events   → SSE: progress | tool_call | result | error
```

The service runs separately from the Next.js process and authenticates the
control plane via a static server-to-server secret (`OPENHANDS_RUNTIME_SECRET`).
Each run receives a short-lived opaque bearer token bound to the run; only
the hash is stored server-side.

This folder holds the Python source for that service. The prototype ships
the typed contract (`src/server/runtime/openhands.ts`) and a mock client
(`createMockRuntimeClient`) so the rest of the product can run without
the Python service while Phase 3 is finalized.

When the real Python service lands, it will:

- Use the current OpenHands Software Agent SDK (not the V0 backend).
- Persist conversation state to a private durable volume.
- Validate every emitted event against the closed schemas.
- Stream back over SSE with per-event sequence IDs.

Until then, the runtime boundary in `src/server/runtime/openhands.ts` is
the seam a future implementation can plug into without changing route
handlers or the durable queue.