import { notFound } from "next/navigation";

import {
  getWorkspaceById,
  getProfileByWorkspace,
  listThreadsForWorkspace,
} from "@/server/mock-runtime/store";
import { AGENT_CATALOG } from "@/server/catalog/agents";
import { AGENT_ORDER } from "@/contracts/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BrandSettingsForm } from "./_components/settings-brand-form";

interface Params {
  workspaceId: string;
}

export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceId } = await params;
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) notFound();
  const profile = getProfileByWorkspace(workspaceId);
  if (!profile) notFound();
  const threads = listThreadsForWorkspace(workspaceId);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-app-ink">Brand settings</h1>
        <p className="text-sm text-app-ink-muted">
          Edit the brand profile and default approval mode. Agent
          configuration is fixed and read-only.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              {workspace.name} — created{" "}
              {new Date(workspace.createdAt).toLocaleDateString()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrandSettingsForm
              workspaceId={workspace.id}
              initial={{
                productSummary: profile.productSummary,
                audience: profile.audience ?? "",
                voice: profile.voice ?? "",
                approvedClaims: profile.approvedClaims,
                restrictions: profile.restrictions,
                defaultApprovalMode: workspace.defaultApprovalMode,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fixed AI team</CardTitle>
            <CardDescription>
              Every brand workspace gets this same six-agent organization.
              Definitions, capabilities, and limits are read-only in the
              prototype.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {AGENT_ORDER.map((key) => {
              const def = AGENT_CATALOG[key]!;
              const thread = threads.find((t) => t.agentKey === key);
              return (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 rounded-md border border-app-border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-app-ink">
                      {def.displayName}
                    </p>
                    <p className="text-xs text-app-ink-muted">{def.role}</p>
                    {thread ? (
                      <p className="mt-1 text-xs text-app-ink-muted">
                        {thread.nextSequence - 1} messages so far
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline">v{def.version}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About this prototype</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-app-ink-secondary">
            <p>
              CMO Studio is local-only. The seeded Owner has full access to
              every brand workspace. Production authentication is required
              before any public deployment.
            </p>
            <Separator className="my-2" />
            <p className="text-xs text-app-ink-muted">
              Simulation label appears wherever generated artifacts, runs, and
              usage are shown.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}