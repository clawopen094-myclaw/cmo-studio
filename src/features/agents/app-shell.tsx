"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { useParams, usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
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
import { transitions } from "@/lib/motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ThemeSelector } from "@/components/ui/theme-selector";
import { WorkspaceSwitcher } from "@/features/workspaces/workspace-switcher";
import type { BrandWorkspace } from "@/contracts/types";

/**
 * Application shell. 280px desktop sidebar, 56px top bar, mobile drawer.
 * Per ui-rules.md: desktop uses labelled sidebar (no dock), drawer on
 * narrow viewports. The sidebar's active row uses a layoutId-driven
 * indicator that smoothly slides between selected rows.
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
  pendingCounts: Record<string, number>;
}

function AppShell({ children, workspaces, pendingCounts }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const params = useParams<{ workspaceId?: string }>();
  const reduced = useReducedMotion();
  const firstId = workspaces[0]?.id;
  const activeWorkspaceId = params.workspaceId ?? firstId ?? "";
  const active = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceName = active?.name ?? "No brand";
  const pendingApprovalCount = pendingCounts[activeWorkspaceId] ?? 0;

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
          reduced={Boolean(reduced)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          pendingApprovalCount={pendingApprovalCount}
          workspaceName={workspaceName}
          pathname={pathname}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function TopBar({
  workspaces,
  activeWorkspaceId,
  pendingApprovalCount,
  workspaceName,
  pathname,
}: {
  workspaces: BrandWorkspace[];
  activeWorkspaceId: string;
  pendingApprovalCount: number;
  workspaceName: string;
  pathname: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-app-border bg-app-bg/85 px-4 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-app-bg/70",
      )}
    >
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
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="text-xs uppercase tracking-wider text-app-ink-muted">
            Brand
          </span>
          <motion.span
            key={workspaceName}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.fast}
            className="truncate text-sm font-medium text-app-ink"
          >
            · {workspaceName}
          </motion.span>
        </div>
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
  );
}

interface SidebarRowProps {
  href: Route | "";
  isActive: boolean;
  icon: React.ElementType;
  label: string;
  count?: number;
  reducedMotion: boolean;
}

function SidebarRow({
  href,
  isActive,
  icon: Icon,
  label,
  count,
  reducedMotion,
}: SidebarRowProps) {
  return (
    <Link
      href={(href || "/") as Route}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150",
        isActive
          ? "text-app-ink"
          : "text-app-ink-secondary hover:text-app-ink",
      )}
    >
      {isActive ? (
        <motion.span
          layoutId="sidebar-active-indicator"
          transition={reducedMotion ? { duration: 0 } : transitions.medium}
          className="absolute inset-0 -z-10 rounded-md bg-app-surface-subtle"
        />
      ) : null}
      <Icon
        aria-hidden
        className={cn(
          "size-4 transition-colors duration-150",
          isActive ? "text-app-ink" : "text-app-ink-muted",
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && count > 0 ? (
        <Badge variant="outline" className="ml-auto">
          {count}
        </Badge>
      ) : null}
    </Link>
  );
}

function SidebarContent({
  pathname,
  workspaces,
  activeWorkspaceId,
  pendingApprovalCount,
  reduced,
}: {
  pathname: string;
  workspaces: BrandWorkspace[];
  activeWorkspaceId: string;
  pendingApprovalCount: number;
  workspaceName: string;
  reduced: boolean;
}) {
  const workspaceId = activeWorkspaceId || workspaces[0]?.id || "";

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-app-border px-4">
        <Megaphone aria-hidden className="size-4 text-app-ink" />
        <span className="text-sm font-semibold tracking-tight text-app-ink">
          CMO Studio
        </span>
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
            const href =
              workspaceId === ""
                ? ("/" as Route)
                : (`/app/${workspaceId}/chat/${key}` as Route);
            const isActive =
              workspaceId !== "" && pathname.startsWith(href);
            return (
              <li key={key}>
                <SidebarRow
                  href={href}
                  isActive={isActive}
                  icon={Icon}
                  label={def.displayName}
                  reducedMotion={reduced}
                />
              </li>
            );
          })}
        </ul>

        <p className="mt-5 px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-app-ink-muted">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          <li>
            <SidebarRow
              href={
                workspaceId === ""
                  ? ("/" as Route)
                  : (`/app/${workspaceId}/campaigns` as Route)
              }
              isActive={
                workspaceId !== "" &&
                pathname.startsWith(`/app/${workspaceId}/campaigns`)
              }
              icon={Megaphone}
              label="Campaigns"
              count={pendingApprovalCount > 0 ? pendingApprovalCount : undefined}
              reducedMotion={reduced}
            />
          </li>
          <li>
            <SidebarRow
              href={
                workspaceId === ""
                  ? ("/" as Route)
                  : (`/app/${workspaceId}/memory` as Route)
              }
              isActive={
                workspaceId !== "" &&
                pathname.startsWith(`/app/${workspaceId}/memory`)
              }
              icon={Brain}
              label="Memory"
              reducedMotion={reduced}
            />
          </li>
          <li>
            <SidebarRow
              href={
                workspaceId === ""
                  ? ("/" as Route)
                  : (`/app/${workspaceId}/settings` as Route)
              }
              isActive={
                workspaceId !== "" &&
                pathname.startsWith(`/app/${workspaceId}/settings`)
              }
              icon={SettingsIcon}
              label="Brand settings"
              reducedMotion={reduced}
            />
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
  activeWorkspaceId: string;
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
            className="absolute inset-0 animate-[fadeIn_150ms_ease-out] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={transitions.medium}
            className="relative flex h-full w-[280px] flex-col border-r border-app-border bg-app-bg shadow-2xl"
          >
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
              reduced={false}
            />
          </motion.aside>
        </div>
      ) : null}
    </>
  );
}

export { AppShell };