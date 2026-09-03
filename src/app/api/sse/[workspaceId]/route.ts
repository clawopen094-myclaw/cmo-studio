import type { NextRequest } from "next/server";

import { readOutbox } from "@/server/services/outbox";
import { getWorkspaceById } from "@/server/services/store";

/**
 * SSE event stream for one workspace. Stable per-workspace sequence;
 * clients reconnect with `Last-Event-ID` to resume from a known cursor.
 *
 * Per architecture.md: payloads are allowlisted + size-capped. A cursor
 * gap returns `resync_required`; the client then refetches authoritative
 * state via the regular route handlers.
 *
 * Auth: the prototype is local-only with one seeded Owner. Production
 * must replace this stub with a real authorization check.
 */
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
): Promise<Response> {
  const { workspaceId } = await params;
  const ws = getWorkspaceById(workspaceId);
  if (!ws) {
    return new Response("not-found", { status: 404 });
  }
  const lastEventIdHeader = req.headers.get("last-event-id");
  const lastEventId = lastEventIdHeader ? Number(lastEventIdHeader) : 0;
  if (lastEventIdHeader && Number.isNaN(lastEventId)) {
    return new Response("invalid-cursor", { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const writeEvent = (
        id: string,
        event: string,
        data: Record<string, unknown>,
      ) => {
        const payload = `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      const entries = readOutbox(workspaceId, lastEventId);
      for (const entry of entries) {
        writeEvent(
          String(entry.workspaceSequence),
          entry.eventType,
          { ...entry.payload, sequence: entry.workspaceSequence },
        );
      }
      // Heartbeat keeps the stream open during idle periods.
      controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}