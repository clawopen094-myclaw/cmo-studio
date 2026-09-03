import { notFound } from "next/navigation";
import { Megaphone } from "lucide-react";

import {
  getWorkspaceById,
  listCampaignsForWorkspace,
  listTasksForCampaign,
} from "@/server/mock-runtime/store";
import { CAMPAIGN_STATUS } from "@/features/agents/status";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignRow } from "./_components/campaign-row";

interface Params {
  workspaceId: string;
}

export default async function CampaignsListPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceId } = await params;
  const ws = getWorkspaceById(workspaceId);
  if (!ws) notFound();
  const campaigns = listCampaignsForWorkspace(workspaceId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
            Campaigns
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-app-ink">
            {ws.name}
          </h1>
          <p className="text-sm text-app-ink-muted">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Start a campaign from the AI CMO chat. The CMO will draft a plan and ask you to start it."
          icon={<Megaphone aria-hidden className="size-7" />}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {campaigns.map((c, idx) => {
            const tasks = listTasksForCampaign(c.id);
            const currentTask =
              tasks.find((t) => t.status === "running") ??
              tasks.find((t) => t.status === "queued") ??
              tasks.find((t) => t.status === "pending");
            return (
              <CampaignRow
                key={c.id}
                index={idx}
                href={`/app/${workspaceId}/campaigns/${c.id}`}
                title={c.title}
                statusDescriptor={CAMPAIGN_STATUS[c.status]}
                approvalMode={c.approvalMode}
                updatedAt={c.updatedAt}
                currentOwner={currentTask?.assignedAgentKey ?? null}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}