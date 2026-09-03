import type {
  AgentKey,
  CapabilityDecision,
  MessageCard,
  ProductToolKey,
} from "@/contracts/types";
import { AGENT_CATALOG } from "@/server/catalog/agents";

/**
 * Capability policy. Deny-by-default per architecture.md and the catalog
 * rules in code-standards.md. Direct chat cannot widen scope, cannot
 * generate media, cannot call real providers.
 *
 * Returns a typed decision the chat handler can render as a card.
 */

const DENY_TOOL_MAP: Partial<Record<AgentKey, string[]>> = {
  media_producer: [
    "Media Producer cannot generate video in the prototype. A simulated-media task runs only inside an approved campaign after pre-production approval.",
  ],
  audience_researcher: [
    "Audience Researcher produces a research brief from supplied context — it cannot generate media or change brand facts.",
  ],
  brand_strategist: [
    "Brand Strategist produces strategy and positioning — it cannot generate media or change authoritative brand facts.",
  ],
  ugc_writer: [
    "UGC Writer produces scripts and storyboards — it cannot generate or publish media.",
  ],
  creative_qa: [
    "Creative QA reviews produced artifacts — it cannot generate, rewrite, or publish content.",
  ],
  ai_cmo: [
    "AI CMO cannot approve creative on your behalf in Manual mode.",
  ],
};

interface Request {
  agentKey: AgentKey;
  messageText: string;
}

const REQUEST_PATTERNS: Array<{
  match: RegExp;
  decision: (req: Request) => CapabilityDecision;
}> = [
  // Media Producer: any "generate video / image / voice" request denied.
  {
    match: /(generate|render|create|make).{0,20}(video|reel|clip|film|animation|image|photo|visual|voice)/i,
    decision: ({ agentKey }) => {
      if (agentKey !== "media_producer") return { kind: "allow" };
      return {
        kind: "deny",
        reason:
          DENY_TOOL_MAP.media_producer![0]!,
        createHandoff: true,
      };
    },
  },
  // CMO: cannot approve on behalf of a human in Manual mode.
  {
    match: /^(approve|go ahead|ship it)\b/i,
    decision: ({ agentKey, messageText }) => {
      if (agentKey !== "ai_cmo") return { kind: "allow" };
      if (/\bmanual\b/i.test(messageText)) {
        return {
          kind: "deny",
          reason:
            "Manual campaigns wait for your explicit decision on the approval card.",
          createHandoff: false,
        };
      }
      return { kind: "allow" };
    },
  },
];

/**
 * Direct capability check. Returns allow or deny; the chat handler turns a
 * deny into either a capability-denied card or a handoff card depending on
 * createHandoff.
 */
export function evaluateDirectRequest(
  agentKey: AgentKey,
  messageText: string,
): CapabilityDecision {
  for (const p of REQUEST_PATTERNS) {
    if (p.match.test(messageText)) {
      return p.decision({ agentKey, messageText });
    }
  }
  return { kind: "allow" };
}

/**
 * Tool-call gate. Deny-by-default: any tool not in the agent's catalog is
 * rejected. Returns a reason suitable for a capability-denied card.
 */
export function evaluateToolCall(
  agentKey: AgentKey,
  tool: ProductToolKey,
): CapabilityDecision {
  const def = AGENT_CATALOG[agentKey];
  if (!def) {
    return {
      kind: "deny",
      reason: `Unknown agent role '${agentKey}'.`,
      createHandoff: false,
    };
  }
  if (!def.allowedProductTools.includes(tool)) {
    return {
      kind: "deny",
      reason: `${def.displayName} is not permitted to call '${tool}'.`,
      createHandoff: false,
    };
  }
  return { kind: "allow" };
}

/** Convenience: build a capability-denied card. */
export function capabilityDeniedCard(reason: string): MessageCard {
  return { kind: "capability_denied", reason };
}

/** Convenience: build a text card. */
export function textCard(body: string): MessageCard {
  return { kind: "text", body };
}