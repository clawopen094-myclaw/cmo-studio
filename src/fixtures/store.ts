import type {
  ApprovalRequest,
  Artifact,
  BrandProfile,
  BrandWorkspace,
  Campaign,
  CampaignTask,
  ChatThread,
  Customer,
  Handoff,
  Id,
  MemoryRecord,
  Message,
  OwnerIdentity,
} from "@/contracts/types";
import { AGENT_ORDER } from "@/contracts/types";
import { AGENT_CATALOG } from "@/server/catalog/agents";
import { makeId } from "@/lib/utils";

/**
 * Deterministic fixtures for Phase 1. IDs and timestamps are stable so
 * visual and interaction tests do not depend on randomness. Mirrors the
 * canonical demo fixtures in build-plan.md feature 01 and 04.
 *
 * Two isolated brands with visibly different profiles, six-agent team per
 * brand, an allowed Writer draft, a Producer denial handed off to CMO once,
 * a draft campaign awaiting explicit start, a Manual campaign waiting at
 * pre_production, an Auto campaign completed with a policy approval, and a
 * QA revision example with stale/superseded artifact history.
 */

export const OWNER: OwnerIdentity = {
  id: "user_owner",
  displayName: "Owner",
};

export const CUSTOMER: Customer = {
  id: "cust_root",
  name: "CMO Studio customer",
};

export const BRAND_A: BrandWorkspace = {
  id: "ws_atelier",
  customerId: CUSTOMER.id,
  name: "Atelier Lumière",
  defaultApprovalMode: "manual",
  createdAt: "2026-08-12T09:00:00.000Z",
};

export const BRAND_B: BrandWorkspace = {
  id: "ws_kettle",
  customerId: CUSTOMER.id,
  name: "Kettle & Crate",
  defaultApprovalMode: "auto",
  createdAt: "2026-08-22T14:30:00.000Z",
};

export const BRAND_PROFILES: BrandProfile[] = [
  {
    id: "prof_atelier",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    version: 1,
    productSummary:
      "Hand-poured botanical candles sold direct to consumers in limited seasonal drops.",
    audience:
      "Design-led shoppers aged 28–45, mostly urban, gift and self-care occasions.",
    voice:
      "Quiet, sensory, slightly poetic. Never urgent, never salesy. Prefer concrete detail over abstraction.",
    approvedClaims: [
      "Hand-poured in small batches in our Lisbon studio.",
      "100% soy wax with cotton wicks; no paraffin, no phthalates.",
    ],
    restrictions: [
      "Do not claim organic certification.",
      "Avoid urgency language like 'limited time' or 'act now'.",
      "Do not show flames in imagery; render candles unlit.",
    ],
    status: "active",
  },
  {
    id: "prof_kettle",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_B.id,
    version: 1,
    productSummary:
      "Single-origin coffee and chai shipped weekly to subscribers across the US.",
    audience:
      "Coffee enthusiasts who care about origin, freshness, and small-batch roasters.",
    voice:
      "Warm, specific, slightly nerdy. Cite producer, process, and origin whenever possible.",
    approvedClaims: [
      "Roasted within 48 hours of shipping.",
      "Direct trade with named producer partners.",
    ],
    restrictions: [
      "Do not describe coffee as 'artisan' or 'craft' (industry overused).",
      "Do not make health claims about caffeine.",
    ],
    status: "active",
  },
];

export const WORKSPACES: BrandWorkspace[] = [BRAND_A, BRAND_B];

/**
 * Canonical direct threads: exactly one per (workspace, agent).
 */
export const CHAT_THREADS: ChatThread[] = WORKSPACES.flatMap((w) =>
  AGENT_ORDER.map((key) => ({
    id: `thr_${w.id}_${key}`,
    brandWorkspaceId: w.id,
    agentInstanceId: `ai_${w.id}_${key}`,
    agentKey: key,
    nextSequence: 1,
    createdAt: w.createdAt,
  })),
);

/**
 * Brand (shared) memory records. Two seeded per brand so the Memory page has
 * real content to render.
 */
