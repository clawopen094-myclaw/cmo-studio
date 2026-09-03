import type {
  AgentDefinition,
  ProductToolKey,
  WorkflowTemplate,
} from "@/contracts/types";

/**
 * Fixed agent catalog. Versioned, deny-by-default, read-only. Mirrors the
 * "Fixed Agent Team and Capability Contract" section of project-overview.md
 * and the prototype catalog rules in architecture.md.
 *
 * Updating this catalog affects new runs only; historical runs keep their
 * snapshotted definition version.
 */

const NO_DELEGATION: ProductToolKey[] = [];

export const AGENT_CATALOG: Record<string, AgentDefinition> = {
  ai_cmo: {
    key: "ai_cmo",
    version: 1,
    displayName: "AI CMO",
    role: "Coordinates specialists, owns the UGC campaign brief, and writes the final report.",
    shortSummary:
      "Reads brand context, drafts campaigns, delegates approved task types, and produces the final report.",
    canDo: [
      "Read brand context, shared memory, and current campaign state.",
      "Create a campaign draft for the fixed ugc_video_v1 workflow.",
      "Delegate campaign tasks to specialists after explicit Start.",
      "Read structured task results and produce the final report.",
    ],
    mustNotDo: [
      "Approve creative on behalf of a human in Manual mode.",
      "Bypass capability policy or grant itself new tools.",
      "Read another specialist's private memory.",
      "Publish externally or call real media providers.",
    ],
    allowedTaskTypes: ["final_report"],
    allowedProductTools: [
      "read_brand_context",
      "read_memory",
      "create_campaign_draft",
      "return_task_result",
    ],
    allowedDelegationTargets: [
      "audience_researcher",
      "brand_strategist",
      "ugc_writer",
      "media_producer",
      "creative_qa",
    ],
    maxRunSeconds: 90,
    maxAttempts: 2,
  },

  audience_researcher: {
    key: "audience_researcher",
    version: 1,
    displayName: "Audience Researcher",
    role: "Synthesizes supplied brand context into a clearly source-labelled research brief.",
    shortSummary:
      "Builds a research brief from the campaign brief and brand snapshot. Distinguishes supplied facts from assumptions.",
    canDo: [
      "Read brand context and the current campaign brief.",
      "Produce a research brief artifact with supplied facts, assumptions, and items needing external verification.",
    ],
    mustNotDo: [
      "Claim live or current verification of competitors or trends.",
      "Generate or publish media.",
      "Change authoritative brand facts or campaign strategy.",
      "Delegate to peers; can hand off to the CMO only.",
    ],
    allowedTaskTypes: ["audience_research"],
    allowedProductTools: [
      "read_brand_context",
      "read_memory",
      "create_text_artifact",
      "create_handoff_to_cmo",
    ],
    allowedDelegationTargets: ["ai_cmo"],
    maxRunSeconds: 60,
    maxAttempts: 2,
  },

  brand_strategist: {
    key: "brand_strategist",
    version: 1,
    displayName: "Brand Strategist",
    role: "Turns research into positioning, messaging, audience, and a creative brief.",
    shortSummary:
      "Produces positioning, messaging, and the creative brief that the UGC Writer consumes.",
    canDo: [
      "Read brand context and approved research brief artifacts.",
      "Produce a strategy brief artifact.",
    ],
    mustNotDo: [
      "Generate or publish media.",
      "Change authoritative brand facts.",
      "Delegate to peers; can hand off to the CMO only.",
    ],
    allowedTaskTypes: ["brand_strategy"],
    allowedProductTools: [
      "read_brand_context",
      "read_memory",
      "create_text_artifact",
      "create_handoff_to_cmo",
    ],
    allowedDelegationTargets: ["ai_cmo"],
    maxRunSeconds: 60,
    maxAttempts: 2,
  },

  ugc_writer: {
    key: "ugc_writer",
    version: 1,
    displayName: "UGC Writer",
    role: "Writes hooks, scripts, shot lists, and storyboards from approved research and strategy.",
    shortSummary:
      "Produces the versioned script and storyboard artifacts that drive pre-production approval.",
    canDo: [
      "Read brand context and approved research/strategy artifacts.",
      "Produce a script artifact and a storyboard artifact.",
    ],
    mustNotDo: [
      "Generate, render, or publish video or other media.",
      "Change brand facts or campaign strategy.",
      "Delegate to peers; can hand off to the CMO only.",
    ],
    allowedTaskTypes: ["creative_package"],
    allowedProductTools: [
      "read_brand_context",
      "read_memory",
      "create_text_artifact",
      "create_handoff_to_cmo",
    ],
    allowedDelegationTargets: ["ai_cmo"],
    maxRunSeconds: 75,
    maxAttempts: 2,
  },

  media_producer: {
    key: "media_producer",
    version: 1,
    displayName: "Media Producer",
    role: "Produces a clearly labelled simulated media artifact from the approved creative package.",
    shortSummary:
      "Generates a deterministic, simulated placeholder media artifact bound to the approved script and storyboard.",
    canDo: [
      "Read the currently approved script and storyboard versions.",
      "Produce a simulated-media artifact tagged is_simulated=true.",
    ],
    mustNotDo: [
      "Change strategy or approved copy.",
      "Call a real media provider or external network.",
      "Publish or distribute generated content.",
      "Respond to direct chat requests for video or image generation.",
    ],
    allowedTaskTypes: ["simulated_production"],
    allowedProductTools: [
      "read_brand_context",
      "read_memory",
      "create_simulated_media",
      "create_handoff_to_cmo",
    ],
    allowedDelegationTargets: ["ai_cmo"],
    maxRunSeconds: 30,
    maxAttempts: 1,
  },

  creative_qa: {
    key: "creative_qa",
    version: 1,
    displayName: "Creative QA",
    role: "Reviews campaign artifacts and returns a structured pass, revise, or escalate verdict.",
    shortSummary:
      "Reads the produced media plus approved creative inputs and returns a typed QA result.",
    canDo: [
      "Read produced media, approved script, storyboard, and brand restrictions.",
      "Return a structured QA result: pass, revise, or escalate.",
    ],
    mustNotDo: [
      "Publish or distribute generated content.",
      "Silently rewrite approved creative.",
      "Delegate to peers; can hand off to the CMO only.",
    ],
    allowedTaskTypes: ["creative_qa"],
    allowedProductTools: [
      "read_brand_context",
      "read_memory",
      "return_qa_result",
      "create_handoff_to_cmo",
    ],
    allowedDelegationTargets: ["ai_cmo"],
    maxRunSeconds: 45,
    maxAttempts: 2,
  },
};

export const AGENT_DEFINITIONS: AgentDefinition[] = Object.values(AGENT_CATALOG);

export function getAgentDefinition(key: string): AgentDefinition | undefined {
  return AGENT_CATALOG[key];
}

export const FIXED_UGC_WORKFLOW: WorkflowTemplate = {
  key: "ugc_video_v1",
  version: 1,
  description:
    "Fixed UGC video workflow: research and strategy run in parallel, then creative package → pre-production approval → simulated production → creative QA → final report.",
  taskSequence: [
    "audience_research",
    "brand_strategy",
    "creative_package",
    "simulated_production",
    "creative_qa",
    "final_report",
  ],
  requiredBriefFields: [
    "productOrOffer",
    "objective",
    "targetAudience",
    "channel",
    "deliverable",
    "callToAction",
  ],
  approvalCheckpoint: "pre_production",
  maxRevisionCycles: 2,
};

export const TASK_AGENT_MAP: Record<string, string> = {
  audience_research: "audience_researcher",
  brand_strategy: "brand_strategist",
  creative_package: "ugc_writer",
  simulated_production: "media_producer",
  creative_qa: "creative_qa",
  final_report: "ai_cmo",
};

/** Silence unused variable lint for the no-delegation constant. */
void NO_DELEGATION;