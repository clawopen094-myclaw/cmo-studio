import { cn } from "@/lib/utils";

/**
 * Geometry-known loading placeholder. Restrained opacity pulse; reduced
 * motion is honored at the root CSS layer.
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-app-surface-subtle",
        className,
      )}
    />
  );
}

export { Skeleton };