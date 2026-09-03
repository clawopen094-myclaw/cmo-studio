import type {
  AgentKey,
  CapabilityDecision,
  ProductToolKey,
} from "@/contracts/types";
import { AGENT_CATALOG } from "@/server/catalog/agents";

/**
 * Authoritative capability policy service. Deny-by-default per
 * architecture.md and the catalog rules in code-standards.md. Direct
 * chat cannot widen scope, cannot generate media, cannot call real
 * providers.
 *
 * Phase 2.06 extraction: the runtime still consumes this from the same
 * import path, but the contract is now explicit and the routing
 * decisions are typed.
 */

interface DirectRequest {
  agentKey: AgentKey;
  messageText: string;
}

const REQUEST_PATTERNS: Array<{
  id: string;
  match: RegExp;
  decision: (req: DirectRequest) => CapabilityDecision;
}> = [
  {
    id: "media_producer_generation_request",
    match: /(generate|render|create|make).{0,20}(video|reel|clip|film|animation|image|photo|visual|voice)/i,
    decision: ({ agentKey }) => {
      if (agentKey !== "media_producer") return { kind: "allow" };
      return {
        kind: "deny",
        reason:
          "Media Producer cannot generate media in the prototype. A simulated-media task can run only inside an approved campaign after pre-production approval.",
        createHandoff: true,
      };
    },
  },
  {
    id: "cmo_self_approve_in_manual",
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

export function listDenyRules(): Array<{ id: string; match: RegExp }> {
  return REQUEST_PATTERNS.map((p) => ({ id: p.id, match: p.match }));
}