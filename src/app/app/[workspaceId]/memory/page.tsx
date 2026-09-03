import { notFound } from "next/navigation";
import { Lock, Users } from "lucide-react";

import {
  getWorkspaceById,
  listMemoryForWorkspace,
} from "@/server/mock-runtime/store";
import { AGENT_CATALOG } from "@/server/catalog/agents";
import { AGENT_ORDER } from "@/contracts/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { MEMORY_STATUS } from "@/features/agents/status";

interface Params {
  workspaceId: string;
}

export default async function MemoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ agent?: string }>;
}) {
  const { workspaceId } = await params;
  const sp = await searchParams;
  const ws = getWorkspaceById(workspaceId);
  if (!ws) notFound();

  const scope: "brand" | "agent_private" = sp.agent
    ? "agent_private"
    : "brand";
  const agentKey = sp.agent;

  const records = listMemoryForWorkspace(workspaceId, { scope, agentKey });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-app-ink">Memory</h1>
        <p className="text-sm text-app-ink-muted">
          Shared brand memory is visible to all six agents in this workspace.
          Per-agent private memory is visible only to that agent and to you as
          the Owner.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside aria-label="Memory scopes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scopes</CardTitle>
              <CardDescription>
                Switch between shared brand memory and per-agent private memory.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <ScopeLink
                href={`/app/${workspaceId}/memory`}
                active={!agentKey}
                icon={<Users aria-hidden className="size-4" />}
                label="Shared brand memory"
              />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
                Per-agent private
              </p>
              {AGENT_ORDER.map((key) => {
                const def = AGENT_CATALOG[key]!;
                return (
                  <ScopeLink
                    key={key}
                    href={`/app/${workspaceId}/memory?agent=${key}`}
                    active={agentKey === key}
                    icon={<Lock aria-hidden className="size-4" />}
                    label={def.displayName}
                  />
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <section aria-label="Memory records">
          <Card>
            <CardHeader>
              <CardTitle>
                {scope === "brand"
                  ? "Shared brand memory"
                  : agentKey
                    ? `${AGENT_CATALOG[agentKey as keyof typeof AGENT_CATALOG]?.displayName ?? "Agent"} — private memory`
                    : "Agent private memory"}
              </CardTitle>
              <CardDescription>
                {scope === "agent_private"
                  ? "Other agents, including the CMO, cannot retrieve this memory."
                  : "All agents in this workspace can read shared brand memory."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {records.length === 0 ? (
                <p className="text-sm text-app-ink-muted">
                  No records in this scope yet.
                </p>
              ) : (
                records.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-2 rounded-md border border-app-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-app-ink">
                        {r.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusIndicator descriptor={MEMORY_STATUS[r.status]} />
                        <Badge variant="outline">v{r.version}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-app-ink-secondary">{r.body}</p>
                    <p className="text-xs text-app-ink-muted">
                      Source: {r.sourceType} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function ScopeLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm " +
        (active
          ? "bg-app-surface-subtle text-app-ink"
          : "text-app-ink hover:bg-app-surface-subtle")
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}