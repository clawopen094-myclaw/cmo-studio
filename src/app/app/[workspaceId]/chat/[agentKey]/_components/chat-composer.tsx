"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/contracts/limits";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

interface ChatComposerProps {
  onSend: (text: string, clientMessageId: string) => void;
  onCancel: () => void;
  queuedCount: number;
  running: boolean;
  agentName: string;
}

/**
 * Multiline IME-safe composer. Enter sends, Shift+Enter inserts a newline.
 * Enter during IME composition does not send. The send button morphs into
 * a stop button while a run is active, with a smooth transition.
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
  const reduced = useReducedMotion();
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

  const overLimit = text.length > LIMITS.userMessage.max;

  return (
    <div className="flex flex-col gap-2 border-t border-app-border pt-3">
      <div className="flex items-center justify-between text-xs text-app-ink-muted">
        <span>
          Send to <span className="text-app-ink">{agentName}</span>. Enter to
          send · Shift+Enter for a newline.
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {(running || queuedCount > 0) && (
            <motion.span
              key="state"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={reduced ? { duration: 0 } : transitions.fast}
              className="inline-flex items-center gap-2"
            >
              {running ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-1.5 animate-pulse rounded-full bg-app-info"
                  />
                  Running
                </span>
              ) : null}
              {queuedCount > 0 ? `· ${queuedCount} queued` : null}
              {running ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onCancel}
                >
                  <Square aria-hidden className="size-3" /> Cancel run
                </Button>
              ) : null}
            </motion.span>
          )}
        </AnimatePresence>
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
          className={cn(
            "min-h-24 resize-y transition-shadow duration-150",
            overLimit && "ring-1 ring-app-danger",
          )}
          aria-label={`Message ${agentName}`}
          aria-invalid={overLimit}
        />
        <motion.div
          whileHover={reduced ? undefined : { scale: 1.04 }}
          whileTap={reduced ? undefined : { scale: 0.94 }}
          transition={transitions.fast}
        >
          <Button
            type="button"
            size="icon"
            variant={running ? "outline" : "default"}
            onClick={running ? onCancel : send}
            disabled={!running && !text.trim()}
            aria-label={running ? "Stop run" : "Send message"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {running ? (
                <motion.span
                  key="stop"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={reduced ? { duration: 0 } : transitions.fast}
                  className="inline-flex"
                >
                  <Square aria-hidden className="size-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="send"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={reduced ? { duration: 0 } : transitions.fast}
                  className="inline-flex"
                >
                  <ArrowUp aria-hidden className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
      {overLimit ? (
        <p role="alert" className="text-xs text-app-danger">
          Message exceeds the {LIMITS.userMessage.max.toLocaleString()}{" "}
          character limit.
        </p>
      ) : null}
    </div>
  );
}

export { ChatComposer };
export type { ChatComposerProps };