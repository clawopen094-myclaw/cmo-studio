/**
 * OpenHands runtime contract. Phase 3 ships the boundary + typed events
 * without spinning up the real Python service; the prototype continues
 * to use the mock runtime in `src/server/mock-runtime/respond.ts`.
 *
 * The interface mirrors what the Python service exposes over its private
 * HTTP boundary:
 *
 *   POST /runtime/start        → { conversationId }
 *   POST /runtime/{id}/resume   → { accepted }
 *   POST /runtime/{id}/cancel   → { accepted }
 *   GET  /runtime/{id}/events   → SSE: { type: "progress" | "result" | "error" ... }
 *
 * Authentication is two-sided:
 *   1. Control plane → runtime uses a static server secret.
 *   2. Runtime → product tools uses a short-lived opaque bearer token
 *      derived from `agent_run_id`; only the hash is stored server-side.
 */

import type { AgentKey, Id } from "@/contracts/types";

export type RuntimeEvent =
  | {
      type: "progress";
      runId: Id;
      stage:
        | "queued"
        | "preparing_context"
        | "reasoning"
        | "validating_output"
        | "persisting";
      detail?: string;
    }
  | {
      type: "tool_call";
      runId: Id;
      toolCallId: string;
      toolKey: string;
      redactedInput: Record<string, unknown>;
    }
  | {
      type: "result";
      runId: Id;
      contentJson: string;
      artifactIds: Id[];
      tokenUsage: { measuredUnits: number; model: string };
    }
  | {
      type: "error";
      runId: Id;
      code: string;
      message: string;
    };

export interface RuntimeStartInput {
  agentKey: AgentKey;
  runId: Id;
  contextEnvelope: Record<string, unknown>;
  /** Short-lived opaque bearer; control plane validates the hash. */
  toolToken: string;
  configDigest: string;
}

export interface RuntimeStartResult {
  conversationId: string;
  acceptedAt: string;
}

export interface RuntimeClient {
  start(input: RuntimeStartInput): Promise<RuntimeStartResult>;
  resume(conversationId: string): Promise<{ accepted: boolean }>;
  cancel(conversationId: string): Promise<{ accepted: boolean }>;
  /** Yields events until the conversation emits a terminal result. */
  events(
    conversationId: string,
    onEvent: (event: RuntimeEvent) => void,
  ): Promise<void>;
}

/**
 * Mock runtime — returns deterministic events so the rest of the
 * prototype can run without the Python service. Phase 3 final ships
 * an HTTP-based client that talks to `runtime/start` etc.
 */
export function createMockRuntimeClient(): RuntimeClient {
  let counter = 0;
  return {
    async start(_input) {
      counter += 1;
      return {
        conversationId: `conv_${counter.toString(36)}`,
        acceptedAt: new Date().toISOString(),
      };
    },
    async resume(_conversationId) {
      return { accepted: true };
    },
    async cancel(_conversationId) {
      return { accepted: true };
    },
    async events(_conversationId, _onEvent) {
      // Phase 3 stubs; production wires up to the OpenHands Software
      // Agent SDK over SSE and validates each event against the schema.
    },
  };
}

/**
 * Synthesize a short-lived opaque token bound to one run. Stored only
 * as a hash; the raw bearer is returned to the runtime caller once.
 */
export function mintRuntimeToken(runId: Id): string {
  return `rt_${runId}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Hash a bearer token for at-rest comparison. Prototype uses FNV-1a;
 * Phase 3 swaps in Web Crypto SHA-256.
 */
export function hashBearerToken(token: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Build the bounded context envelope sent to the runtime at start.
 * Architecture: only fixed catalog summary + current message + brand
 * snapshot + active memory + newest thread turns within the token
 * budget. The runtime cannot query arbitrary product memory.
 */
export function buildContextEnvelope(input: {
  agentKey: AgentKey;
  brandProfile: Record<string, unknown>;
  brandMemory: Array<{ title: string; body: string }>;
  privateMemory: Array<{ title: string; body: string }>;
  recentThreadTurns: Array<{ role: "user" | "agent"; body: string }>;
  currentMessage: string;
  toolClaims: string[];
}): RuntimeStartInput["contextEnvelope"] {
  return {
    agent: { key: input.agentKey },
    brand: input.brandProfile,
    sharedMemory: input.brandMemory,
    privateMemory: input.privateMemory,
    thread: input.recentThreadTurns,
    message: input.currentMessage,
    allowedTools: input.toolClaims,
  };
}