import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl items-center px-6 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-app-ink">Page not found</h1>
        <p className="text-sm text-app-ink-muted">
          The product page you tried to open is not part of the prototype.
        </p>
        <div>
          <Button asChild variant="default">
            <Link href="/app">Back to CMO Studio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}