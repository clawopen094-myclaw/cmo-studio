"use client";

import * as React from "react";

import type {
  AgentKey,
  Handoff,
  Id,
  Message,
  MessageCard,
} from "@/contracts/types";
import { appendMessageAction } from "@/server/mock-runtime/store";
import { respondToDirectMessage } from "@/server/mock-runtime/respond";

import { ChatComposer } from "./chat-composer";
import { ChatThread } from "./chat-thread";

interface ChatPanelProps {
  workspaceId: Id;
  threadId: Id;
  agentKey: AgentKey;
  initialMessages: Message[];
  handoffs: Handoff[];
}

/**
 * Top-level chat panel: holds the local optimistic message list, sends user
 * messages via server action, then appends the deterministic mock-runtime
 * response. Real OpenHands integration happens in Phase 3.
 */
function ChatPanel({
  workspaceId,
  threadId,
  agentKey,
  initialMessages,
  handoffs,
}: ChatPanelProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [pending, setPending] = React.useState<{ id: string; text: string }[]>(
    [],
  );
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  async function handleSend(text: string, clientId: string) {
    if (running) {
      setPending((p) => [...p, { id: clientId, text }]);
      return;
    }
    setRunning(true);
    // Optimistic user message
    const userMsg: Message = {
      id: `tmp_${clientId}`,
      threadId,
      sequence: messages.length + 1,
      authorType: "user",
      contentJson: text,
      status: "succeeded",
      createdAt: new Date().toISOString(),
      cards: [{ kind: "text", body: text }],
    };
    setMessages((m) => [...m, userMsg]);

    const persisted = await appendMessageAction({
      threadId,
      authorType: "user",
      contentJson: text,
      cards: userMsg.cards,
      clientMessageId: clientId,
    });
    setMessages((m) =>
      m.map((x) => (x.id === userMsg.id ? { ...persisted, cards: persisted.cards } : x)),
    );

    // Deterministic mock runtime response
    const out = respondToDirectMessage({
      agentKey,
      workspaceId,
      threadId,
      messageText: text,
      brandName: workspaceId,
    });
    const agentMsg = await appendMessageAction({
      threadId,
      authorType: "agent",
      authorKey: agentKey,
      contentJson: out.cards.map(cardText).join("\n\n"),
      cards: out.cards,
    });
    setMessages((m) => [...m, agentMsg]);
    setRunning(false);

    // Drain queue
    if (pending.length > 0) {
      const [next, ...rest] = pending;
      setPending(rest);
      // Use a microtask so state updates flush first.
      Promise.resolve().then(() => handleSend(next!.text, next!.id));
    }
  }

  function handleCancel() {
    setPending([]);
    setRunning(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
      <ChatThread messages={messages} handoffs={handoffs} />
      <ChatComposer
        onSend={handleSend}
        onCancel={handleCancel}
        queuedCount={pending.length}
        running={running}
        agentName={agentKeyToDisplay(agentKey)}
      />
    </div>
  );
}

function agentKeyToDisplay(key: AgentKey): string {
  switch (key) {
    case "ai_cmo":
      return "AI CMO";
    case "audience_researcher":
      return "Audience Researcher";
    case "brand_strategist":
      return "Brand Strategist";
    case "ugc_writer":
      return "UGC Writer";
    case "media_producer":
      return "Media Producer";
    case "creative_qa":
      return "Creative QA";
  }
}

function cardText(c: MessageCard): string {
  switch (c.kind) {
    case "text":
      return c.body;
    case "artifact_reference":
      return `[artifact] ${c.label}`;
    case "capability_denied":
      return `[denied] ${c.reason}`;
    case "handoff":
      return `[handoff created]`;
    case "run_progress":
      return `[run] ${c.stage}`;
    case "queued":
      return `[queued #${c.position}]`;
    case "error":
      return `[error] ${c.message}`;
  }
}

export { ChatPanel };
export type { ChatPanelProps };