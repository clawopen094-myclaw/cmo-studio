import { redirect } from "next/navigation";

import { listWorkspaces } from "@/server/mock-runtime/store";

/**
 * /app entry. Per project-overview.md: redirect to the first authorized
 * workspace's CMO chat (ordered by creation time), or /app/workspaces if
 * none exist. Remembered-last-workspace is deferred.
 */
export default function AppIndexPage() {
  const workspaces = listWorkspaces();
  if (workspaces.length === 0) {
    redirect("/app/workspaces");
  }
  const first = workspaces[0]!;
  redirect(`/app/${first.id}/chat/ai_cmo`);
}