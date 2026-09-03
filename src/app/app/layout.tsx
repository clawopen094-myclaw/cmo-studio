import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/ui/theme-selector";
import { AppShell } from "@/features/agents/app-shell";
import {
  listWorkspaces,
  countPendingApprovals,
  getWorkspaceById,
} from "@/server/mock-runtime/store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMO Studio",
  description:
    "Multi-brand AI marketing workspace. Fixed six-agent team, one approval checkpoint, durable campaign execution.",
};

/**
 * Product shell layout. .cmo-app owns theme tokens; no marketing code can
 * bleed in here. Per code-standards.md and ui-tokens.md. The shell is
 * server-rendered; per-route data fetching lives in route pages.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspaces = listWorkspaces();
  const first = workspaces[0];
  // Compute workspace name + pending count for the top bar/sidebar using
  // the first workspace. Routes with their own workspaceId override the
  // top bar context via AppShell context prop.
  const initialName = first?.name ?? "No brand";
  const initialPending = first ? countPendingApprovals(first.id) : 0;
  const initialWorkspaceId = first?.id;

  return (
    <div className={`${inter.variable} cmo-app`} data-theme="dark">
      <ThemeProvider>
        <AppShell
          workspaces={workspaces}
          activeWorkspaceId={initialWorkspaceId}
          pendingApprovalCount={initialPending}
          workspaceName={initialName}
        >
          {children}
        </AppShell>
      </ThemeProvider>
    </div>
  );
}

// Hint to TS that getWorkspaceById is used at the route layer
export const __workspaceHelper = getWorkspaceById;