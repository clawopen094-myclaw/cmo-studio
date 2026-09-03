"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BrandWorkspace } from "@/contracts/types";

/**
 * Workspace switcher. Lives in the sidebar on desktop and in the top bar on
 * mobile. Selecting a workspace navigates to its CMO chat; the dedicated
 * create flow lives at /app/workspaces/new.
 */

interface WorkspaceSwitcherProps {
  workspaces: BrandWorkspace[];
  activeWorkspaceId?: string;
  className?: string;
}

/**
 * Tiny self-contained popover so: this primitive has no dependency on the
 * menu package version. Click outside / Escape closes; focus is restored to
 * the trigger.
 */
function usePopover() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        popoverRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, triggerRef, popoverRef };
}

function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  className,
}: WorkspaceSwitcherProps) {
  const pathname = usePathname() ?? "";
  const params = useParams<{ workspaceId?: string }>();
  const current =
    workspaces.find((w) => w.id === (activeWorkspaceId ?? params.workspaceId)) ??
    workspaces[0];
  const pop = usePopover();

  return (
    <div className={cn("relative", className)}>
      <button
        ref={pop.triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={pop.open}
        onClick={() => pop.setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md border border-app-border-strong bg-app-surface px-2.5 py-1.5 text-sm text-app-ink hover:bg-app-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
        aria-label="Switch brand workspace"
      >
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-full bg-app-surface-strong text-[11px] font-semibold uppercase text-app-ink"
        >
          {current?.name.slice(0, 1) ?? "—"}
        </span>
        <span className="min-w-0 flex-1 truncate text-left">
          {current?.name ?? "No brand"}
        </span>
        <ChevronsUpDown aria-hidden className="size-4 text-app-ink-muted" />
      </button>
      {pop.open ? (
        <div
          ref={pop.popoverRef}
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 overflow-hidden rounded-md border border-app-border bg-app-surface p-1 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-app-ink-muted">
            Switch brand
          </p>
          {workspaces.length === 0 ? (
            <p className="px-2 py-2 text-sm text-app-ink-muted">
              No brands yet.
            </p>
          ) : (
            workspaces.map((w) => {
              const isActive = w.id === current?.id;
              const href =
                pathname.includes("/chat") && isActive
                  ? pathname
                  : `/app/${w.id}/chat/ai_cmo`;
              return (
                <Link
                  key={w.id}
                  href={href}
                  role="menuitem"
                  onClick={() => pop.setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    isActive
                      ? "bg-app-surface-subtle text-app-ink"
                      : "text-app-ink hover:bg-app-surface-subtle",
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-6 place-items-center rounded-full bg-app-surface-strong text-[11px] font-semibold uppercase"
                  >
                    {w.name.slice(0, 1)}
                  </span>
                  <span className="flex-1 truncate">{w.name}</span>
                </Link>
              );
            })
          )}
          <div className="my-1 h-px bg-app-border" />
          <Link
            href="/app/workspaces/new"
            role="menuitem"
            onClick={() => pop.setOpen(false)}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-app-ink hover:bg-app-surface-subtle"
          >
            <Plus aria-hidden className="size-4" />
            <span>New brand workspace</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export { WorkspaceSwitcher };
export type { WorkspaceSwitcherProps };