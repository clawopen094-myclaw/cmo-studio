import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getWorkspaceById,
  listCampaignsForWorkspace,
  listTasksForCampaign,
} from "@/server/mock-runtime/store";
import { CAMPAIGN_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";

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
        <div>
          <h1 className="text-2xl font-bold text-app-ink">Campaigns</h1>
          <p className="text-sm text-app-ink-muted">
            {ws.name} · {campaigns.length} campaign
            {campaigns.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Start a campaign from the AI CMO chat. The CMO will draft a plan and ask you to start it."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {campaigns.map((c) => {
            const tasks = listTasksForCampaign(c.id);
            const currentTask =
              tasks.find((t) => t.status === "running") ??
              tasks.find((t) => t.status === "queued") ??
              tasks.find((t) => t.status === "pending");
            return (
              <li key={c.id}>
                <Link
                  href={`/app/${workspaceId}/campaigns/${c.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                  <Card className="transition-colors hover:border-app-border-strong">
                    <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-base font-semibold text-app-ink">
                          {c.title}
                        </span>
                        <span className="text-xs text-app-ink-muted">
                          Updated {formatRelative(c.updatedAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusIndicator
                          descriptor={CAMPAIGN_STATUS[c.status]}
                        />
                        <Badge variant="outline">
                          {c.approvalMode === "manual" ? "Manual" : "Auto"}
                        </Badge>
                        {currentTask ? (
                          <span className="text-xs text-app-ink-muted">
                            {currentTask.assignedAgentKey.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}