import { notFound } from "next/navigation";

import { AppShell } from "@/features/agents/app-shell";
import { ThemeProvider } from "@/components/ui/theme-selector";
import {
  countPendingApprovals,
  getWorkspaceById,
  listWorkspaces,
} from "@/server/mock-runtime/store";

/**
 * Workspace-aware layout. Overrides the AppShell's top bar context with the
 * current workspace name and pending-approval count. Per ui-rules.md:
 * selecting a workspace retains the agent key on chat routes, and falls
 * back to its CMO when entering from other pages.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) notFound();
  const all = listWorkspaces();
  const pending = countPendingApprovals(workspaceId);

  return (
    <ThemeProvider>
      <AppShell
        workspaces={all}
        activeWorkspaceId={workspace.id}
        pendingApprovalCount={pending}
        workspaceName={workspace.name}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  );
}