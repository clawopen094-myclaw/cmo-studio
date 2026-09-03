import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Empty region explanation with one next action. Status and tone belong in
 * the StatusIndicator registry, not in this primitive.
 */
function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-app-border p-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-app-ink-muted [&_svg]:size-8">{icon}</div>
      ) : null}
      <h3 className="text-base font-semibold text-app-ink">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-app-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };