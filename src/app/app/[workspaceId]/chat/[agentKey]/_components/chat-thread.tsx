"use client";

import * as React from "react";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Hourglass,
  Inbox,
  Loader2,
} from "lucide-react";

import type {
  Handoff,
  Message,
  MessageCard,
} from "@/contracts/types";
import { cn } from "@/lib/utils";

import { HandoffCard } from "./handoff-card";

interface ChatThreadProps {
  messages: Message[];
  handoffs: Handoff[];
}

/**
 * Accessible ordered projection of one canonical direct thread. User
 * messages align right on app-surface-strong; agent messages align left on
 * the primary surface. Distinct semantic objects (text, artifact reference,
 * capability denial, handoff, queued, run progress, error) render as typed
 * cards. Per ui-rules.md: never render raw JSON.
 */
function ChatThread({ messages, handoffs }: ChatThreadProps) {
  const ordered = React.useMemo(
    () => [...messages].sort((a, b) => a.sequence - b.sequence),
    [messages],
  );

  if (ordered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-app-border p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <Inbox aria-hidden className="size-8 text-app-ink-muted" />
          <p className="text-sm text-app-ink-muted">
            No messages yet. Start a conversation with this agent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol
      className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2"
      aria-label="Conversation"
    >
      {ordered.map((m) => (
        <li
          key={m.id}
          className={cn(
            "flex max-w-[720px] flex-col gap-2 rounded-lg p-3",
            m.authorType === "user"
              ? "self-end bg-app-surface-strong"
              : m.authorType === "system"
                ? "self-center border border-dashed border-app-border bg-transparent"
                : "self-start bg-app-surface border border-app-border",
          )}
        >
          {m.cards.length === 0 ? (
            <p className="text-sm text-app-ink-secondary">
              {m.contentJson || "(empty)"}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {m.cards.map((card, idx) => (
                <MessageCardView
                  key={idx}
                  card={card}
                  handoffs={handoffs}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-app-ink-muted">
            {new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Local rendering of one MessageCard. Distinct semantic objects never
 * become raw JSON; each kind has its own visual treatment.
 */
function MessageCardView({
  card,
  handoffs,
}: {
  card: MessageCard;
  handoffs: Handoff[];
}) {
  switch (card.kind) {
    case "text":
      return (
        <p className="whitespace-pre-wrap text-sm text-app-ink-secondary">
          {card.body}
        </p>
      );
    case "artifact_reference":
      return (
        <div className="flex items-center gap-2 rounded-md border border-app-border-strong bg-app-surface p-2 text-sm">
          <Archive aria-hidden className="size-4 text-app-ink-muted" />
          <span className="flex-1 text-app-ink">{card.label}</span>
          <ArrowRight aria-hidden className="size-4 text-app-ink-muted" />
        </div>
      );
    case "capability_denied":
      return (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-app-danger bg-app-danger-soft p-2 text-sm text-app-danger"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4" />
          <span>{card.reason}</span>
        </div>
      );
    case "handoff": {
      const handoff = handoffs.find((h) => h.id === card.handoffId);
      if (!handoff) {
        return (
          <div className="flex items-center gap-2 rounded-md border border-app-border p-2 text-sm text-app-ink-muted">
            <ArrowRight aria-hidden className="size-4" />
            Specialist handed off to the CMO.
          </div>
        );
      }
      return <HandoffCard handoff={handoff} />;
    }
    case "queued":
      return (
        <div className="flex items-center gap-2 rounded-md border border-app-border p-2 text-sm text-app-ink-muted">
          <Hourglass aria-hidden className="size-4" />
          Queued · position {card.position}
        </div>
      );
    case "run_progress":
      return (
        <div className="flex items-center gap-2 rounded-md border border-app-border p-2 text-sm text-app-ink-muted">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {stageLabel(card.stage)}
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-2 rounded-md border border-app-danger bg-app-danger-soft p-2 text-sm text-app-danger">
          <AlertTriangle aria-hidden className="size-4" />
          {card.message}
        </div>
      );
  }
}

function stageLabel(stage: string): string {
  switch (stage) {
    case "queued":
      return "Queued";
    case "preparing_context":
      return "Preparing context";
    case "reasoning":
      return "Reasoning";
    case "validating_output":
      return "Validating output";
    case "persisting":
      return "Persisting result";
    case "succeeded":
      return "Done";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return stage;
  }
}

export { ChatThread };