import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { WorkspaceCard } from "./_components/workspace-card";
import {
  listWorkspaces,
  listProfiles,
  countPendingApprovals,
} from "@/server/mock-runtime/store";

export default function WorkspacesPage() {
  const workspaces = listWorkspaces();
  const profiles = listProfiles();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
            Brand workspaces
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-app-ink">
            Choose or create a brand
          </h1>
          <p className="text-sm text-app-ink-muted">
            Each workspace has its own fixed six-agent team, isolated
            memory, and campaigns.
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
          {workspaces.map((ws, idx) => {
            const profile = profiles.find(
              (p) => p.brandWorkspaceId === ws.id,
            );
            const pending = countPendingApprovals(ws.id);
            return (
              <li key={ws.id} className="list-none">
                <WorkspaceCard
                  index={idx}
                  href={`/app/${ws.id}/chat/ai_cmo`}
                  name={ws.name}
                  approvalMode={ws.defaultApprovalMode}
                  productSummary={profile?.productSummary ?? ""}
                  pending={pending}
                  createdAt={ws.createdAt}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Keep Card/Badge/StatusIndicator imports alive for any future inline use
// without tree-shaking them.
void Card;
void CardContent;
void Badge;
void StatusIndicator;