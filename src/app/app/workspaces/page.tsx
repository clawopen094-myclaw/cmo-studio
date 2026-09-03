import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  listWorkspaces,
  listProfiles,
  countPendingApprovals,
} from "@/server/mock-runtime/store";
import {
  CAMPAIGN_STATUS,
} from "@/features/agents/status";

export default function WorkspacesPage() {
  const workspaces = listWorkspaces();
  const profiles = listProfiles();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-ink">Brand workspaces</h1>
          <p className="text-sm text-app-ink-muted">
            Each workspace has its own fixed six-agent team, isolated memory,
            and campaigns. Create a brand to start a new conversation.
          </p>
        </div>
        <Button asChild variant="default" size="default">
          <Link href="/app/workspaces/new">
            <Plus aria-hidden className="size-4" />
            New brand
          </Link>
        </Button>
      </header>

      {workspaces.length === 0 ? (
        <EmptyState
          title="No brands yet"
          description="Create your first brand workspace to instantiate the fixed AI CMO team."
          action={
            <Button asChild variant="default" size="default">
              <Link href="/app/workspaces/new">Create a brand</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {workspaces.map((ws) => {
            const profile = profiles.find(
              (p) => p.brandWorkspaceId === ws.id,
            );
            const pending = countPendingApprovals(ws.id);
            return (
              <li key={ws.id}>
                <Link
                  href={`/app/${ws.id}/chat/ai_cmo`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                  <Card className="h-full transition-colors hover:border-app-border-strong">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle>{ws.name}</CardTitle>
                        <Badge variant="outline">
                          {ws.defaultApprovalMode === "manual"
                            ? "Manual"
                            : "Auto"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {new Date(ws.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {profile ? (
                        <p className="line-clamp-3 text-sm text-app-ink-secondary">
                          {profile.productSummary}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2">
                        {pending > 0 ? (
                          <StatusIndicator
                            descriptor={CAMPAIGN_STATUS.waiting_approval}
                          />
                        ) : (
                          <StatusIndicator descriptor={CAMPAIGN_STATUS.draft} />
                        )}
                        <span className="text-xs text-app-ink-muted">
                          {pending} pending approval
                          {pending === 1 ? "" : "s"}
                        </span>
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