export const BRAND_MEMORY: MemoryRecord[] = [
  {
    id: "mem_atelier_voice",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    scope: "brand",
    title: "Voice — quiet and sensory",
    body: "Lead with texture, scent, and weight. One concrete detail per line is enough.",
    sourceType: "user",
    status: "active",
    version: 1,
    createdAt: "2026-08-13T10:00:00.000Z",
  },
  {
    id: "mem_atelier_claims",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    scope: "brand",
    title: "Approved claims",
    body: "Hand-poured in small batches. 100% soy wax with cotton wicks.",
    sourceType: "user",
    status: "active",
    version: 1,
    createdAt: "2026-08-13T10:05:00.000Z",
  },
  {
    id: "mem_kettle_origin",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_B.id,
    scope: "brand",
    title: "Origin and freshness",
    body: "Always name the producer and roast date when available. Avoid 'artisan'.",
    sourceType: "user",
    status: "active",
    version: 1,
    createdAt: "2026-08-23T09:00:00.000Z",
  },
];

/**
 * Agent-private memory — one per agent instance. Visible only to that agent
 * and the Owner per the memory contract.
 */
export const AGENT_PRIVATE_MEMORY: MemoryRecord[] = WORKSPACES.flatMap((w) =>
  AGENT_ORDER.map((key) => ({
    id: `mem_${w.id}_${key}_priv`,
    customerId: CUSTOMER.id,
    brandWorkspaceId: w.id,
    scope: "agent_private" as const,
    agentInstanceId: `ai_${w.id}_${key}`,
    agentKey: key,
    title: `${AGENT_CATALOG[key]!.displayName} notes`,
    body: `Notes accumulated by ${AGENT_CATALOG[key]!.displayName} for ${w.name}.`,
    sourceType: "user" as const,
    status: "active" as const,
    version: 1,
    createdAt: w.createdAt,
  })),
);

export const ALL_MEMORY: MemoryRecord[] = [
  ...BRAND_MEMORY,
  ...AGENT_PRIVATE_MEMORY,
];

// --- Messages and handoffs ---------------------------------------------------

/**
 * Deterministic seed messages. Each thread has at most one seeded message
 * pair so the UI has visible conversation history. New messages append
 * through the in-memory store at runtime.
 */
export const SEEDED_MESSAGES: Message[] = [
  // Atelier CMO thread — has an accepted handoff from the UGC Writer.
  {
    id: "msg_atelier_cmo_seed_1",
    threadId: "thr_ws_atelier_ai_cmo",
    sequence: 1,
    authorType: "user",
    contentJson: "Plan a 30-second UGC spot for our autumn drop.",
    status: "succeeded",
    createdAt: "2026-09-01T10:00:00.000Z",
    cards: [{ kind: "text", body: "Plan a 30-second UGC spot for our autumn drop." }],
  },
  {
    id: "msg_atelier_cmo_seed_2",
    threadId: "thr_ws_atelier_ai_cmo",
    sequence: 2,
    authorType: "agent",
    authorKey: "ai_cmo",
    runId: "run_seed_cmo_1",
    contentJson: "Drafted a campaign. Awaiting your start.",
    status: "succeeded",
    createdAt: "2026-09-01T10:00:12.000Z",
    cards: [
      { kind: "text", body: "Drafted a campaign. Approve to start, or refine the brief." },
      { kind: "handoff", handoffId: "ho_seed_writer" },
    ],
  },
  // Atelier UGC Writer thread — produced an allowed draft.
  {
    id: "msg_atelier_writer_seed_1",
    threadId: "thr_ws_atelier_ugc_writer",
    sequence: 1,
    authorType: "user",
    contentJson: "Draft three hook variants for a 30-second spot.",
    status: "succeeded",
    createdAt: "2026-09-01T09:30:00.000Z",
    cards: [{ kind: "text", body: "Draft three hook variants for a 30-second spot." }],
  },
  {
    id: "msg_atelier_writer_seed_2",
    threadId: "thr_ws_atelier_ugc_writer",
    sequence: 2,
    authorType: "agent",
    authorKey: "ugc_writer",
    runId: "run_seed_writer_1",
    contentJson: "Three hook variants ready for review.",
    status: "succeeded",
    createdAt: "2026-09-01T09:30:08.000Z",
    cards: [
      { kind: "text", body: "Three hook variants ready for review." },
      { kind: "artifact_reference", artifactId: "art_atelier_script_v1", label: "Script draft (v1)" },
    ],
  },
  // Atelier Media Producer thread — denial + handoff to CMO.
  {
    id: "msg_atelier_producer_seed_1",
    threadId: "thr_ws_atelier_media_producer",
    sequence: 1,
    authorType: "user",
    contentJson: "Generate a 30-second video for our autumn drop.",
    status: "succeeded",
    createdAt: "2026-09-01T11:15:00.000Z",
    cards: [{ kind: "text", body: "Generate a 30-second video for our autumn drop." }],
  },
  {
    id: "msg_atelier_producer_seed_2",
    threadId: "thr_ws_atelier_media_producer",
    sequence: 2,
    authorType: "agent",
    authorKey: "media_producer",
    runId: "run_seed_producer_1",
    contentJson: "Media Producer cannot generate video in the prototype.",
    status: "succeeded",
    createdAt: "2026-09-01T11:15:05.000Z",
    cards: [
      {
        kind: "capability_denied",
        reason:
          "Media generation is not permitted in the prototype. A simulated-media task can run only inside an approved campaign after pre-production approval.",
        handoffId: "ho_seed_producer",
      },
    ],
  },
];

