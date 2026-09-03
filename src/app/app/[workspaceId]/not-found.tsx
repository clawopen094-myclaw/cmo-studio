import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Scoped workspace not-found. Per ui-rules.md: invalid or cross-workspace
 * routes render the same scoped not-found state without revealing whether
 * the target exists.
 */
export default function WorkspaceNotFound() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-3xl items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Workspace not found</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-app-ink-muted">
            This workspace is not available. Pick another brand or go back to
            the workspace list.
          </p>
          <div>
            <Button asChild variant="default" size="default">
              <Link href="/app/workspaces">Back to workspaces</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}