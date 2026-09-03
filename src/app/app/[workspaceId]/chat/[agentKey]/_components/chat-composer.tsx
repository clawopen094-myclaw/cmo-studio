"use client";

import * as React from "react";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/contracts/limits";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (text: string, clientMessageId: string) => void;
  onCancel: () => void;
  queuedCount: number;
  running: boolean;
  agentName: string;
}

/**
 * Multiline IME-safe composer. Enter sends, Shift+Enter inserts a newline.
 * Enter during IME composition does not send. After Send, focus stays in the
 * composer unless an error requires focus. Per ui-rules.md.
 */
function ChatComposer({
  onSend,
  onCancel,
  queuedCount,
  running,
  agentName,
}: ChatComposerProps) {
  const [text, setText] = React.useState("");
  const [composing, setComposing] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  function clientId() {
    return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > LIMITS.userMessage.max) return;
    onSend(trimmed, clientId());
    setText("");
    ref.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !composing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-app-border pt-3">
      <div className="flex items-center justify-between text-xs text-app-ink-muted">
        <span>
          Send to {agentName}. Enter to send · Shift+Enter for a newline.
        </span>
        {queuedCount > 0 || running ? (
          <span className="inline-flex items-center gap-2">
            {running ? "Running" : null}
            {queuedCount > 0 ? `· ${queuedCount} queued` : null}
            {running ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancel}
              >
                <X aria-hidden className="size-3" /> Cancel run
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          placeholder="Type a message…"
          rows={3}
          className={cn("min-h-24 resize-y")}
          aria-label={`Message ${agentName}`}
        />
        <Button type="button" onClick={send} disabled={!text.trim() || running}>
          <Send aria-hidden className="size-4" />
          Send
        </Button>
      </div>
    </div>
  );
}

export { ChatComposer };
export type { ChatComposerProps };