export const HANDOFFS: Handoff[] = [
  {
    id: "ho_seed_writer",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    sourceAgentInstanceId: "ai_ws_atelier_ugc_writer",
    sourceAgentKey: "ugc_writer",
    targetCmoInstanceId: "ai_ws_atelier_ai_cmo",
    sourceThreadId: "thr_ws_atelier_ugc_writer",
    sourceMessageId: "msg_atelier_writer_seed_2",
    targetThreadId: "thr_ws_atelier_ai_cmo",
    reason: "Multi-agent coordination requested.",
    requestedOutcome: "Plan a UGC campaign based on the approved script draft.",
    safeContextSummary:
      "UGC Writer produced script v1. Asks CMO to start a campaign that uses this script as the creative brief input.",
    status: "accepted",
    createdAt: "2026-09-01T09:30:30.000Z",
  },
  {
    id: "ho_seed_producer",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    sourceAgentInstanceId: "ai_ws_atelier_media_producer",
    sourceAgentKey: "media_producer",
    targetCmoInstanceId: "ai_ws_atelier_ai_cmo",
    sourceThreadId: "thr_ws_atelier_media_producer",
    sourceMessageId: "msg_atelier_producer_seed_2",
    targetThreadId: "thr_ws_atelier_ai_cmo",
    reason: "Request is outside the Media Producer's allowed outcomes.",
    requestedOutcome:
      "User asked for video generation. CMO should plan a full UGC campaign so simulated production can run inside it.",
    safeContextSummary:
      "Media Producer denied a direct video generation request and is escalating to the CMO.",
    status: "pending",
    createdAt: "2026-09-01T11:15:30.000Z",
  },
];

// --- Artifacts (script, storyboard, simulated media, QA, final report) -------

