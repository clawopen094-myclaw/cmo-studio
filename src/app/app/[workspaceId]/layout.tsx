import { notFound } from "next/navigation";

import { getWorkspaceById } from "@/server/mock-runtime/store";

/**
 * Workspace-aware layout. Validates the workspaceId from the URL and
 * triggers not-found() for invalid or cross-workspace requests. The
 * application shell is rendered ONCE by src/app/app/layout.tsx — this
 * layout intentionally does NOT wrap with AppShell, otherwise the
 * sidebar would render twice on every /app/[workspaceId]/* route.
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
  return <>{children}</>;
}