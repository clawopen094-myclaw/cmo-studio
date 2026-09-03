import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  getWorkspaceById,
  getCampaign,
  listTasksForCampaign,
  listApprovalsForCampaign,
  listArtifactsForWorkspace,
} from "@/server/mock-runtime/store";
import { CAMPAIGN_STATUS } from "@/features/agents/status";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { CampaignTaskFlow } from "./_components/campaign-task-flow";
import { ApprovalCard } from "./_components/approval-card";
import { ArtifactCard } from "@/features/artifacts/artifact-card";
import { FinalReportView } from "./_components/final-report-view";

interface Params {
  workspaceId: string;
  campaignId: string;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceId, campaignId } = await params;
  const ws = getWorkspaceById(workspaceId);
  if (!ws) notFound();
  const campaign = getCampaign(workspaceId, campaignId);
  if (!campaign) notFound();
  const tasks = listTasksForCampaign(campaignId);
  const approvals = listApprovalsForCampaign(campaignId);
  const artifacts = listArtifactsForWorkspace(workspaceId).filter(
    (a) => a.campaignId === campaignId,
  );
  const pendingApproval = approvals.find((a) => a.status === "pending");
  const finalReport = artifacts.find((a) => a.type === "final_report");

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <Link
        href={`/app/${workspaceId}/campaigns`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-app-ink-muted hover:text-app-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Back to campaigns
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold text-app-ink">
            {campaign.title}
          </h1>
          <p className="text-sm text-app-ink-muted">
            {campaign.brief.objective}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusIndicator descriptor={CAMPAIGN_STATUS[campaign.status]} />
          <Badge variant="outline">
            {campaign.approvalMode === "manual" ? "Manual" : "Auto"}
          </Badge>
          <Badge variant="outline">Revision {campaign.revisionCount}</Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Brief */}
          <Card>
            <CardHeader>
              <CardTitle>Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Row label="Product / offer" value={campaign.brief.productOrOffer} />
                <Row label="Objective" value={campaign.brief.objective} />
                <Row label="Target audience" value={campaign.brief.targetAudience} />
                <Row label="Channel" value={campaign.brief.channel} />
                <Row label="Deliverable" value={campaign.brief.deliverable} />
                <Row label="Call to action" value={campaign.brief.callToAction} />
              </dl>
              <Separator className="my-4" />
              <p className="text-xs text-app-ink-muted">
                Brand profile version {campaign.brandProfileVersion} · Approval
                mode snapshot: {campaign.approvalMode}
              </p>
            </CardContent>
          </Card>

          {/* Task flow */}
          <Card>
            <CardHeader>
              <CardTitle>Fixed UGC workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignTaskFlow tasks={tasks} workspaceId={workspaceId} />
            </CardContent>
          </Card>

          {/* Approval */}
          {pendingApproval ? (
            <ApprovalCard
              approval={pendingApproval}
              workspaceId={workspaceId}
            />
          ) : null}

          {/* Final report */}
          {finalReport ? (
            <FinalReportView artifact={finalReport} workspaceId={workspaceId} />
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {artifacts.length === 0 ? (
                <p className="text-sm text-app-ink-muted">
                  No artifacts yet.
                </p>
              ) : (
                artifacts
                  .filter((a) => a.type !== "final_report")
                  .map((a) => (
                    <ArtifactCard
                      key={a.id}
                      artifact={a}
                      workspaceId={workspaceId}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wider text-app-ink-muted">
        {label}
      </dt>
      <dd className="text-sm text-app-ink">{value}</dd>
    </div>
  );
}