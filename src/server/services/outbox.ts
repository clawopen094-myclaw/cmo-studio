/**
 * Event outbox. State changes commit in the same transaction as an
 * outbox row, so subscribers never see partial state.
 *
 * Per architecture.md: payloads are allowlisted + size-capped; no prompts,
 * message bodies, memory content, secrets, raw provider output, or signed
 * URLs. The outbox is consumed by the SSE endpoint, which keeps a
 * per-workspace sequence and lets clients reconnect with Last-Event-ID.
 *
 * NOTE: this file is NOT marked `"use server"`. It mutates the shared
 * module-level store. Server actions that produce events must call
 * `appendOutbox()` from their own `"use server"` file in the same
 * transaction as the state change.
 */

import type { Id } from "@/contracts/types";
import { store } from "./store-impl";
import { LIMITS } from "@/contracts/limits";

const OUTBOX_LIMIT = LIMITS.sseOutboxPayload.max;

const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "type",
  "entityRef",
  "status",
  "version",
  "campaignId",
  "taskId",
  "approvalId",
  "approvalStatus",
  "handoffId",
  "workspaceId",
  "agentKey",
  "messageId",
]);

export interface OutboxEntry {
  id: Id;
  customerId: Id;
  brandWorkspaceId: Id;
  workspaceSequence: number;
  eventType: string;
  entityRef: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

function redactPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in payload) out[key] = payload[key];
  }
  return out;
}

function clamp(payload: string): string {
  if (payload.length <= OUTBOX_LIMIT) return payload;
  return payload.slice(0, OUTBOX_LIMIT);
}

export function appendOutbox(input: {
  customerId: Id;
  brandWorkspaceId: Id;
  eventType: string;
  entityRef: string;
  payload: Record<string, unknown>;
}): OutboxEntry {
  const filtered = redactPayload(input.payload);
  const serialized = clamp(JSON.stringify(filtered));
  const safePayload = JSON.parse(serialized) as Record<string, unknown>;
  const nextSequence =
    store.outbox
      .filter((e) => e.brandWorkspaceId === input.brandWorkspaceId)
      .reduce((max, e) => Math.max(max, e.workspaceSequence), 0) + 1;
  const entry: OutboxEntry = {
    id: `out_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: input.customerId,
    brandWorkspaceId: input.brandWorkspaceId,
    workspaceSequence: nextSequence,
    eventType: input.eventType,
    entityRef: input.entityRef,
    payload: safePayload,
    createdAt: new Date().toISOString(),
  };
  store.outbox.push(entry);
  return entry;
}

export function readOutbox(
  brandWorkspaceId: Id,
  sinceSequence: number,
): OutboxEntry[] {
  return store.outbox
    .filter(
      (e) =>
        e.brandWorkspaceId === brandWorkspaceId &&
        e.workspaceSequence > sinceSequence,
    )
    .sort((a, b) => a.workspaceSequence - b.workspaceSequence);
}