export const ARTIFACTS: Artifact[] = [
  {
    id: "art_atelier_script_v1",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "script",
    version: 1,
    type: "script",
    title: "Autumn drop — script draft",
    producingAgentKey: "ugc_writer",
    sourceRunId: "run_seed_writer_1",
    threadId: "thr_ws_atelier_ugc_writer",
    campaignId: "cmp_atelier_autumn",
    taskId: "tsk_atelier_creative_v1",
    body:
      "Hook A: 'Three days from the studio floor, your autumn drop is here.'\n" +
      "Hook B: 'Same hands that poured it, packing it for you tonight.'\n" +
      "Hook C: 'Quietly, on purpose — autumn, in a glass.'\n\n" +
      "Body: Texture close-up on wax. Hand dips wick. Slow pan across finished jars.\n" +
      "CTA: 'Available until Sunday, or until they're gone.'",
    mimeType: "text/plain",
    sha256: "a1b2c3d4",
    status: "stale",
    isSimulated: false,
    createdAt: "2026-09-01T09:30:08.000Z",
    inputArtifactIds: [],
  },
  {
    id: "art_atelier_script_v2",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "script",
    version: 2,
    type: "script",
    title: "Autumn drop — revised script",
    producingAgentKey: "ugc_writer",
    campaignId: "cmp_atelier_autumn",
    taskId: "tsk_atelier_creative_v2",
    body:
      "Hook A: 'Pour by hand. Ship by hand. Yours on Friday.'\n" +
      "Hook B: 'Six candles. Twenty-four jars. Sunday at midnight they close.'\n" +
      "Body: Steadier narrative. Closer on pour. Holds longer on the seal.\n" +
      "CTA: 'Sunday at midnight, or until they're gone.'",
    mimeType: "text/plain",
    sha256: "b2c3d4e5",
    status: "current",
    isSimulated: false,
    createdAt: "2026-09-02T10:12:00.000Z",
    inputArtifactIds: [],
  },
  {
    id: "art_atelier_storyboard_v2",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "storyboard",
    version: 2,
    type: "storyboard",
    title: "Autumn drop — storyboard (revised)",
    producingAgentKey: "ugc_writer",
    campaignId: "cmp_atelier_autumn",
    taskId: "tsk_atelier_creative_v2",
    body:
      "Shot 1: Hand lifting wick from bowl — close. 1.5s.\n" +
      "Shot 2: Pour at 3fps — slow drip onto wick. 2s.\n" +
      "Shot 3: Six jars on table — wide. 1s.\n" +
      "Shot 4: One jar held to camera, label slightly off-center. 2s.\n" +
      "Shot 5: Label reads 'Atelier Lumière · Autumn'. 1s.\n" +
      "Shot 6: Fade to black. CTA card. 1.5s.",
    mimeType: "text/plain",
    sha256: "c3d4e5f6",
    status: "current",
    isSimulated: false,
    createdAt: "2026-09-02T10:12:00.000Z",
    inputArtifactIds: ["art_atelier_script_v2"],
  },
  {
    id: "art_atelier_media_v1",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "simulated_media",
    version: 1,
    type: "simulated_media",
    title: "Simulated media — autumn drop",
    producingAgentKey: "media_producer",
    campaignId: "cmp_atelier_autumn",
    mimeType: "application/x.simulated-media",
    sha256: "d4e5f6a7",
    status: "superseded",
    isSimulated: true,
    createdAt: "2026-09-02T11:00:00.000Z",
    inputArtifactIds: ["art_atelier_script_v1"],
  },
  {
    id: "art_atelier_media_v2",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "simulated_media",
    version: 2,
    type: "simulated_media",
    title: "Simulated media — autumn drop (v2)",
    producingAgentKey: "media_producer",
    campaignId: "cmp_atelier_autumn",
    mimeType: "application/x.simulated-media",
    sha256: "e5f6a7b8",
    status: "current",
    isSimulated: true,
    createdAt: "2026-09-02T13:00:00.000Z",
    inputArtifactIds: ["art_atelier_script_v2", "art_atelier_storyboard_v2"],
  },
  {
    id: "art_atelier_qa_v1",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "qa_report",
    version: 1,
    type: "qa_report",
    title: "Creative QA — pass after revision",
    producingAgentKey: "creative_qa",
    campaignId: "cmp_atelier_autumn",
    body:
      "Verdict: pass. All brand restrictions honored. No flames rendered. CTA matches script.",
    mimeType: "text/plain",
    sha256: "f6a7b8c9",
    status: "current",
    isSimulated: false,
    createdAt: "2026-09-02T13:30:00.000Z",
    inputArtifactIds: ["art_atelier_media_v2"],
  },
  {
    id: "art_atelier_final_v1",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    logicalKey: "final_report",
    version: 1,
    type: "final_report",
    title: "Final report — autumn drop",
    producingAgentKey: "ai_cmo",
    campaignId: "cmp_atelier_autumn",
    body:
      "Objective: Plan and execute a 30-second UGC spot for the autumn drop.\n\n" +
      "Final artifacts: Script v2, storyboard v2, simulated media v2, QA pass.\n\n" +
      "Decisions: One revision cycle was used to tighten the CTA wording.\n\n" +
      "Approval history: pre_production approved (manual) on script/storyboard v2.\n\n" +
      "QA: pass. Unresolved risks: simulated media is a placeholder, not a rendered video.\n\n" +
      "Provenance: AI CMO drafted, UGC Writer scripted, Media Producer simulated, Creative QA reviewed.\n\n" +
      "Status: Simulation. All media artifacts are deterministic placeholders.",
    mimeType: "text/plain",
    sha256: "a7b8c9d0",
    status: "current",
    isSimulated: false,
    createdAt: "2026-09-02T14:00:00.000Z",
    inputArtifactIds: [
      "art_atelier_script_v2",
      "art_atelier_storyboard_v2",
      "art_atelier_media_v2",
      "art_atelier_qa_v1",
    ],
  },
];

// --- Campaigns ---------------------------------------------------------------

