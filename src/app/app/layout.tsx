import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/ui/theme-selector";
import { AppShell } from "@/features/agents/app-shell";
import {
  listWorkspaces,
  countPendingApprovals,
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
 * Product shell layout. Renders ONCE for every /app/* route. Nested
 * workspace layouts must NOT wrap the shell again — they validate the
 * workspaceId and render `{children}` only. The shell's active workspace
 * is derived from useParams() inside AppShell so it stays in sync with
 * the URL on every navigation.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspaces = listWorkspaces();
  const pendingCounts: Record<string, number> = {};
  for (const w of workspaces) {
    pendingCounts[w.id] = countPendingApprovals(w.id);
  }

  return (
    <div className={`${inter.variable} cmo-app`} data-theme="dark">
      <ThemeProvider>
        <AppShell workspaces={workspaces} pendingCounts={pendingCounts}>
          {children}
        </AppShell>
      </ThemeProvider>
    </div>
  );
}