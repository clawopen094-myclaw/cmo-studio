"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Brain,
  ClipboardCheck,
  Film,
  ListChecks,
  Megaphone,
  Menu,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import { AGENT_ORDER } from "@/contracts/types";
import { AGENT_CATALOG } from "@/server/catalog/agents";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ThemeSelector } from "@/components/ui/theme-selector";
import { WorkspaceSwitcher } from "@/features/workspaces/workspace-switcher";
import type { BrandWorkspace } from "@/contracts/types";

/**
 * Application shell. 280px desktop sidebar, 56px top bar, mobile drawer.
 * Per ui-rules.md: desktop uses labelled sidebar (no dock), drawer on
 * narrow viewports. ThemeSelector + Simulation label live in the top bar.
 */

const AGENT_ICONS: Record<string, React.ElementType> = {
  ai_cmo: Sparkles,
  audience_researcher: Brain,
  brand_strategist: Target,
  ugc_writer: ListChecks,
  media_producer: Film,
  creative_qa: ClipboardCheck,
};

interface AppShellProps {
  children: React.ReactNode;
  workspaces: BrandWorkspace[];
  activeWorkspaceId?: string;
  pendingApprovalCount?: number;
  workspaceName: string;
}

function AppShell({
  children,
  workspaces,
  activeWorkspaceId,
  pendingApprovalCount = 0,
  workspaceName,
}: AppShellProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className="cmo-app flex min-h-dvh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-app-border bg-app-bg lg:flex">
        <SidebarContent
          pathname={pathname}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          pendingApprovalCount={pendingApprovalCount}
          workspaceName={workspaceName}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-app-border bg-app-bg px-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* Mobile menu trigger */}
            <div className="lg:hidden">
              <MobileNav
                pathname={pathname}
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                pendingApprovalCount={pendingApprovalCount}
                workspaceName={workspaceName}
              />
            </div>
            <span className="text-sm text-app-ink-secondary">
              <span className="text-app-ink-muted">Brand · </span>
              {workspaceName}
            </span>
            <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
              Simulation
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              Owner
            </Badge>
            <ThemeSelector />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  workspaces,
  activeWorkspaceId,
  pendingApprovalCount,
  workspaceName,
}: {
  pathname: string;
  workspaces: BrandWorkspace[];
  activeWorkspaceId?: string;
  pendingApprovalCount: number;
  workspaceName: string;
}) {
  const workspaceId = activeWorkspaceId ?? workspaces[0]?.id ?? "";

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-app-border px-4">
        <Megaphone aria-hidden className="size-4 text-app-ink" />
        <span className="text-sm font-semibold text-app-ink">CMO Studio</span>
      </div>

      <div className="px-3 pt-3">
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
          Your AI team
        </p>
        <ul className="flex flex-col gap-0.5">
          {AGENT_ORDER.map((key) => {
            const def = AGENT_CATALOG[key]!;
            const Icon = AGENT_ICONS[key] ?? Bot;
            const href = `/app/${workspaceId}/chat/${key}`;
            const isActive = pathname.startsWith(href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md px-2 text-sm text-app-ink hover:bg-app-surface-subtle",
                    isActive &&
                      "bg-app-surface-subtle text-app-ink [&_svg]:text-app-ink",
                  )}
                >
                  <Icon aria-hidden className="size-4 text-app-ink-muted" />
                  <span className="flex-1 truncate">{def.displayName}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href={`/app/${workspaceId}/campaigns`}
              aria-current={
                pathname.startsWith(`/app/${workspaceId}/campaigns`)
                  ? "page"
                  : undefined
              }
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-2 text-sm text-app-ink hover:bg-app-surface-subtle",
                pathname.startsWith(`/app/${workspaceId}/campaigns`) &&
                  "bg-app-surface-subtle text-app-ink",
              )}
            >
              <Megaphone aria-hidden className="size-4 text-app-ink-muted" />
              <span className="flex-1 truncate">Campaigns</span>
              {pendingApprovalCount > 0 ? (
                <Badge variant="outline" className="ml-auto">
                  {pendingApprovalCount}
                </Badge>
              ) : null}
            </Link>
          </li>
          <li>
            <Link
              href={`/app/${workspaceId}/memory`}
              aria-current={
                pathname.startsWith(`/app/${workspaceId}/memory`)
                  ? "page"
                  : undefined
              }
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-2 text-sm text-app-ink hover:bg-app-surface-subtle",
                pathname.startsWith(`/app/${workspaceId}/memory`) &&
                  "bg-app-surface-subtle text-app-ink",
              )}
            >
              <Brain aria-hidden className="size-4 text-app-ink-muted" />
              <span className="flex-1 truncate">Memory</span>
            </Link>
          </li>
          <li>
            <Link
              href={`/app/${workspaceId}/settings`}
              aria-current={
                pathname.startsWith(`/app/${workspaceId}/settings`)
                  ? "page"
                  : undefined
              }
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-2 text-sm text-app-ink hover:bg-app-surface-subtle",
                pathname.startsWith(`/app/${workspaceId}/settings`) &&
                  "bg-app-surface-subtle text-app-ink",
              )}
            >
              <SettingsIcon
                aria-hidden
                className="size-4 text-app-ink-muted"
              />
              <span className="flex-1 truncate">Brand settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="border-t border-app-border p-3 text-[11px] text-app-ink-muted">
        Local-only Owner session. Production auth required before public
        deployment.
      </div>
    </>
  );
}

function MobileNav({
  pathname,
  workspaces,
  activeWorkspaceId,
  pendingApprovalCount,
  workspaceName,
}: {
  pathname: string;
  workspaces: BrandWorkspace[];
  activeWorkspaceId?: string;
  pendingApprovalCount: number;
  workspaceName: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden className="size-5" />
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Primary navigation"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-app-border bg-app-bg shadow-2xl">
            <div className="flex h-14 items-center justify-end border-b border-app-border px-3">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden className="size-5" />
              </Button>
            </div>
            <SidebarContent
              pathname={pathname}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              pendingApprovalCount={pendingApprovalCount}
              workspaceName={workspaceName}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

export { AppShell };