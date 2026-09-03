import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Semantic/decorative division. Default role is decorative; pass role to
 * upgrade to a true separator landmark.
 */
function Separator({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-app-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}

export { Separator };