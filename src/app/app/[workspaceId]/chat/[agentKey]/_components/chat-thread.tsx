"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Hourglass,
  Inbox,
  Loader2,
  Sparkles,
} from "lucide-react";

import type {
  Handoff,
  Message,
  MessageCard,
} from "@/contracts/types";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

import { HandoffCard } from "./handoff-card";

interface ChatThreadProps {
  messages: Message[];
  handoffs: Handoff[];
}

/**
 * Accessible ordered projection of one canonical direct thread. User
 * messages align right on app-surface-strong; agent messages align left
 * on the primary surface. Distinct semantic objects render as typed
 * cards. Per ui-rules.md: never render raw JSON.
 *
 * Motion: each new message fades + lifts into place. Reduced-motion
 * users get a plain fade with no transform.
 */
function ChatThread({ messages, handoffs }: ChatThreadProps) {
  const reduced = useReducedMotion();
  const ordered = React.useMemo(
    () => [...messages].sort((a, b) => a.sequence - b.sequence),
    [messages],
  );

  if (ordered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-app-border p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : transitions.medium}
          className="flex max-w-sm flex-col items-center gap-3"
        >
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-full bg-app-surface-subtle"
          >
            <Inbox className="size-6 text-app-ink-muted" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-app-ink">
              No messages yet
            </p>
            <p className="text-xs text-app-ink-muted">
              Start a conversation with this agent.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ol
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-1 py-1"
      aria-label="Conversation"
    >
      <AnimatePresence initial={false}>
        {ordered.map((m, idx) => (
          <motion.li
            key={m.id}
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...transitions.medium, delay: reduced ? 0 : Math.min(idx * 0.02, 0.1) }}
            className={cn(
              "flex max-w-[720px] flex-col gap-2 rounded-lg p-3 transition-colors duration-150",
              m.authorType === "user"
                ? "self-end bg-app-surface-strong"
                : m.authorType === "system"
                  ? "self-center border border-dashed border-app-border bg-transparent"
                  : "self-start bg-app-surface border border-app-border",
            )}
          >
            {m.authorType === "agent" ? (
              <div className="flex items-center gap-2 text-xs text-app-ink-muted">
                <Sparkles aria-hidden className="size-3" />
                <span>{m.authorKey?.replaceAll("_", " ") ?? "Agent"}</span>
              </div>
            ) : null}
            {m.cards.length === 0 ? (
              <p className="text-sm text-app-ink-secondary">
                {m.contentJson || "(empty)"}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {m.cards.map((card, cidx) => (
                  <MessageCardView
                    key={cidx}
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
          </motion.li>
        ))}
      </AnimatePresence>
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
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-app-ink-secondary">
          {card.body}
        </p>
      );
    case "artifact_reference":
      return (
        <div className="group flex items-center gap-2 rounded-md border border-app-border-strong bg-app-surface p-2.5 text-sm transition-colors duration-150 hover:border-app-ink-muted">
          <Archive aria-hidden className="size-4 text-app-ink-muted" />
          <span className="flex-1 text-app-ink">{card.label}</span>
          <ArrowRight
            aria-hidden
            className="size-4 text-app-ink-muted transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </div>
      );
    case "capability_denied":
      return (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-app-danger bg-app-danger-soft p-2.5 text-sm text-app-danger"
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