export const CAMPAIGNS: Campaign[] = [
  {
    id: "cmp_atelier_draft",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    originThreadId: "thr_ws_atelier_ai_cmo",
    originMessageId: "msg_atelier_cmo_seed_2",
    handoffId: "ho_seed_writer",
    title: "Autumn drop — UGC spot",
    brief: {
      productOrOffer: "Limited autumn candle drop (six scents).",
      objective:
        "Drive pre-orders for the autumn drop with a 30-second UGC spot.",
      targetAudience:
        "Design-led shoppers aged 28–45; existing customers plus gift buyers.",
      channel: "Instagram Reels",
      deliverable: "30-second vertical video + 3 hook variants.",
      callToAction: "Pre-order by Sunday at midnight.",
    },
    brandProfileVersion: 1,
    approvalMode: "manual",
    status: "draft",
    revisionCount: 0,
    createdAt: "2026-09-01T10:01:00.000Z",
    updatedAt: "2026-09-01T10:01:00.000Z",
  },
  {
    id: "cmp_atelier_autumn",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    originThreadId: "thr_ws_atelier_ai_cmo",
    title: "Autumn drop — UGC spot (Manual)",
    brief: {
      productOrOffer: "Limited autumn candle drop (six scents).",
      objective:
        "Drive pre-orders for the autumn drop with a 30-second UGC spot.",
      targetAudience:
        "Design-led shoppers aged 28–45; existing customers plus gift buyers.",
      channel: "Instagram Reels",
      deliverable: "30-second vertical video + 3 hook variants.",
      callToAction: "Pre-order by Sunday at midnight.",
    },
    brandProfileVersion: 1,
    approvalMode: "manual",
    status: "waiting_approval",
    revisionCount: 1,
    createdAt: "2026-09-01T10:30:00.000Z",
    updatedAt: "2026-09-02T10:12:00.000Z",
  },
];

// --- Tasks for the Manual campaign ------------------------------------------

export const CAMPAIGN_TASKS: CampaignTask[] = [
  // Audience research (completed)
  {
    id: "tsk_atelier_research",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "audience_research",
    revisionIndex: 0,
    isCurrent: true,
    assignedAgentInstanceId: "ai_ws_atelier_audience_researcher",
    assignedAgentKey: "audience_researcher",
    status: "completed",
    dependsOnTaskIds: [],
    attemptCount: 1,
    maxAttempts: 2,
    artifactIds: [],
    resultSummary:
      "Confirmed gift + self-care purchase occasions; flagged weekend messaging.",
  },
  // Brand strategy (completed)
  {
    id: "tsk_atelier_strategy",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "brand_strategy",
    revisionIndex: 0,
    isCurrent: true,
    assignedAgentInstanceId: "ai_ws_atelier_brand_strategist",
    assignedAgentKey: "brand_strategist",
    status: "completed",
    dependsOnTaskIds: [],
    attemptCount: 1,
    maxAttempts: 2,
    artifactIds: [],
    resultSummary: "Positioning: hand-poured, sensory, unhurried. Tone: quiet.",
  },
  // Creative package v1 (stale; v2 is current)
  {
    id: "tsk_atelier_creative_v1",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "creative_package",
    revisionIndex: 0,
    isCurrent: false,
    supersedesTaskId: "tsk_atelier_creative_v2",
    assignedAgentInstanceId: "ai_ws_atelier_ugc_writer",
    assignedAgentKey: "ugc_writer",
    status: "completed",
    dependsOnTaskIds: ["tsk_atelier_research", "tsk_atelier_strategy"],
    attemptCount: 1,
    maxAttempts: 2,
    artifactIds: ["art_atelier_script_v1"],
    resultSummary: "Initial script draft (now stale).",
  },
  {
    id: "tsk_atelier_creative_v2",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "creative_package",
    revisionIndex: 1,
    isCurrent: true,
    assignedAgentInstanceId: "ai_ws_atelier_ugc_writer",
    assignedAgentKey: "ugc_writer",
    status: "completed",
    dependsOnTaskIds: ["tsk_atelier_research", "tsk_atelier_strategy"],
    attemptCount: 1,
    maxAttempts: 2,
    artifactIds: ["art_atelier_script_v2", "art_atelier_storyboard_v2"],
    resultSummary: "Revised script and storyboard with tighter CTA.",
  },
  // Simulated production v1 (superseded by v2)
  {
    id: "tsk_atelier_production_v1",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "simulated_production",
    revisionIndex: 0,
    isCurrent: false,
    assignedAgentInstanceId: "ai_ws_atelier_media_producer",
    assignedAgentKey: "media_producer",
    status: "completed",
    dependsOnTaskIds: ["tsk_atelier_creative_v1"],
    attemptCount: 1,
    maxAttempts: 1,
    artifactIds: ["art_atelier_media_v1"],
    resultSummary: "First simulated media build.",
  },
  {
    id: "tsk_atelier_production_v2",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "simulated_production",
    revisionIndex: 1,
    isCurrent: true,
    assignedAgentInstanceId: "ai_ws_atelier_media_producer",
    assignedAgentKey: "media_producer",
    status: "completed",
    dependsOnTaskIds: ["tsk_atelier_creative_v2"],
    attemptCount: 1,
    maxAttempts: 1,
    artifactIds: ["art_atelier_media_v2"],
    resultSummary: "Re-render after creative revision.",
  },
  // QA — pass
  {
    id: "tsk_atelier_qa",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "creative_qa",
    revisionIndex: 0,
    isCurrent: true,
    assignedAgentInstanceId: "ai_ws_atelier_creative_qa",
    assignedAgentKey: "creative_qa",
    status: "completed",
    dependsOnTaskIds: ["tsk_atelier_production_v2"],
    attemptCount: 1,
    maxAttempts: 2,
    artifactIds: ["art_atelier_qa_v1"],
    resultSummary: "Pass.",
  },
  // Final report
  {
    id: "tsk_atelier_final",
    campaignId: "cmp_atelier_autumn",
    templateTaskKey: "final_report",
    revisionIndex: 0,
    isCurrent: true,
    assignedAgentInstanceId: "ai_ws_atelier_ai_cmo",
    assignedAgentKey: "ai_cmo",
    status: "completed",
    dependsOnTaskIds: ["tsk_atelier_qa"],
    attemptCount: 1,
    maxAttempts: 2,
    artifactIds: ["art_atelier_final_v1"],
    resultSummary: "Final report ready.",
  },
];

