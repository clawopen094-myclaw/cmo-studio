import { notFound } from "next/navigation";

import {
  getWorkspaceById,
  getThreadByAgent,
  listMessagesForThread,
  listHandoffsForWorkspace,
  getWorkspaceProfile,
} from "@/server/mock-runtime/store";
import { AGENT_CATALOG } from "@/server/catalog/agents";
import type { AgentKey } from "@/contracts/types";
import { AGENT_ORDER } from "@/contracts/types";

import { ChatPanel } from "./_components/chat-panel";
import { AgentHeader } from "./_components/agent-header";

interface Params {
  workspaceId: string;
  agentKey: string;
}

export default async function ChatPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceId, agentKey } = await params;

  if (!AGENT_ORDER.includes(agentKey as AgentKey)) notFound();
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) notFound();
  const def = AGENT_CATALOG[agentKey as AgentKey];
  if (!def) notFound();

  const thread = getThreadByAgent(workspaceId, agentKey);
  if (!thread) notFound();

  const messages = listMessagesForThread(thread.id);
  const handoffs = listHandoffsForWorkspace(workspaceId).filter(
    (h) =>
      h.sourceAgentKey === agentKey ||
      (agentKey === "ai_cmo" &&
        (h.status === "pending" || h.status === "accepted")) ||
      (agentKey !== "ai_cmo" &&
        h.targetCmoInstanceId === `ai_${workspaceId}_ai_cmo`),
  );
  const profile = getWorkspaceProfile(workspaceId);

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col px-4 py-4">
      <AgentHeader
        agentName={def.displayName}
        role={def.role}
        canDo={def.canDo}
        mustNotDo={def.mustNotDo}
        workspaceName={profile ? undefined : workspace.name}
      />
      <ChatPanel
        workspaceId={workspaceId}
        threadId={thread.id}
        agentKey={agentKey as AgentKey}
        initialMessages={messages}
        handoffs={handoffs}
      />
    </div>
  );
}