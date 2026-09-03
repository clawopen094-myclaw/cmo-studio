import type {
  AgentKey,
  Id,
  Message,
  MessageCard,
} from "@/contracts/types";
import { AGENT_CATALOG } from "@/server/catalog/agents";
import { evaluateDirectRequest } from "./capability";

/**
 * Deterministic direct-message responder. Produces a single structured
 * agent response per message. Fixtures drive the outcomes so the prototype
 * can demonstrate allowed, denied, and handoff behavior without an LLM.
 *
 * No model prose is invented — every response body is content-supplied or
 * templated from the catalog, so reviewer never mistakes it for a real
 * model's output.
 */

interface DirectMessageInput {
  agentKey: AgentKey;
  workspaceId: Id;
  threadId: Id;
  messageText: string;
  brandName: string;
}

interface DirectMessageOutput {
  cards: MessageCard[];
  handoffId?: Id;
}

/**
 * Per-agent templates. Each agent returns a deterministic structured
 * answer that names what it can and cannot do. The body is intentionally
 * short; the long-tail conversational UX is the chat composer's job.
 */
const TEMPLATES: Record<
  AgentKey,
  (input: { messageText: string; brandName: string }) => MessageCard[]
> = {
  ai_cmo: ({ messageText, brandName }) => [
    {
      kind: "text",
      body: `Working from ${brandName}'s brand profile. ` +
        `I can draft a campaign for the fixed ugc_video_v1 workflow, or coordinate with the specialists. ` +
        `Tell me what you want to ship and I'll plan it.`,
    },
    {
      kind: "text",
      body: `Your message: "${truncate(messageText, 200)}"`,
    },
  ],

  audience_researcher: () => [
    {
      kind: "text",
      body:
        "I'll synthesize a research brief from your supplied context. " +
        "I'll mark anything that needs external verification as such — I don't claim live competitor or trend data.",
    },
    {
      kind: "artifact_reference",
      artifactId: "draft_research_placeholder",
      label: "Research brief (draft)",
    },
  ],

  brand_strategist: ({ brandName }) => [
    {
      kind: "text",
      body:
        `Positioning draft for ${brandName}: based on the brand voice and approved claims, ` +
        `I'd lead with the most concrete sensory detail and avoid urgency language.`,
    },
  ],

  ugc_writer: ({ brandName }) => [
    {
      kind: "text",
      body:
        `Hook + script + storyboard draft for ${brandName}. ` +
        `This produces text only — I don't generate video.`,
    },
  ],

  media_producer: () => [
    {
      kind: "text",
      body:
        "I produce simulated media artifacts only inside an approved campaign " +
        "after pre-production approval. Direct requests for video are out of scope.",
    },
  ],

  creative_qa: () => [
    {
      kind: "text",
      body:
        "I'll review the produced artifacts against the approved creative package and brand restrictions, " +
        "then return pass, revise, or escalate.",
    },
  ],
};

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function respondToDirectMessage(
  input: DirectMessageInput,
): DirectMessageOutput {
  const def = AGENT_CATALOG[input.agentKey];
  if (!def) {
    return {
      cards: [
        {
          kind: "capability_denied",
          reason: `Unknown agent role '${input.agentKey}'.`,
        },
      ],
    };
  }

  const decision = evaluateDirectRequest(input.agentKey, input.messageText);
  if (decision.kind === "deny") {
    return {
      cards: [
        { kind: "capability_denied", reason: decision.reason },
        ...(decision.createHandoff
          ? [{ kind: "handoff" as const, handoffId: "ho_pending" }]
          : []),
      ],
      handoffId: decision.createHandoff ? "ho_pending" : undefined,
    };
  }

  const tpl = TEMPLATES[input.agentKey];
  return { cards: tpl({ messageText: input.messageText, brandName: input.brandName }) };
}

/**
 * Convert a Message's content_json (already-parsed text) into the message
 * cards for display. Used by the chat thread view.
 */
export function messageToCards(m: Message): MessageCard[] {
  return m.cards;
}