// --- Approvals ---------------------------------------------------------------

export const APPROVALS: ApprovalRequest[] = [
  // Manual campaign: pending pre_production on script/storyboard v2.
  {
    id: "apr_atelier_pending",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    campaignId: "cmp_atelier_autumn",
    checkpoint: "pre_production",
    subjectDigest: "digest_v2",
    subjects: [
      {
        artifactId: "art_atelier_script_v2",
        logicalKey: "script",
        version: 2,
        sha256: "b2c3d4e5",
      },
      {
        artifactId: "art_atelier_storyboard_v2",
        logicalKey: "storyboard",
        version: 2,
        sha256: "c3d4e5f6",
      },
    ],
    status: "pending",
    createdAt: "2026-09-02T10:12:30.000Z",
  },
  // Superseded: pre-production on script/storyboard v1 (now stale).
  {
    id: "apr_atelier_superseded",
    customerId: CUSTOMER.id,
    brandWorkspaceId: BRAND_A.id,
    campaignId: "cmp_atelier_autumn",
    checkpoint: "pre_production",
    subjectDigest: "digest_v1",
    subjects: [
      {
        artifactId: "art_atelier_script_v1",
        logicalKey: "script",
        version: 1,
        sha256: "a1b2c3d4",
      },
    ],
    status: "superseded",
    resolutionSource: "user",
    decidedByUserId: OWNER.id,
    createdAt: "2026-09-02T10:00:00.000Z",
    resolvedAt: "2026-09-02T10:11:00.000Z",
  },
];

/**
 * Helper: resolve a workspace by id (or first available).
 */
export function getWorkspace(id?: Id): BrandWorkspace {
  return WORKSPACES.find((w) => w.id === id) ?? BRAND_A;
}

export function getWorkspaceProfile(id?: Id): BrandProfile {
  return (
    BRAND_PROFILES.find((p) => p.brandWorkspaceId === (id ?? BRAND_A.id)) ??
    BRAND_PROFILES[0]!
  );
}

/** Quick count of pending approvals for a workspace (used in sidebar). */
export function countPendingApprovals(workspaceId: Id): number {
  return APPROVALS.filter(
    (a) => a.brandWorkspaceId === workspaceId && a.status === "pending",
  ).length;
}

/** Convenience: number of brands. */
export const brandCount = WORKSPACES.length;

/** Avoid unused makeId import lint. */
void makeId;